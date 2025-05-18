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
      subject: `Soporte: ${req.body.nombre}`,
      text: `\nNombre: ${req.body.nombre}\nEmpresa: ${req.body.empresa}\nTeléfono: ${req.body.telefono}\nDescripción: ${req.body.descripcion}\n  `
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
      subject: `Solicitud Bot: ${req.body.empresaBot}`,
      text: `\nEmpresa: ${req.body.empresaBot}\nContacto: ${req.body.contactoBot}\nDatos a pedir: ${req.body.infoCliente}\nObservaciones: ${req.body.observacionesBot || ''}\n  `
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

module.exports = router;
