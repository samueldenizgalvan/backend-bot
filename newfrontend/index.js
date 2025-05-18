document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const logs = document.getElementById('logs');
    const tablaPendientes = document.getElementById('tablaPendientes');
    const tablaConfirmadas = document.getElementById('tablaConfirmadas');

    function agregarLog(mensaje) {
        logs.innerHTML += `<p>${mensaje}</p>`;
        logs.scrollTop = logs.scrollHeight;
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
    const logsDiv = document.getElementById('logs');
    const logEntry = document.createElement('div');

    // Estilo según tipo
    if (mensaje.includes('✅')) logEntry.style.color = '#25D366';
    else if (mensaje.includes('❗') || mensaje.includes('❌')) logEntry.style.color = '#e74c3c';
    else if (mensaje.includes('🔔')) logEntry.style.color = '#f39c12';
    else logEntry.style.color = '#333';

    logEntry.textContent = mensaje;
    logsDiv.prepend(logEntry);

    if (logsDiv.children.length > 50) {
        logsDiv.removeChild(logsDiv.lastChild);
    }
});


    

    socket.on('ready', () => {
        document.getElementById('status').textContent = '✅ Conectado a WhatsApp Business';
        document.getElementById('qr').style.display = 'none';
        cargarCitas();
    });
    socket.on('nueva-cita', () => {
        cargarCitas(); // 🔁 Refrescar citas automáticamente
    });
    

    socket.on('qr', (qrURL) => {
        document.getElementById('qr').src = qrURL;
        document.getElementById('qr').style.display = 'block';
        document.getElementById('status').textContent = '📸 Escanea el código QR en WhatsApp Business';
    });

    document.querySelector('button[onclick="conectarSesion()"]').onclick = () => {
        socket.emit('conectarSesion');
        document.getElementById('status').textContent = '⏳ Intentando conectar con la sesión existente...';
    };

    document.querySelector('button[onclick="vincularNuevaCuenta()"]').onclick = () => {
        socket.emit('startBot');
        document.getElementById('status').textContent = '⏳ Generando nuevo QR...';
    };

    document.getElementById('logoutBtn').onclick = () => {
        fetch('/logout', { method: 'POST' }).then(() => location.href = '/login');
    };

    function cargarCitas() {
        fetch('/api/citas/pendientes')
            .then(res => res.json())
            .then(citas => mostrarCitasPendientes(citas));

        fetch('/api/citas/confirmadas')
            .then(res => res.json())
            .then(citas => mostrarCitasConfirmadas(citas));
    }

    function logout() {
        fetch('/logout', { method: 'POST' })
            .then(() => {
                socket.emit('stopBot'); // Apaga el bot desde frontend
                window.location.href = '/login';
            });
    }
    

    function mostrarCitasPendientes(citas) {
        const tbody = document.querySelector('#tablaPendientes tbody');
        tbody.innerHTML = '';
    
        citas.forEach(cita => {
            const tr = document.createElement('tr');
    
            tr.appendChild(createCell(cita.telefono));
            tr.appendChild(createCell(cita.nombre));
            tr.appendChild(createCell(cita.vehiculo));
            tr.appendChild(createCell(cita.trabajo));
            tr.appendChild(createCell(cita.fechaDeseada || ''));
            tr.appendChild(createCell(cita.horaDeseada || ''));
            tr.appendChild(createCell(cita.observacion || ''));
    
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
            tr.innerHTML = `
                <td>${cita.telefono}</td>
                <td>${cita.nombre}</td>
                <td>${cita.vehiculo}</td>
                <td>${cita.trabajo}</td>
                <td>${cita.observacion}</td>
                <td>${cita.fechaConfirmada || ''}</td>
                <td>${cita.horaConfirmada || ''}</td>
                <td><button class="eliminar">❌</button></td>
            `;
            tbody.appendChild(tr);

            tr.querySelector('.eliminar').onclick = () => {
                if (confirm('¿Eliminar cita confirmada?')) {
                    fetch(`/api/citas/confirmadas/${cita.telefono}`, { method: 'DELETE' })
                        .then(() => cargarCitas());
                }
            };
        });
    }

    cargarCitas();
});


