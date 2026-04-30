const express = require('express');
const path = require('path');
const session = require('express-session');
const logsRouter = require('./routes/logs');
const authRouter = require('./routes/auth');
const contentfulRouter = require('./routes/contentful');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Set up Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));

// CORS middleware for React frontend
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'logger-dashboard-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (if needed)
app.use('/static', express.static(path.join(__dirname, '../public')));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session?.authToken) {
    return res.redirect('/auth/login');
  }
  next();
};

// API Authentication middleware (JWT-based for React frontend)
const requireApiAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }
  // For demo purposes, accept any token. In production, verify JWT
  req.apiToken = authHeader.substring(7);
  next();
};

// Routes
app.use('/auth', authRouter);
app.use('/api/auth', authRouter); // API routes for React frontend
app.use('/api/logs', requireApiAuth, logsRouter); // API routes for React frontend
app.use('/api/contentful', requireApiAuth, contentfulRouter); // Contentful export API
app.use('/contentful', requireAuth, contentfulRouter); // Pug-side (optional)
app.use('/logs', requireAuth, logsRouter);

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

// 404 handler (no logging)
app.use((req, res) => {
  // Check if client expects JSON
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(404).json({ 
      error: 'Not Found',
      message: 'The requested resource was not found'
    });
  }
  
  // Render HTML page without logging
  res.status(404).render('404', {
    title: 'Page Not Found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Check if client expects JSON
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
  
  // Render HTML page
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'An unexpected error occurred. Please try again later.'
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