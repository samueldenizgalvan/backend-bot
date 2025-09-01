const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const { requireTenant } = require('../middleware/authMiddleware');

router.use(requireTenant);

// Citas pendientes
router.get('/citas/pendientes', citasController.getPendientes);

// Citas confirmadas
router.get('/citas/confirmadas', citasController.getConfirmadas);

// Confirmar cita
router.post('/citas/confirmar', citasController.confirmarCita);

// Crear cita pendiente
router.post('/citas/pendientes', citasController.crearPendiente);

// Eliminar cita pendiente
router.delete('/citas/pendientes/:telefono', citasController.eliminarPendiente);

// Eliminar cita confirmada
router.delete('/citas/confirmadas/:telefono', citasController.eliminarConfirmada);

module.exports = router;
