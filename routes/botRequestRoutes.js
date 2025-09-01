const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { requireTenant } = require('../middleware/authMiddleware');

router.use(requireTenant);

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

// POST /api/bot-request
router.post('/bot-request', async (req, res) => {
  try {
    console.log('Form Data Received:', req.body); // Debugging log

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
    console.error('Error in /bot-request:', err); // Debugging log
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

module.exports = router;
