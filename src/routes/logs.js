const express = require('express');
const { MongoClient } = require('mongodb');
const moment = require('moment');

const router = express.Router();

// MongoDB connection configuration
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'winston_logs';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'logs';

let db = null;

// Initialize MongoDB connection
async function initializeDatabase() {
  try {
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB for logs viewing');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

// Initialize database connection
initializeDatabase();

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
        totalPages: 1
      });
    }

    const {
      search = '',
      type = 'correlationId',
      page = '1',
      limit = '50'
    } = req.query;

    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const skip = (currentPage - 1) * itemsPerPage;

    // Build search query
    let searchQuery = {};
    
    if (search.trim()) {
      if (type === 'correlationId') {
        searchQuery['meta.correlationId'] = { $regex: search, $options: 'i' };
      } else if (type === 'tibicotransactionid') {
        searchQuery['meta.tibicotransactionid'] = { $regex: search, $options: 'i' };
      }
    }

    const collection = db.collection(COLLECTION_NAME);

    // Get total count for pagination
    const totalCount = await collection.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Fetch logs with pagination
    const logs = await collection
      .find(searchQuery)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .toArray();

    // Transform logs for display
    const transformedLogs = logs.map(log => ({
      ...log,
      correlationId: log.meta?.correlationId || log.correlationId,
      tibicotransactionid: log.meta?.tibicotransactionid || log.tibicotransactionid,
      payload: log.meta?.payload || log.payload
    }));

    res.render('logs', {
      title: 'Logger Dashboard',
      logs: transformedLogs,
      searchQuery: search,
      searchType: type,
      currentPage,
      totalPages,
      totalCount
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
      totalPages: 1
    });
  }
});

// API endpoint for JSON response
router.get('/api', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const {
      search = '',
      type = 'correlationId',
      page = '1',
      limit = '50'
    } = req.query;

    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const skip = (currentPage - 1) * itemsPerPage;

    // Build search query
    let searchQuery = {};
    
    if (search.trim()) {
      if (type === 'correlationId') {
        searchQuery['meta.correlationId'] = { $regex: search, $options: 'i' };
      } else if (type === 'tibicotransactionid') {
        searchQuery['meta.tibicotransactionid'] = { $regex: search, $options: 'i' };
      }
    }

    const collection = db.collection(COLLECTION_NAME);

    // Get total count for pagination
    const totalCount = await collection.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Fetch logs with pagination
    const logs = await collection
      .find(searchQuery)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .toArray();

    res.json({
      logs,
      pagination: {
        currentPage,
        totalPages,
        totalCount,
        itemsPerPage
      },
      search: {
        query: search,
        type
      }
    });

  } catch (error) {
    console.error('Error fetching logs via API:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;