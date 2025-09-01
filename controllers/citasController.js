const whatsappService = require('../services/whatsappService');

const keyFor = (tenant, telefono) => `${tenant}:${telefono}`;

exports.getPendientes = (req, res) => {
    const citasPendientes = req.app.get('citasPendientes');
    const citas = [];
    for (const [key, cita] of citasPendientes.entries()) {
        if (key.startsWith(`${req.tenant}:`)) citas.push(cita);
    }
    res.json(citas);
};

exports.getConfirmadas = (req, res) => {
    const citasConfirmadas = req.app.get('citasConfirmadas');
    const citas = [];
    for (const [key, cita] of citasConfirmadas.entries()) {
        if (key.startsWith(`${req.tenant}:`)) citas.push(cita);
    }
    res.json(citas);
};

exports.crearPendiente = (req, res) => {
    const { telefono } = req.body;
    const citasPendientes = req.app.get('citasPendientes');
    citasPendientes.set(keyFor(req.tenant, telefono), { ...req.body });
    req.app.get('guardarCitas')();
    res.json({ success: true });
};

exports.confirmarCita = async (req, res) => {
    const { telefono, fechaConfirmada, horaConfirmada } = req.body;
    const citasPendientes = req.app.get('citasPendientes');
    const citasConfirmadas = req.app.get('citasConfirmadas');
    const key = keyFor(req.tenant, telefono);
    const cita = citasPendientes.get(key);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    cita.fechaConfirmada = fechaConfirmada;
    cita.horaConfirmada = horaConfirmada;
    citasConfirmadas.set(key, cita);
    citasPendientes.delete(key);
    req.app.get('guardarCitas')();
    try {
        await whatsappService.sendConfirmation(req.tenant, telefono, fechaConfirmada, horaConfirmada);
    } catch (err) {
        console.error('Error enviando confirmación WhatsApp:', err);
    }
    res.json({ success: true });
};

exports.eliminarPendiente = (req, res) => {
    const telefono = req.params.telefono;
    const citasPendientes = req.app.get('citasPendientes');
    const key = keyFor(req.tenant, telefono);
    if (!citasPendientes.has(key)) {
        return res.status(404).json({ success: false, message: 'Cita pendiente no encontrada' });
    }
    citasPendientes.delete(key);
    req.app.get('guardarCitas')();
    res.json({ success: true, message: 'Cita pendiente eliminada correctamente' });
};

exports.eliminarConfirmada = (req, res) => {
    const telefono = req.params.telefono;
    const citasConfirmadas = req.app.get('citasConfirmadas');
    const key = keyFor(req.tenant, telefono);
    if (!citasConfirmadas.has(key)) {
        return res.status(404).json({ success: false, message: 'Cita confirmada no encontrada' });
    }
    citasConfirmadas.delete(key);
    req.app.get('guardarCitas')();
    res.json({ success: true, message: 'Cita confirmada eliminada correctamente' });
};

