const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'data');

function readJSON(tenantId, name, defaultValue) {
  const tenantDir = path.join(baseDir, tenantId);
  const filePath = path.join(tenantDir, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

function writeJSON(tenantId, name, data) {
  const tenantDir = path.join(baseDir, tenantId);
  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true });
  }
  const filePath = path.join(tenantDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readJSON, writeJSON };
