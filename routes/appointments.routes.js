const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointments.controller');
const { requireTenant } = require('../middleware/requireTenant');

router.use(requireTenant);

router.get('/appointments', controller.listAppointments);
router.post('/appointments', controller.createAppointment);
router.post('/appointments/:id/confirm', controller.confirmAppointment);

module.exports = router;
