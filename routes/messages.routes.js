const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');

router.get('/messages', messagesController.getMessages);

module.exports = router;
