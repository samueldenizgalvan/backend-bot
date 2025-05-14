const express = require('express');
const router = express.Router();
const path = require('path');

// Login page
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public', 'login.html')));

// Captcha
router.get('/captcha', (req, res) => {
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  const suma = num1 + num2;
  req.session.captchaAnswer = suma;
  res.json({ pregunta: `${num1} + ${num2}`, respuesta: suma });
});

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
    res.status(401).json({ success: false });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

module.exports = router;
