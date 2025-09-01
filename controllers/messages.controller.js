const storage = require('../storage');

exports.getMessages = (req, res) => {
    const tenantId = req.session.username || req.session.usuario;
    if (!tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const limit = parseInt(req.query.limit, 10) || 10;
    const afterTs = req.query.afterTs ? parseInt(req.query.afterTs, 10) : undefined;
    const messages = storage.getMessages(tenantId, limit, afterTs);
    res.json(messages);
};
