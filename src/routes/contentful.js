const express = require('express');
const contentful = require('contentful');

const router = express.Router();

const SUPPORTED_LOCALES = ['en', 'zh', 'ar', 'fr', 'de', 'ru', 'tr'];
const SUPPORTED_FORMATS = ['csv', 'excel', 'json'];

// Lazy Contentful client
let _client = null;
function getClient() {
  if (_client) return _client;
  const space = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  const environment = process.env.CONTENTFUL_ENVIRONMENT || 'master';
  if (!space || !accessToken) {
    throw new Error('Contentful is not configured (CONTENTFUL_SPACE_ID / CONTENTFUL_ACCESS_TOKEN missing).');
  }
  _client = contentful.createClient({ space, accessToken, environment });
  return _client;
}

// ---------- Helpers ----------
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function flatten(items, locale) {
  return items.map((item) => ({
    locale,
    id: item.sys?.id,
    updatedAt: item.sys?.updatedAt,
    ...(item.fields || {}),
  }));
}

// Fetch ALL entries for a given query, paginating through skip/limit.
// Contentful caps page size at 1000.
async function fetchAllEntries(client, baseQuery) {
  const PAGE = 1000;
  const all = [];
  let skip = 0;
  // Cap absolute total to avoid runaway loops (Contentful spaces are bounded anyway)
  const HARD_CAP = 100000;
  // First request to know total
  while (true) {
    const res = await client.getEntries({ ...baseQuery, limit: PAGE, skip });
    all.push(...res.items);
    const total = res.total ?? all.length;
    skip += res.items.length;
    if (res.items.length === 0 || skip >= total || all.length >= HARD_CAP) break;
  }
  return all;
}

// Pivot rows so each unique `key` gets one row with one column per locale.
// Falls back to `id` when fields.key is not present.
function pivotByKey(perLocale, locales) {
  const map = new Map(); // key -> { key, en: ..., ar: ..., ... }
  for (const loc of locales) {
    const rows = perLocale[loc] || [];
    for (const r of rows) {
      const k = r.key != null ? String(r.key) : (r.id != null ? String(r.id) : '');
      if (!k) continue;
      if (!map.has(k)) map.set(k, { key: k });
      const obj = map.get(k);
      // Prefer `value`; otherwise stringify all non-meta fields
      let v;
      if ('value' in r) {
        v = r.value;
      } else {
        const { locale, id, updatedAt, key, ...rest } = r;
        const keys = Object.keys(rest);
        v = keys.length === 1 ? rest[keys[0]] : rest;
      }
      obj[loc] = v;
    }
  }
  return Array.from(map.values());
}

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Array.from(
    rows.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set())
  );
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(','));
  }
  return lines.join('\n');
}

// Excel-friendly XML (.xls) — opens natively in Excel without extra deps
function toExcelXML(rows) {
  const headers = rows.length
    ? Array.from(rows.reduce((s, r) => { Object.keys(r).forEach(k => s.add(k)); return s; }, new Set()))
    : [];
  const xmlEscape = (v) => String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const cell = (v) => `<Cell><Data ss:Type="String">${xmlEscape(typeof v === 'object' ? JSON.stringify(v) : v)}</Data></Cell>`;
  const headerRow = `<Row>${headers.map(cell).join('')}</Row>`;
  const bodyRows = rows.map(r => `<Row>${headers.map(h => cell(r[h])).join('')}</Row>`).join('');
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Export"><Table>${headerRow}${bodyRows}</Table></Worksheet>
</Workbook>`;
}

// ---------- Routes ----------

// Render the Contentful utility UI (Pug)
router.get('/', (req, res) => {
  res.render('contentful', {
    title: 'Contentful Utility - Logger Dashboard',
    locales: SUPPORTED_LOCALES,
    formats: SUPPORTED_FORMATS
  });
});

// Export endpoint — triggers a file download
// Example: /contentful/export?content_type=keyValue&select=fields.key,fields.value&locale=en&export=csv
// `limit` is optional. When omitted, ALL entries are fetched (paginated).
router.get('/export', async (req, res) => {
  try {
    const {
      content_type,
      limit, // optional
      select,
      locale = 'en',
      export: exportFormat = 'json',
    } = req.query;

    if (!content_type) {
      return res.status(400).json({ error: 'content_type query param is required' });
    }
    if (!SUPPORTED_FORMATS.includes(exportFormat)) {
      return res.status(400).json({ error: `Unsupported export format. Use one of: ${SUPPORTED_FORMATS.join(', ')}` });
    }

    let locales;
    if (locale === 'ALL' || locale === 'all') {
      locales = SUPPORTED_LOCALES;
    } else {
      locales = String(locale).split(',').map(s => s.trim()).filter(Boolean);
      const bad = locales.filter(l => !SUPPORTED_LOCALES.includes(l));
      if (bad.length) {
        return res.status(400).json({ error: `Unsupported locale(s): ${bad.join(', ')}` });
      }
    }

    const parsedLimit = limit != null && limit !== '' ? parseInt(limit, 10) : null;
    const fetchAll = !parsedLimit || parsedLimit <= 0;

    const client = getClient();
    const allRows = [];
    const perLocale = {};

    for (const loc of locales) {
      const baseQuery = { content_type, locale: loc };
      if (select) baseQuery.select = select;

      let items;
      if (fetchAll) {
        items = await fetchAllEntries(client, baseQuery);
      } else {
        const response = await client.getEntries({ ...baseQuery, limit: Math.min(parsedLimit, 1000) });
        items = response.items;
      }
      const rows = flatten(items, loc);
      perLocale[loc] = rows;
      allRows.push(...rows);
    }

    const baseName = `contentful-${content_type}-${locales.join('_')}`;
    const pivoted = pivotByKey(perLocale, locales);

    if (exportFormat === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.json"`);
      return res.send(JSON.stringify({ locales, total: allRows.length, data: perLocale }, null, 2));
    }
    if (exportFormat === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
      return res.send(toCSV(pivoted));
    }
    if (exportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.xls"`);
      return res.send(toExcelXML(pivoted));
    }
  } catch (err) {
    console.error('Contentful export error:', err);
    res.status(500).json({ error: 'Contentful export failed', message: err.message });
  }
});

module.exports = router;
