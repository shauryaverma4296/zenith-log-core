const express = require('express');
const router = express.Router();

// Login page route
router.get('/login', (req, res) => {
  // If already authenticated, redirect to logs
  const token = req.session?.authToken;
  if (token) {
    return res.redirect('/logs');
  }
  
  res.render('login', {
    title: 'Login - Logger Dashboard',
    error: req.query.error || null
  });
});

// Login form submission
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    
    if (!username || !password) {
      return res.render('login', {
        title: 'Login - Logger Dashboard',
        error: 'Username and password are required'
      });
    }
    
    // For demo purposes, simulate the auth API call
    // Replace this with actual call to your auth service
    const mockAuthResponse = {
      ok: username === 'admin' && password === 'password', // Demo credentials
      data: username === 'admin' && password === 'password' ? 'mock-jwt-token-12345' : null,
      message: username === 'admin' && password === 'password' ? 'Success' : 'Invalid credentials'
    };
    
    if (mockAuthResponse.ok && mockAuthResponse.data) {
      // Store token in session
      req.session.authToken = mockAuthResponse.data;
      req.session.username = username;
      
      // Set cookie expiry based on remember me
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }
      
      res.redirect('/logs');
    } else {
      res.render('login', {
        title: 'Login - Logger Dashboard',
        error: mockAuthResponse.message || 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login - Logger Dashboard',
      error: 'Login service unavailable'
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
});

// Get token endpoint (proxy to existing endpoint)
router.post('/get-token', async (req, res) => {
  // This assumes there's already an implementation of /auth/get-token
  // If not, you'll need to implement the actual authentication logic here
  res.status(501).json({
    message: "This endpoint should be implemented by your authentication service",
    data: null
  });
});

module.exports = router;