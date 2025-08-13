const express = require('express');
const path = require('path');
const logsRouter = require('./routes/logs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Set up Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (if needed)
app.use('/static', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/logs', logsRouter);

// Root route redirect to logs
app.get('/', (req, res) => {
  res.redirect('/logs');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'winston-logger-dashboard'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('logs', {
    title: 'Page Not Found',
    logs: [],
    error: 'Page not found',
    searchQuery: '',
    searchType: 'correlationId',
    currentPage: 1,
    totalPages: 1
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('logs', {
    title: 'Server Error',
    logs: [],
    error: 'Internal server error',
    searchQuery: '',
    searchType: 'correlationId',
    currentPage: 1,
    totalPages: 1
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Logger Dashboard running on http://localhost:${PORT}`);
    console.log(`View logs at: http://localhost:${PORT}/logs`);
  });
}

module.exports = app;