const express = require('express');
const nodemailer = require('nodemailer');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const authRoutes = require('./routes/authRoutes');
const citasRoutes = require('./routes/citasRoutes');
const soporteRoutes = require('./routes/soporteRoutes'); // <-- AGREGA ESTA LÍNEA
const botService = require('./services/botService');

// Configuración de mailer (ajusta según tu config real)
const mailer = nodemailer.createTransport({
  host: 'smtp.tu-servidor.com',
  port: 465,
  secure: true,
  auth: {
    user: 'usuario@tu-servidor.com',
    pass: 'tu-contraseña'
  }
});

// Inicialización de la aplicación
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'tu_secreto',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Static & SPA
app.use(express.static(path.join(__dirname, 'public')));

// ===========================
// RUTAS DE FORMULARIOS WEB
// ===========================

// WebSocket
const server = http.createServer(app);
const io = socketIO(server);
botService.setIO(io);

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
  socket.emit('log', '🟢 Cliente conectado a WebSocket');

  socket.on('startBot', () => {
    botService.iniciarBot();
  });

  socket.on('stopBot', () => {
    if (botService.client) {
      botService.client.destroy().then(() => {
        io.emit('log', '🛑 Bot de WhatsApp cerrado por el usuario.');
        botService.client = null;
      }).catch(err => {
        console.error('❌ Error al cerrar el bot:', err);
      });
    }
  });

  socket.on('conectarSesion', async () => {
    if (botService.client) {
      io.emit('log', '⚠️ El bot ya está en ejecución. No se generará un nuevo QR.');
      return;
    }
    botService.crearNuevoCliente();
  });
});

// Iniciar servidor y cargar citas

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { usuario, contraseña } = req.body;

    // Validar credenciales
    if (usuario === 'admin' && contraseña === 'admin123') {
        req.session.usuario = 'admin';
        return res.redirect('/admin.html');
    } else if (usuario === 'cliente' && contraseña === 'cliente123') {
        req.session.usuario = 'cliente';
        return res.redirect('/index.html');
    } else {
        return res.status(401).send('Credenciales inválidas');
    }
});

// Proteger rutas específicas
app.get('/index.html', protegerRuta, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', protegerRuta, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use('/api', authRoutes);
app.use('/api', citasRoutes);
app.use('/api', soporteRoutes);

// --- Si usas catch-all para SPA ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Iniciar servidor
server.listen(3000, () => {
    console.log('🚀 Servidor listo en http://localhost:3000');
    cargarCitas();
    // ⏰ Ejecutar todos los días a las 08:00
    cron.schedule('0 8 * * *', () => {
        console.log('⏰ Verificando citas para enviar recordatorios (08:00)');
        verificarRecordatorios();
    });
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

// Middleware para proteger rutas
function protegerRuta(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    next();
}

