const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middleware/authMiddleware');
const whatsappService = require('../services/whatsappService');

router.post('/start', protegerRuta, async (req, res) => {
  try {
    await whatsappService.startBot(req.tenantId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to start bot' });
  }
});

router.post('/stop', protegerRuta, (req, res) => {
  try {
    whatsappService.stopBot(req.tenantId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to stop bot' });
  }
});

router.get('/status', protegerRuta, (req, res) => {
  try {
    const { status, hasLastQR } = whatsappService.getStatus(req.tenantId);
    res.json({ status, hasLastQR });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

module.exports = router;
