(function () {
// Toggle Mobile Menu
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Abrir/cerrar menú
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Cerrar menú al hacer clic en un enlace
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.header')) {
        navMenu.classList.remove('active');
    }
});

// Smooth scroll para enlaces de navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Agregar efecto de scroll al header
let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    lastScrollTop = scrollTop;
});

// Animación de elementos cuando entran en vista
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar elementos para animación
document.querySelectorAll('.room-card, .servicio-card, .gallery-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// Validación del formulario de contacto (con Formspree)
const contactForm = document.querySelector('.contacto-form');
if (contactForm) {
    contactForm.setAttribute('action', 'https://formspree.io/f/mdaqndll');

    contactForm.addEventListener('submit', (e) => {
        // Formspree manejará el envío, solo validamos los campos
        const nombre = contactForm.querySelector('input[name="nombre"]').value;
        const email = contactForm.querySelector('input[name="email"]').value;
        const telefono = contactForm.querySelector('input[name="telefono"]').value;
        const mensaje = contactForm.querySelector('textarea[name="mensaje"]').value;
        
        // Validar que no estén vacíos
        if (!nombre.trim() || !email.trim() || !telefono.trim() || !mensaje.trim()) {
            e.preventDefault();
            alert('Por favor completa todos los campos.');
        }
        // Si está completo, Formspree manejará el envío
    });
}

// Efecto parallax en hero
const hero = document.querySelector('.hero');
if (hero) {
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const heroImage = hero.querySelector('.hero-image');
        if (heroImage) {
            heroImage.style.transform = `translateY(${scrollY * 0.5}px)`;
        }
    });
}

