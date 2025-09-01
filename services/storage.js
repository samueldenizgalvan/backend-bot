const fs = require('fs');
const path = require('path');

function ensureTenantDirs(tenantId) {
  const dataDir = path.join('data', tenantId);
  const logsDir = path.join('logs', tenantId);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });
}

function readJSON(tenantId, name, defaultValue = {}) {
  const filePath = path.join('data', tenantId, `${name}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

function writeJSON(tenantId, name, data) {
  const dirPath = path.join('data', tenantId);
  fs.mkdirSync(dirPath, { recursive: true });
  const filePath = path.join(dirPath, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  ensureTenantDirs,
  readJSON,
  writeJSON
};
