const express = require('express');
const multer = require('multer');
const contentfulManagement = require('contentful-management');
const { WinstonLoggerAdapter } = require('../infrastructure/WinstonLoggerAdapter');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return callback(new Error(`${file.originalname} is not an image file`));
    }
    callback(null, true);
  },
});

const COMMERCETOOLS_AUTH_API = 'https://auth.europe-west1.gcp.commercetools.com/oauth/token';
const COMMERCETOOLS_API = 'https://api.europe-west1.gcp.com';
const MAX_TRANSACTION_ITEMS = 100;
const IMAGE_UPLOAD_LOG_COLLECTION = process.env.IMAGE_UPLOAD_LOG_COLLECTION || 'image_upload_transactions';
const finalizedTransactions = new Map();

function mongoLogConnectionString() {
  const source = process.env.MONGODB_URL || 'mongodb://localhost:27017';
  const database = process.env.DB_NAME || 'winston_logs';
  const queryIndex = source.indexOf('?');
  const query = queryIndex >= 0 ? source.slice(queryIndex) : '';
  const base = queryIndex >= 0 ? source.slice(0, queryIndex) : source;
  const match = base.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/.*)?$/i);
  return match ? `${match[1]}/${encodeURIComponent(database)}${query}` : source;
}

const uploadLogger = WinstonLoggerAdapter.fromConfiguration({
  name: 'image-upload-transactions',
  level: 'info',
  defaultMetadata: { service: 'image-upload-utility' },
  transports: [{
    type: 'mongodb',
    level: 'info',
    options: {
      connectionString: mongoLogConnectionString(),
      collection: IMAGE_UPLOAD_LOG_COLLECTION,
      tryReconnect: true,
    },
  }],
  silent: false,
  exitOnError: false,
  handleExceptions: false,
  handleRejections: false,
});

function writeTransactionLog(metadata) {
  return new Promise((resolve, reject) => {
    uploadLogger.winston.write({
      level: 'info',
      message: 'Image upload transaction completed',
      ...uploadLogger.buildLogData(metadata),
    }, error => error ? reject(error) : resolve());
  });
}

function rememberFinalizedTransaction(transactionId) {
  finalizedTransactions.set(transactionId, Date.now());
  if (finalizedTransactions.size > 1000) {
    const oldest = finalizedTransactions.keys().next().value;
    finalizedTransactions.delete(oldest);
  }
}

function getConfig() {
  const config = {
    commercetoolsClientId: process.env.COMMERCETOOLS_CLIENT_ID,
    commercetoolsClientSecret: process.env.COMMERCETOOLS_CLIENT_SECRET,
    commercetoolsProjectKey: process.env.COMMERCETOOLS_PROJECT_KEY,
    commercetoolsFloorPlanAttribute: process.env.COMMERCETOOLS_FLOOR_PLAN_ATTRIBUTE || 'coloredFloorPlan',
    contentfulManagementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN,
    contentfulSpaceId: process.env.CONTENTFUL_SPACE_ID,
    contentfulEnvironmentId: process.env.CONTENTFUL_ENVIRONMENT_ID || process.env.CONTENTFUL_ENVIRONMENT || 'master',
    contentfulLocale: process.env.CONTENTFUL_LOCALE || 'en',
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
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(config.commercetoolsProjectKey)) {
    throw new Error('COMMERCETOOLS_PROJECT_KEY must be the project key (for example, damac-staging), not a project UUID');
  }
  return config;
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
  return originalname
    .replace(/\.[^/.]+$/, '')
    .trim()
    .replace(/_+/g, '/');
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

function hasAttributeValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
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
  const template = process.env.COMMERCETOOLS_PRODUCT_WHERE_TEMPLATE || 'masterData(current(name(en="{unit}")))';
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
    productVersion: product.version,
    variantId: current.masterVariant?.id,
    projectName: getPath(product, ['projectName', 'project.name', 'masterData.current.custom.fields.projectName', 'masterData.current.name.en']) || getPath(attributeMap, ['projectName']),
    buildingCode: getPath(product, ['buildingCode', 'masterData.current.custom.fields.buildingCode']) || getPath(attributeMap, ['buildingCode']),
    floorNumber: getPath(product, ['floorNumber', 'masterData.current.custom.fields.floorNumber']) || getPath(attributeMap, ['floorNumber']),
    hasFloorPlanValue: hasAttributeValue(attributeMap[config.commercetoolsFloorPlanAttribute]),
  };
  return { ...productDetails, tags: uniqueValues([unitName, productDetails.projectName, productDetails.buildingCode, productDetails.floorNumber]) };
}

