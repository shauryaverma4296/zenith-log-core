const express = require('express');
const router = express.Router();

// Demo user directory: maps credentials to roles.
// Add new roles freely (e.g. 'editor', 'auditor'). Tool access is decided
// by the tool registry (see views/select.pug and src/server.js TOOL_ROLES).
const USERS = {
  admin:  { password: 'password', roles: ['admin'] },
  user:   { password: 'password', roles: ['user'] },
  viewer: { password: 'password', roles: ['user'] },
};

function authenticate(username, password) {
  const u = USERS[username];
  if (!u || u.password !== password) return null;
  return { token: 'demo-jwt-token-' + Date.now(), roles: u.roles };
}

// Login page
router.get('/login', (req, res) => {
  if (req.session?.authToken) {
    return res.redirect('/select');
  }
  res.render('login', {
    title: 'Login - Logger Dashboard',
    error: req.query.error || null
  });
});

// Login submission
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.render('login', {
        title: 'Login - Logger Dashboard',
        error: 'Username and password are required'
      });
    }

    const result = authenticate(username, password);

    if (result) {
      req.session.authToken = result.token;
      req.session.username = username;
      req.session.roles = result.roles;
      req.session.cookie.maxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
      return res.redirect('/select');
    }

    return res.render('login', {
      title: 'Login - Logger Dashboard',
      error: 'Invalid credentials'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login - Logger Dashboard',
      error: 'Login service unavailable'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/auth/login');
  });
});

// JSON token endpoint (for programmatic clients only)
router.post('/get-token', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required', token: null, roles: [] });
    }
    const result = authenticate(username, password);
    if (!result) {
      return res.status(401).json({ message: 'Invalid credentials', token: null, roles: [] });
    }
    return res.json({ message: 'Login successful', ...result });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Authentication service unavailable', token: null, roles: [] });
  }
});

module.exports = router;
