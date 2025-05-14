const express = require('express');
const nodemailer = require('nodemailer');
const http = require('http');
const socketIO = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const soporteRoutes = require('./routes/soporteRoutes');
const authRoutes = require('./routes/authRoutes');
const citasRoutes = require('./routes/citasRoutes');

// Crear el transporter que use sendmail (Postfix) en localhost
const mailer = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
  logger: true,
  debug: true
});


// Inicialización de la aplicación
const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = socketIO(server);

// Configuración
const usuariosValidos = { 'admin': 'password123' };
const TIEMPO_ESPERA = 5 * 60 * 60 * 1000;
let client = null;
let estadoUsuarios = {};
let eliminarSesionAlReiniciar = false;
let ultimaInteraccion = {};
const citasPendientes = new Map();
const citasConfirmadas = new Map();
const archivoCitas = path.join(__dirname, 'citas.json');

// Configuración de variables globales para rutas
app.set('citasPendientes', citasPendientes);
app.set('citasConfirmadas', citasConfirmadas);
app.set('guardarCitas', guardarCitas);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'tu_secreto_super_seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// --- Captcha simple ---
app.get('/api/captcha', (req, res) => {
    // Genera dos números aleatorios para una suma
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    req.session.captchaAnswer = a + b;
    res.json({
        question: `¿Cuánto es ${a} + ${b}?`
    });
});

// Rutas
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

// Middleware para proteger archivos HTML del panel
app.use((req, res, next) => {
  if (
    req.path.endsWith('.html') &&
    req.path !== '/login.html' &&
    !req.session.authenticated
  ) {
    return res.redirect('/login.html');
  }
  next();
});

// --- Archivos estáticos ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Si usas catch-all para SPA ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ===========================
// RUTAS DE FORMULARIOS WEB
// ===========================

// Formulario de Soporte
app.post('/api/soporte', async (req, res) => {
    const { nombre, empresa, telefono, descripcion, captcha } = req.body;

    // Validar el captcha
    if (!req.session.captchaAnswer || parseInt(captcha) !== req.session.captchaAnswer) {
        return res.status(400).json({ success: false, error: 'Captcha incorrecto' });
    }

    // Si el captcha es correcto, enviar el email
    try {
        await mailer.sendMail({
            from: '"Soporte Web" <administrador@bot-whatsapp.es>',
            to: 'samueldenizgalvan@gmail.com',
            subject: 'Nuevo mensaje de Soporte',
            text: `Nombre: ${nombre}\nEmpresa: ${empresa}\nTeléfono: ${telefono}\nMensaje:\n${descripcion}`
        });
        return res.json({ success: true });
    } catch (err) {
        console.error('Error enviando email de soporte:', err);
        return res.status(500).json({ success: false, error: 'Error interno al enviar email' });
    }
});


// Formulario de Bot Request
app.post('/api/bot-request', async (req, res) => {
    const { empresaBot, contactoBot, infoCliente, observacionesBot, captcha } = req.body;

    // Validar el captcha
    if (!req.session.captchaAnswer || parseInt(captcha) !== req.session.captchaAnswer) {
        return res.status(400).json({ success: false, error: 'Captcha incorrecto' });
    }

    // Si el captcha es correcto, enviar el email
    try {
        await mailer.sendMail({
            from: '"Solicitud Bot" <administrador@bot-whatsapp.es>',
            to: 'samueldenizgalvan@gmail.com',
            subject: 'Nueva solicitud desde Bot Request',
            text: `Empresa: ${empresaBot}\nContacto: ${contactoBot}\nInformación cliente:\n${infoCliente}\nObservaciones:\n${observacionesBot}`
        });
        return res.json({ success: true });
    } catch (err) {
        console.error('Error enviando email de bot-request:', err);
        return res.status(500).json({ success: false, error: 'Error interno al enviar email' });
    }
});


;