async function updateFloorPlan(token, product, floorPlanUrl, config) {
  if (!product.productId || !Number.isInteger(product.productVersion)) {
    throw new Error('Commercetools product response is missing its ID or version');
  }
  if (!Number.isInteger(product.variantId)) {
    throw new Error(`Commercetools product ${product.productId} has no master variant ID`);
  }
  if (!floorPlanUrl) {
    throw new Error(`No Contentful asset URL is available for product ${product.productId}`);
  }

  const response = await fetch(
    `${COMMERCETOOLS_API}/${encodeURIComponent(config.commercetoolsProjectKey)}/products/${encodeURIComponent(product.productId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: product.productVersion,
        actions: [{
          action: 'setAttribute',
          variantId: product.variantId,
          name: config.commercetoolsFloorPlanAttribute,
          value: floorPlanUrl,
          staged: false,
        }],
      }),
    },
  );
  await readResponse(response, `Update ${config.commercetoolsFloorPlanAttribute} for product ${product.productId}`);
}

function getContentfulClient(config) {
  return contentfulManagement.createClient(
    { accessToken: config.contentfulManagementToken },
    {
      type: 'plain',
      defaults: {
        spaceId: config.contentfulSpaceId,
        environmentId: config.contentfulEnvironmentId,
      },
    },
  );
}

async function ensureTagsExist(tags, client) {
  if (!tags.length) return [];
  const existing = await client.tag.getMany({ query: { limit: 1000 } });
  const byName = new Map((existing.items || []).map(tag => [tag.name, tag]));
  const links = [];

  for (const name of tags) {
    let tag = byName.get(name);
    if (!tag) {
      const tagId = slugify(name);
      tag = await client.tag.createWithId(
        { tagId },
        { name, sys: { visibility: 'public' } },
      );
      byName.set(name, tag);
    }
    if (tag.sys?.id) links.push({ sys: { type: 'Link', linkType: 'Tag', id: tag.sys.id } });
  }
  return links;
}

async function findExistingAsset(unitName, filename, client, locale) {
  const assets = await client.asset.getMany({ query: { limit: 1000 } });
  const normalizedUnit = unitName.toLowerCase();
  const normalizedFilename = filename.toLowerCase();
  return (assets.items || []).find(asset => {
    const title = String(asset.fields?.title?.[locale] || '').toLowerCase();
    const description = String(asset.fields?.description?.[locale] || '').toLowerCase();
    return title === normalizedUnit || title === normalizedFilename || description.includes(`unit:${normalizedUnit}`);
  }) || null;
}

function assetUrl(asset, locale) {
  const url = asset.fields?.file?.[locale]?.url || '';
  return url.startsWith('//') ? `https:${url}` : url;
}

async function uploadAsset(file, unitName, product, config, client) {
  const locale = config.contentfulLocale;
  const fileData = file.buffer.buffer.slice(
    file.buffer.byteOffset,
    file.buffer.byteOffset + file.buffer.byteLength,
  );
  const existing = await findExistingAsset(unitName, file.originalname, client, locale);
  if (existing) {
    return {
      unitName,
      assetUrl: assetUrl(existing, locale),
      productId: product.productId,
      projectName: product.projectName,
      buildingCode: product.buildingCode,
      floorNumber: product.floorNumber,
      status: 'duplicate-skipped',
      uploadSuccess: true,
      ctUpdateSuccess: false,
      ctUpdateSkipped: false,
      error: '',
    };
  }

  const tags = await ensureTagsExist(product.tags, client);
  let asset = await client.asset.createFromFiles(
    {},
    {
      metadata: { tags },
      fields: {
        title: { [locale]: unitName },
        description: { [locale]: `Unit:${unitName}` },
        file: {
          [locale]: {
            fileName: file.originalname,
            contentType: file.mimetype,
            file: fileData,
          },
        },
      },
    },
  );
  asset = await client.asset.processForLocale({}, asset, locale, {
    processingCheckWait: 1000,
    processingCheckRetries: Number(process.env.CONTENTFUL_PROCESS_ATTEMPTS || 15),
  });
  asset = await client.asset.publish({ assetId: asset.sys.id }, asset);

  return {
    unitName,
    assetUrl: assetUrl(asset, locale),
    productId: product.productId,
    projectName: product.projectName,
    buildingCode: product.buildingCode,
    floorNumber: product.floorNumber,
    status: 'uploaded',
    uploadSuccess: true,
    ctUpdateSuccess: false,
    ctUpdateSkipped: false,
    error: '',
  };
}

router.get('/', (req, res) => {
  res.render('image-upload', {
    title: 'Image Upload Utility - Logger Dashboard',
  });
});

router.post('/complete', async (req, res) => {
  try {
    const transactionId = String(req.body?.transactionId || '').trim();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(transactionId)) {
      return res.status(400).json({ error: 'A valid transaction ID is required' });
    }
    if (!items.length || items.length > MAX_TRANSACTION_ITEMS) {
      return res.status(400).json({ error: `Transaction items must contain between 1 and ${MAX_TRANSACTION_ITEMS} records` });
    }
    if (finalizedTransactions.has(transactionId)) {
      return res.json({ transactionId, logged: true, duplicate: true });
    }

    const logItems = items.map(item => ({
      unitName: String(item?.unitName || '').slice(0, 200),
      assetUrl: String(item?.assetUrl || '').slice(0, 2000),
      uploadSuccess: item?.uploadSuccess === true,
      ctUpdateSuccess: item?.ctUpdateSuccess === true,
      ctUpdateSkipped: item?.ctUpdateSkipped === true,
      status: String(item?.status || 'failed').slice(0, 60),
      error: String(item?.error || '').slice(0, 1000),
    }));
    const successfulUploads = logItems.filter(item => item.uploadSuccess).length;
    const successfulCtUpdates = logItems.filter(item => item.ctUpdateSuccess).length;
    const skippedCtUpdates = logItems.filter(item => item.ctUpdateSkipped).length;
    const failedCtUpdates = logItems.length - successfulCtUpdates - skippedCtUpdates;

    await writeTransactionLog({
      event: 'image_upload_transaction',
      transactionId,
      username: String(req.session?.username || 'unknown').slice(0, 100),
      totalImages: logItems.length,
      successfulUploads,
      failedUploads: logItems.length - successfulUploads,
      successfulCtUpdates,
      skippedCtUpdates,
      failedCtUpdates,
      success: successfulUploads === logItems.length && failedCtUpdates === 0,
      items: logItems,
    });
    rememberFinalizedTransaction(transactionId);
    return res.status(201).json({ transactionId, logged: true });
  } catch (error) {
    console.error('Failed to write image upload transaction log:', error);
    return res.status(500).json({ error: 'Failed to save the upload transaction log' });
  }
});

router.post('/upload', (req, res) => {
  upload.array('images', 5)(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }
    try {
      const config = getConfig();
      const files = req.files || [];
      if (!files.length) return res.status(400).json({ error: 'Choose at least one image to upload' });

      const token = await getCommercetoolsToken(config);
      const contentfulClient = getContentfulClient(config);
      const results = [];
      for (const file of files) {
        const unitName = filenameUnit(file.originalname);
        try {
          const product = await getProductDetails(token, unitName, config);
          const result = await uploadAsset(file, unitName, product, config, contentfulClient);
          if (result.status === 'duplicate-skipped' && product.hasFloorPlanValue) {
            results.push({ ...result, ctUpdateSuccess: false, ctUpdateSkipped: true });
            continue;
          }
          try {
            await updateFloorPlan(token, product, result.assetUrl, config);
            results.push({ ...result, ctUpdateSuccess: true, ctUpdateSkipped: false });
          } catch (error) {
            results.push({ ...result, ctUpdateSuccess: false, ctUpdateSkipped: false, status: 'failed', error: error.message });
          }
        } catch (error) {
          results.push({ unitName, assetUrl: '', productId: '', projectName: '', buildingCode: '', floorNumber: '', status: 'failed', uploadSuccess: false, ctUpdateSuccess: false, ctUpdateSkipped: false, error: error.message });
        }
      }
      return res.json({ results, csv: toCsv(results) });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

module.exports = router;
