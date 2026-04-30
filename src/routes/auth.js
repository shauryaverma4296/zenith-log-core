const express = require('express');
const router = express.Router();

// Demo user directory: maps credentials to allowed tabs.
// Replace with a real auth service in production.
const USERS = {
  admin:  { password: 'password', access: ['logs', 'contentful'] },
  viewer: { password: 'password', access: ['logs'] },
  editor: { password: 'password', access: ['contentful'] },
};

function authenticate(username, password) {
  const u = USERS[username];
  if (!u || u.password !== password) return null;
  return { token: 'demo-jwt-token-' + Date.now(), access: u.access };
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
      req.session.access = result.access;
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
      return res.status(400).json({ message: 'Username and password are required', token: null, access: [] });
    }
    const result = authenticate(username, password);
    if (!result) {
      return res.status(401).json({ message: 'Invalid credentials', token: null, access: [] });
    }
    return res.json({ message: 'Login successful', ...result });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Authentication service unavailable', token: null, access: [] });
  }
});

module.exports = router;
