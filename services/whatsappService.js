// Servicio multiusuario para WhatsApp
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const bots = new Map(); // username -> { client, estado }

// Inicializa o recupera el bot para un usuario
async function getOrCreateBot(username, io) {
    if (bots.has(username)) return bots.get(username).client;
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: username }),
        puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    });
    // Puedes agregar aquí eventos personalizados por usuario si lo deseas
    client.on('ready', () => {
        if (io) io.emit('log', `✅ Bot de WhatsApp listo para ${username}`);
    });
    client.on('disconnected', () => {
        bots.delete(username);
    });
    client.on('message', (msg) => {
        const logDir = path.join(__dirname, '..', 'logs', username);
        const logPath = path.join(logDir, 'messages.ndjson');
        const entry = {
            ts: Date.now(),
            from: msg.from,
            to: msg.to,
            body: msg.body
        };
        try {
            fs.mkdirSync(logDir, { recursive: true });
            fs.appendFile(logPath, JSON.stringify(entry) + '\n', () => {});
        } catch (err) {
            console.error('Error registrando mensaje:', err);
        }
    });
    await client.initialize();
    bots.set(username, { client });
    return client;
}

// Enviar confirmación de cita usando el bot del usuario
exports.sendConfirmation = async (username, telefono, fecha, hora) => {
    const client = await getOrCreateBot(username);
    const mensaje = `✅ Tu cita ha sido confirmada para el día ${fecha} a las ${hora}`;
    await client.sendMessage(telefono, mensaje);
};

// Obtener bots activos
exports.getBotsActivos = () => {
    return Array.from(bots.entries()).map(([username, { client }]) => ({
        username,
        estado: client.info ? client.info.pushname || 'Activo' : 'Activo'
    }));
};

// Control de bots
exports.startBot = async (username) => {
    if (!bots.has(username)) {
        await getOrCreateBot(username);
    }
};
exports.stopBot = (username) => {
    if (bots.has(username)) {
        bots.get(username).client.destroy();
        bots.delete(username);
    }
};
exports.restartBot = async (username) => {
    exports.stopBot(username);
    await exports.startBot(username);
};

// Puedes agregar más funciones multiusuario aquí

