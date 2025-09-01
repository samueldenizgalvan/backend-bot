const express = require('express');
const router = express.Router();
const botController = require('../controllers/bot.controller');
const { requireTenant } = require('../middleware/authMiddleware');

router.post('/bot/start', requireTenant, botController.startBot);
router.post('/bot/stop', requireTenant, botController.stopBot);
router.get('/bot/status', requireTenant, botController.getStatus);

module.exports = router;
