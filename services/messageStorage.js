const store = new Map();

function addMessage(tenantId, msg) {
    if (!store.has(tenantId)) store.set(tenantId, []);
    store.get(tenantId).push({
        from: msg.from,
        to: msg.to,
        body: msg.body,
        timestamp: msg.timestamp
    });
}

function getMessages(tenantId) {
    return store.get(tenantId) || [];
}

module.exports = {
    addMessage,
    getMessages
};
