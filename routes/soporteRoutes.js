const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configuración de mailer (ajusta según tu config real)
const mailer = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'administrador@bot-whatsapp.es',
    pass: '9vtk6L6q7vTRw$='
  }
});

// POST /api/soporte
router.post('/soporte', async (req, res) => {
  try {
    await mailer.sendMail({
      from: '"Soporte Bot" <administrador@bot-whatsapp.es>',
      to: 'samueldenizgalvan@gmail.com',
      subject: `Soporte: ${req.body.botName}`,
      text: `
Nombre: ${req.body.botName}
Empresa: ${req.body.botPhone}
Teléfono: ${req.body.botEmail}
Descripción: ${req.body.botDetails}
  `
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// POST /api/bot-request
router.post('/bot-request', async (req, res) => {
  try {
    await mailer.sendMail({
      from: '"Soporte Bot" <administrador@bot-whatsapp.es>',
      to: 'samueldenizgalvan@gmail.com',
      subject: `Solicitud Bot: ${req.body.botName}`,
      text: `
Empresa: ${req.body.botName}
Contacto: ${req.body.botPhone}
Datos a pedir: ${req.body.botEmail}
Observaciones: ${req.body.botDetails || ''}
  `
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

module.exports = router;
