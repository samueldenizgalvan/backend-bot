const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

function getFilePath(tenantId) {
  return path.join(__dirname, '..', 'data', tenantId, 'citas.json');
}

function ensureFile(tenantId) {
  const file = getFilePath(tenantId);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ pending: [], confirmed: [] }, null, 2));
  }
  return file;
}

function readData(tenantId) {
  const file = ensureFile(tenantId);
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
      confirmed: Array.isArray(parsed.confirmed) ? parsed.confirmed : []
    };
  } catch (e) {
    return { pending: [], confirmed: [] };
  }
}

function writeData(tenantId, data) {
  const file = ensureFile(tenantId);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function listAppointments(tenantId, filters = {}) {
  const data = readData(tenantId);
  let list = [];
  if (filters.estado) {
    const state = filters.estado;
    if (state === 'pending') list = data.pending;
    else if (state === 'confirmed') list = data.confirmed;
  } else {
    list = data.pending.concat(data.confirmed);
  }
  if (filters.fecha) {
    const target = filters.fecha;
    list = list.filter(c => c.fecha === target || c.fechaDeseada === target);
  }
  return list;
}

function createAppointment(tenantId, payload) {
  const data = readData(tenantId);
  const appointment = { ...payload, id: randomUUID(), createdAt: new Date().toISOString() };
  data.pending.push(appointment);
  writeData(tenantId, data);
  return appointment;
}

function confirmAppointment(tenantId, id) {
  const data = readData(tenantId);
  const idx = data.pending.findIndex(a => a.id === id);
  if (idx === -1) return null;
  const appointment = data.pending.splice(idx, 1)[0];
  appointment.confirmedAt = new Date().toISOString();
  data.confirmed.push(appointment);
  writeData(tenantId, data);
  return appointment;
}

function deleteAppointment(tenantId, id) {
  const data = readData(tenantId);
  let idx = data.pending.findIndex(a => a.id === id);
  if (idx !== -1) {
    data.pending.splice(idx, 1);
    writeData(tenantId, data);
    return true;
  }
  idx = data.confirmed.findIndex(a => a.id === id);
  if (idx !== -1) {
    data.confirmed.splice(idx, 1);
    writeData(tenantId, data);
    return true;
  }
  return false;
}

// Legacy placeholders to avoid runtime errors where older code expects them.
function cargarCitas() {}
function guardarCitas() {}
function verificarRecordatorios() {}

module.exports = {
  listAppointments,
  createAppointment,
  confirmAppointment,
  deleteAppointment,
  cargarCitas,
  guardarCitas,
  verificarRecordatorios
};
