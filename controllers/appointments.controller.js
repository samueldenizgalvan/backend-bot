const appointmentsService = require('../services/appointmentsService');

const listAppointments = (req, res) => {
  const data = appointmentsService.listAppointments(req.tenantId);
  res.json(data);
};

const createAppointment = (req, res) => {
  const appointment = appointmentsService.createAppointment(req.tenantId, req.body);
  res.status(201).json(appointment);
};

const confirmAppointment = (req, res) => {
  const appointment = appointmentsService.confirmAppointment(req.tenantId, req.params.id);
  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json(appointment);
};

module.exports = {
  listAppointments,
  createAppointment,
  confirmAppointment,
};
