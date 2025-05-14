// Servicio multiusuario para WhatsApp
const { Client, LocalAuth } = require('whatsapp-web.js');
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

// Puedes agregar más funciones multiusuario aquí

