const express = require('express');
const multer = require('multer');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return callback(new Error(`${file.originalname} is not an image file`));
    }
    callback(null, true);
  },
});

const CONTENTFUL_API = 'https://api.contentful.com';
const CONTENTFUL_UPLOADS_API = 'https://upload.contentful.com';
const COMMERCETOOLS_AUTH_API = 'https://auth.europe-west1.gcp.commercetools.com/oauth/token';
const COMMERCETOOLS_API = 'https://api.europe-west1.gcp.com';

function getConfig() {
  const config = {
    commercetoolsClientId: process.env.COMMERCETOOLS_CLIENT_ID,
    commercetoolsClientSecret: process.env.COMMERCETOOLS_CLIENT_SECRET,
    commercetoolsProjectKey: process.env.COMMERCETOOLS_PROJECT_KEY,
    contentfulManagementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN,
    contentfulSpaceId: process.env.CONTENTFUL_SPACE_ID,
    contentfulEnvironmentId: process.env.CONTENTFUL_ENVIRONMENT_ID || process.env.CONTENTFUL_ENVIRONMENT || 'master',
  };

  const required = [
    ['COMMERCETOOLS_CLIENT_ID', config.commercetoolsClientId],
    ['COMMERCETOOLS_CLIENT_SECRET', config.commercetoolsClientSecret],
    ['COMMERCETOOLS_PROJECT_KEY', config.commercetoolsProjectKey],
    ['CONTENTFUL_MANAGEMENT_TOKEN', config.contentfulManagementToken],
    ['CONTENTFUL_SPACE_ID', config.contentfulSpaceId],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    throw new Error(`Upload utility is not configured. Missing: ${missing.join(', ')}`);
  }
  return config;
}

function contentfulUrl(path, config) {
  return `${CONTENTFUL_API}/spaces/${encodeURIComponent(config.contentfulSpaceId)}/environments/${encodeURIComponent(config.contentfulEnvironmentId)}${path}`;
}

async function readResponse(response, label) {
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch (_) {
    body = text;
  }
  if (!response.ok) {
    const detail = typeof body === 'string' ? body : (body.message || body.sys?.id || JSON.stringify(body));
    throw new Error(`${label} failed (${response.status}): ${detail}`);
  }
  return body;
}

function getPath(value, paths) {
  for (const path of paths) {
    const result = path.split('.').reduce((current, key) => current == null ? undefined : current[key], value);
    if (result !== undefined && result !== null && result !== '') return result;
  }
  return '';
}

function filenameUnit(originalname) {
  return originalname.replace(/\.[^/.]+$/, '').trim();
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled';
}

