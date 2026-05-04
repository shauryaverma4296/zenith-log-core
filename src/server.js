const express = require('express');
const path = require('path');
const session = require('express-session');
const logsRouter = require('./routes/logs');
const authRouter = require('./routes/auth');
const contentfulRouter = require('./routes/contentful');

const app = express();
const PORT = process.env.PORT || 3001;

// Pug view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'logger-dashboard-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (if any)
app.use('/static', express.static(path.join(__dirname, '../public')));

// Single source of truth: which roles can access which tool.
// Add a new tool/role here and it works across server + views.
const TOOL_ROLES = {
  logs: ['user', 'admin'],
  contentful: ['user'],
};

// Expose session info to all templates
app.use((req, res, next) => {
  res.locals.session = req.session || {};
  res.locals.username = req.session?.username || null;
  res.locals.roles = req.session?.roles || [];
  next();
});

// Auth required
const requireAuth = (req, res, next) => {
  if (!req.session?.authToken) return res.redirect('/auth/login');
  next();
};

// Per-tool access required (role-based)
const requireAccess = (tool) => (req, res, next) => {
  if (!req.session?.authToken) return res.redirect('/auth/login');
  const userRoles = req.session.roles || [];
  const allowedRoles = TOOL_ROLES[tool] || [];
  const allowed = userRoles.some((r) => allowedRoles.includes(r));
  if (!allowed) {
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: `You don't have access to "${tool}". Contact an administrator.`
    });
  }
  next();
};

// Selector page (lists tools the user can open)
app.get('/select', requireAuth, (req, res) => {
  res.render('select', {
    title: 'Select Tool - Logger Dashboard',
    roles: req.session.roles || [],
    username: req.session.username
  });
});

// Routes
app.use('/auth', authRouter);
app.use('/logs', requireAccess('logs'), logsRouter);
app.use('/contentful', requireAccess('contentful'), contentfulRouter);

// Root redirect
app.get('/', (req, res) => {
  if (!req.session?.authToken) return res.redirect('/auth/login');
  res.redirect('/select');
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
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found' });
  }
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
  }
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'An unexpected error occurred. Please try again later.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Logger Dashboard running on http://localhost:${PORT}`);
    console.log(`View logs at: http://localhost:${PORT}/logs`);
  });
}

module.exports = app;
