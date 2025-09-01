// Servicio de WhatsApp multi-tenant con pool de clientes
const { Client, LocalAuth } = require('whatsapp-web.js');
const messageStorage = require('./messageStorage');

const clients = new Map(); // tenantId -> Client
const statuses = new Map(); // tenantId -> status string
const lastQr = new Map(); // tenantId -> last QR string

function createClient(tenantId) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: tenantId, dataPath: './sessions' }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
        }
    });

    client.on('qr', qr => {
        console.log(`[${tenantId}] QR recibido`);
        lastQr.set(tenantId, qr);
        statuses.set(tenantId, 'qr');
    });

    client.on('ready', () => {
        console.log(`[${tenantId}] Bot listo`);
        statuses.set(tenantId, 'ready');
    });

    client.on('disconnected', reason => {
        console.log(`[${tenantId}] Bot desconectado: ${reason}`);
        statuses.set(tenantId, 'disconnected');
        clients.delete(tenantId);
    });

    client.on('auth_failure', msg => {
        console.log(`[${tenantId}] Fallo de autenticación: ${msg}`);
        statuses.set(tenantId, 'auth_failure');
    });

    client.on('message', msg => {
        console.log(`[${tenantId}] Mensaje de ${msg.from}`);
        messageStorage.addMessage(tenantId, msg);
    });

    return client;
}

async function startBot(tenantId) {
    if (clients.has(tenantId)) {
        console.log(`[${tenantId}] Bot ya iniciado`);
        return;
    }
    console.log(`[${tenantId}] Iniciando bot`);
    const client = createClient(tenantId);
    clients.set(tenantId, client);
    statuses.set(tenantId, 'starting');
    await client.initialize();
}

function stopBot(tenantId) {
    const client = clients.get(tenantId);
    if (client) {
        console.log(`[${tenantId}] Deteniendo bot`);
        client.destroy();
        clients.delete(tenantId);
    }
    statuses.set(tenantId, 'stopped');
    lastQr.delete(tenantId);
}

function getStatus(tenantId) {
    return statuses.get(tenantId) || 'stopped';
}

function getLastQr(tenantId) {
    return lastQr.get(tenantId);
}

async function sendConfirmation(tenantId, telefono, fecha, hora) {
    const client = clients.get(tenantId);
    if (!client) throw new Error('Bot no iniciado');
    const mensaje = `✅ Tu cita ha sido confirmada para el día ${fecha} a las ${hora}`;
    await client.sendMessage(telefono, mensaje);
}

module.exports = {
    startBot,
    stopBot,
    getStatus,
    getLastQr,
    sendConfirmation
};
