const estadoUsuarios = {};
const citasPendientes = new Map();
const citasConfirmadas = new Map();
const { guardarCitas } = require('./citasService');

async function manejarMensaje(msg, client, io) {
    if (msg.from.endsWith('@g.us')) return;
    const usuario = msg.from;
    const body = msg.body.toLowerCase().trim();

    const contiene = (...palabras) => palabras.every(p => body.includes(p));
    const comienzaCon = (...palabras) => palabras.some(p => body.startsWith(p));

    const quiereMenuOCita = 
        ['menu', 'menú', 'cita', 'ayuda'].some(p => body === p) ||
        contiene('quiero', 'cita') ||
        contiene('hacer', 'cita') ||
        contiene('pedir', 'cita') ||
        contiene('solicitar', 'cita') ||
        contiene('necesito', 'cita');

    if (estadoUsuarios[usuario]) {
        return manejarCitas(msg, usuario, client, io);
    }

    if (quiereMenuOCita) {
        estadoUsuarios[usuario] = 'inicio';
        await enviarMensajeSeguro(client, usuario, `💬 *¡Hola! ¿En qué puedo ayudarte? Escribe el número en el menú.*\n\n📅 1️⃣ *Hacer una cita*\n👨‍🔧 2️⃣ *Hablar con el taller*`);
    }
}

async function manejarCitas(msg, usuario, client, io) {
    const cancelar = msg.body.toLowerCase().trim();
    if (cancelar === 'cancelar' || cancelar === 'salir') {
        delete estadoUsuarios[usuario];
        await enviarMensajeSeguro(client, usuario, '❌ Has cancelado el proceso de solicitud de cita.');
        return;
    }

    switch (estadoUsuarios[usuario]) {
        case 'inicio':
            if (msg.body === '1') {
                estadoUsuarios[usuario] = 'nombre';
                await enviarMensajeSeguro(client, usuario, '¿Cuál es tu nombre? Escribe "Salir" para cancelar.');
            } else if (msg.body === '2') {
                delete estadoUsuarios[usuario];
                await enviarMensajeSeguro(client, usuario, 'Taller te contactará pronto para confirmar la cita.');
            }
            break;

        case 'nombre':
            estadoUsuarios[`${usuario}_nombre`] = msg.body;
            estadoUsuarios[usuario] = 'vehiculo';
            await enviarMensajeSeguro(client, usuario, 'Marca, modelo y matrícula del vehículo:');
            break;

        case 'vehiculo':
            estadoUsuarios[`${usuario}_vehiculo`] = msg.body;
            estadoUsuarios[usuario] = 'trabajo';
            await enviarMensajeSeguro(client, usuario, `🔧 *¿Qué tipo de trabajo necesitas?*\n\n1️⃣ 🔍 *Revisión*\n2️⃣ 🔁 *Distribución o embragues*\n3️⃣ ⚙️ *Averías*\n4️⃣ 🛞 *Neumáticos*\n5️⃣ 🛠️ *Otros*`);
            break;

        case 'trabajo':
            const opcionesTrabajo = {
                '1': 'Revisión',
                '2': 'Distribución o embragues',
                '3': 'Averías',
                '4': 'Neumáticos',
                '5': 'Otros'
            };

            const trabajoElegido = opcionesTrabajo[msg.body.trim()];
            if (!trabajoElegido) {
                await enviarMensajeSeguro(client, usuario, '⚠️ Opción no válida. Por favor, selecciona una opción del 1 al 5. Escribe "Salir" para cancelar.');
                return;
            }

            estadoUsuarios[`${usuario}_trabajo`] = trabajoElegido;
            estadoUsuarios[usuario] = 'fecha_hora_deseada';
            await enviarMensajeSeguro(client, usuario, '📅 ¿Qué día y hora deseas? (Ejemplo: 20/04/2025 10:00)');
            break;

        case 'fecha_hora_deseada':
            const partes = msg.body.trim().split(' ');
            if (partes.length !== 2) {
                await enviarMensajeSeguro(client, usuario, '⚠️ Formato inválido. Usa el formato: 20/04/2025 10:00');
                return;
            }

            estadoUsuarios[`${usuario}_fechaDeseada`] = partes[0];
            estadoUsuarios[`${usuario}_horaDeseada`] = partes[1];
            estadoUsuarios[usuario] = 'observacion_confirmar';
            await enviarMensajeSeguro(client, usuario, '¿Quieres añadir alguna observación? (Sí/No)');
            break;

        case 'observacion_confirmar':
            if (msg.body.toLowerCase() === 'sí' || msg.body.toLowerCase() === 'si') {
                estadoUsuarios[usuario] = 'observacion_texto';
                await enviarMensajeSeguro(client, usuario, '✏️ Escribe la observación que quieras añadir:');
            } else {
                const cita = {
                    telefono: usuario,
                    nombre: estadoUsuarios[`${usuario}_nombre`],
                    vehiculo: estadoUsuarios[`${usuario}_vehiculo`],
                    trabajo: estadoUsuarios[`${usuario}_trabajo`],
                    fechaDeseada: estadoUsuarios[`${usuario}_fechaDeseada`],
                    horaDeseada: estadoUsuarios[`${usuario}_horaDeseada`],
                    observacion: ''
                };
                citasPendientes.set(usuario, cita);
                guardarCitas();
                io.emit('nueva-cita');
                await enviarMensajeSeguro(client, usuario, '✅ Tu cita ha sido registrada. Taller te confirmará la fecha, hora y presupuesto.');
                delete estadoUsuarios[usuario];
            }
            break;

        case 'observacion_texto':
            const cita = {
                telefono: usuario,
                nombre: estadoUsuarios[`${usuario}_nombre`],
                vehiculo: estadoUsuarios[`${usuario}_vehiculo`],
                trabajo: estadoUsuarios[`${usuario}_trabajo`],
                fechaDeseada: estadoUsuarios[`${usuario}_fechaDeseada`],
                horaDeseada: estadoUsuarios[`${usuario}_horaDeseada`],
                observacion: msg.body
            };
            citasPendientes.set(usuario, cita);
            guardarCitas();
            io.emit('nueva-cita');
            await enviarMensajeSeguro(client, usuario, '✅ Tu cita ha sido registrada. Taller te confirmará la fecha, hora y presupuesto.');
            delete estadoUsuarios[usuario];
            break;
    }
}

async function enviarMensajeSeguro(client, destinatario, mensaje) {
    try {
        await client.sendMessage(destinatario, mensaje);
    } catch (e) {
        console.error('Error al enviar mensaje:', e);
    }
}

function getUserFlowFields() {
    return {
        fields: ['Teléfono', 'Nombre', 'Vehículo', 'Trabajo', 'Fecha deseada', 'Hora deseada', 'Observación']
    };
}

module.exports = {
    manejarMensaje,
    getUserFlowFields
};
