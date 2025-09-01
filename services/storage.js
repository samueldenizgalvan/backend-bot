const fs = require('fs');
const path = require('path');

function ensureTenantDirs(tenantId) {
  ['data', 'logs', 'sessions'].forEach(base => {
    const dir = path.join(base, tenantId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function readJSON(tenantId, name, fallback) {
  const file = path.join('data', tenantId, `${name}.json`);
  try {
    if (!fs.existsSync(file)) {
      return fallback;
    }
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return fallback;
  }
}

function writeJSON(tenantId, name, obj) {
  ensureTenantDirs(tenantId);
  const file = path.join('data', tenantId, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

module.exports = {
  ensureTenantDirs,
  readJSON,
  writeJSON
};
