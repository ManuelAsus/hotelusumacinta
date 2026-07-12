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
})();
