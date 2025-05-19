// admin.js - Panel de administración de usuarios y flujos personalizados

document.addEventListener('DOMContentLoaded', () => {
    const usuariosSelect = document.getElementById('usuariosSelect');
    const flujoInput = document.getElementById('flujoInput');
    const guardarBtn = document.getElementById('guardarFlujoBtn');
    const mensajeDiv = document.getElementById('mensaje');

    // Cargar lista de usuarios
    fetch('/api/usuarios')
        .then(res => res.json())
        .then(data => {
            if (!data.success) throw new Error(data.message);
            usuariosSelect.innerHTML = '<option value="">Selecciona un usuario</option>';
            data.usuarios.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u;
                opt.textContent = u;
                usuariosSelect.appendChild(opt);
            });
        })
        .catch(err => {
            mensajeDiv.textContent = err.message;
            mensajeDiv.style.color = 'red';
        });

    // Al seleccionar usuario, cargar su flujo
    usuariosSelect.addEventListener('change', () => {
        const user = usuariosSelect.value;
        if (!user) {
            flujoInput.value = '';
            return;
        }
        fetch('/api/flujo-usuario', { credentials: 'same-origin' })
            .then(res => {
                if (!res.ok) throw new Error('No se pudo obtener el flujo');
                return res.json();
            })
            .then(data => {
                flujoInput.value = data.fields.join(', ');
            })
            .catch(() => {
                flujoInput.value = '';
            });
    });

    // Guardar flujo editado
    guardarBtn.addEventListener('click', () => {
        const user = usuariosSelect.value;
        if (!user) {
            mensajeDiv.textContent = 'Selecciona un usuario.';
            mensajeDiv.style.color = 'red';
            return;
        }
        const campos = flujoInput.value.split(',').map(f => f.trim()).filter(f => f);
        if (campos.length === 0) {
            mensajeDiv.textContent = 'El flujo no puede estar vacío.';
            mensajeDiv.style.color = 'red';
            return;
        }
        fetch(`/api/flujo-usuario/${user}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: campos })
        })
            .then(res => res.json())
            .then(data => {
                mensajeDiv.textContent = data.message;
                mensajeDiv.style.color = data.success ? 'green' : 'red';
            })
            .catch(() => {
                mensajeDiv.textContent = 'Error guardando el flujo.';
                mensajeDiv.style.color = 'red';
            });
    });

    // --- VISUALIZACIÓN DE DATOS EN EL PANEL ADMIN ---

    // Mostrar bots activos
    function mostrarBotsActivos() {
        fetch('/api/bots-activos')
            .then(res => res.json())
            .then(data => {
                const cont = document.getElementById('botsActivos');
                if (!data.activos || data.activos.length === 0) {
                    cont.innerHTML = '<div style="color:#888;">No hay bots activos.</div>';
                    return;
                }
                cont.innerHTML = `<table><thead><tr><th>Usuario</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
                    ${data.activos.map(bot => `
                        <tr>
                            <td>${bot.username}</td>
                            <td>${bot.estado}</td>
                            <td>
                                <button onclick="controlBot('${bot.username}','stop')">Apagar</button>
                                <button onclick="controlBot('${bot.username}','restart')">Reiniciar</button>
                            </td>
                        </tr>`).join('')}
                </tbody></table>`;
            });
    }
    window.controlBot = function(username, action) {
        fetch(`/api/bot/${username}/${action}`, { method: 'POST' })
            .then(() => mostrarBotsActivos());
    };

    // Mostrar detalles de usuarios
    function mostrarDetallesUsuarios() {
        fetch('/api/usuarios/detalles')
            .then(res => res.json())
            .then(data => {
                const cont = document.getElementById('detallesUsuarios');
                if (!data.usuarios || data.usuarios.length === 0) {
                    cont.innerHTML = '<div style="color:#888;">No hay usuarios registrados.</div>';
                    return;
                }
                cont.innerHTML = `<table><thead><tr><th>Usuario</th><th>Teléfono</th></tr></thead><tbody>
                    ${data.usuarios.map(u => `<tr><td>${u.username}</td><td>${u.telefono || '-'}</td></tr>`).join('')}
                </tbody></table>`;
            });
    }

    // Mostrar log general
    function mostrarLogs() {
        fetch('/api/logs')
            .then(res => res.json())
            .then(data => {
                const cont = document.getElementById('logsPanel');
                if (!data.logs || data.logs.length === 0) {
                    cont.innerHTML = '<div style="color:#888;">No hay logs recientes.</div>';
                    return;
                }
                cont.innerHTML = data.logs.map(l => `<div>${l}</div>`).join('');
            });
    }

    // --- LÓGICA DE SECCIONES Y VISUALIZACIÓN ---
    window.mostrarSeccion = function(seccion) {
        document.querySelectorAll('.seccion-admin').forEach(s => s.classList.remove('active'));
        document.getElementById('seccion-' + seccion).classList.add('active');
        // Cargar datos según sección
        if (seccion === 'estadisticas') cargarEstadisticas();
        if (seccion === 'bots') mostrarBotsActivosPanel();
        if (seccion === 'usuarios') mostrarUsuariosPanel();
        if (seccion === 'citas') mostrarCitasPanel();
        if (seccion === 'logs') mostrarLogsPanel();
        if (seccion === 'actividad') mostrarActividadPanel();
        if (seccion === 'soporte') mostrarSoportePanel();
    };

    // --- Estadísticas ---
    function cargarEstadisticas() {
        Promise.all([
            fetch('/api/usuarios').then(r=>r.json()),
            fetch('/api/bots-activos').then(r=>r.json()),
            fetch('/api/citas/pendientes').then(r=>r.json()),
            fetch('/api/citas/confirmadas').then(r=>r.json())
        ]).then(([usuarios, bots, pendientes, confirmadas]) => {
            const totalUsuarios = usuarios.usuarios?.length || 0;
            const totalBots = bots.activos?.length || 0;
            const totalPendientes = pendientes.length || 0;
            const totalConfirmadas = confirmadas.length || 0;
            document.getElementById('seccion-estadisticas').innerHTML = `
                <div class="admin-card">
                    <h3>Estadísticas generales</h3>
                    <ul style="font-size:1.1em;">
                        <li>👤 Usuarios registrados: <b>${totalUsuarios}</b></li>
                        <li>🤖 Bots activos: <b>${totalBots}</b></li>
                        <li>📅 Citas pendientes: <b>${totalPendientes}</b></li>
                        <li>✅ Citas confirmadas: <b>${totalConfirmadas}</b></li>
                    </ul>
                </div>
            `;
        });
    }

    // --- Bots activos ---
    function mostrarBotsActivosPanel() {
        fetch('/api/bots-activos')
            .then(res => res.json())
            .then(data => {
                document.getElementById('seccion-bots').innerHTML = `
                    <div class="admin-card">
                        <h3>Bots activos</h3>
                        ${data.activos && data.activos.length > 0 ? `
                        <table><thead><tr><th>Usuario</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
                            ${data.activos.map(bot => `
                                <tr>
                                    <td>${bot.username}</td>
                                    <td>${bot.estado}</td>
                                    <td>
                                        <button onclick="controlBot('${bot.username}','stop')">Apagar</button>
                                        <button onclick="controlBot('${bot.username}','restart')">Reiniciar</button>
                                    </td>
                                </tr>`).join('')}
                        </tbody></table>` : '<div style="color:#888;">No hay bots activos.</div>'}
                    </div>
                `;
            });
    }

    // --- Usuarios ---
    function mostrarUsuariosPanel() {
        fetch('/api/usuarios/detalles')
            .then(res => res.json())
            .then(function(data) {
                document.getElementById('seccion-usuarios').innerHTML = `
                    <div class="admin-card">
                        <h3>Usuarios registrados</h3>
                        <table><thead><tr><th>Usuario</th><th>Teléfono</th><th>Acción</th></tr></thead><tbody>
                            ${data.usuarios.map(u => `
                                <tr>
                                    <td>${u.username}</td>
                                    <td>${u.telefono || '-'}</td>
                                    <td>
                                        ${u.username !== 'admin' ? `<button class='eliminar-usuario-btn' data-username='${u.username}'>Eliminar</button>` : ''}
                                    </td>
                                </tr>`).join('')}
                        </tbody></table>
                        <div id="mensajeEliminarUsuario" style="margin-top:1em;"></div>
                    </div>
                `;
                // Añadir listeners a los botones de eliminar
                document.querySelectorAll('.eliminar-usuario-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        const username = this.getAttribute('data-username');
                        if (confirm(`¿Seguro que quieres eliminar el usuario '${username}'? Esta acción es irreversible.`)) {
                            fetch(`/api/usuario/${username}`, { method: 'DELETE' })
                                .then(res => res.json())
                                .then(function(data) {
                                    const msgDiv = document.getElementById('mensajeEliminarUsuario');
                                    msgDiv.textContent = data.message;
                                    msgDiv.style.color = data.success ? 'green' : 'red';
                                    if (data.success) setTimeout(mostrarUsuariosPanel, 1000);
                                })
                                .catch(function() {
                                    const msgDiv = document.getElementById('mensajeEliminarUsuario');
                                    msgDiv.textContent = 'Error eliminando usuario.';
                                    msgDiv.style.color = 'red';
                                });
                        }
                    });
                });
            });
    }

    // --- Citas por usuario ---
    function mostrarCitasPanel() {
        fetch('/api/usuarios').then(r=>r.json()).then(data => {
            let html = '<div class="admin-card"><h3>Citas por usuario</h3>';
            if (!data.usuarios || data.usuarios.length === 0) {
                html += '<div style="color:#888;">No hay usuarios.</div></div>';
                document.getElementById('seccion-citas').innerHTML = html;
                return;
            }
            html += '<label for="citasUsuariosSelect">Selecciona usuario:</label>';
            html += '<select id="citasUsuariosSelect" style="margin-bottom:1em;"><option value="">Selecciona usuario</option>' +
                data.usuarios.map(u => `<option value="${u}">${u}</option>`).join('') + '</select>';
            html += '<div id="citasUsuario"></div></div>';
            document.getElementById('seccion-citas').innerHTML = html;
            document.getElementById('citasUsuariosSelect').addEventListener('change', function() {
                const user = this.value;
                if (!user) { document.getElementById('citasUsuario').innerHTML = ''; return; }
                fetch(`/api/citas/usuario/${user}`)
                    .then(res => res.json())
                    .then(data => {
                        let html = '<h5>Pendientes</h5>';
                        if (data.pendientes && data.pendientes.length > 0) {
                            html += '<table><thead><tr>' + Object.keys(data.pendientes[0]).map(k => `<th>${k}</th>`).join('') + '</tr></thead><tbody>';
                            html += data.pendientes.map(c => '<tr>' + Object.values(c).map(v => `<td>${v}</td>`).join('') + '</tr>').join('');
                            html += '</tbody></table>';
                        } else {
                            html += '<div style="color:#888;">Sin citas pendientes.</div>';
                        }
                        html += '<h5>Confirmadas</h5>';
                        if (data.confirmadas && data.confirmadas.length > 0) {
                            html += '<table><thead><tr>' + Object.keys(data.confirmadas[0]).map(k => `<th>${k}</th>`).join('') + '</tr></thead><tbody>';
                            html += data.confirmadas.map(c => '<tr>' + Object.values(c).map(v => `<td>${v}</td>`).join('') + '</tr>').join('');
                            html += '</tbody></table>';
                        } else {
                            html += '<div style="color:#888;">Sin citas confirmadas.</div>';
                        }
                        document.getElementById('citasUsuario').innerHTML = html;
                    });
            });
        });
    }

    // --- Log general ---
    function mostrarLogsPanel() {
        fetch('/api/logs')
            .then(res => res.json())
            .then(data => {
                document.getElementById('seccion-logs').innerHTML = `
                    <div class="admin-card">
                        <h3>Log general del sistema</h3>
                        <div style="max-height:200px; overflow-y:auto; background:#222; color:#eee; font-size:0.95em; border-radius:8px; padding:1em;">
                            ${data.logs && data.logs.length > 0 ? data.logs.map(l => `<div>${l}</div>`).join('') : '<div style="color:#888;">No hay logs recientes.</div>'}
                        </div>
                    </div>
                `;
            });
    }

    // --- Actividad reciente (simulada: últimos logs) ---
    function mostrarActividadPanel() {
        fetch('/api/logs')
            .then(res => res.json())
            .then(data => {
                document.getElementById('seccion-actividad').innerHTML = `
                    <div class="admin-card">
                        <h3>Actividad reciente</h3>
                        <ul style="font-size:1.05em;">
                            ${data.logs && data.logs.length > 0 ? data.logs.slice(-10).reverse().map(l => `<li>${l}</li>`).join('') : '<li>No hay actividad reciente.</li>'}
                        </ul>
                    </div>
                `;
            });
    }

    // --- Panel de soporte (formulario simple) ---
    function mostrarSoportePanel() {
        document.getElementById('seccion-soporte').innerHTML = `
            <div class="admin-card">
                <h3>Soporte</h3>
                <form id="soporteForm">
                    <label for="soporteMensaje">Mensaje para soporte:</label>
                    <textarea id="soporteMensaje" rows="4" style="width:100%;"></textarea>
                    <button type="submit" style="margin-top:1em;">Enviar</button>
                </form>
                <div id="soporteRespuesta" style="margin-top:1em;"></div>
            </div>
        `;
        document.getElementById('soporteForm').onsubmit = function(e) {
            e.preventDefault();
            const mensaje = document.getElementById('soporteMensaje').value;
            fetch('/api/soporte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion: mensaje, nombre: 'admin', empresa: 'admin', telefono: '' })
            })
            .then(res => res.json())
            .then(data => {
                document.getElementById('soporteRespuesta').textContent = data.success ? 'Mensaje enviado correctamente.' : 'Error al enviar mensaje.';
            })
            .catch(() => {
                document.getElementById('soporteRespuesta').textContent = 'Error de red al enviar mensaje.';
            });
        };
    }

    // Inicialización: mostrar estadísticas por defecto
    mostrarSeccion('estadisticas');
    // Inicialización visual
    mostrarBotsActivos();
    mostrarDetallesUsuarios();
    mostrarLogs();
    setInterval(mostrarBotsActivos, 10000);
    setInterval(mostrarLogs, 10000);
    setInterval(mostrarDetallesUsuarios, 30000);

    // Mostrar citas al seleccionar usuario
    usuariosSelect.addEventListener('change', () => {
        mostrarCitasUsuario(usuariosSelect.value);
    });
});
