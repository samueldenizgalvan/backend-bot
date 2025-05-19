document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const logs = document.getElementById('logs');
    const tablaPendientes = document.getElementById('tablaPendientes');
    const tablaConfirmadas = document.getElementById('tablaConfirmadas');
    const botStatus = document.getElementById('botStatus');
    const totalPendientes = document.getElementById('totalPendientes');
    const totalConfirmadas = document.getElementById('totalConfirmadas');

    function agregarLog(mensaje) {
        if (logs) {
            logs.innerHTML += `<p>${mensaje}</p>`;
            logs.scrollTop = logs.scrollHeight;
        }
    }
    function createCell(content) {
        const td = document.createElement('td');
        if (content instanceof HTMLElement) {
            td.appendChild(content);
        } else {
            td.textContent = content;
        }
        return td;
    }
    

    document.getElementById('logoutBtn').addEventListener('click', () => {
        fetch('/logout', { method: 'POST' })
            .then(() => {
                if (socket) socket.emit('stopBot');
                window.location.href = '/login';
            });
    });
    
    function logout() {
        fetch('/logout', { method: 'POST' }).then(() => {
            fetch('/apagar-bot', { method: 'POST' }).then(() => {
                window.location.href = '/login';
            });
        });
    }


    socket.on('log', (mensaje) => {
        if (logs) {
            const logEntry = document.createElement('div');

            // Estilo según tipo
            if (mensaje.includes('✅')) logEntry.style.color = '#25D366';
            else if (mensaje.includes('❗') || mensaje.includes('❌')) logEntry.style.color = '#e74c3c';
            else if (mensaje.includes('🔔')) logEntry.style.color = '#f39c12';
            else logEntry.style.color = '#333';

            logEntry.textContent = mensaje;
            logs.prepend(logEntry);

            if (logs.children.length > 50) {
                logs.removeChild(logs.lastChild);
            }
        }
    });

    socket.on('ready', () => {
        if (botStatus) {
            botStatus.textContent = '✅ Conectado a WhatsApp Business';
        }
        if (document.getElementById('qr')) {
            document.getElementById('qr').style.display = 'none';
        }
        if (tablaPendientes && tablaConfirmadas) {
            cargarCitas();
        }
    });
    socket.on('nueva-cita', () => {
        cargarCitas(); // 🔁 Refrescar citas automáticamente
    });
    

    socket.on('qr', (qrURL) => {
        const qr = document.getElementById('qr');
        if (qr) {
            qr.src = qrURL;
            qr.style.display = 'block';
        }
        if (botStatus) {
            botStatus.textContent = '📸 Escanea el código QR en WhatsApp Business';
        }
    });

    document.querySelector('button[onclick="conectarSesion()"]')?.addEventListener('click', () => {
        socket.emit('conectarSesion');
        if (botStatus) {
            botStatus.textContent = '⏳ Intentando conectar con la sesión existente...';
        }
    });

    document.querySelector('button[onclick="vincularNuevaCuenta()"]')?.addEventListener('click', () => {
        socket.emit('startBot');
        if (botStatus) {
            botStatus.textContent = '⏳ Generando nuevo QR...';
        }
    });

    document.getElementById('logoutBtn').onclick = () => {
        fetch('/logout', { method: 'POST' }).then(() => location.href = '/login');
    };

    let userFields = [];

function mostrarMensajeError(mensaje) {
    const main = document.querySelector('main') || document.body;
    main.innerHTML = `<div style="color:red;font-weight:bold;text-align:center;margin-top:2em;">${mensaje}</div>`;
}

function crearEncabezadoTabla(fields) {
    const thead = document.querySelector('#tablaPendientes thead');
    thead.innerHTML = '';
    const tr = document.createElement('tr');
    fields.forEach(f => {
        const th = document.createElement('th');
        th.textContent = f;
        tr.appendChild(th);
    });
    // Confirmar, fecha, hora, acciones
    tr.appendChild(document.createElement('th')).textContent = 'Fecha confirmada';
    tr.appendChild(document.createElement('th')).textContent = 'Hora confirmada';
    tr.appendChild(document.createElement('th')).textContent = 'Acciones';
    thead.appendChild(tr);
}

