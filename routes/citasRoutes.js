const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const requireTenant = require('../middleware/requireTenant');

// Citas pendientes
router.get('/citas/pendientes', requireTenant, citasController.getPendientes);

// Citas confirmadas
router.get('/citas/confirmadas', requireTenant, citasController.getConfirmadas);

// Confirmar cita
router.post('/citas/confirmar', requireTenant, citasController.confirmarCita);

// Eliminar cita pendiente
router.delete('/citas/pendientes/:id', requireTenant, citasController.eliminarPendiente);

// Eliminar cita confirmada
router.delete('/citas/confirmadas/:id', requireTenant, citasController.eliminarConfirmada);

module.exports = router;