// Galería - Zoom de imágenes
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', function() {
        const img = this.querySelector('img');
        const src = img.src;
        
        // Crear modal para mostrar imagen
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            cursor: zoom-out;
        `;
        
        const imgElement = document.createElement('img');
        imgElement.src = src;
        imgElement.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        `;
        
        // Botón cerrar
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            color: white;
            font-size: 32px;
            cursor: pointer;
            z-index: 1001;
        `;
        
        modal.appendChild(imgElement);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        
        // Cerrar modal
        const closeModal = () => {
            modal.remove();
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Cerrar con tecla ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        
        document.addEventListener('keydown', handleEsc);
    });
});

// Contador de números (para estadísticas si se agrega después)
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Efecto hover en cards
document.querySelectorAll('.room-card, .servicio-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

console.log('Página web del Hotel Casa Usumacinta cargada correctamente ✓');

    async function ensureFirestoreInitialized() {
        if (window.firestore && window.firestore.db) return window.firestore;
        try {
            const { firebaseConfig } = await import('../config.js');
            const firebaseApp = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js');
            const firebaseFirestore = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
            const app = firebaseApp.initializeApp(firebaseConfig);
            const db = firebaseFirestore.getFirestore(app);
            window.firestore = {
                db,
                collection: firebaseFirestore.collection,
                getDocs: firebaseFirestore.getDocs,
                getDoc: firebaseFirestore.getDoc,
                query: firebaseFirestore.query,
                where: firebaseFirestore.where,
                orderBy: firebaseFirestore.orderBy,
                addDoc: firebaseFirestore.addDoc,
                updateDoc: firebaseFirestore.updateDoc,
                setDoc: firebaseFirestore.setDoc,
                doc: firebaseFirestore.doc
            };
            return window.firestore;
        } catch (error) {
            console.error('Error inicializando Firestore:', error);
            return null;
        }
    }

    async function getFirestoreHelpers() {
        const helpers = await ensureFirestoreInitialized();
        if (!helpers) {
            console.error('Firestore no está inicializado en la página web pública.');
            return null;
        }
        return helpers;
    }

    function ensureReservaModal() {
        let modal = document.getElementById('reservaModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'reservaModal';
            modal.className = 'modal';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="close-modal" id="reservaModalClose" type="button" aria-label="Cerrar">&times;</button>
                    <div id="reservaModalBody"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const closeBtn = modal.querySelector('#reservaModalClose');
        if (closeBtn && !closeBtn.dataset.listenerAttached) {
            closeBtn.addEventListener('click', cerrarModalReserva);
            closeBtn.dataset.listenerAttached = 'true';
        }

        if (!modal.dataset.backgroundClickAttached) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) cerrarModalReserva();
            });
            modal.dataset.backgroundClickAttached = 'true';
        }

        return modal;
    }

    function cerrarModalReserva() {
        const modal = ensureReservaModal();
        if (!modal) return;
        modal.style.display = 'none';
        const body = document.getElementById('reservaModalBody');
        if (body) body.innerHTML = '';
    }

    function abrirModalReserva(capacidad, roomLabel = '') {
        const modal = document.getElementById('reservaModal');
        const body = document.getElementById('reservaModalBody');
        if (!modal || !body) return;

        const cantidadBotones = [1,2,3,4,5,6].map(n =>
            `<button type="button" class="cantidad-btn" data-cantidad="${n}" onclick="seleccionarCantidad(${n})">${n}</button>`
        ).join('');

        body.innerHTML = `
            <div class="modal-header">
                <h2>🧳 Reserva en Casa Usumacinta</h2>
                <button class="close-modal" type="button" onclick="cerrarModalReserva()">&times;</button>
            </div>
            <div class="modal-body modal-form">
                <div class="highlight-box">
                    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;">
                        <div style="flex:1;min-width:240px;">
                            <label>👥 ¿Cuántos huéspedes deseas agregar?</label>
                            <div class="room-options">${cantidadBotones}</div>
                            <input id="cantidadHuespedes" type="hidden" value="1">
                        </div>
                        <div style="flex:1;min-width:240px;">
                            <label>⏰ Tipo de Reserva</label>
                            <div style="display:flex;flex-direction:column;gap:8px;">
                                <label style="display:flex;align-items:center;gap:8px;padding:10px;border:2px solid #d0d0d0;border-radius:8px;cursor:pointer;">
                                    <input type="radio" id="reservaConEspera" name="tipoReserva" value="Con tiempo de espera" checked onchange="actualizarPorcentajePago()">
                                    <span>⏳ Con tiempo de espera</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="huespedFormContainer"></div>
                <div class="highlight-box">
                    <div class="room-select-container">
                        <div>
                            <label>🛏️ Habitación (requerida para reserva)</label>
                            <select id="huespedHabitacion"></select>
                        </div>
                        <div>
                            <label>💳 Tipo de Pago</label>
                            <select id="tipoPago">
                                <option value="">Selecciona tipo de pago</option>
                                <option value="Transferencia">🏦 Transferencia</option>
                            </select>
                        </div>
                    </div>
                    <div class="room-select-container">
                        <div>
                            <label>📅 Check-in</label>
                            <input id="checkInDate" type="date">
                        </div>
                        <div>
                            <label>📅 Check-out</label>
                            <input id="checkOutDate" type="date">
                        </div>
                    </div>
                    <div class="room-select-container">
                        <div>
                            <label>📊 % Pago Inicial</label>
                            <select id="porcentajePago" onchange="calcularTotal()">
                                <option value="100">100% (Pago Completo)</option>
                                <option value="50">50% (Anticipo)</option>
                                <option value="35">35% (Anticipo)</option>
                            </select>
                        </div>
                        <div>
                            <label>🧾 Facturar</label>
                            <div class="facturar-options">
                                <label><input id="facturarNo" type="radio" name="facturar" value="no" checked> No</label>
                                <label><input id="facturarSi" type="radio" name="facturar" value="si"> Sí</label>
                            </div>
                        </div>
                    </div>
                    <div class="room-select-container">
                        <div id="datosBancariosContainer" style="display:block;">
                            <label>🏦 Datos Bancarios</label>
                            <div class="datos-bancarios" id="datosBancariosTexto">CLABE interbancaria 012796015605553236 banco BBVA</div>
                        </div>
                        <div>
                            <label>📄 Comprobante de Pago</label>
                            <input id="comprobantePago" type="file" accept="image/*,.pdf" required>
                        </div>
                    </div>
                    <div>
                        <label>💰 Total</label>
                        <input id="totalReserva" type="text" readonly>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" type="button" onclick="cerrarModalReserva()">Cancelar</button>
                <button class="btn btn-primary" type="button" onclick="guardarReservaWeb()">Guardar Reserva</button>
            </div>
        `;

        modal.style.display = 'flex';
        seleccionarCantidad(1);
        actualizarPorcentajePago();
        actualizarDatosBancarios();
        attachFacturarListeners();
        if (capacidad) actualizarHabitacionesPorCapacidad(capacidad, roomLabel);
    }

    function attachFacturarListeners() {
        const radios = document.querySelectorAll('input[name="facturar"]');
        radios.forEach(radio => {
            radio.removeEventListener('change', actualizarDatosBancarios);
            radio.addEventListener('change', actualizarDatosBancarios);
        });
    }

    function formatearFechaInput(fecha) {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
    }

    function parsearFechaInput(valor) {
        if (!valor) return null;
        const [año, mes, dia] = valor.split('-').map(Number);
        return new Date(año, mes - 1, dia);
    }

    function encontrarSiguienteFechaDisponible(fechaInicial, fechasBloqueadas) {
        const candidata = new Date(fechaInicial);
        candidata.setHours(12, 0, 0, 0);
        while (fechasBloqueadas.has(formatearFechaInput(candidata))) {
            candidata.setDate(candidata.getDate() + 1);
        }
        return candidata;
    }

    async function actualizarFechasDisponibles() {
        const helpers = await getFirestoreHelpers();
        if (!helpers) return;
        const { db, collection, getDocs } = helpers;
        const roomSelect = document.getElementById('huespedHabitacion');
        const checkInInput = document.getElementById('checkInDate');
        const checkOutInput = document.getElementById('checkOutDate');
        if (!roomSelect || !checkInInput || !checkOutInput) return;

        const roomId = roomSelect.value;
        const hoy = new Date();
        hoy.setHours(12, 0, 0, 0);
        const hoyInput = formatearFechaInput(hoy);
        checkInInput.min = hoyInput;

        if (!roomId) {
            checkInInput.value = '';
            checkOutInput.value = '';
            checkOutInput.min = hoyInput;
            return;
        }

        try {
            const reservasSnap = await getDocs(collection(db, 'reservas'));
            const fechasBloqueadas = new Set();
            reservasSnap.forEach(docReserva => {
                const reserva = { id: docReserva.id, ...docReserva.data() };
                if (!reserva.roomId || reserva.roomId !== roomId) return;
                if ((reserva.status || 'Confirmada') === 'Cancelada') return;
                const checkIn = reserva.checkIn && reserva.checkIn.toDate ? reserva.checkIn.toDate() : new Date(reserva.checkIn);
                const checkOut = reserva.checkOut && reserva.checkOut.toDate ? reserva.checkOut.toDate() : new Date(reserva.checkOut);
                const fechaActual = new Date(checkIn);
                fechaActual.setHours(12, 0, 0, 0);
                const fechaFin = new Date(checkOut);
                fechaFin.setHours(12, 0, 0, 0);
                while (fechaActual < fechaFin) {
                    fechasBloqueadas.add(formatearFechaInput(fechaActual));
                    fechaActual.setDate(fechaActual.getDate() + 1);
                }
            });

            const checkInActual = checkInInput.value;
            const checkInParsed = checkInActual ? parsearFechaInput(checkInActual) : null;
            const checkInValido = !!checkInParsed && checkInParsed >= hoy && !fechasBloqueadas.has(checkInActual);
            let nuevoCheckIn = checkInActual;
            if (!checkInValido) {
                const fechaDisponible = encontrarSiguienteFechaDisponible(hoy, fechasBloqueadas);
                nuevoCheckIn = formatearFechaInput(fechaDisponible);
            }
            if (nuevoCheckIn !== checkInActual) {
                checkInInput.value = nuevoCheckIn;
            }

            const checkInDate = parsearFechaInput(checkInInput.value);
            const checkoutMin = new Date(checkInDate);
            checkoutMin.setDate(checkoutMin.getDate() + 1);
            checkOutInput.min = formatearFechaInput(checkoutMin);

            const checkOutActual = checkOutInput.value;
            const checkOutParsed = checkOutActual ? parsearFechaInput(checkOutActual) : null;
            const checkOutValido = !!checkOutParsed && checkOutParsed > checkInDate && !fechasBloqueadas.has(checkOutActual);
            let nuevoCheckOut = checkOutActual;
            if (!checkOutValido) {
                const checkoutDisponible = encontrarSiguienteFechaDisponible(checkoutMin, fechasBloqueadas);
                nuevoCheckOut = formatearFechaInput(checkoutDisponible);
            }
            if (nuevoCheckOut !== checkOutActual) {
                checkOutInput.value = nuevoCheckOut;
            }

            calcularTotal();
        } catch (error) {
            console.error('Error cargando fechas disponibles:', error);
        }
    }

    function actualizarDatosBancarios() {
        const facturar = document.querySelector('input[name="facturar"]:checked')?.value || 'no';
        const datosContainer = document.getElementById('datosBancariosContainer');
        const datosTexto = document.getElementById('datosBancariosTexto');
        if (!datosContainer || !datosTexto) return;
        datosContainer.style.display = 'block';
        if (facturar === 'si') {
            datosTexto.textContent = 'CLABE interbancaria 012796004921167074 banco BBVA';
        } else {
            datosTexto.textContent = 'CLABE interbancaria 012796015605553236 banco BBVA';
        }
    }

    function seleccionarCantidad(cantidad) {
        document.querySelectorAll('.cantidad-btn').forEach(btn => {
            btn.classList.toggle('active', Number(btn.dataset.cantidad) === cantidad);
        });
        document.getElementById('cantidadHuespedes').value = cantidad;
        generarFormulariosHuespedes();
        actualizarHabitacionesPorCapacidad(cantidad);
        setTimeout(() => {
            const checkInInput = document.getElementById('checkInDate');
            const checkOutInput = document.getElementById('checkOutDate');
            const habitacionSelect = document.getElementById('huespedHabitacion');
            if (checkInInput && !checkInInput.dataset.listenersAttached) {
                checkInInput.addEventListener('change', () => {
                    actualizarFechasDisponibles();
                    calcularTotal();
                });
                checkInInput.dataset.listenersAttached = 'true';
            }
            if (checkOutInput && !checkOutInput.dataset.listenersAttached) {
                checkOutInput.addEventListener('change', () => {
                    actualizarFechasDisponibles();
                    calcularTotal();
                });
                checkOutInput.dataset.listenersAttached = 'true';
            }
            if (habitacionSelect && !habitacionSelect.dataset.listenersAttached) {
                habitacionSelect.addEventListener('change', () => {
                    actualizarFechasDisponibles();
                    calcularTotal();
                });
                habitacionSelect.dataset.listenersAttached = 'true';
            }
            actualizarFechasDisponibles();
        }, 50);
    }

    async function actualizarHabitacionesPorCapacidad(cantidad, roomLabel = '') {
        const helpers = await getFirestoreHelpers();
        if (!helpers) return;
        const { db, collection, getDocs } = helpers;
        const selectHabitacion = document.getElementById('huespedHabitacion');
        if (!selectHabitacion) return;

        try {
            const roomsSnap = await getDocs(collection(db, 'habitaciones'));
            let roomsOptions = '<option value="">Selecciona habitación</option>';
            let primeraHabitacionId = '';
            const normalizedLabel = (roomLabel || '').toLowerCase().trim();

            roomsSnap.forEach(r => {
                const data = r.data();
                const capacity = parseInt(data.capacidad, 10);
                if (data.estado === 'Disponible' && capacity === cantidad) {
                    if (!primeraHabitacionId) primeraHabitacionId = r.id;
                    const tipoTexto = (data.tipo || '').toString().toLowerCase();
                    const coincideConLabel = normalizedLabel && (tipoTexto.includes(normalizedLabel.replace(/^habitación\s+/, '')) || normalizedLabel.includes(tipoTexto));
                    if (!normalizedLabel || coincideConLabel) {
                        primeraHabitacionId = r.id;
                    }
                    roomsOptions += `<option value="${r.id}">${data.numero} - ${data.tipo} (Capacidad: ${data.capacidad})</option>`;
                }
            });

            selectHabitacion.innerHTML = roomsOptions;
            if (primeraHabitacionId) {
                selectHabitacion.value = primeraHabitacionId;
                calcularTotal();
                setTimeout(() => actualizarFechasDisponibles(), 80);
            }
        } catch (error) {
            console.error('Error actualizando habitaciones por capacidad:', error);
            selectHabitacion.innerHTML = '<option value="">Error cargando habitaciones</option>';
        }
    }

    function generarFormulariosHuespedes() {
        const cantidad = parseInt(document.getElementById('cantidadHuespedes')?.value || '1', 10);
        const container = document.getElementById('huespedFormContainer');
        if (!container) return;
        let html = '';
        for (let i = 1; i <= cantidad; i++) {
            const colorHeader = ['#2f8b3a', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'][i - 1];
            html += `
                <div class="huesped-card">
                    <div class="huesped-card-header" style="border-bottom-color: ${colorHeader};">
                        <div class="huesped-card-badge" style="background:${colorHeader};">${i}</div>
                        <h4>Huésped ${i}</h4>
                    </div>
                    <div class="huesped-card-grid">
                        <div>
                            <label>👤 Nombre</label>
                            <input class="huesped-nombre" type="text" placeholder="Ej. Juan García" required>
                        </div>
                        <div>
                            <label>📱 Teléfono</label>
                            <input class="huesped-telefono" type="text" placeholder="Ej. +55 123456789" required>
                        </div>
                        <div class="huesped-card-fullwidth">
                            <label>🌍 ¿De dónde nos visita?</label>
                            <input class="huesped-origen" type="text" placeholder="Ej. México, Ciudad de México" required>
                        </div>
                        <div class="huesped-card-fullwidth">
                            <label>📧 Correo (opcional)</label>
                            <input class="huesped-correo" type="email" placeholder="Ej. juan@example.com">
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    function actualizarPorcentajePago() {
        const porcentajePagoContainer = document.getElementById('porcentajePago')?.parentElement;
        if (!porcentajePagoContainer) return;
        porcentajePagoContainer.style.display = 'block';
        calcularTotal();
    }

    function mostrarCampoEfectivo() {
        const tipoPago = document.getElementById('tipoPago')?.value;
        const efectivoContainer = document.getElementById('efectivoContainer');
        const cambioContainer = document.getElementById('cambioContainer');
        if (tipoPago === 'Efectivo') {
            if (efectivoContainer) efectivoContainer.style.display = 'block';
            if (cambioContainer) cambioContainer.style.display = 'block';
        } else {
            if (efectivoContainer) efectivoContainer.style.display = 'none';
            if (cambioContainer) cambioContainer.style.display = 'none';
        }
        calcularCambio();
    }

    async function calcularTotal() {
        const helpers = await getFirestoreHelpers();
        if (!helpers) return;
        const { db, collection, getDoc, doc } = helpers;
        const checkInVal = document.getElementById('checkInDate')?.value;
        const checkOutVal = document.getElementById('checkOutDate')?.value;
        const habitacionId = document.getElementById('huespedHabitacion')?.value;
        const tipoReserva = document.querySelector('input[name="tipoReserva"]:checked')?.value;
        const porcentajePago = parseInt(document.getElementById('porcentajePago')?.value || '100', 10);
        const totalInput = document.getElementById('totalReserva');
        if (!totalInput) return;
        if (!checkInVal || !checkOutVal || !habitacionId) {
            totalInput.value = '';
            return;
        }
        try {
            const checkIn = new Date(checkInVal + 'T12:00:00');
            const checkOut = new Date(checkOutVal + 'T12:00:00');
            const diffTime = checkOut - checkIn;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 0) {
                totalInput.value = 'Fechas inválidas';
                totalInput.style.color = '#c0392b';
                return;
            }
            const roomDoc = await getDoc(doc(db, 'habitaciones', habitacionId));
            if (!roomDoc.exists()) {
                totalInput.value = 'Habitación no encontrada';
                return;
            }
            const precioNoche = parseFloat(roomDoc.data().precioNoche) || 0;
            let totalCalculado = precioNoche * diffDays;
            totalCalculado = (totalCalculado * porcentajePago) / 100;
            totalInput.value = `$${totalCalculado.toFixed(2)} (${diffDays} noche${diffDays > 1 ? 's' : ''}) (${porcentajePago}% anticipo)`;
            totalInput.style.color = '#2f5230';
        } catch (error) {
            console.error('Error calculando total:', error);
            totalInput.value = 'Error en cálculo';
        }
    }

    const COMPROBANTE_CHUNK_SIZE = 700000;

    async function procesarComprobanteParaFirestore(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                const commaIdx = dataUrl.indexOf(',');
                const header = dataUrl.substring(0, commaIdx + 1);
                const base64 = dataUrl.substring(commaIdx + 1);
                if (base64.length <= COMPROBANTE_CHUNK_SIZE) {
                    resolve({ header, chunked: false, inline: base64 });
                } else {
                    const chunks = [];
                    for (let i = 0; i < base64.length; i += COMPROBANTE_CHUNK_SIZE) {
                        chunks.push(base64.substring(i, i + COMPROBANTE_CHUNK_SIZE));
                    }
                    resolve({ header, chunked: true, chunks });
                }
            };
            reader.onerror = () => reject(new Error('Error leyendo el archivo de comprobante'));
            reader.readAsDataURL(file);
        });
    }

    function calcularCambio() {
        const totalInput = document.getElementById('totalReserva');
        const efectivoInput = document.getElementById('efectivoRecibido');
        const cambioInput = document.getElementById('cambio');
        if (!totalInput || !efectivoInput || !cambioInput) return;
        const totalText = totalInput.value;
        const totalMatch = totalText.match(/\$?([\d.]+)/);
        const total = totalMatch ? parseFloat(totalMatch[1]) : 0;
        const efectivo = parseFloat(efectivoInput.value) || 0;
        const cambio = efectivo - total;
        cambioInput.value = cambio >= 0 ? `$${cambio.toFixed(2)}` : '⚠️ Insuficiente';
        cambioInput.style.color = cambio < 0 ? '#c0392b' : '#2e7d32';
    }

    async function guardarReservaWeb() {
        const helpers = await getFirestoreHelpers();
        if (!helpers) return;
        const { db, collection, getDocs, addDoc, doc, getDoc, updateDoc } = helpers;
        const cantidad = parseInt(document.getElementById('cantidadHuespedes')?.value || '1', 10);
        const habitacionId = document.getElementById('huespedHabitacion')?.value;
        const checkInVal = document.getElementById('checkInDate')?.value;
        const checkOutVal = document.getElementById('checkOutDate')?.value;
        const tipoPago = document.getElementById('tipoPago')?.value;
        const tipoReserva = document.querySelector('input[name="tipoReserva"]:checked')?.value;
        const facturar = document.querySelector('input[name="facturar"]:checked')?.value || 'no';
        const porcentajePago = parseInt(document.getElementById('porcentajePago')?.value || '100', 10);
        const comprobanteFile = document.getElementById('comprobantePago')?.files[0];
        const nombres = Array.from(document.querySelectorAll('.huesped-nombre'));
        const telefonos = Array.from(document.querySelectorAll('.huesped-telefono'));
        const origenes = Array.from(document.querySelectorAll('.huesped-origen'));
        const correos = Array.from(document.querySelectorAll('.huesped-correo'));
        if (!habitacionId || !checkInVal || !checkOutVal || !tipoPago) {
            alert('Completa todos los campos de la reserva antes de continuar.');
            return;
        }
        if (!comprobanteFile) {
            alert('Sube el comprobante de pago.');
            return;
        }
        for (let i = 0; i < cantidad; i++) {
            if (!nombres[i]?.value.trim() || !telefonos[i]?.value.trim() || !origenes[i]?.value.trim()) {
                alert(`Completa nombre, teléfono y origen para huésped ${i + 1}`);
                return;
            }
        }
        try {
            const huespedesIds = [];
            for (let i = 0; i < cantidad; i++) {
                const hData = {
                    nombreCompleto: nombres[i].value.trim(),
                    telefono: telefonos[i].value.trim(),
                    origen: origenes[i].value.trim(),
                    correo: correos[i]?.value.trim() || '',
                    creado: new Date()
                };
                const docRef = await addDoc(collection(db, 'huespedes'), hData);
                huespedesIds.push(docRef.id);
            }
            const checkIn = new Date(checkInVal + 'T12:00:00');
            const checkOut = new Date(checkOutVal + 'T12:00:00');
            if (checkOut <= checkIn) {
                alert('La fecha de check-out debe ser posterior a la fecha de check-in.');
                return;
            }
            const roomDoc = await getDoc(doc(db, 'habitaciones', habitacionId));
            if (!roomDoc.exists()) {
                alert('Habitación no encontrada.');
                return;
            }
            const roomData = roomDoc.data();
            const diffTime = checkOut - checkIn;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const precioNoche = parseFloat(roomData.precioNoche) || 0;
            let totalReserva = precioNoche * diffDays;
            totalReserva = (totalReserva * porcentajePago) / 100;
            const comprobanteData = await procesarComprobanteParaFirestore(comprobanteFile);
            const reservaData = {
                guestId: huespedesIds[0],
                guestName: nombres[0].value.trim(),
                roomId: habitacionId,
                roomNumber: roomData.numero,
                tipoHab: roomData.tipo,
                checkIn: checkIn,
                checkOut: checkOut,
                status: 'Confirmada',
                paymentMethod: tipoPago,
                tipoReserva: tipoReserva,
                facturar: facturar,
                porcentajePago: porcentajePago,
                noches: diffDays,
                precioNoche: precioNoche,
                totalOriginal: precioNoche * diffDays,
                total: totalReserva,
                paymentProofName: comprobanteFile.name,
                paymentProofHeader: comprobanteData.header,
                paymentProofInline: comprobanteData.chunked ? '' : comprobanteData.inline,
                paymentProofChunked: comprobanteData.chunked,
                bankClabe: facturar === 'si' ? 'XXXXXXXX' : '012796015605553236',
                bankName: facturar === 'si' ? 'XXXXXX' : 'BBVA',
                efectivoRecibido: null,
                cambio: null,
                additionalGuests: huespedesIds.slice(1),
                creado: new Date()
            };
            const reservaRef = await addDoc(collection(db, 'reservas'), reservaData);
            if (comprobanteData.chunked) {
                await Promise.all(comprobanteData.chunks.map((chunk, idx) =>
                    setDoc(doc(db, 'reservas', reservaRef.id, 'comprobanteChunks', `chunk${idx + 1}`), { data: chunk })
                ));
            }
            await updateDoc(doc(db, 'habitaciones', habitacionId), { estado: 'Ocupada', actualizado: new Date() });
            await generarTicketReservaPDF(reservaRef.id, reservaData, roomData, nombres[0].value.trim(), telefonos[0].value.trim());
            alert(`Reserva creada correctamente!\nHabitación: ${roomData.numero}\nCheck-in: ${checkInVal}\nCheck-out: ${checkOutVal}\nTotal: $${totalReserva.toFixed(2)}`);
            cerrarModalReserva();
        } catch (error) {
            console.error('Error guardando reserva web:', error);
            alert('Ocurrió un error al crear la reserva. Revisa la consola.');
        }
    }

    async function generarTicketReservaPDF(reservaId, reservaData, roomData, nombrePrincipal, telefonoPrincipal) {
        try {
            const helpers = await getFirestoreHelpers();
            if (!helpers) return;
            const { jsPDF } = window.jspdf;
            const { db, collection, addDoc } = helpers;
            const pageWidth = 80;
            const pageHeight = 160;
            const docPdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageWidth, pageHeight] });
            const checkInDate = new Date(reservaData.checkIn).toLocaleDateString('es-MX');
            const checkOutDate = new Date(reservaData.checkOut).toLocaleDateString('es-MX');
            docPdf.setFillColor(47, 139, 58);
            docPdf.rect(0, 0, pageWidth, 20, 'F');
            docPdf.setTextColor(255, 255, 255);
            docPdf.setFontSize(16);
            docPdf.setFont(undefined, 'bold');
            docPdf.text('Hotel Casa', pageWidth/2, 7, { align: 'center' });
            docPdf.text('Usumacinta', pageWidth/2, 13, { align: 'center' });
            let yPos = 25;
            docPdf.setTextColor(0,0,0);
            docPdf.setFontSize(8);
            docPdf.setFont(undefined, 'bold');
            docPdf.text(`TICKET #${reservaId.substring(0,8).toUpperCase()}`, pageWidth/2, yPos, { align: 'center' });
            yPos += 6;
            docPdf.setDrawColor(200,200,200);
            docPdf.line(5, yPos, pageWidth-5, yPos);
            yPos += 4;
            docPdf.setFont(undefined, 'bold');
            docPdf.text('HUÉSPED:', 5, yPos);
            docPdf.setFont(undefined, 'normal');
            yPos += 4;
            docPdf.text(nombrePrincipal.substring(0, 30), 5, yPos);
            yPos += 4;
            docPdf.text(`Telf: ${telefonoPrincipal}`, 5, yPos);
            yPos += 5;
            docPdf.setFont(undefined, 'bold');
            docPdf.text('HABITACIÓN:', 5, yPos);
            docPdf.setFont(undefined, 'normal');
            yPos += 4;
            docPdf.text(`No. ${roomData.numero}`, 5, yPos);
            yPos += 4;
            docPdf.text(`Tipo: ${roomData.tipo}`, 5, yPos);
            yPos += 4;
            docPdf.text(`Capacidad: ${roomData.capacidad}`, 5, yPos);
            yPos += 5;
            docPdf.setFont(undefined, 'bold');
            docPdf.text('RESERVA:', 5, yPos);
            docPdf.setFont(undefined, 'normal');
            yPos += 4;
            docPdf.text(`Check-in: ${checkInDate}`, 5, yPos);
            yPos += 4;
            docPdf.text(`Check-out: ${checkOutDate}`, 5, yPos);
            yPos += 4;
            docPdf.text(`Noches: ${reservaData.noches}`, 5, yPos);
            yPos += 4;
            docPdf.text(`Precio/Noche: $${parseFloat(reservaData.precioNoche).toFixed(2)}`, 5, yPos);
            yPos += 4;
            docPdf.text(`Total original: $${parseFloat(reservaData.totalOriginal).toFixed(2)}`, 5, yPos);
            yPos += 4;
            docPdf.text(`Anticipo (${reservaData.porcentajePago}%): $${parseFloat(reservaData.total).toFixed(2)}`, 5, yPos);
            yPos += 4;
            const pendiente = Math.max(0, parseFloat(reservaData.totalOriginal) - parseFloat(reservaData.total));
            docPdf.text(`Pendiente: $${pendiente.toFixed(2)}`, 5, yPos);
            yPos += 5;
            docPdf.setFont(undefined, 'bold');
            docPdf.text(`PAGADO: $${parseFloat(reservaData.total).toFixed(2)}`, pageWidth/2, yPos, { align: 'center' });
            yPos += 6;
            docPdf.setFont(undefined, 'normal');
            docPdf.setFontSize(7);
            docPdf.text(`Tipo reserva: ${reservaData.tipoReserva}`, pageWidth/2, yPos, { align: 'center' });
            yPos += 4;
            docPdf.text(`Medio: ${reservaData.paymentMethod}`, pageWidth/2, yPos, { align: 'center' });
            yPos += 5;
            docPdf.text(`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`, pageWidth/2, yPos, { align: 'center' });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            docPdf.save(`ticket-reserva-${reservaId.substring(0,8)}-${timestamp}.pdf`);
            await addDoc(collection(db, 'tickets'), {
                reservaId: reservaId,
                nombreHuesped: nombrePrincipal,
                telefonoHuesped: telefonoPrincipal,
                numeroHabitacion: roomData.numero,
                tipoHabitacion: roomData.tipo,
                capacidadHabitacion: roomData.capacidad,
                checkIn: reservaData.checkIn,
                checkOut: reservaData.checkOut,
                noches: reservaData.noches,
                precioNoche: reservaData.precioNoche,
                total: reservaData.total,
                tipoPago: reservaData.paymentMethod,
                tipoReserva: reservaData.tipoReserva,
                creado: new Date()
            });
        } catch (error) {
            console.error('Error generando ticket de reserva:', error);
        }
    }

    function attachReservaButtons() {
        const buttons = document.querySelectorAll('.reservar-btn');
        buttons.forEach(btn => {
            btn.removeEventListener('click', handleReservarBtnClick);
            btn.addEventListener('click', handleReservarBtnClick);
        });
    }

    function handleReservarBtnClick(event) {
        const button = event.currentTarget;
        const capacidad = parseInt(button.dataset.roomCapacity || '1', 10);
        const roomLabel = button.dataset.roomLabel || '';
        abrirModalReserva(capacidad, roomLabel);
    }

    function initializeReservaFeature() {
        ensureReservaModal();
        attachReservaButtons();
        window.abrirModalReserva = abrirModalReserva;
        window.cerrarModalReserva = cerrarModalReserva;
        window.seleccionarCantidad = seleccionarCantidad;
        window.actualizarPorcentajePago = actualizarPorcentajePago;
        window.mostrarCampoEfectivo = mostrarCampoEfectivo;
        window.calcularTotal = calcularTotal;
        window.calcularCambio = calcularCambio;
        window.guardarReservaWeb = guardarReservaWeb;
    }

    initializeReservaFeature();
})();