function mostrarCitasPendientes(citas) {
    const tbody = document.querySelector('#tablaPendientes tbody');
    tbody.innerHTML = '';
    citas.forEach(cita => {
        const tr = document.createElement('tr');
        userFields.forEach(f => tr.appendChild(createCell(cita[f] || '')));
        // Input para fecha confirmada
        const fechaInput = document.createElement('input');
        fechaInput.type = 'date';
        fechaInput.value = cita.fechaConfirmada || '';

        // Input para hora confirmada
        const horaInput = document.createElement('input');
        horaInput.type = 'time';
        horaInput.value = cita.horaConfirmada || '';

        const acciones = document.createElement('td');

        // Botón de Confirmar
        const confirmarBtn = document.createElement('button');
        confirmarBtn.textContent = '✅ Confirmar';
        confirmarBtn.onclick = () => {
            const fecha = fechaInput.value;
            const hora = horaInput.value;

            if (!fecha || !hora) {
                alert('Debes seleccionar fecha y hora');
                return;
            }

            fetch('/api/citas/confirmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telefono: cita.telefono,
                    fechaConfirmada: fecha,
                    horaConfirmada: hora
                })
            }).then(res => res.json()).then(() => cargarCitas());
        };

        // Botón ❌ para eliminar
        const eliminarBtn = document.createElement('button');
        eliminarBtn.textContent = '❌';
        eliminarBtn.onclick = () => {
            if (confirm('¿Seguro que quieres eliminar esta cita pendiente?')) {
                fetch(`/api/citas/pendientes/${cita.telefono}`, { method: 'DELETE' })
                    .then(() => cargarCitas());
            }
        };

        acciones.appendChild(confirmarBtn);
        acciones.appendChild(document.createTextNode(' '));
        acciones.appendChild(eliminarBtn);

        // Agregar inputs de fecha y hora a la fila
        tr.appendChild(createCell(fechaInput));
        tr.appendChild(createCell(horaInput));
        tr.appendChild(acciones);

        tbody.appendChild(tr);
    });
}



function mostrarCitasConfirmadas(citas) {
    const tbody = tablaConfirmadas.querySelector('tbody');
    tbody.innerHTML = '';

    citas.forEach(cita => {
        const tr = document.createElement('tr');
        userFields.forEach(f => tr.appendChild(createCell(cita[f] || '')));
        tr.appendChild(createCell(cita.fechaConfirmada || ''));
        tr.appendChild(createCell(cita.horaConfirmada || ''));
        const acciones = document.createElement('td');
        const eliminarBtn = document.createElement('button');
        eliminarBtn.textContent = '❌';
        eliminarBtn.onclick = () => {
            if (confirm('¿Eliminar cita confirmada?')) {
                fetch(`/api/citas/confirmadas/${cita.telefono}`, { method: 'DELETE' })
                    .then(() => cargarCitas());
            }
        };
        acciones.appendChild(eliminarBtn);
        tr.appendChild(acciones);
        tbody.appendChild(tr);
    });
}

function cargarCitas() {
    fetch('/api/citas/pendientes')
        .then(res => res.json())
        .then(citas => mostrarCitasPendientes(citas));

    fetch('/api/citas/confirmadas')
        .then(res => res.json())
        .then(citas => mostrarCitasConfirmadas(citas));
}

// Al cargar la página, obtener el flujo personalizado
fetch('/api/flujo-usuario')
    .then(res => {
        if (!res.ok) throw new Error('No hay flujo personalizado para este usuario. Contacta al administrador.');
        return res.json();
    })
    .then(data => {
        userFields = data.fields;
        if (tablaPendientes) {
            crearEncabezadoTabla(userFields);
            cargarCitas();
        }
    })
    .catch(err => {
        mostrarMensajeError(err.message);
        if (tablaPendientes) tablaPendientes.style.display = 'none';
        if (tablaConfirmadas) tablaConfirmadas.style.display = 'none';
    });

    // Verificar y actualizar el estado del bot
    if (botStatus) {
        if (!botStatus.textContent.trim()) {
            botStatus.textContent = 'Desconectado ❌';
        }
    }

    // Actualizar contadores si existen
    if (totalPendientes) {
        totalPendientes.textContent = '3'; // Simulación de datos
    }

    if (totalConfirmadas) {
        totalConfirmadas.textContent = '12'; // Simulación de datos
    }

    // Emit a test message to the server
    socket.emit('message', { from: 'test-user@example.com', body: 'Hello, bot!' });
});


