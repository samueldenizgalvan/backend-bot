const express = require('express');
const router = express.Router();
const { requireTenant } = require('../middleware/requireTenant');
const { readJSON, writeJSON } = require('../services/jsonService');

const defaultFlow = { defaultReply: '...', routes: {} };

router.get('/current', requireTenant, (req, res) => {
  const flow = readJSON(req.tenantId, 'flow', defaultFlow);
  res.json(flow);
});

router.put('/current', requireTenant, (req, res) => {
  if (typeof req.body !== 'object' || req.body === null) {
    return res.status(400).json({ error: 'Cuerpo JSON inválido' });
  }
  writeJSON(req.tenantId, 'flow', req.body);
  res.json({ success: true });
});

module.exports = router;
