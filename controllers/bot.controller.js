const whatsappService = require('../services/whatsappService');

exports.startBot = async (req, res) => {
  try {
    const status = await whatsappService.startBot(req.tenantId);
    res.json({ success: true, ...status });
  } catch (err) {
    console.error('Error starting bot:', err);
    res.status(500).json({ success: false, error: 'Error starting bot' });
  }
};

exports.stopBot = (req, res) => {
  try {
    whatsappService.stopBot(req.tenantId);
    res.json({ success: true });
  } catch (err) {
    console.error('Error stopping bot:', err);
    res.status(500).json({ success: false, error: 'Error stopping bot' });
  }
};

exports.getStatus = (req, res) => {
  try {
    const status = whatsappService.getStatus(req.tenantId);
    res.json({ success: true, ...status });
  } catch (err) {
    console.error('Error getting status:', err);
    res.status(500).json({ success: false, error: 'Error getting status' });
  }
};
