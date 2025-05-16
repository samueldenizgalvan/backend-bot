const express = require('express');
const router = express.Router();
const path = require('path');

// Login page
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public', 'login.html')));

// Check auth
router.get('/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const usuariosValidos = { 'admin': 'password123' }; // Puedes mover esto a un config
  if (usuariosValidos[username] === password) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

module.exports = router;
