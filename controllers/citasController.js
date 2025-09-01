const whatsappService = require('../services/whatsappService');
const {
  listAppointments,
  confirmAppointment,
  deleteAppointment
} = require('../services/citasService');

exports.getPendientes = (req, res) => {
  const citas = listAppointments(req.tenantId, { estado: 'pending', ...req.query });
  res.json(citas);
};

exports.getConfirmadas = (req, res) => {
  const citas = listAppointments(req.tenantId, { estado: 'confirmed', ...req.query });
  res.json(citas);
};

exports.confirmarCita = async (req, res) => {
  const { id } = req.body;
  const cita = confirmAppointment(req.tenantId, id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  try {
    await whatsappService.sendConfirmation(
      req.session.username,
      cita.telefono || cita.id,
      cita.fechaConfirmada,
      cita.horaConfirmada
    );
  } catch (err) {
    console.error('Error enviando confirmación WhatsApp:', err);
  }
  res.json({ success: true });
};

exports.eliminarPendiente = (req, res) => {
  const { id } = req.params;
  const ok = deleteAppointment(req.tenantId, id);
  if (!ok) {
    return res.status(404).json({ success: false, message: 'Cita pendiente no encontrada' });
  }
  res.json({ success: true, message: 'Cita pendiente eliminada correctamente' });
};

exports.eliminarConfirmada = (req, res) => {
  const { id } = req.params;
  const ok = deleteAppointment(req.tenantId, id);
  if (!ok) {
    return res.status(404).json({ success: false, message: 'Cita confirmada no encontrada' });
  }
  res.json({ success: true, message: 'Cita confirmada eliminada correctamente' });
};
