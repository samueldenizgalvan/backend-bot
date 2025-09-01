const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const ensureFile = (tenantId) => {
  const dir = path.join(__dirname, '../data', tenantId);
  const file = path.join(dir, 'citas.json');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ pending: [], confirmed: [] }, null, 2));
  }
  return file;
};

const readData = (tenantId) => {
  const file = ensureFile(tenantId);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const writeData = (tenantId, data) => {
  const file = ensureFile(tenantId);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const listAppointments = (tenantId) => {
  return readData(tenantId);
};

const createAppointment = (tenantId, appointment) => {
  const data = readData(tenantId);
  const newAppointment = { id: randomUUID(), ...appointment };
  data.pending.push(newAppointment);
  writeData(tenantId, data);
  return newAppointment;
};

const confirmAppointment = (tenantId, id) => {
  const data = readData(tenantId);
  const index = data.pending.findIndex((a) => a.id === id);
  if (index === -1) {
    return null;
  }
  const [appointment] = data.pending.splice(index, 1);
  data.confirmed.push(appointment);
  writeData(tenantId, data);
  return appointment;
};

module.exports = {
  listAppointments,
  createAppointment,
  confirmAppointment,
};
