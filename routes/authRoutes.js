const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { requireTenant } = require('../middleware/requireTenant');

// Login page
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public', 'login.html')));

// Check auth
router.get('/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Función para verificar la contraseña usando users.json
function passwordCorrecta(username, password) {
    const usersPath = path.join(__dirname, '../userflows/users.json');
    if (!fs.existsSync(usersPath)) return false;
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    return users[username] && users[username].password === password;
}

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Admin hardcodeado
    if (username === 'admin' && password === 'Samueldg1992..') {
        req.session.authenticated = true;
        req.session.user = username;
        req.session.role = 'admin';
        return res.json({ success: true, role: 'admin' });
    }

    // Si es usuario normal y existe su flujo personalizado
    const userFlowPath = path.join(__dirname, '../userflows', username + '.json');
    if (fs.existsSync(userFlowPath) && passwordCorrecta(username, password)) {
        req.session.authenticated = true;
        req.session.user = username;
        req.session.role = 'user';
        return res.json({ success: true, role: 'user' });
    }

    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Rutas posteriores requieren identificador de tenant
router.use(requireTenant);

// Nueva ruta para obtener el flujo personalizado del usuario
router.get('/api/flujo-usuario', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const username = req.session.user;
    const userFlowPath = path.join(__dirname, '../userflows', username + '.json');
    if (!fs.existsSync(userFlowPath)) {
        // Si no existe, devolver error
        return res.status(404).json({ success: false, message: 'No existe flujo personalizado para este usuario. Contacta al administrador.' });
    }
    try {
        const fields = JSON.parse(fs.readFileSync(userFlowPath, 'utf8'));
        return res.json({ success: true, fields });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Error leyendo el flujo del usuario' });
    }
});

// Ruta para que el admin guarde el flujo personalizado de un usuario
router.post('/api/flujo-usuario/:username', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede modificar flujos.' });
    }
    const username = req.params.username;
    const fields = req.body.fields;
    if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ success: false, message: 'El flujo debe ser un array de campos.' });
    }
    const userFlowPath = path.join(__dirname, '../userflows', username + '.json');
    try {
        fs.writeFileSync(userFlowPath, JSON.stringify(fields, null, 2), 'utf8');
        return res.json({ success: true, message: 'Flujo guardado correctamente.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Error guardando el flujo.' });
    }
});

// Ruta para que el admin obtenga la lista de usuarios (basada en los archivos de userflows)
router.get('/api/usuarios', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede ver usuarios.' });
    }
    const userflowsDir = path.join(__dirname, '../userflows');
    try {
        const files = fs.readdirSync(userflowsDir);
        // Solo archivos .json
        const usuarios = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        return res.json({ success: true, usuarios });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Error leyendo usuarios.' });
    }
});

// Ruta para crear un nuevo usuario (nombre y contraseña)
router.post('/api/crear-usuario', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede crear usuarios.' });
    }
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Faltan datos.' });
    }
    // Guardar usuario en archivo users.json
    const usersPath = path.join(__dirname, '../userflows/users.json');
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    }
    if (users[username]) {
        return res.status(400).json({ success: false, message: 'El usuario ya existe.' });
    }
    users[username] = { password };
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
    return res.json({ success: true, message: 'Usuario creado correctamente. Ahora diseña el flujo de chat para este usuario.' });
});

// 1. Citas pendientes y confirmadas por usuario
router.get('/api/citas/usuario/:username', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede ver citas por usuario.' });
    }
    const username = req.params.username;
    const archivoCitas = path.join(__dirname, '../citas.json');
    if (!fs.existsSync(archivoCitas)) {
        return res.json({ pendientes: [], confirmadas: [] });
    }
    const data = JSON.parse(fs.readFileSync(archivoCitas, 'utf8'));
    // Filtrar por username (asumimos que telefono === username)
    const pendientes = Object.values(data.pendientes || {}).filter(c => c.telefono === username);
    const confirmadas = Object.values(data.confirmadas || {}).filter(c => c.telefono === username);
    res.json({ pendientes, confirmadas });
});

// 2. Estado de bots activos (requiere whatsappService multiusuario)
const whatsappService = require('../services/whatsappService');
router.get('/api/bots-activos', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede ver bots activos.' });
    }
    // Suponemos que whatsappService expone getBotsActivos()
    const activos = whatsappService.getBotsActivos ? whatsappService.getBotsActivos() : [];
    res.json({ activos });
});

// 3. Log general del backend (últimos 100 logs de un archivo o memoria)
router.get('/api/logs', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede ver logs.' });
    }
    const logPath = path.join(__dirname, '../backend.log');
    let logs = [];
    if (fs.existsSync(logPath)) {
        logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-100);
    }
    res.json({ logs });
});

// 4. Número de teléfono de cada usuario (si está en users.json)
router.get('/api/usuarios/detalles', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede ver detalles de usuarios.' });
    }
    const usersPath = path.join(__dirname, '../userflows/users.json');
    let usuarios = [];
    if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        usuarios = Object.keys(users).map(username => ({ username, telefono: users[username].telefono || '' }));
    }
    res.json({ usuarios });
});

// 5. Control de bots (start, stop, restart)
router.post('/api/bot/:username/start', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede iniciar bots.' });
    }
    whatsappService.startBot && whatsappService.startBot(req.params.username);
    res.json({ success: true });
});
router.post('/api/bot/:username/stop', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede detener bots.' });
    }
    whatsappService.stopBot && whatsappService.stopBot(req.params.username);
    res.json({ success: true });
});
router.post('/api/bot/:username/restart', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede reiniciar bots.' });
    }
    whatsappService.restartBot && whatsappService.restartBot(req.params.username);
    res.json({ success: true });
});

// Ruta para eliminar un usuario (admin)
router.delete('/api/usuario/:username', (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo el admin puede eliminar usuarios.' });
    }
    const username = req.params.username;
    if (username === 'admin') {
        return res.status(400).json({ success: false, message: 'No se puede eliminar el usuario admin.' });
    }
    const userflowsDir = path.join(__dirname, '../userflows');
    const usersPath = path.join(userflowsDir, 'users.json');
    const userFlowPath = path.join(userflowsDir, username + '.json');
    // 1. Eliminar usuario de users.json
    let users = {};
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        delete users[username];
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
    }
    // 2. Eliminar flujo personalizado
    if (fs.existsSync(userFlowPath)) {
        fs.unlinkSync(userFlowPath);
    }
    // 3. Eliminar sesión de bot (si existe)
    const whatsappService = require('../services/whatsappService');
    if (whatsappService.stopBot) {
        whatsappService.stopBot(username);
    }
    // 4. Eliminar carpeta de sesión de WhatsApp (si existe)
    const sessionDir = path.join(__dirname, '../../.wwebjs_auth', username);
    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    return res.json({ success: true, message: 'Usuario eliminado correctamente.' });
});

module.exports = router;
