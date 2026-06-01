import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const navItems = document.querySelectorAll('.nav-item[data-section]');
const contentSections = document.querySelectorAll('.content-section');

// Event Listeners
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    const section = e.target.dataset.section;
    cambiarSeccion(section);
  });
});

// Verificar autenticación
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    cargarDatosDashboard();
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
  }
});

// Cambiar entre secciones (SPA)
function cambiarSeccion(section) {
  // Remover clase active de todos
  navItems.forEach(item => item.classList.remove('active'));
  contentSections.forEach(content => content.classList.remove('active'));
  
  // Agregar clase active a los seleccionados
  document.querySelector(`[data-section="${section}"]`).classList.add('active');
  document.getElementById(section).classList.add('active');

  // Cargar contenido según la sección
  if (section === 'usuarios') {
    cargarUsuarios();
  } else if (section === 'habitaciones') {
    cargarHabitaciones();
  } else if (section === 'reservas') {
    cargarReservas();
  }
}

// Cargar datos del dashboard
async function cargarDatosDashboard() {
  try {
    const user = auth.currentUser;

    // Obtener información del usuario actual
    const userEmail = user.email;
    document.getElementById('usuarioInfo').textContent = `Sesión: ${userEmail}`;

    // Cargar estadísticas
    await cargarEstadisticas();

    // Cargar actividad reciente
    await cargarActividadReciente();

  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    // Total de usuarios
    const usuariosSnap = await getDocs(collection(db, 'usuarios'));
    document.getElementById('totalUsuarios').textContent = usuariosSnap.size;

    // Habitaciones disponibles (simulado)
    document.getElementById('habitacionesDisponibles').textContent = '42';

    // Reservas activas (simulado)
    document.getElementById('reservasActivas').textContent = '18';

    // Ingresos hoy (simulado)
    document.getElementById('ingresosHoy').textContent = '$4,500.00';

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

// Cargar actividad reciente
async function cargarActividadReciente() {
  try {
    const actividadDiv = document.getElementById('actividadReciente');
    
    // Obtener logins recientes
    const loginsSnap = await getDocs(
      query(
        collection(db, 'loginicios'),
        orderBy('fechaHora', 'desc'),
        limit(5)
      )
    );

    if (loginsSnap.empty) {
      actividadDiv.innerHTML = '<div class="empty-message">No hay actividad registrada</div>';
      return;
    }

    let html = '';
    loginsSnap.forEach(doc => {
      const data = doc.data();
      const fecha = new Date(data.fechaHora.toDate());
      html += `
        <div class="activity-item">
          <div class="activity-time">${fecha.toLocaleString('es-MX')}</div>
          <div class="activity-description">🔐 Inicio de sesión registrado</div>
        </div>
      `;
    });

    actividadDiv.innerHTML = html;

  } catch (error) {
    console.error('Error cargando actividad:', error);
  }
}

// Actualizar reloj
function actualizarReloj() {
  const ahora = new Date();
  const horaFormato = ahora.toLocaleTimeString('es-MX');
  const horaDiv = document.getElementById('horaActual');
  if (horaDiv) {
    horaDiv.textContent = horaFormato;
  }
}

// Cargar usuarios
async function cargarUsuarios() {
  try {
    const usuariosSnap = await getDocs(collection(db, 'usuarios'));
    const tablaDiv = document.getElementById('tablaUsuarios');

    if (usuariosSnap.empty) {
      tablaDiv.innerHTML = '<p>No hay usuarios registrados</p>';
      return;
    }

    let html = '<table class="users-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>';

    usuariosSnap.forEach(doc => {
      const usuario = doc.data();
      html += `
        <tr>
          <td>${usuario.usuario}</td>
          <td>${usuario.nombreCompleto}</td>
          <td>${usuario.correo}</td>
          <td>${usuario.telefono}</td>
          <td>
            <button class="btn-action btn-view" onclick="verDetallesUsuario('${usuario.usuario}')">Ver</button>
            <button class="btn-action btn-edit">Editar</button>
            <button class="btn-action btn-delete">Eliminar</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    tablaDiv.innerHTML = html;

  } catch (error) {
    console.error('Error:', error);
  }
}

// Cargar habitaciones
async function cargarHabitaciones() {
  try {
    const habitacionesDiv = document.getElementById('tablaHabitaciones');
    
    // Simulación de habitaciones
    let html = `
      <table class="users-table">
        <thead>
          <tr><th>Número</th><th>Tipo</th><th>Capacidad</th><th>Precio/Noche</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>101</td><td>Simple</td><td>1</td><td>$80</td>
            <td><span style="color: green;">✓ Disponible</span></td>
            <td><button class="btn-action btn-edit">Editar</button></td>
          </tr>
          <tr>
            <td>102</td><td>Doble</td><td>2</td><td>$120</td>
            <td><span style="color: red;">✗ Ocupada</span></td>
            <td><button class="btn-action btn-edit">Editar</button></td>
          </tr>
          <tr>
            <td>103</td><td>Suite</td><td>4</td><td>$200</td>
            <td><span style="color: green;">✓ Disponible</span></td>
            <td><button class="btn-action btn-edit">Editar</button></td>
          </tr>
        </tbody>
      </table>
    `;
    habitacionesDiv.innerHTML = html;

  } catch (error) {
    console.error('Error:', error);
  }
}

// Cargar reservas
async function cargarReservas() {
  try {
    const reservasDiv = document.getElementById('tablaReservas');
    
    // Simulación de reservas
    let html = `
      <table class="users-table">
        <thead>
          <tr><th>ID Reserva</th><th>Huésped</th><th>Habitación</th><th>Check-in</th><th>Check-out</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>RES001</td><td>Juan García</td><td>101</td><td>2026-06-01</td><td>2026-06-05</td>
            <td><span style="color: green;">Confirmada</span></td>
          </tr>
          <tr>
            <td>RES002</td><td>María López</td><td>102</td><td>2026-05-31</td><td>2026-06-02</td>
            <td><span style="color: green;">Activa</span></td>
          </tr>
          <tr>
            <td>RES003</td><td>Pedro Martínez</td><td>103</td><td>2026-06-05</td><td>2026-06-10</td>
            <td><span style="color: blue;">Pendiente</span></td>
          </tr>
        </tbody>
      </table>
    `;
    reservasDiv.innerHTML = html;

  } catch (error) {
    console.error('Error:', error);
  }
}

// Funciones auxiliares
function mostrarFormularioHabitacion() {
  alert('Formulario para agregar habitación (Por implementar)');
}

function mostrarFormularioReserva() {
  alert('Formulario para agregar reserva (Por implementar)');
}

function generarReporte(tipo) {
  alert(`Generando reporte de ${tipo}...`);
}

function exportarDatos() {
  alert('Exportando datos...');
}

function limpiarCache() {
  localStorage.clear();
  alert('Caché limpiado');
}

function irASeccion(section) {
  document.querySelector(`[data-section="${section}"]`).click();
}

function cerrarModal() {
  document.getElementById('modal').classList.remove('active');
}

function cargarReportes() {
  irASeccion('reportes');
}

async function verDetallesUsuario(usuario) {
  try {
    const usuariosSnap = await getDocs(
      query(collection(db, 'usuarios'), where('usuario', '==', usuario))
    );

    if (!usuariosSnap.empty) {
      const userData = usuariosSnap.docs[0].data();
      const fecha = new Date(userData.fechaCreacion.toDate());
      
      alert(`
👤 DETALLES DEL USUARIO
======================
Usuario: ${userData.usuario}
Nombre: ${userData.nombreCompleto}
Correo: ${userData.correo}
Teléfono: ${userData.telefono}
Dirección: ${userData.direccion}
Fecha Nacimiento: ${userData.fechaNacimiento}
Creado: ${fecha.toLocaleString('es-MX')}
      `);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Exportar funciones globales
window.cambiarSeccion = cambiarSeccion;
window.cerrarSesion = cerrarSesion;
window.mostrarFormularioHabitacion = mostrarFormularioHabitacion;
window.mostrarFormularioReserva = mostrarFormularioReserva;
window.generarReporte = generarReporte;
window.exportarDatos = exportarDatos;
window.limpiarCache = limpiarCache;
window.irASeccion = irASeccion;
window.cerrarModal = cerrarModal;
window.cargarReportes = cargarReportes;
window.verDetallesUsuario = verDetallesUsuario;

function cerrarSesion() {
  if (confirm('¿Deseas cerrar sesión?')) {
    signOut(auth).then(() => {
      window.location.href = 'index.html';
    }).catch(error => {
      console.error('Error al cerrar sesión:', error);
    });
  }
}
