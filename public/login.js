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
                if (config.formId === 'botRequestForm') {
                    const payload = {
                        botName: document.getElementById('botName')?.value,
                        botPhone: document.getElementById('botPhone')?.value,
                        botEmail: document.getElementById('botEmail')?.value,
                        botDetails: document.getElementById('botDetails')?.value // Captura correctamente el campo de detalles
                    };
                    fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: 'administrador@bot-whatsapp.es',
                            subject: 'Nueva solicitud de Bot de WhatsApp',
                            text: `Nombre: ${payload.botName}\nTeléfono: ${payload.botPhone}\nEmail: ${payload.botEmail}\nDetalles: ${payload.botDetails}`
                        })
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
                    .catch(() => alert('Error de red al enviar la solicitud.'));
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
        const infoBtn = document.getElementById('infoLegalBtn');
        const infoModal = document.getElementById('infoLegalModal');
        const closeInfo = document.getElementById('closeInfoLegalModal');
        if (infoBtn && infoModal && closeInfo) {
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                infoModal.style.display = 'flex';
            });
            closeInfo.addEventListener('click', () => {
                infoModal.style.display = 'none';
            });
            infoModal.addEventListener('click', (e) => {
                if (e.target === infoModal) infoModal.style.display = 'none';
            });
        }
    }

    // GSAP Animations
    const initGSAPAnimations = () => {
        // Verificar si GSAP está disponible
        if (typeof gsap === 'undefined') {
            console.error('GSAP no está cargado. Verifica la inclusión del script en el HTML.');
            return;
        }
        console.log('GSAP está cargado correctamente.');

        // Animación inicial del formulario de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('Ejecutando animación para el formulario de login.');
            gsap.from(loginForm, {
                opacity: 0,
                y: -20,
                duration: 1,
                ease: 'power2.out'
            });
        } else {
            console.warn('No se encontró el formulario de login.');
        }

        // Animación para la barra de navegación
        const navBar = document.querySelector('nav');
        if (navBar) {
            console.log('Ejecutando animación para la barra de navegación.');
            gsap.from(navBar, {
                opacity: 0,
                y: -50,
                duration: 1.2,
                ease: 'power2.out',
                delay: 0.5
            });
        } else {
            console.warn('No se encontró la barra de navegación.');
        }

        // Animación para las secciones
        const sections = document.querySelectorAll('section');
        if (sections.length > 0) {
            console.log('Ejecutando animación para las secciones.');
            sections.forEach((section, index) => {
                gsap.from(section, {
                    opacity: 0,
                    y: 30,
                    duration: 1,
                    ease: 'power2.out',
                    delay: 1 + index * 0.3
                });

                // Animación adicional para los títulos dentro de cada sección
                const title = section.querySelector('h1');
                if (title) {
                    gsap.from(title, {
                        opacity: 0,
                        x: -50,
                        duration: 1,
                        ease: 'power2.out',
                        delay: 1.2 + index * 0.3
                    });
                }

                // Animación adicional para los párrafos dentro de cada sección
                const paragraphs = section.querySelectorAll('p');
                if (paragraphs.length > 0) {
                    gsap.from(paragraphs, {
                        opacity: 0,
                        x: 50,
                        duration: 1,
                        ease: 'power2.out',
                        stagger: 0.2,
                        delay: 1.4 + index * 0.3
                    });
                }
            });
        } else {
            console.warn('No se encontraron secciones en la página.');
        }

        // Animación específica para "Plan a tu medida"
        const planSection = document.querySelector('#planSection');
        if (planSection) {
            gsap.from(planSection, {
                opacity: 0,
                scale: 0.8,
                duration: 1.5,
                ease: 'elastic.out(1, 0.3)',
                delay: 2
            });
        }

        // Animación específica para "Cómo funciona este bot"
        const botFunctionSection = document.querySelector('#botFunctionSection');
        if (botFunctionSection) {
            gsap.from(botFunctionSection, {
                opacity: 0,
                rotationX: 90,
                duration: 1.5,
                ease: 'back.out(1.7)',
                delay: 2.5
            });
        }

        // Animación específica para "WhatsApp Bot Para empresas"
        const whatsappBotSection = document.querySelector('#whatsappBotSection');
        if (whatsappBotSection) {
            gsap.from(whatsappBotSection, {
                opacity: 0,
                y: 100,
                duration: 1.5,
                ease: 'power4.out',
                delay: 3
            });
        }

        // Animación para "Casos de uso reales"
        const realUseCasesTexts = document.querySelectorAll('.info-box.card.gsap-card ul li');
        realUseCasesTexts.forEach((text) => {
            text.addEventListener('mouseenter', () => {
                gsap.to(text, {
                    x: 10,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            text.addEventListener('mouseleave', () => {
                gsap.to(text, {
                    x: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });

        // Animación de vibración para "Pago seguro", "Soporte personalizado", "Entrega rápida"
        const vibratingElements = document.querySelectorAll('#securePayment, #personalizedSupport, #fastDelivery');
        vibratingElements.forEach((element) => {
            gsap.to(element, {
                x: -2,
                y: 2,
                repeat: -1,
                yoyo: true,
                duration: 0.1,
                ease: 'power1.inOut'
            });
        });

        // Animación de vibración para "Pack Profesional" y "Mantenimiento"
        const packElements = document.querySelectorAll('#professionalPack, #maintenance');
        packElements.forEach((element) => {
            gsap.to(element, {
                x: -2,
                y: 2,
                repeat: -1,
                yoyo: true,
                duration: 0.1,
                ease: 'power1.inOut'
            });
        });

        // Animación para "Plan a tu medida"
        const planTexts = document.querySelectorAll('#precios .gsap-card ul li');
        planTexts.forEach((text) => {
            text.addEventListener('mouseenter', () => {
                gsap.to(text, {
                    x: 10,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            text.addEventListener('mouseleave', () => {
                gsap.to(text, {
                    x: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });

        // Animación para "Cómo funciona este bot"
        const botFunctionTexts = document.querySelectorAll('#funciona .gsap-card ul li');
        botFunctionTexts.forEach((text) => {
            text.addEventListener('mouseenter', () => {
                gsap.to(text, {
                    x: 10,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            text.addEventListener('mouseleave', () => {
                gsap.to(text, {
                    x: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });

        // Animación para el nav
        const navLinks = document.querySelectorAll('nav .nav-link');
        navLinks.forEach((link) => {
            link.addEventListener('mouseenter', () => {
                gsap.to(link, {
                    scale: 1.1,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
            link.addEventListener('mouseleave', () => {
                gsap.to(link, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
        });

        // Animación continua hacia la derecha para los precios
        const priceElements = document.querySelectorAll('#precios .gsap-card p');
        priceElements.forEach((price) => {
            gsap.to(price, {
                x: 10, // Cambia el desplazamiento hacia la derecha
                rotation: 15, // Cambia la rotación hacia la derecha
                scale: 1.3,
                color: '#ff4081',
                duration: 2,
                ease: 'elastic.inOut(1, 0.3)',
                yoyo: true,
                repeat: -1 // Repetir indefinidamente
            });
        });
    };

    // Animaciones sutiles para campos de entrada y botones
    const initInputAnimations = () => {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                gsap.to(input, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            input.addEventListener('blur', () => {
                gsap.to(input, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });

        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    scale: 1.1,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
        });
    };

    // Inicializar todo
    initDarkMode();
    initCaptchaSystem();
    setupModals();
    initGSAPAnimations();
    initInputAnimations();
});

// ===== GSAP ANIMACIONES MODERNAS LOGIN =====
// Unifica en un solo DOMContentLoaded para evitar conflictos y doble ejecución
// Elimina el segundo bloque para evitar doble inicialización y errores de carga
