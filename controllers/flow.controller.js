const fs = require('fs').promises;
const path = require('path');

exports.getCurrent = async (req, res) => {
  const tenantId = req.tenantId;
  const filePath = path.join(__dirname, '..', 'data', tenantId, 'flow.json');
  try {
    const content = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(content));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Flow not found' });
    }
    console.error('Error reading flow:', err);
    res.status(500).json({ error: 'Error reading flow' });
  }
};

exports.updateCurrent = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const tenantId = req.tenantId;
  const dirPath = path.join(__dirname, '..', 'data', tenantId);
  const filePath = path.join(dirPath, 'flow.json');

  try {
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving flow:', err);
    res.status(500).json({ error: 'Error saving flow' });
  }
};
