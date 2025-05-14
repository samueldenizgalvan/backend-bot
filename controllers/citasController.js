const whatsappService = require('../services/whatsappService');

exports.getPendientes = (req, res) => {
    const citasPendientes = req.app.get('citasPendientes');
    res.json(Array.from(citasPendientes.values()));
};

exports.getConfirmadas = (req, res) => {
    const citasConfirmadas = req.app.get('citasConfirmadas');
    res.json(Array.from(citasConfirmadas.values()));
};

exports.confirmarCita = async (req, res) => {
    const { telefono, fechaConfirmada, horaConfirmada } = req.body;
    const citasPendientes = req.app.get('citasPendientes');
    const citasConfirmadas = req.app.get('citasConfirmadas');
    const cita = citasPendientes.get(telefono);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    cita.fechaConfirmada = fechaConfirmada;
    cita.horaConfirmada = horaConfirmada;
    citasConfirmadas.set(telefono, cita);
    citasPendientes.delete(telefono);
    req.app.get('guardarCitas')();
    // Enviar confirmación por WhatsApp usando el servicio multiusuario
    try {
        // El usuario autenticado está en req.session.username
        await whatsappService.sendConfirmation(req.session.username, telefono, fechaConfirmada, horaConfirmada);
    } catch (err) {
        // Si falla el envío, solo loguea, no detiene la confirmación
        console.error('Error enviando confirmación WhatsApp:', err);
    }
    res.json({ success: true });
};

exports.eliminarPendiente = (req, res) => {
    const telefono = req.params.telefono;
    const citasPendientes = req.app.get('citasPendientes');
    if (!citasPendientes.has(telefono)) {
        return res.status(404).json({ success: false, message: 'Cita pendiente no encontrada' });
    }
    citasPendientes.delete(telefono);
    req.app.get('guardarCitas')();
    res.json({ success: true, message: 'Cita pendiente eliminada correctamente' });
};

exports.eliminarConfirmada = (req, res) => {
    const telefono = req.params.telefono;
    const citasConfirmadas = req.app.get('citasConfirmadas');
    if (!citasConfirmadas.has(telefono)) {
        return res.status(404).json({ success: false, message: 'Cita confirmada no encontrada' });
    }
    citasConfirmadas.delete(telefono);
    req.app.get('guardarCitas')();
    res.json({ success: true, message: 'Cita confirmada eliminada correctamente' });
};

