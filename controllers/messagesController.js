const fs = require('fs');
const path = require('path');

exports.getMessages = (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    const username = req.session.user;
    const limit = parseInt(req.query.limit, 10) || 20;
    const afterTs = parseInt(req.query.afterTs, 10);
    const logPath = path.join(__dirname, '..', 'logs', username, 'messages.ndjson');
    if (!fs.existsSync(logPath)) {
        return res.json({ messages: [] });
    }
    try {
        const lines = fs.readFileSync(logPath, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map(line => {
                try { return JSON.parse(line); } catch { return null; }
            })
            .filter(Boolean);
        let messages = lines;
        if (!isNaN(afterTs)) {
            messages = messages.filter(m => m.ts > afterTs);
        }
        if (limit > 0) {
            messages = messages.slice(-limit);
        }
        res.json({ messages });
    } catch (err) {
        console.error('Error leyendo mensajes:', err);
        res.status(500).json({ error: 'Error interno' });
    }
};