// Bot WhatsApp
function iniciarBot() {
    if (client) {
        io.emit('log', '⚠️ Reiniciando sesión de WhatsApp...');

        client.destroy().then(() => {
            io.emit('log', '✅ Sesión cerrada.');

            if (eliminarSesionAlReiniciar) {
                eliminarSesion();
                eliminarSesionAlReiniciar = false;
            }

            setTimeout(() => {
                io.emit('log', '🕒 Creando nuevo cliente...');
                crearNuevoCliente();
            }, 3000);

        }).catch((error) => {
            console.error('❌ Error al cerrar sesión:', error);
            io.emit('log', '❌ Error al cerrar sesión. Intentando crear nuevo cliente...');
            setTimeout(() => {
                crearNuevoCliente();
            }, 3000);
        });

    } else {
        io.emit('log', '🟢 No hay cliente activo. Creando uno nuevo...');
        crearNuevoCliente();
    }
}


function eliminarSesion() {
    const sessionPath = './.wwebjs_auth';
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        io.emit('log', '🗑️ Sesión eliminada correctamente.');
    }
}

function crearNuevoCliente() {
    io.emit('log', '🧠 Inicializando nuevo cliente de WhatsApp Business...');

    const puppeteer = require('puppeteer');
    try {
        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                executablePath: puppeteer.executablePath(), // Usa el Chromium incluido
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        client.on('qr', qr => {
            qrcode.toDataURL(qr, (err, url) => {
                if (!err) {
                    io.emit('qr', url);
                    io.emit('log', '📸 Escanea el código QR para vincular tu cuenta');
                } else {
                    console.error('❌ Error generando QR:', err);
                    io.emit('log', '❌ Error generando el código QR');
                }
            });
        });

        client.on('ready', () => {
            console.log('✅ Bot de WhatsApp Business listo');
            io.emit('log', '✅ Bot de WhatsApp Business listo');
            io.emit('ready');
        });

        client.on('authenticated', () => {
            console.log('🔑 Autenticación exitosa');
            io.emit('log', '🔑 Autenticación exitosa');
        });

        client.on('auth_failure', msg => {
            console.error('❌ Fallo de autenticación:', msg);
            io.emit('log', '❌ Fallo de autenticación. Intenta vincular de nuevo.');
        });

        client.on('disconnected', reason => {
            console.warn('🔌 Cliente desconectado:', reason);
            io.emit('log', `🔌 Cliente desconectado: ${reason}`);
        });

        client.on('message', manejarMensaje);

        client.initialize();

    } catch (error) {
        console.error('❌ Error al crear el cliente:', error);
        io.emit('log', '❌ Error crítico al iniciar el cliente de WhatsApp');
    }
}


async function manejarMensaje(msg) {
    if (msg.from.endsWith('@g.us')) return;
    const usuario = msg.from;
    const body = msg.body.toLowerCase().trim();

    // Función auxiliar para verificar si contiene ciertas palabras
    const contiene = (...palabras) => palabras.every(p => body.includes(p));
    const comienzaCon = (...palabras) => palabras.some(p => body.startsWith(p));

    // Detectar si el mensaje tiene intención de pedir cita o ver menú
    const quiereMenuOCita = 
        ['menu', 'menú', 'cita', 'ayuda'].some(p => body === p) ||
        contiene('quiero', 'cita') ||
        contiene('quería', 'cita') ||
        contiene('hacer', 'cita') ||
        contiene('pedir', 'cita') ||
        contiene('solicitar', 'cita') ||
        contiene('necesito', 'cita') ||
        contiene('reservar', 'cita') ||
        contiene('quiero', 'hora') ||
        contiene('necesito', 'hora') ||
        contiene('pedir', 'hora') ||
        contiene('programar', 'cita') ||
        contiene('quiero', 'revisión') ||
        contiene('necesito', 'revisión') ||
        contiene('hacer', 'revisión') ||
        comienzaCon('me gustaría', 'quisiera', 'quería', 'deseo');

    // Si ya está dentro del flujo, seguimos el flujo
    if (estadoUsuarios[usuario]) {
        return manejarCitas(msg);
    }

    // Si el mensaje muestra intención clara, iniciamos el flujo
    if (quiereMenuOCita) {
        estadoUsuarios[usuario] = 'inicio';
        await enviarMensajeSeguro(usuario, `💬 *¡Hola! ¿En qué puedo ayudarte? Escribe el numero en el menú .*

            📅 1️⃣ *Hacer una cita*  
            👨‍🔧 2️⃣ *Hablar con el taller*`);
            
        return;
    }
}


