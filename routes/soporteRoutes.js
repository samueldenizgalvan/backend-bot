const express = require('express');
const router = express.Router();
const soporteController = require('../controllers/soporteController');

router.post('/soporte', soporteController.handleSoporte);
router.post('/bot-request', soporteController.handleBotRequest);

module.exports = router;
