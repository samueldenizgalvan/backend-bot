const mailerService = require('../services/mailerService');

exports.handleSoporte = async (req, res) => {
  const { nombre, empresa, telefono, descripcion, captcha } = req.body;
  if (!req.session.captchaAnswer || parseInt(captcha) !== req.session.captchaAnswer) {
    return res.status(400).json({ success: false, error: 'Captcha incorrecto' });
  }
  try {
    await mailerService.sendSoporteEmail({ nombre, empresa, telefono, descripcion });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error enviando email de soporte:', err);
    return res.status(500).json({ success: false, error: 'Error interno al enviar email' });
  }
};

exports.handleBotRequest = async (req, res) => {
  const { empresaBot, contactoBot, infoCliente, observacionesBot, captcha } = req.body;
  if (!req.session.captchaAnswer || parseInt(captcha) !== req.session.captchaAnswer) {
    return res.status(400).json({ success: false, error: 'Captcha incorrecto' });
  }
  try {
    await mailerService.sendBotRequestEmail({ empresaBot, contactoBot, infoCliente, observacionesBot });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error enviando email de bot-request:', err);
    return res.status(500).json({ success: false, error: 'Error interno al enviar email' });
  }
};
