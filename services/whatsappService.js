// Servicio de WhatsApp multi-tenant
// Gestiona múltiples clientes de WhatsApp identificados por tenantId

const { Client, LocalAuth } = require('whatsapp-web.js');

// Pool de clientes: tenantId -> client
const clients = new Map();
// Estado reciente de cada cliente para consultas rápidas
const states = new Map();

// Crea y configura un cliente para el tenant indicado
async function createClient(tenantId) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: tenantId, dataPath: './sessions' }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
        }
    });

    states.set(tenantId, 'INITIALIZING');

    // Eventos básicos
    client.on('qr', (qr) => {
        console.log(`[${tenantId}] QR: ${qr}`);
    });

    client.on('ready', () => {
        console.log(`[${tenantId}] READY`);
        states.set(tenantId, 'READY');
    });

    client.on('disconnected', (reason) => {
        console.log(`[${tenantId}] DISCONNECTED: ${reason || ''}`);
        states.set(tenantId, 'DISCONNECTED');
        clients.delete(tenantId);
    });

    client.on('auth_failure', (msg) => {
        console.log(`[${tenantId}] AUTH FAILURE: ${msg}`);
        states.set(tenantId, 'AUTH_FAILURE');
    });

    client.on('message', (msg) => {
        console.log(`[${tenantId}] MESSAGE: ${msg.body}`);
    });

    await client.initialize();
    return client;
}

// Inicia el bot para un tenant
async function startBot(tenantId) {
    if (clients.has(tenantId)) {
        return clients.get(tenantId);
    }
    const client = await createClient(tenantId);
    clients.set(tenantId, client);
    return client;
}

// Detiene y elimina el bot del tenant
function stopBot(tenantId) {
    const client = clients.get(tenantId);
    if (client) {
        client.destroy();
        clients.delete(tenantId);
        states.set(tenantId, 'STOPPED');
        console.log(`[${tenantId}] STOPPED`);
    }
}

// Obtiene el estado del bot
async function getStatus(tenantId) {
    const client = clients.get(tenantId);
    if (!client) {
        return states.get(tenantId) || 'STOPPED';
    }
    try {
        const state = await client.getState();
        states.set(tenantId, state);
        return state;
    } catch (err) {
        return states.get(tenantId) || 'UNKNOWN';
    }
}

// Funciones auxiliares para compatibilidad con el código existente
async function sendConfirmation(tenantId, telefono, fecha, hora) {
    const client = await startBot(tenantId);
    const mensaje = `✅ Tu cita ha sido confirmada para el día ${fecha} a las ${hora}`;
    await client.sendMessage(telefono, mensaje);
}

function getBotsActivos() {
    return Array.from(states.entries()).map(([tenantId, estado]) => ({ tenantId, estado }));
}

async function restartBot(tenantId) {
    stopBot(tenantId);
    await startBot(tenantId);
}

module.exports = {
    startBot,
    stopBot,
    getStatus,
    sendConfirmation,
    getBotsActivos,
    restartBot
};