async function manejarCitas(msg) {
    const usuario = msg.from;
    const cancelar = msg.body.toLowerCase().trim();
if (cancelar === 'cancelar' || cancelar === 'salir') {
    delete estadoUsuarios[usuario];
    await enviarMensajeSeguro(usuario, '❌ Has cancelado el proceso de solicitud de cita.');
    return;
}
    switch (estadoUsuarios[usuario]) {
        case 'inicio':
            if (msg.body === '1') {
                estadoUsuarios[usuario] = 'nombre';
                await enviarMensajeSeguro(usuario, '¿Cuál es tu nombre? Escribe " Salir " para cancelar ');
            } else if (msg.body === '2') {
                delete estadoUsuarios[usuario];
                await enviarMensajeSeguro(usuario, 'Taller te contactará pronto para confirmar la cita.');
            }
            break;

        case 'nombre':
            estadoUsuarios[usuario + '_nombre'] = msg.body;
            estadoUsuarios[usuario] = 'vehiculo';
            await enviarMensajeSeguro(usuario, 'Marca, modelo y matrícula del vehículo:');
            break;

        case 'vehiculo':
            estadoUsuarios[usuario + '_vehiculo'] = msg.body;
            estadoUsuarios[usuario] = 'trabajo';
            await enviarMensajeSeguro(usuario, `🔧 *¿Qué tipo de trabajo necesitas?*\n\n1️⃣ 🔍 *Revisión*\n2️⃣ 🔁 *Distribución o embragues*\n3️⃣ ⚙️ *Averías*\n4️⃣ 🛞 *Neumáticos*\n5️⃣ 🛠️ *Otros*`);
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
                await enviarMensajeSeguro(usuario, '⚠️ Opción no válida. Por favor, selecciona una opción del 1 al 5. Escribe " Salir " para cancelar');
                return;
            }

            estadoUsuarios[usuario + '_trabajo'] = trabajoElegido;
            estadoUsuarios[usuario] = 'fecha_hora_deseada';
            await enviarMensajeSeguro(usuario, '📅 ¿Qué día y hora deseas? (Ejemplo: 20/04/2025 10:00)');
            break;

        case 'fecha_hora_deseada':
            const partes = msg.body.trim().split(' ');
            if (partes.length !== 2) {
                await enviarMensajeSeguro(usuario, '⚠️ Formato inválido. Usa el formato: 20/04/2025 10:00');
                return;
            }

            estadoUsuarios[usuario + '_fechaDeseada'] = partes[0];
            estadoUsuarios[usuario + '_horaDeseada'] = partes[1];
            estadoUsuarios[usuario] = 'observacion_confirmar';
            await enviarMensajeSeguro(usuario, '¿Quieres añadir alguna observación? (Sí/No)');
            break;

        case 'observacion_confirmar':
            if (msg.body.toLowerCase() === 'sí' || msg.body.toLowerCase() === 'si') {
                estadoUsuarios[usuario] = 'observacion_texto';
                await enviarMensajeSeguro(usuario, '✏️ Escribe la observación que quieras añadir:');
            } else {
                const cita = {
                    telefono: usuario,
                    nombre: estadoUsuarios[usuario + '_nombre'],
                    vehiculo: estadoUsuarios[usuario + '_vehiculo'],
                    trabajo: estadoUsuarios[usuario + '_trabajo'],
                    fechaDeseada: estadoUsuarios[usuario + '_fechaDeseada'],
                    horaDeseada: estadoUsuarios[usuario + '_horaDeseada'],
                    observacion: ''
                };
                citasPendientes.set(usuario, cita);
                guardarCitas();
                io.emit('nueva-cita');
                await enviarMensajeSeguro(usuario, '✅ Tu cita ha sido registrada. Taller te confirmará la fecha, hora y presupuesto.');
                delete estadoUsuarios[usuario];
            }
            break;

        case 'observacion_texto':
            const cita = {
                telefono: usuario,
                nombre: estadoUsuarios[usuario + '_nombre'],
                vehiculo: estadoUsuarios[usuario + '_vehiculo'],
                trabajo: estadoUsuarios[usuario + '_trabajo'],
                fechaDeseada: estadoUsuarios[usuario + '_fechaDeseada'],
                horaDeseada: estadoUsuarios[usuario + '_horaDeseada'],
                observacion: msg.body
            };
            citasPendientes.set(usuario, cita);
            guardarCitas();
            io.emit('nueva-cita');
            await enviarMensajeSeguro(usuario, '✅ Tu cita ha sido registrada. Taller te confirmará la fecha, hora y presupuesto.');
            delete estadoUsuarios[usuario];
            break;
    }
}



