const express = require('express');
const contentful = require('contentful');

const router = express.Router();

const SUPPORTED_LOCALES = ['en', 'zh', 'ar', 'fr', 'de', 'ru', 'tr'];
const SUPPORTED_FORMATS = ['csv', 'excel', 'json'];

// Lazy Contentful client (one per locale to keep things simple)
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

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[\",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function flatten(items, locale) {
  // Each row: { locale, id, ...fields }
  return items.map((item) => ({
    locale,
    id: item.sys?.id,
    updatedAt: item.sys?.updatedAt,
    ...(item.fields || {}),
  }));
}

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(','));
  }
  return lines.join('\n');
}

// Minimal XLSX writer using a single-sheet CSV-as-XLSX would require a dep.
// Use a tiny SpreadsheetML 2003 (.xls) XML format that Excel opens natively.
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

router.get('/export', async (req, res) => {
  try {
    const {
      content_type,
      limit = '1000',
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

    // Resolve locale list
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

    const client = getClient();
    const allRows = [];
    const perLocale = {};

    for (const loc of locales) {
      const query = {
        content_type,
        limit: Math.min(parseInt(limit, 10) || 1000, 1000),
        locale: loc,
      };
      if (select) query.select = select;

      const response = await client.getEntries(query);
      const rows = flatten(response.items, loc);
      perLocale[loc] = rows;
      allRows.push(...rows);
    }

    const baseName = `contentful-${content_type}-${locales.join('_')}`;

    if (exportFormat === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.json"`);
      return res.send(JSON.stringify({ locales, total: allRows.length, data: perLocale }, null, 2));
    }

    if (exportFormat === 'csv') {
      const csv = toCSV(allRows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
      return res.send(csv);
    }

    if (exportFormat === 'excel') {
      const xml = toExcelXML(allRows);
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.xls"`);
      return res.send(xml);
    }
  } catch (err) {
    console.error('Contentful export error:', err);
    res.status(500).json({ error: 'Contentful export failed', message: err.message });
  }
});

module.exports = router;
