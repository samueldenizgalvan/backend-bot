const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flow.controller');
const requireTenant = require('../middleware/requireTenant');

router.get('/flow/current', requireTenant, flowController.getCurrent);
router.put('/flow/current', requireTenant, flowController.updateCurrent);

module.exports = router;
