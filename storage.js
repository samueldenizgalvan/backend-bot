const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'logs');

function appendMessage(tenantId, message) {
  const dir = path.join(baseDir, tenantId);
  const file = path.join(dir, 'messages.ndjson');
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(file, JSON.stringify(message) + '\n');
}

function getMessages(tenantId, limit = 10, afterTs) {
  const file = path.join(baseDir, tenantId, 'messages.ndjson');
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean);
  let messages = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
  if (afterTs) {
    messages = messages.filter(m => m.ts > afterTs);
  }
  if (limit) {
    messages = messages.slice(-limit);
  }
  return messages;
}

module.exports = { appendMessage, getMessages };
