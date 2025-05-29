// ========= CAPTCHA System ==========
function initCaptchaSystem() {
    const captchaConfigs = [
        {
            formId: 'botRequestForm',
            labelId: 'captchaBotLabel',
            inputId: 'captchaBotInput'
        }
    ];
    function generateCaptcha(labelElement) {
        if (!labelElement) return null;
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        labelElement.textContent = `¿Cuánto es ${a} + ${b}?`;
        return a + b;
    }
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
            if (config.formId === 'botRequestForm') {
                const payload = {
                    botName: document.getElementById('botName')?.value,
                    botPhone: document.getElementById('botPhone')?.value,
                    botEmail: document.getElementById('botEmail')?.value,
                    botDetails: document.getElementById('botDetails')?.value
                };
                fetch('/api/bot-request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('Solicitud enviada correctamente.');
                        form.reset();
                    } else {
                        alert('Error al enviar la solicitud.');
                    }
                })
                .catch((err) => {
                    console.error('Error en fetch:', err);
                    alert('Error de red al enviar la solicitud.');
                });
            }
        });
    });
}

// ========= LOGIN FORM HANDLER ==========
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
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

// MODAL LOGIC para login, bot request y legal info
function setupModals() {
    // Login modal
    const loginModal = document.getElementById('loginModal');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const closeLoginModal = document.getElementById('closeLoginModal');
    if (showLoginBtn && loginModal && closeLoginModal) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
        });
        closeLoginModal.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) loginModal.style.display = 'none';
        });
    }
    // Bot request modal
    const botModal = document.getElementById('botModal');
    const closeBotModal = document.getElementById('closeBotModal');
    const showBotModalBtns = document.querySelectorAll('#showBotModalBtn, #showBotModalBtn2, #showBotModalBtn3');
    showBotModalBtns.forEach(btn => {
        if (btn && botModal) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                botModal.style.display = 'flex';
            });
        }
    });
    if (closeBotModal && botModal) {
        closeBotModal.addEventListener('click', () => {
            botModal.style.display = 'none';
        });
        botModal.addEventListener('click', (e) => {
            if (e.target === botModal) botModal.style.display = 'none';
        });
    }
    // Info legal modal
    const infoModal = document.getElementById('infoLegalModal');
    const closeInfo = document.getElementById('closeInfoLegalModal');
    // El enlace de 'más información' se gestiona en el HTML inline para máxima compatibilidad
    if (closeInfo && infoModal) {
        closeInfo.addEventListener('click', () => {
            infoModal.style.display = 'none';
        });
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.style.display = 'none';
        });
    }
}

// GSAP Animations
function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return;
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        gsap.from(loginForm, { opacity: 0, y: -20, duration: 1, ease: 'power2.out' });
    }
    const navBar = document.querySelector('nav');
    if (navBar) {
        gsap.from(navBar, { opacity: 0, y: -50, duration: 1.2, ease: 'power2.out', delay: 0.5 });
    }
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        gsap.from(section, { opacity: 0, y: 30, duration: 1, ease: 'power2.out', delay: 1 + index * 0.3 });
        const title = section.querySelector('h1');
        if (title) {
            gsap.from(title, { opacity: 0, x: -50, duration: 1, ease: 'power2.out', delay: 1.2 + index * 0.3 });
        }
        const paragraphs = section.querySelectorAll('p');
        if (paragraphs.length > 0) {
            gsap.from(paragraphs, { opacity: 0, x: 50, duration: 1, ease: 'power2.out', stagger: 0.2, delay: 1.4 + index * 0.3 });
        }
    });
    // Animaciones hover para listas y precios
    document.querySelectorAll('.info-box.card.gsap-card ul li, #precios .gsap-card ul li, #funciona .gsap-card ul li').forEach(text => {
        text.addEventListener('mouseenter', () => {
            gsap.to(text, { x: 10, duration: 0.3, ease: 'power2.out' });
        });
        text.addEventListener('mouseleave', () => {
            gsap.to(text, { x: 0, duration: 0.3, ease: 'power2.out' });
        });
    });
    // Animación para precios
    document.querySelectorAll('#precios .gsap-card p').forEach(price => {
        gsap.to(price, {
            x: 10,
            rotation: 15,
            scale: 1.3,
            color: '#ff4081',
            duration: 2,
            ease: 'elastic.inOut(1, 0.3)',
            yoyo: true,
            repeat: -1
        });
    });
}

// Animaciones sutiles para campos de entrada y botones
function initInputAnimations() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            gsap.to(input, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
        });
        input.addEventListener('blur', () => {
            gsap.to(input, { scale: 1, duration: 0.3, ease: 'power2.out' });
        });
    });
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            gsap.to(button, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
        });
        button.addEventListener('mouseleave', () => {
            gsap.to(button, { scale: 1, duration: 0.2, ease: 'power2.out' });
        });
    });
}

// Función para mostrar/ocultar el menú responsive
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('show');
    }
}
window.toggleMenu = toggleMenu;

// Inicializar todo al cargar
window.addEventListener('DOMContentLoaded', () => {
    initCaptchaSystem();
    initLoginForm();
    setupModals();
    initGSAPAnimations();
    initInputAnimations();
});