function uniqueValues(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(results) {
  const headers = ['Unit Name', 'Contentful Asset URL', 'Product ID', 'Project Name', 'Building Code', 'Floor Number', 'Status', 'Error'];
  const rows = results.map(result => [
    result.unitName,
    result.assetUrl,
    result.productId,
    result.projectName,
    result.buildingCode,
    result.floorNumber,
    result.status,
    result.error,
  ]);
  return [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
}

async function getCommercetoolsToken(config) {
  const basic = Buffer.from(`${config.commercetoolsClientId}:${config.commercetoolsClientSecret}`).toString('base64');
  const response = await fetch(COMMERCETOOLS_AUTH_API, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const body = await readResponse(response, 'Commercetools authentication');
  if (!body.access_token) throw new Error('Commercetools authentication returned no access token');
  return body.access_token;
}

async function getProductDetails(token, unitName, config) {
  const template = process.env.COMMERCETOOLS_PRODUCT_WHERE_TEMPLATE || 'masterData.current.name(en)="{unit}"';
  const where = template.replaceAll('{unit}', unitName.replace(/"/g, '\\"'));
  const params = new URLSearchParams({ where, limit: '1' });
  const response = await fetch(`${COMMERCETOOLS_API}/${encodeURIComponent(config.commercetoolsProjectKey)}/products?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await readResponse(response, `Product lookup for ${unitName}`);
  const product = body.results?.[0];
  if (!product) throw new Error(`No Commercetools product found for unit ${unitName}`);

  const current = product.masterData?.current || {};
  const customFields = current.custom?.fields || {};
  const attributes = current.masterVariant?.attributes || [];
  const attributeMap = Object.fromEntries(attributes.map(attribute => [attribute.name, attribute.value]));
  const productDetails = {
    productId: product.id || '',
    projectName: getPath(product, ['projectName', 'project.name', 'masterData.current.custom.fields.projectName', 'masterData.current.name.en']) || getPath(attributeMap, ['projectName']),
    buildingCode: getPath(product, ['buildingCode', 'masterData.current.custom.fields.buildingCode']) || getPath(attributeMap, ['buildingCode']),
    floorNumber: getPath(product, ['floorNumber', 'masterData.current.custom.fields.floorNumber']) || getPath(attributeMap, ['floorNumber']),
  };
  return { ...productDetails, tags: uniqueValues([unitName, productDetails.projectName, productDetails.buildingCode, productDetails.floorNumber]) };
}

async function contentfulRequest(path, config, options = {}, label = 'Contentful request') {
  const response = await fetch(contentfulUrl(path, config), {
    ...options,
    headers: {
      Authorization: `Bearer ${config.contentfulManagementToken}`,
      ...(options.headers || {}),
    },
  });
  return readResponse(response, label);
}

async function ensureTagsExist(tags, config) {
  if (!tags.length) return [];
  const existing = await contentfulRequest('/tags?limit=1000', config, {}, 'Contentful tag lookup');
  const byName = new Map((existing.items || []).map(tag => [tag.name, tag]));
  const links = [];

  for (const name of tags) {
    let tag = byName.get(name);
    if (!tag) {
      const tagId = slugify(name);
      tag = await contentfulRequest(`/tags/${encodeURIComponent(tagId)}`, config, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/vnd.contentful.management.v1+json' },
        body: JSON.stringify({ name, visibility: 'public' }),
      }, `Create Contentful tag ${name}`);
      byName.set(name, tag);
    }
    if (tag.sys?.id) links.push({ sys: { type: 'Link', linkType: 'Tag', id: tag.sys.id } });
  }
  return links;
}

async function findExistingAsset(unitName, filename, config) {
  const assets = await contentfulRequest('/assets?limit=1000', config, {}, 'Contentful asset lookup');
  const normalizedUnit = unitName.toLowerCase();
  const normalizedFilename = filename.toLowerCase();
  return (assets.items || []).find(asset => {
    const title = String(asset.fields?.title?.en || '').toLowerCase();
    const description = String(asset.fields?.description?.en || '').toLowerCase();
    return title === normalizedUnit || title === normalizedFilename || description.includes(`unit:${normalizedUnit}`);
  }) || null;
}

function assetUrl(asset) {
  const url = asset.fields?.file?.en?.url || '';
  return url.startsWith('//') ? `https:${url}` : url;
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitForProcessedAsset(assetId, config) {
  const attempts = Number(process.env.CONTENTFUL_PROCESS_ATTEMPTS || 15);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const asset = await contentfulRequest(
      `/assets/${encodeURIComponent(assetId)}`,
      config,
      {},
      `Retrieve processed Contentful asset ${assetId}`,
    );
    if (asset.fields?.file?.en?.url) return asset;
    if (attempt < attempts - 1) await wait(1000);
  }
  throw new Error(`Contentful asset ${assetId} did not finish processing in time`);
}

async function uploadAsset(file, unitName, product, config) {
  const existing = await findExistingAsset(unitName, file.originalname, config);
  if (existing) {
    return {
      unitName,
      assetUrl: assetUrl(existing),
      productId: product.productId,
      projectName: product.projectName,
      buildingCode: product.buildingCode,
      floorNumber: product.floorNumber,
      status: 'duplicate-skipped',
      error: '',
    };
  }

  const tags = await ensureTagsExist(product.tags, config);
  const uploadResponse = await fetch(`${CONTENTFUL_UPLOADS_API}/spaces/${encodeURIComponent(config.contentfulSpaceId)}/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.contentfulManagementToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: file.buffer,
  });
  const uploadBody = await readResponse(uploadResponse, `Upload ${file.originalname} to Contentful`);
  const uploadId = uploadBody.sys?.id;
  if (!uploadId) throw new Error(`Contentful returned no upload ID for ${file.originalname}`);

  const asset = await contentfulRequest('/assets', config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.contentful.management.v1+json' },
    body: JSON.stringify({
      metadata: { tags },
      fields: {
        title: { en: unitName },
        description: { en: `Unit:${unitName}` },
        file: { en: {
          fileName: file.originalname,
          contentType: file.mimetype,
          uploadFrom: { sys: { type: 'Link', linkType: 'Upload', id: uploadId } },
        } },
      },
    }),
  }, `Create Contentful asset for ${unitName}`);
  const assetId = asset.sys?.id;
  if (!assetId) throw new Error(`Contentful returned no asset ID for ${unitName}`);

  await contentfulRequest(`/assets/${encodeURIComponent(assetId)}/files/en/process`, config, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/vnd.contentful.management.v1+json' },
  }, `Process Contentful asset ${unitName}`);
  const processedAsset = await waitForProcessedAsset(assetId, config);
  await contentfulRequest(`/assets/${encodeURIComponent(assetId)}/published`, config, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'X-Contentful-Version': String(processedAsset.sys.version),
    },
  }, `Publish Contentful asset ${unitName}`);
  const publishedAsset = await contentfulRequest(`/assets/${encodeURIComponent(assetId)}`, config, {}, `Retrieve Contentful asset ${unitName}`);

  return {
    unitName,
    assetUrl: assetUrl(publishedAsset),
    productId: product.productId,
    projectName: product.projectName,
    buildingCode: product.buildingCode,
    floorNumber: product.floorNumber,
    status: 'uploaded',
    error: '',
  };
}

router.get('/', (req, res) => {
  res.render('image-upload', {
    title: 'Image Upload Utility - Logger Dashboard',
  });
});

router.post('/upload', (req, res) => {
  upload.array('images', 10)(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }
    try {
      const config = getConfig();
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ error: 'Choose at least one image to upload' });

      const token = await getCommercetoolsToken(config);
      const results = [];
      for (const file of files) {
        const unitName = filenameUnit(file.originalname);
        try {
          const product = await getProductDetails(token, unitName, config);
          results.push(await uploadAsset(file, unitName, product, config));
        } catch (error) {
          results.push({ unitName, assetUrl: '', productId: '', projectName: '', buildingCode: '', floorNumber: '', status: 'failed', error: error.message });
        }
      }
      return res.json({ results, csv: toCsv(results) });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

module.exports = router;
