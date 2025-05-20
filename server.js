// Refactored server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { protegerRuta } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const citasRoutes = require('./routes/citasRoutes');
const soporteRoutes = require('./routes/soporteRoutes');
const { cargarCitas, guardarCitas, verificarRecordatorios } = require('./services/citasService');
const botService = require('./services/botService');
const { manejarMensaje, getUserFlowFields } = require('./services/userFlowService');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
botService.setIO(io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Sirve los archivos estáticos de /public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta raíz: redirige según sesión y rol
app.get('/', (req, res) => {
  if (!req.session.usuario) {
    // No autenticado → mostramos login
    return res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
  // Autenticado → mostramos panel según rol
  if (req.session.usuario === 'admin') {
    return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  }
  // Cualquier otro usuario (cliente)
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Inicializar almacenamiento en memoria para citas
const citasPendientes = new Map();
const citasConfirmadas = new Map();
app.set('citasPendientes', citasPendientes);
app.set('citasConfirmadas', citasConfirmadas);

// Routes
app.post('/login', (req, res) => {
    const { usuario, contraseña } = req.body;
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
app.get('/index.html', protegerRuta, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin.html', protegerRuta, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.use('/api', authRoutes);
app.use('/api', citasRoutes);
app.use('/api', soporteRoutes);
app.get('/api/flujo-usuario', (req, res) => {
    res.json(getUserFlowFields());
});

// WebSocket
io.on('connection', socket => {
    socket.emit('log', '🟢 Cliente conectado a WebSocket');
    socket.on('startBot', botService.iniciarBot);
    socket.on('stopBot', botService.stopBot);
    socket.on('conectarSesion', botService.crearNuevoCliente);
    socket.on('message', msg => manejarMensaje(msg, botService.client, io));
});

// Cron Jobs
cron.schedule('0 8 * * *', () => {
    console.log('⏰ Verificando citas para enviar recordatorios (08:00)');
    verificarRecordatorios();
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
    cargarCitas();
});

