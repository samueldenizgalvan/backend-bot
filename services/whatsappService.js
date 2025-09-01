// Servicio multiusuario para WhatsApp
const { Client, LocalAuth } = require('whatsapp-web.js');
// username -> { client, status, lastQR }
const bots = new Map();

// Inicializa o recupera el bot para un usuario
async function getOrCreateBot(username, io) {
    if (bots.has(username)) return bots.get(username).client;
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: username }),
        puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    });
    bots.set(username, { client, status: 'initializing', lastQR: null });

    client.on('qr', qr => {
        const bot = bots.get(username);
        if (bot) {
            bot.lastQR = qr;
            bot.status = 'qr';
        }
    });

    client.on('ready', () => {
        const bot = bots.get(username);
        if (bot) {
            bot.status = 'ready';
            bot.lastQR = null;
        }
        if (io) io.emit('log', `✅ Bot de WhatsApp listo para ${username}`);
    });

    client.on('authenticated', () => {
        const bot = bots.get(username);
        if (bot) bot.status = 'authenticated';
    });

    client.on('auth_failure', () => {
        const bot = bots.get(username);
        if (bot) bot.status = 'auth_failure';
    });

    client.on('disconnected', () => {
        const bot = bots.get(username);
        if (bot) bot.status = 'disconnected';
        bots.delete(username);
    });

    await client.initialize();
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
    return Array.from(bots.entries()).map(([username, { client, status }]) => ({
        username,
        estado: status || (client.info ? client.info.pushname || 'Activo' : 'Activo')
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

// Estado del bot
exports.getStatus = (username) => {
    const bot = bots.get(username);
    if (!bot) {
        return { status: 'disconnected', hasLastQR: false };
    }
    return { status: bot.status || 'unknown', hasLastQR: !!bot.lastQR };
};

// Puedes agregar más funciones multiusuario aquí

