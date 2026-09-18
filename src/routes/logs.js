const express = require('express');
const { MongoClient } = require('mongodb');
const moment = require('moment');

const router = express.Router();

// MongoDB connection configuration
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'winston_logs';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'logs';
const IMAGE_UPLOAD_LOG_COLLECTION = process.env.IMAGE_UPLOAD_LOG_COLLECTION || 'image_upload_transactions';

let db = null;

// Initialize MongoDB connection with indexes
async function initializeDatabase() {
  try {
    const client = new MongoClient(MONGODB_URL, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    await client.connect();
    db = client.db(DB_NAME);

    // Create indexes for faster queries
    const collection = db.collection(COLLECTION_NAME);
    await collection.createIndex({ 'metadata.correlationId': 1 });
    await collection.createIndex({ 'metadata.tibcoTransactionId': 1 });
    await collection.createIndex(
      { 'metadata.payload.unitName': 1 },
      { collation: { locale: 'en', strength: 2 } }
    );
    await collection.createIndex({ timestamp: -1 });

    const imageUploadCollection = db.collection(IMAGE_UPLOAD_LOG_COLLECTION);
    await imageUploadCollection.createIndex({ 'metadata.transactionId': 1 }, { unique: true });
    await imageUploadCollection.createIndex({ timestamp: -1 });

    console.log('Connected to MongoDB with indexes created');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

// Initialize database connection
initializeDatabase();

// JSON endpoint for the Image Upload Utility Logs tab.
router.get('/image-upload-transactions', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database connection not available' });
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const search = String(req.query.search || '').trim().slice(0, 80);
    const query = { 'metadata.event': 'image_upload_transaction' };
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query['metadata.transactionId'] = { $regex: `^${escapedSearch}`, $options: 'i' };
    }
    const collection = db.collection(IMAGE_UPLOAD_LOG_COLLECTION);
    const totalCount = await collection.countDocuments(query);
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .project({ timestamp: 1, level: 1, message: 1, metadata: 1 })
      .toArray();
    return res.json({ logs, totalCount, search });
  } catch (error) {
    console.error('Failed to retrieve image upload transaction logs:', error);
    return res.status(500).json({ error: 'Failed to retrieve upload transaction logs' });
  }
});

// GET /logs - Display logs with search functionality
router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).render('logs', {
        title: 'Logger Dashboard - Error',
        logs: [],
        error: 'Database connection not available',
        searchQuery: '',
        searchType: 'correlationId',
        currentPage: 1,
        totalPages: 1,
      });
    }

  const { search = '', type = 'correlationId', page = '1', limit = '50', level = '' } = req.query;

    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const skip = (currentPage - 1) * itemsPerPage;

    // Build search query
    let searchQuery = {};
    let useCollation = false;

    // Add level filter
    if (level && level !== 'all') {
      searchQuery.level = level;
    }

    if (search.trim()) {
      // Escape special regex characters
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (type === 'correlationId') {
        searchQuery['metadata.correlationId'] = { $regex: `^${escapedSearch}`, $options: 'i' };
      } else if (type === 'tibcoTransactionId') {
        searchQuery['metadata.tibcoTransactionId'] = { $regex: `^${escapedSearch}`, $options: 'i' };
      } else if (type === 'unitName') {
        searchQuery['metadata.payload.unitName'] = { $regex: `^${escapedSearch}`, $options: 'i' };
        useCollation = true;
      }
    }

    const collection = db.collection(COLLECTION_NAME);

    // Get total count for pagination
    const totalCount = await collection.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Fetch logs with pagination
    let cursor = collection.find(searchQuery);

    if (useCollation) {
      cursor = cursor.collation({ locale: 'en', strength: 2 });
    }

    const logs = await cursor.sort({ timestamp: -1 }).skip(skip).limit(itemsPerPage).toArray();

    // Transform logs for display
    const transformedLogs = logs.map(log => ({
      ...log,
      correlationId: log.metadata?.correlationId || log.correlationId,
      tibcoTransactionId: log.metadata?.tibcoTransactionId || log.tibcoTransactionId,
    }));

    res.render('logs', {
      title: 'Logger Dashboard',
      logs: transformedLogs,
      searchQuery: search,
      searchType: type,
      levelFilter: level,
      currentPage,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).render('logs', {
      title: 'Logger Dashboard - Error',
      logs: [],
      error: 'Failed to fetch logs',
      searchQuery: req.query.search || '',
      searchType: req.query.type || 'correlationId',
      currentPage: 1,
      totalPages: 1,
    });
  }
});

// API endpoint for JSON response (used by React frontend)
router.get('/', async (req, res) => {
  // Check if request wants JSON (API call from React)
  const wantsJson = req.xhr || req.headers.accept?.includes('application/json') || req.headers.authorization;
  
  try {
    if (!db) {
      if (wantsJson) {
        return res.status(500).json({ error: 'Database connection not available' });
      }
      return res.status(500).render('logs', {
        title: 'Logger Dashboard - Error',
        logs: [],
        error: 'Database connection not available',
        searchQuery: '',
        searchType: 'correlationId',
        currentPage: 1,
        totalPages: 1,
      });
    }

    const { search = '', type = 'correlationId', page = '1', limit = '50', level = '' } = req.query;

    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const skip = (currentPage - 1) * itemsPerPage;

    // Build search query
    let searchQuery = {};
    let useCollation = false;

    // Add level filter
    if (level && level !== 'all') {
      searchQuery.level = level;
    }

    if (search.trim()) {
      // Escape special regex characters
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (type === 'correlationId') {
        searchQuery['metadata.correlationId'] = { $regex: `^${escapedSearch}`, $options: 'i' };
      } else if (type === 'tibcoTransactionId') {
        searchQuery['metadata.tibcoTransactionId'] = { $regex: `^${escapedSearch}`, $options: 'i' };
      } else if (type === 'unitName') {
        searchQuery['metadata.payload.unitName'] = { $regex: `^${escapedSearch}`, $options: 'i' };
        useCollation = true;
      }
    }

    const collection = db.collection(COLLECTION_NAME);

    // Get total count for pagination
    const totalCount = await collection.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Fetch logs with pagination
    let cursor = collection.find(searchQuery);

    if (useCollation) {
      cursor = cursor.collation({ locale: 'en', strength: 2 });
    }

    const logs = await cursor.sort({ timestamp: -1 }).skip(skip).limit(itemsPerPage).toArray();

    // Transform logs for display
    const transformedLogs = logs.map(log => ({
      ...log,
      correlationId: log.metadata?.correlationId || log.correlationId,
      tibcoTransactionId: log.metadata?.tibcoTransactionId || log.tibcoTransactionId,
    }));

    // Return JSON for API requests
    if (wantsJson) {
      return res.json({
        logs: transformedLogs,
        currentPage,
        totalPages,
        totalCount,
      });
    }

    // Render HTML for browser requests
    res.render('logs', {
      title: 'Logger Dashboard',
      logs: transformedLogs,
      searchQuery: search,
      searchType: type,
      levelFilter: level,
      currentPage,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    if (wantsJson) {
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }
    res.status(500).render('logs', {
      title: 'Logger Dashboard - Error',
      logs: [],
      error: 'Failed to fetch logs',
      searchQuery: req.query.search || '',
      searchType: req.query.type || 'correlationId',
      currentPage: 1,
      totalPages: 1,
    });
  }
});

module.exports = router;