async function enviarMensajeSeguro(destinatario, mensaje) {
    try {
        await client.sendMessage(destinatario, mensaje);
    } catch (e) {
        console.error('Error al enviar mensaje:', e);
    }
}



function guardarCitas() {
    const todas = {
        pendientes: Object.fromEntries(citasPendientes),
        confirmadas: Object.fromEntries(citasConfirmadas)
    };
    fs.writeFileSync(archivoCitas, JSON.stringify(todas, null, 2));
}

function cargarCitas() {
    if (fs.existsSync(archivoCitas)) {
        const data = JSON.parse(fs.readFileSync(archivoCitas));
        Object.entries(data.pendientes || {}).forEach(([tel, cita]) => citasPendientes.set(tel, cita));
        Object.entries(data.confirmadas || {}).forEach(([tel, cita]) => citasConfirmadas.set(tel, cita));
    }
}

// WebSocket
io.on('connection', socket => {


    io.on('connection', socket => {
        socket.emit('log', '🟢 Cliente conectado a WebSocket');
    
        socket.on('startBot', () => {
            eliminarSesionAlReiniciar = true;
            iniciarBot();
        });
    

        // 👇 Esto es lo nuevo para apagar el bot
        socket.on('stopBot', () => {
            if (client) {
                client.destroy().then(() => {
                    io.emit('log', '🛑 Bot de WhatsApp cerrado por el usuario.');
                    client = null;
                }).catch(err => {
                    console.error('❌ Error al cerrar el bot:', err);
                });
            }
        });
        
    });
    
    // Opción 1: Conectarse a la sesión actual (NO destruye la sesión)
    socket.on('conectarSesion', async () => {
        console.log('⚙️ Conectando a la sesión existente...');
        io.emit('log', '⚙️ Intentando conectar con la sesión existente...');

        // Si el cliente ya existe, avisamos
        if (client) {
            console.log('⚠️ El bot ya está en ejecución.');
            io.emit('log', '⚠️ El bot ya está en ejecución. No se generará un nuevo QR.');
            return;
        }
        // Si no hay cliente, se crea y se usará la carpeta .wwebjs_auth si existe
        crearNuevoCliente();
    });
    socket.emit('log', '🟢 Cliente conectado a WebSocket');
    socket.on('startBot', () => {
        eliminarSesionAlReiniciar = true;
        iniciarBot();
    });
});

// Iniciar servidor y cargar citas

app.get('/', (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Función que envía recordatorio 3 días antes de la cita confirmada
function verificarRecordatorios() {
    const hoy = new Date();

    for (const [telefono, cita] of citasConfirmadas.entries()) {
        if (!cita.fechaConfirmada || !cita.horaConfirmada || cita.recordatorioEnviado) continue;

        const fechaCita = new Date(`${cita.fechaConfirmada}T${cita.horaConfirmada}`);
        const diferenciaDias = Math.ceil((fechaCita - hoy) / (1000 * 60 * 60 * 24));

        if (diferenciaDias === 3) {
            enviarMensajeSeguro(telefono, `📅 *Recordatorio:* tienes una cita el *${cita.fechaConfirmada}* a las *${cita.horaConfirmada}*. ¡Te esperamos!`);
            cita.recordatorioEnviado = true;
            console.log(`📨 Recordatorio enviado a ${telefono}`);
        }
    }

    guardarCitas();
}



server.listen(3000, () => {
    console.log('🚀 Servidor listo en http://localhost:3000');
    cargarCitas();
    // ⏰ Ejecutar todos los días a las 08:00
cron.schedule('0 8 * * *', () => {
    console.log('⏰ Verificando citas para enviar recordatorios (08:00)');
    verificarRecordatorios();
});

    
});

app.use('/api', soporteRoutes);
app.use('/api', citasRoutes);
app.use('/api', authRoutes);

