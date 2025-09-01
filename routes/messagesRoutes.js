const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');

router.get('/messages', (req, res) => {
    if (!req.session || !req.session.authenticated) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    messagesController.getMessages(req, res);
});

module.exports = router;
