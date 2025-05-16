const mailerService = require('../services/mailerService');

exports.handleSoporte = async (req, res) => {
  const { nombre, empresa, telefono, descripcion } = req.body;
  console.log('[Soporte] Datos recibidos:', req.body);
  try {
    await mailerService.sendSoporteEmail({ nombre, empresa, telefono, descripcion });
    console.log('[Soporte] Email enviado correctamente');
    return res.json({ success: true });
  } catch (err) {
    console.error('Error enviando email de soporte:', err);
    return res.status(500).json({ success: false, error: 'Error interno al enviar email' });
  }
};

exports.handleBotRequest = async (req, res) => {
  const { empresaBot, contactoBot, infoCliente, observacionesBot } = req.body;
  console.log('[BotRequest] Datos recibidos:', req.body);
  try {
    await mailerService.sendBotRequestEmail({ empresaBot, contactoBot, infoCliente, observacionesBot });
    console.log('[BotRequest] Email enviado correctamente');
    return res.json({ success: true });
  } catch (err) {
    console.error('Error enviando email de bot-request:', err);
    return res.status(500).json({ success: false, error: 'Error interno al enviar email' });
  }
};
