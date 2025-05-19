document.addEventListener('DOMContentLoaded', () => {
    // ======= Dark Mode ==========
    const initDarkMode = () => {
        const darkToggle = document.getElementById('darkModeToggle');
        if (!darkToggle) return;
        darkToggle.addEventListener('click', (e) => {
            document.body.classList.toggle('dark-mode');
            e.target.textContent = document.body.classList.contains('dark-mode') 
                ? '☀️' 
                : '🌙';
        });
    };

    // ========= CAPTCHA System ==========
    const initCaptchaSystem = () => {
        const captchaConfigs = [
            {
                formId: 'soporteForm',
                labelId: 'captchaLabel',
                inputId: 'captchaInput'
            },
            {
                formId: 'botRequestForm',
                labelId: 'captchaBotLabel',
                inputId: 'captchaBotInput'
            }
        ];
        const generateCaptcha = (labelElement) => {
            if (!labelElement) return null;
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            labelElement.textContent = `¿Cuánto es ${a} + ${b}?`;
            return a + b;
        };
        captchaConfigs.forEach(config => {
            const form = document.getElementById(config.formId);
            if (!form) return;
            const label = document.getElementById(config.labelId);
            const input = document.getElementById(config.inputId);
            let currentAnswer = generateCaptcha(label);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!input || parseInt(input.value) !== currentAnswer) {
                    alert('Respuesta incorrecta. Intente nuevamente.');
                    currentAnswer = generateCaptcha(label);
                    if (input) input.value = '';
                    return;
                }
                // Lógica de envío específica para cada formulario
                if (config.formId === 'soporteForm') {
                    const payload = {
                        nombre: document.getElementById('nombre')?.value,
                        empresa: document.getElementById('empresa')?.value,
                        telefono: document.getElementById('telefono')?.value,
                        descripcion: document.getElementById('descripcion')?.value
                    };
                    fetch('/api/soporte', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert('Formulario de soporte enviado correctamente.');
                            form.reset();
                        } else {
                            alert('Error al enviar el formulario de soporte.');
                        }
                    })
                    .catch(() => alert('Error de red al enviar el formulario.'));
                } else if (config.formId === 'botRequestForm') {
                    const payload = {
                        empresaBot: document.getElementById('empresaBot')?.value,
                        contactoBot: document.getElementById('contactoBot')?.value,
                        infoCliente: document.getElementById('infoCliente')?.value,
                        observacionesBot: document.getElementById('observacionesBot')?.value
                    };
                    fetch('/api/bot-request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert('Formulario de solicitud de bot enviado correctamente.');
                            form.reset();
                        } else {
                            alert('Error al enviar el formulario de solicitud de bot.');
                        }
                    })
                    .catch(() => alert('Error de red al enviar el formulario.'));
                }
                // Regenerar captcha después del envío
                currentAnswer = generateCaptcha(label);
                if (input) input.value = '';
            });
        });
    };

    // ========= LOGIN FORM HANDLER ==========
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');
            errorDiv.textContent = '';
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (data.success) {
                    // Si es usuario normal, puedes redirigir a otro panel si lo tienes
                    errorDiv.textContent = 'Acceso solo para administradores.';
                    errorDiv.style.color = 'red';
                } else {
                    errorDiv.textContent = data.message || 'Usuario o contraseña incorrectos.';
                    errorDiv.style.color = 'red';
                }
            })
            .catch(() => {
                errorDiv.textContent = 'Error de red. Intenta de nuevo.';
                errorDiv.style.color = 'red';
            });
        });
    }

    // Inicializar todo
    initDarkMode();
    initCaptchaSystem();
});
