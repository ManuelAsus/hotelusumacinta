import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where, orderBy, limit, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const navItems = document.querySelectorAll('.nav-item[data-section]');
const contentSections = document.querySelectorAll('.content-section');
let habitacionEditando = null;

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
  } else if (section === 'huespedes') {
    cargarHuespedes();
  } else if (section === 'habitaciones') {
    // Reset del filtro
    const buscarInput = document.getElementById('buscarHabitacion');
    const filtroEstado = document.getElementById('filtroEstado');
    if (buscarInput) buscarInput.value = '';
    if (filtroEstado) filtroEstado.value = '';
    cargarHabitaciones('', '');
  } else if (section === 'ventas') {
    cargarVentas();
  } else if (section === 'reservas') {
    cargarReservas();
  } else if (section === 'tickets') {
    cargarTickets();
  } else if (section === 'caja') {
    cargarCaja();
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

    // Habitaciones y disponibilidad reales
    const habitacionesSnap = await getDocs(collection(db, 'habitaciones'));
    const habitacionesDisponibles = habitacionesSnap.docs.filter(doc => doc.data().estado === 'Disponible').length;
    document.getElementById('habitacionesDisponibles').textContent = habitacionesDisponibles;

    // Reservas activas reales si existen
    const reservasSnap = await getDocs(collection(db, 'reservas'));
    document.getElementById('reservasActivas').textContent = reservasSnap.size;

    // Ingresos hoy basado en habitaciones ocupadas
    const ingresosHoy = habitacionesSnap.docs.reduce((total, doc) => {
      const data = doc.data();
      const precio = parseFloat(data.precioNoche) || 0;
      return total + (data.estado === 'Ocupada' ? precio : 0);
    }, 0);
    document.getElementById('ingresosHoy').textContent = `$${ingresosHoy.toFixed(2)}`;

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

// Cargar huéspedes
let huespedesCache = [];

async function cargarHuespedes() {
  try {
    const huespedesSnap = await getDocs(collection(db, 'huespedes'));
    
    // Guardar en cache para búsqueda
    huespedesCache = [];
    huespedesSnap.forEach(doc => {
      huespedesCache.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Mostrar todos los huéspedes
    mostrarHuespedesEnTabla(huespedesCache);
  } catch (error) {
    console.error('Error cargando huéspedes:', error);
  }
}

function mostrarHuespedesEnTabla(huespedes) {
  const tablaDiv = document.getElementById('tablaHuespedes');

  if (huespedes.length === 0) {
    tablaDiv.innerHTML = '<p>No hay huéspedes registrados</p>';
    return;
  }

  let html = '<table class="users-table"><thead><tr><th>Nombre</th><th>Origen</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>';

  huespedes.forEach(h => {
    html += `
      <tr>
        <td>${h.nombreCompleto || '—'}</td>
        <td>${h.origen || '—'}</td>
        <td>${h.correo || '—'}</td>
        <td>${h.telefono || '—'}</td>
        <td>
          <button class="btn-action btn-view" onclick="verDetallesHuesped('${h.id}')">Ver</button>
          <button class="btn-action btn-edit" onclick="editarHuesped('${h.id}')">Editar</button>
          <button class="btn-action btn-delete" onclick="eliminarHuesped('${h.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  tablaDiv.innerHTML = html;
}

function filtrarHuespedes(termino) {
  const terminoLower = termino.toLowerCase().trim();
  
  if (terminoLower === '') {
    // Si el campo está vacío, mostrar todos
    mostrarHuespedesEnTabla(huespedesCache);
    return;
  }
  
  // Filtrar por nombre o teléfono
  const huespedesFiltrados = huespedesCache.filter(h => {
    const nombre = (h.nombreCompleto || '').toLowerCase();
    const telefono = (h.telefono || '').toLowerCase();
    
    return nombre.includes(terminoLower) || telefono.includes(terminoLower);
  });
  
  mostrarHuespedesEnTabla(huespedesFiltrados);
}

async function mostrarFormularioHuesped(huesped = null) {
  const modalContent = document.getElementById('modalContent');
  const nombre = huesped ? huesped.nombreCompleto : '';
  const correo = huesped ? huesped.correo : '';
  const telefono = huesped ? huesped.telefono : '';
  const origen = huesped ? huesped.origen : '';
  
  // Cargar habitaciones disponibles
  const roomsSnap = await getDocs(query(collection(db, 'habitaciones'), where('estado', '==', 'Disponible')));
  let roomsOptions = '<option value="">Sin asignar habitación</option>';
  roomsSnap.forEach(r => {
    const data = r.data();
    roomsOptions += `<option value="${r.id}">${data.numero} - ${data.tipo}</option>`;
  });

  if (huesped) {
    // Modo edición: formulario simple
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2>✏️ Editar Huésped</h2>
        <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-body">
        <form id="huespedForm" class="modal-form">
          <div>
            <label>👤 Nombre completo</label>
            <input id="huespedNombre" type="text" value="${nombre}" required>
          </div>
          <div>
            <label>📱 Teléfono</label>
            <input id="huespedTelefono" type="text" value="${telefono}" required>
          </div>
          <div style="grid-column: 1 / -1;">
            <label>🌍 ¿De dónde nos visita?</label>
            <input id="huespedOrigen" type="text" value="${origen}" placeholder="Ciudad, País" required>
          </div>
          <div style="grid-column: 1 / -1;">
            <label>📧 Correo (opcional)</label>
            <input id="huespedCorreo" type="email" value="${correo}">
          </div>
        </form>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
        <button class="btn-primary" onclick="guardarHuesped('${huesped.id}')">Guardar</button>
      </div>
    `;
  } else {
    // Modo creación: múltiples huéspedes
    let cantidadBotones = [1,2,3,4,5,6].map(n => `<button type="button" class="cantidad-btn" data-cantidad="${n}" onclick="seleccionarCantidad(${n})" style="padding: 10px 16px; border: 2px solid #d0d0d0; border-radius: 8px; background: white; cursor: pointer; font-weight: 600; color: #2c3e50; transition: all 0.3s; min-width: 50px; font-size: 14px;">${n}</button>`).join('');
    
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2>🧳 Agregar Huéspedes</h2>
        <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-body">
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f4ff 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #2f8b3a;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
            <div style="flex: 1;">
              <label style="font-weight: 700; color: #2f5230; display: block; margin-bottom: 12px; font-size: 15px;">👥 ¿Cuántos huéspedes deseas agregar?</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${cantidadBotones}
              </div>
              <input id="cantidadHuespedes" type="hidden" value="1">
            </div>
            <div style="flex: 1;">
              <label style="font-weight: 700; color: #2f5230; display: block; margin-bottom: 12px; font-size: 15px;">⏰ Tipo de Reserva</label>
              <div style="display: flex; gap: 8px; flex-direction: column;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px; border: 2px solid #d0d0d0; border-radius: 8px; background: white; font-weight: 600; color: #2c3e50; transition: all 0.3s;">
                  <input type="radio" id="reservaInmediata" name="tipoReserva" value="Inmediata" checked onchange="actualizarPorcentajePago()">
                  <span>✅ Inmediata</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px; border: 2px solid #d0d0d0; border-radius: 8px; background: white; font-weight: 600; color: #2c3e50; transition: all 0.3s;">
                  <input type="radio" id="reservaEspera" name="tipoReserva" value="Con Tiempo de Espera" onchange="actualizarPorcentajePago()">
                  <span>⏳ Con Tiempo de Espera</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div id="huespedFormContainer"></div>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 12px; margin-top: 20px;">
          <label style="font-weight: 700; color: #2f5230; display: block; margin-bottom: 8px; font-size: 14px;">🛏️ Habitación (opcional)</label>
          <select id="huespedHabitacion" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e0e6e9; font-size: 14px; background: white;">
            <option value="">Sin asignar habitación</option>
          </select>
        </div>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 12px; margin-top: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
            <div>
              <label style="font-weight: 700; color: #2f5230; display: block; margin-bottom: 8px; font-size: 14px;">📅 Check-in</label>
              <input id="checkInDate" type="date" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e0e6e9; font-size: 14px; background: white;">
            </div>
            <div>
              <label style="font-weight: 700; color: #2f5230; display: block; margin-bottom: 8px; font-size: 14px;">📅 Check-out</label>
              <input id="checkOutDate" type="date" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e0e6e9; font-size: 14px; background: white;">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
            <div>
              <label style="font-weight: 700; color: #2f5230; display: block; margin-bottom: 8px; font-size: 14px;">💳 Tipo de Pago</label>
              <select id="tipoPago" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e0e6e9; font-size: 14px; background: white;" onchange="mostrarCampoEfectivo()">
                <option value="">Selecciona tipo de pago</option>
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Tarjeta">💳 Tarjeta</option>
                <option value="Transferencia">🏦 Transferencia</option>
              </select>
            </div>
            <div id="porcentajePagoContainer" style="display: none;">
              <label style="font-weight: 700; color: #2f5230; display: block; margin-bottom: 8px; font-size: 14px;">📊 % Pago Inicial</label>
              <select id="porcentajePago" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e0e6e9; font-size: 14px; background: white;" onchange="calcularTotal()">
                <option value="100">100% (Pago Completo)</option>
                <option value="50">50% (Anticipo)</option>
              </select>
            </div>
          </div>
          <div id="efectivoContainer" style="display: none; background: #fff8e1; padding: 16px; border-radius: 8px; margin-bottom: 14px; border-left: 4px solid #fbc02d;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <label style="font-weight: 700; color: #f57f17; display: block; margin-bottom: 8px; font-size: 14px;">💵 Efectivo Recibido</label>
                <input id="efectivoRecibido" type="number" step="0.01" placeholder="Monto recibido" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #fbc02d; font-size: 14px; background: white;" onchange="calcularCambio()" onkeyup="calcularCambio()">
              </div>
              <div>
                <label style="font-weight: 700; color: #2e7d32; display: block; margin-bottom: 8px; font-size: 14px;">💸 Cambio</label>
                <input id="cambio" type="text" readonly style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #2e7d32; font-size: 14px; background: #e8f5e9; color: #2e7d32; font-weight: 700;">
              </div>
            </div>
          </div>
          <div>
            <label style="font-weight: 700; color: #2f5230; display: block; margin-bottom: 8px; font-size: 14px;">💰 Total</label>
            <input id="totalReserva" type="text" readonly style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #27ae60; font-size: 14px; background: #e8f5e9; color: #2f5230; font-weight: 700;">
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
        <button class="btn-primary" onclick="guardarMultiplesHuespedes()">Guardar Huéspedes</button>
      </div>
    `;
    
    document.getElementById('modal').classList.add('active');
    seleccionarCantidad(1);
    return;
  }
  
  document.getElementById('modal').classList.add('active');
}

function seleccionarCantidad(cantidad) {
  // Actualizar botones activos
  document.querySelectorAll('.cantidad-btn').forEach(btn => {
    btn.style.borderColor = btn.dataset.cantidad == cantidad ? '#2f8b3a' : '#d0d0d0';
    btn.style.background = btn.dataset.cantidad == cantidad ? '#2f8b3a' : 'white';
    btn.style.color = btn.dataset.cantidad == cantidad ? 'white' : '#2c3e50';
  });
  
  document.getElementById('cantidadHuespedes').value = cantidad;
  generarFormulariosHuespedes();
  actualizarHabitacionesPorCapacidad(cantidad);
  
  // Agregar event listeners para cálculo de total
  setTimeout(() => {
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    const habitacionSelect = document.getElementById('huespedHabitacion');
    
    if (checkInInput) checkInInput.addEventListener('change', calcularTotal);
    if (checkOutInput) checkOutInput.addEventListener('change', calcularTotal);
    if (habitacionSelect) habitacionSelect.addEventListener('change', calcularTotal);
  }, 100);
}

async function calcularTotal() {
  const checkInVal = document.getElementById('checkInDate').value;
  const checkOutVal = document.getElementById('checkOutDate').value;
  const habitacionId = document.getElementById('huespedHabitacion').value;
  const tipoReserva = document.querySelector('input[name="tipoReserva"]:checked').value;
  const porcentajePago = document.getElementById('porcentajePago') ? parseInt(document.getElementById('porcentajePago').value, 10) : 100;
  const totalInput = document.getElementById('totalReserva');
  
  if (!totalInput) return;
  
  // Si no hay datos completos, mostrar vacío
  if (!checkInVal || !checkOutVal || !habitacionId) {
    totalInput.value = '';
    return;
  }
  
  try {
    const checkIn = new Date(checkInVal + 'T12:00:00');
    const checkOut = new Date(checkOutVal + 'T12:00:00');
    
    // Calcular diferencia en días
    const diffTime = checkOut - checkIn;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      totalInput.value = 'Fechas inválidas';
      totalInput.style.color = '#c0392b';
      return;
    }
    
    // Obtener precio de la habitación
    const roomDoc = await getDoc(doc(db, 'habitaciones', habitacionId));
    if (!roomDoc.exists()) {
      totalInput.value = 'Habitación no encontrada';
      return;
    }
    
    const precioNoche = parseFloat(roomDoc.data().precioNoche) || 0;
    let totalCalculado = precioNoche * diffDays;
    
    // Aplicar porcentaje si es con tiempo de espera
    if (tipoReserva === 'Con Tiempo de Espera') {
      totalCalculado = (totalCalculado * porcentajePago) / 100;
    }
    
    const porcentajeTexto = tipoReserva === 'Con Tiempo de Espera' ? ` (${porcentajePago}%)` : '';
    totalInput.value = `$${totalCalculado.toFixed(2)} (${diffDays} noche${diffDays > 1 ? 's' : ''})${porcentajeTexto}`;
    totalInput.style.color = '#2f5230';
  } catch (error) {
    console.error('Error calculando total:', error);
    totalInput.value = 'Error en cálculo';
  }
}

function actualizarPorcentajePago() {
  const tipoReserva = document.querySelector('input[name="tipoReserva"]:checked').value;
  const porcentajePagoContainer = document.getElementById('porcentajePagoContainer');
  
  if (tipoReserva === 'Con Tiempo de Espera') {
    porcentajePagoContainer.style.display = 'block';
  } else {
    porcentajePagoContainer.style.display = 'none';
    const porcentajePago = document.getElementById('porcentajePago');
    if (porcentajePago) porcentajePago.value = '100';
  }
  
  calcularTotal();
}

function mostrarCampoEfectivo() {
  const tipoPago = document.getElementById('tipoPago')?.value;
  const efectivoContainer = document.getElementById('efectivoContainer');
  
  if (tipoPago === 'Efectivo') {
    efectivoContainer.style.display = 'block';
  } else {
    efectivoContainer.style.display = 'none';
    const efectivoRecibido = document.getElementById('efectivoRecibido');
    const cambio = document.getElementById('cambio');
    if (efectivoRecibido) efectivoRecibido.value = '';
    if (cambio) cambio.value = '';
  }
  calcularCambio();
}

function calcularCambio() {
  const totalInput = document.getElementById('totalReserva');
  const efectivoInput = document.getElementById('efectivoRecibido');
  const cambioInput = document.getElementById('cambio');
  
  if (!totalInput || !efectivoInput || !cambioInput) return;
  
  const totalText = totalInput.value;
  const efectivo = parseFloat(efectivoInput.value) || 0;
  
  // Extraer solo el número del total (ej: "$100.00 (2 noches) - 100%" → 100)
  const totalMatch = totalText.match(/\$?([\d.]+)/);
  const total = totalMatch ? parseFloat(totalMatch[1]) : 0;
  
  const cambio = efectivo - total;
  cambioInput.value = cambio >= 0 ? `$${cambio.toFixed(2)}` : '⚠️ Insuficiente';
  
  if (cambio < 0) {
    cambioInput.style.color = '#c0392b';
  } else {
    cambioInput.style.color = '#2e7d32';
  }
}

async function actualizarHabitacionesPorCapacidad(cantidad) {
  const selectHabitacion = document.getElementById('huespedHabitacion');
  if (!selectHabitacion) return;

  try {
    const roomsSnap = await getDocs(collection(db, 'habitaciones'));
    let roomsOptions = '<option value="">Sin asignar habitación</option>';
    
    roomsSnap.forEach(r => {
      const data = r.data();
      // Solo mostrar habitaciones disponibles con capacidad exactamente igual a la cantidad de huéspedes
      if (data.estado === 'Disponible' && parseInt(data.capacidad, 10) === cantidad) {
        roomsOptions += `<option value="${r.id}">${data.numero} - ${data.tipo} (Capacidad: ${data.capacidad})</option>`;
      }
    });
    
    selectHabitacion.innerHTML = roomsOptions;
  } catch (error) {
    console.error('Error actualizando habitaciones por capacidad:', error);
  }
}

function generarFormulariosHuespedes() {
  const cantidad = parseInt(document.getElementById('cantidadHuespedes')?.value || 1, 10) || 1;
  const container = document.getElementById('huespedFormContainer');
  let html = '';
  
  for (let i = 1; i <= cantidad; i++) {
    const colorHeader = ['#2f8b3a', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'][i - 1];
    html += `
      <div style="background: white; border: 2px solid #e0e6e9; padding: 18px; border-radius: 12px; margin-bottom: 16px; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid ${colorHeader};">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${colorHeader}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;">${i}</div>
          <h4 style="margin: 0; color: #2f5230; font-size: 16px; font-weight: 700;">Huésped ${i}</h4>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div>
            <label style="display: block; font-weight: 600; color: #2c3e50; margin-bottom: 6px; font-size: 13px;">👤 Nombre</label>
            <input class="huesped-nombre" type="text" placeholder="Ej. Juan García" required style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #e0e6e9; font-size: 14px;">
          </div>
          <div>
            <label style="display: block; font-weight: 600; color: #2c3e50; margin-bottom: 6px; font-size: 13px;">📱 Teléfono</label>
            <input class="huesped-telefono" type="text" placeholder="Ej. +55 123456789" required style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #e0e6e9; font-size: 14px;">
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 600; color: #2c3e50; margin-bottom: 6px; font-size: 13px;">🌍 ¿De dónde nos visita?</label>
            <input class="huesped-origen" type="text" placeholder="Ej. México, Ciudad de México" required style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #e0e6e9; font-size: 14px;">
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 600; color: #2c3e50; margin-bottom: 6px; font-size: 13px;">📧 Correo (opcional)</label>
            <input class="huesped-correo" type="email" placeholder="Ej. juan@example.com" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #e0e6e9; font-size: 14px;">
          </div>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

async function guardarMultiplesHuespedes() {
  const cantidad = parseInt(document.getElementById('cantidadHuespedes').value, 10) || 1;
  const habitacionId = document.getElementById('huespedHabitacion').value;
  const checkInVal = document.getElementById('checkInDate').value;
  const checkOutVal = document.getElementById('checkOutDate').value;
  const tipoPago = document.getElementById('tipoPago').value;
  const tipoReserva = document.querySelector('input[name="tipoReserva"]:checked').value;
  const porcentajePago = document.getElementById('porcentajePago') ? parseInt(document.getElementById('porcentajePago').value, 10) : 100;
  const nombres = document.querySelectorAll('.huesped-nombre');
  const telefonos = document.querySelectorAll('.huesped-telefono');
  const origenes = document.querySelectorAll('.huesped-origen');
  const correos = document.querySelectorAll('.huesped-correo');
  
  // Capturar datos de efectivo si aplica
  const efectivoRecibido = tipoPago === 'Efectivo' ? parseFloat(document.getElementById('efectivoRecibido')?.value || 0) : null;
  
  // Validar que todos los campos requeridos estén completo
  for (let i = 0; i < cantidad; i++) {
    if (!nombres[i].value.trim() || !telefonos[i].value.trim() || !origenes[i].value.trim()) {
      alert(`Completa nombre, teléfono y origen para huésped ${i + 1}`);
      return;
    }
  }
  
  // Validar si hay habitación, que estén completos check-in, check-out y tipo de pago
  if (habitacionId) {
    if (!checkInVal || !checkOutVal || !tipoPago) {
      alert('Completa Check-in, Check-out y Tipo de Pago para crear reserva');
      return;
    }
    
    // Si es efectivo, validar que esté completo el efectivo recibido
    if (tipoPago === 'Efectivo' && !efectivoRecibido) {
      alert('Ingresa el efectivo recibido');
      return;
    }
  }
  
  try {
    const huespedesIds = [];
    
    // Guardar cada huésped
    for (let i = 0; i < cantidad; i++) {
      const hData = {
        nombreCompleto: nombres[i].value.trim(),
        telefono: telefonos[i].value.trim(),
        origen: origenes[i].value.trim(),
        correo: correos[i].value.trim() || '',
        creado: new Date()
      };
      const docRef = await addDoc(collection(db, 'huespedes'), hData);
      huespedesIds.push(docRef.id);
    }
    
    // Si se seleccionó habitación, crear reserva automática
    if (habitacionId) {
      const checkIn = new Date(checkInVal + 'T12:00:00');
      const checkOut = new Date(checkOutVal + 'T12:00:00');
      
      if (checkOut <= checkIn) {
        alert('La fecha de check-out debe ser posterior a check-in');
        return;
      }
      
      const roomDoc = await getDoc(doc(db, 'habitaciones', habitacionId));
      const roomData = roomDoc.data();
      
      // Calcular número de noches
      const diffTime = checkOut - checkIn;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const precioNoche = parseFloat(roomData.precioNoche) || 0;
      let totalReserva = precioNoche * diffDays;
      
      // Aplicar porcentaje si es con tiempo de espera
      if (tipoReserva === 'Con Tiempo de Espera') {
        totalReserva = (totalReserva * porcentajePago) / 100;
      }
      
      // Calcular cambio si es efectivo
      let cambioTotal = 0;
      if (tipoPago === 'Efectivo' && efectivoRecibido) {
        cambioTotal = efectivoRecibido - totalReserva;
      }
      
      const reservaData = {
        guestId: huespedesIds[0], // Primer huésped como principal
        guestName: nombres[0].value.trim(),
        roomId: habitacionId,
        roomNumber: roomData.numero,
        tipoHab: roomData.tipo,
        checkIn: checkIn,
        checkOut: checkOut,
        status: 'Confirmada',
        paymentMethod: tipoPago,
        tipoReserva: tipoReserva,
        porcentajePago: porcentajePago,
        noches: diffDays,
        precioNoche: precioNoche,
        totalOriginal: precioNoche * diffDays,
        total: totalReserva,
        efectivoRecibido: tipoPago === 'Efectivo' ? efectivoRecibido : null,
        cambio: tipoPago === 'Efectivo' ? cambioTotal : null,
        additionalGuests: huespedesIds.slice(1),
        creado: new Date()
      };
      
      const reservaRef = await addDoc(collection(db, 'reservas'), reservaData);
      await updateDoc(doc(db, 'habitaciones', habitacionId), { estado: 'Ocupada', actualizado: new Date() });
      
      // Guardar transacción de caja si es efectivo
      if (tipoPago === 'Efectivo' && efectivoRecibido) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const transaccionData = {
          fecha: hoy,
          tipo: 'Ingreso',
          concepto: `Pago Reserva - ${nombres[0].value.trim()}`,
          monto: totalReserva,
          efectivoRecibido: efectivoRecibido,
          cambio: cambioTotal,
          reservaId: reservaRef.id,
          guestName: nombres[0].value.trim(),
          creado: new Date()
        };
        
        await addDoc(collection(db, 'transacciones_caja'), transaccionData);
      }
      
      // Generar ticket
      await generarTicketPDF(reservaRef.id, reservaData, roomData, huespedesIds, nombres[0].value.trim(), telefonos[0].value.trim());
      
      const porcentajeTexto = tipoReserva === 'Con Tiempo de Espera' ? `\nPorcentaje a Pagar: ${porcentajePago}%\nTotal Original: $${(precioNoche * diffDays).toFixed(2)}` : '';
      const efectivoTexto = tipoPago === 'Efectivo' ? `\nEfectivo Recibido: $${efectivoRecibido.toFixed(2)}\nCambio: $${cambioTotal.toFixed(2)}` : '';
      alert(`${cantidad} huésped(es) agregado(s) y reserva creada\nHabitación: ${roomData.numero}\nTipo de Reserva: ${tipoReserva}\nNoches: ${diffDays}\nPrecio/Noche: $${precioNoche.toFixed(2)}${porcentajeTexto}\nTotal a Pagar: $${totalReserva.toFixed(2)}\nPago: ${tipoPago}${efectivoTexto}`);
    } else {
      alert(`${cantidad} huésped(es) agregado(s) exitosamente`);
    }
    
    cerrarModal();
    cargarHuespedes();
    cargarHabitaciones(document.getElementById('buscarHabitacion') ? document.getElementById('buscarHabitacion').value : '', document.getElementById('filtroEstado') ? document.getElementById('filtroEstado').value : '');
    cargarReservas();
    cargarEstadisticas();
  } catch (error) {
    console.error('Error guardando huéspedes:', error);
    alert('Error guardando huéspedes');
  }
}

async function guardarHuesped(id = '') {
  try {
    const nombre = document.getElementById('huespedNombre').value.trim();
    const correo = document.getElementById('huespedCorreo').value.trim();
    const telefono = document.getElementById('huespedTelefono').value.trim();
    const origen = document.getElementById('huespedOrigen').value.trim();

    if (!nombre || !telefono || !origen) { 
      alert('Nombre, teléfono y origen son obligatorios'); 
      return; 
    }

    const data = {
      nombreCompleto: nombre,
      correo,
      telefono,
      origen,
      actualizado: new Date()
    };

    if (id) {
      await updateDoc(doc(db, 'huespedes', id), data);
      alert('Huésped actualizado');
    } else {
      data.creado = new Date();
      await addDoc(collection(db, 'huespedes'), data);
      alert('Huésped creado');
    }

    cerrarModal();
    cargarHuespedes();
  } catch (error) {
    console.error('Error guardando huésped:', error);
    alert('Error guardando huésped');
  }
}

async function editarHuesped(id) {
  try {
    const snap = await getDoc(doc(db, 'huespedes', id));
    if (!snap.exists()) { alert('Huésped no encontrado'); return; }
    mostrarFormularioHuesped({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error('Error editar huésped:', error);
  }
}

async function eliminarHuesped(id) {
  if (!confirm('Eliminar huésped?')) return;
  try {
    await deleteDoc(doc(db, 'huespedes', id));
    alert('Huésped eliminado');
    cargarHuespedes();
  } catch (error) {
    console.error('Error eliminando huésped:', error);
  }
}

async function verDetallesHuesped(id) {
  try {
    const snap = await getDoc(doc(db, 'huespedes', id));
    if (!snap.exists()) { alert('No encontrado'); return; }
    const d = snap.data();
    alert(`Nombre: ${d.nombreCompleto}\n¿De dónde nos visita?: ${d.origen || '—'}\nTeléfono: ${d.telefono || '—'}\nCorreo: ${d.correo || '—'}`);
  } catch (error) {
    console.error(error);
  }
}

// Cargar habitaciones
async function cargarHabitaciones(search = '', estado = '') {
  try {
    const habitacionesDiv = document.getElementById('tablaHabitaciones');
    const habitacionesSnap = await getDocs(collection(db, 'habitaciones'));
    const habitaciones = [];

    habitacionesSnap.forEach(doc => {
      habitaciones.push({ id: doc.id, ...doc.data() });
    });

    if (habitaciones.length === 0) {
      habitacionesDiv.innerHTML = '<p>No hay habitaciones registradas aún.</p>';
      return;
    }

    const filterTerm = search.trim().toLowerCase();
    const estadoFilter = estado.trim(); // No convertir a lowercase, mantener el valor exacto
    
    const habitacionesFiltradas = habitaciones.filter(habitacion => {
      const texto = `${habitacion.numero} ${habitacion.tipo} ${habitacion.estado} ${habitacion.descripcion || ''}`.toLowerCase();
      
      // Filtro de estado: si no hay filtro o coincide exactamente
      const estadoMatch = !estadoFilter || habitacion.estado === estadoFilter;
      
      // Filtro de búsqueda: si no hay búsqueda o coincide en el texto
      const searchMatch = !filterTerm || texto.includes(filterTerm);
      
      return estadoMatch && searchMatch;
    });

    if (habitacionesFiltradas.length === 0) {
      habitacionesDiv.innerHTML = '<p>No se encontraron habitaciones con esos filtros.</p>';
      return;
    }

    let html = `
      <table class="users-table">
        <thead>
          <tr><th>Número</th><th>Tipo</th><th>Capacidad</th><th>Precio/Noche</th><th>Estado</th><th>Amenities</th><th>Acciones</th></tr>
        </thead>
        <tbody>
    `;

    habitacionesFiltradas.forEach(habitacion => {
      const estadoClase = habitacion.estado ? habitacion.estado.toLowerCase() : 'disponible';
      const am = habitacion.amenities || {};
      const amenitiesList = [];
      if (am.internet) amenitiesList.push('Internet');
      if (am.cable) amenitiesList.push('Cable TV');
      if (am.clima) amenitiesList.push('Clima');
      if (am.calefaccion) amenitiesList.push('Calefacción');
      const numTVs = habitacion.numTVs || 0;
      const amenitiesHtml = `${amenitiesList.length ? amenitiesList.join(', ') : '—'}${numTVs ? ' · TVs: ' + numTVs : ''}`;

      html += `
        <tr>
          <td>${habitacion.numero}</td>
          <td>${habitacion.tipo}</td>
          <td>${habitacion.capacidad || '-'}</td>
          <td>$${parseFloat(habitacion.precioNoche || 0).toFixed(2)}</td>
          <td><span class="status status-${estadoClase}">${habitacion.estado}</span></td>
          <td>${amenitiesHtml}</td>
          <td>
            <button class="btn-action btn-edit" onclick="editarHabitacion('${habitacion.id}')">Editar</button>
            <button class="btn-action btn-delete" onclick="eliminarHabitacion('${habitacion.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    habitacionesDiv.innerHTML = html;

  } catch (error) {
    console.error('Error cargando habitaciones:', error);
  }
}

// Cargar reservas
async function cargarReservas() {
  try {
    const reservasDiv = document.getElementById('tablaReservas');
    const reservasSnap = await getDocs(query(collection(db, 'reservas'), orderBy('checkIn', 'desc')));
    if (reservasSnap.empty) {
      reservasDiv.innerHTML = '<p>No hay reservas registradas.</p>';
      return;
    }

    let html = `
      <table class="users-table">
        <thead>
          <tr><th>ID</th><th>Huésped</th><th>Habitación</th><th>Check-in</th><th>Check-out</th><th>Estado</th><th>Pago</th><th>Total</th><th>Acciones</th></tr>
        </thead>
        <tbody>`;

    reservasSnap.forEach(docRes => {
      const r = docRes.data();
      const id = docRes.id;
      const guest = r.guestName || r.guestId || '—';
      const room = r.roomNumber || (r.roomId ? r.roomId : '—');
      const checkIn = formatDate(r.checkIn);
      const checkOut = formatDate(r.checkOut);
      const estado = r.status || 'Pendiente';
      const pago = r.paymentMethod || '—';
      const total = r.total ? `$${parseFloat(r.total).toFixed(2)}` : '—';

      html += `
        <tr>
          <td>${id}</td>
          <td>${guest}</td>
          <td>${room}</td>
          <td>${checkIn}</td>
          <td>${checkOut}</td>
          <td>${estado}</td>
          <td>${pago}</td>
          <td>${total}</td>
          <td>
            <button class="btn-action btn-edit" onclick="editarReserva('${id}')">Editar</button>
            <button class="btn-action btn-delete" onclick="eliminarReserva('${id}')">Eliminar</button>
          </td>
        </tr>`;
    });

    html += '</tbody></table>';
    reservasDiv.innerHTML = html;
  } catch (error) {
    console.error('Error cargando reservas:', error);
  }
}

function formatDate(value) {
  if (!value) return '';
  try {
    if (value.toDate) return value.toDate().toLocaleDateString('es-MX');
    if (typeof value === 'string') return new Date(value).toLocaleDateString('es-MX');
    return new Date(value).toLocaleDateString('es-MX');
  } catch (e) {
    return '';
  }
}

// Reservas: modal, guardar, editar, eliminar
async function mostrarFormularioReserva(reserva = null) {
  const modalContent = document.getElementById('modalContent');
  // cargar huéspedes y habitaciones para selects
  const usersSnap = await getDocs(collection(db, 'huespedes'));
  const roomsSnap = await getDocs(collection(db, 'habitaciones'));

  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const rooms = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const res = reserva ? (await getDoc(doc(db, 'reservas', reserva))).data() : null;
  const guestId = res ? res.guestId : '';
  const roomId = res ? res.roomId : '';
  const checkIn = res && res.checkIn ? (() => { const d = res.checkIn.toDate ? res.checkIn.toDate() : new Date(res.checkIn); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : '';
  const checkOut = res && res.checkOut ? (() => { const d = res.checkOut.toDate ? res.checkOut.toDate() : new Date(res.checkOut); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : '';
  const status = res ? res.status : 'Confirmada';
  const total = res ? (res.total || '') : '';

  // Si es edición, obtener solo los huéspedes hospedados en esa habitación
  let huespedesToShow = users;
  if (reserva && roomId) {
    // Buscar todas las reservas de esa habitación
    const reservasEnHabitacion = await getDocs(query(collection(db, 'reservas'), where('roomId', '==', roomId)));
    const guestIdsEnHabitacion = new Set();
    reservasEnHabitacion.forEach(doc => {
      const r = doc.data();
      if (r.guestId) guestIdsEnHabitacion.add(r.guestId);
      if (r.additionalGuests && Array.isArray(r.additionalGuests)) {
        r.additionalGuests.forEach(gId => guestIdsEnHabitacion.add(gId));
      }
    });
    huespedesToShow = users.filter(u => guestIdsEnHabitacion.has(u.id));
  }

  let usersOptions = '<option value="">Selecciona huésped</option>';
  huespedesToShow.forEach(u => usersOptions += `<option value="${u.id}" ${u.id===guestId ? 'selected' : ''}>${u.nombreCompleto || u.usuario || u.correo}</option>`);

  let roomsOptions = '<option value="">Selecciona habitación</option>';
  rooms.forEach(r => {
    const disabled = (!res && r.estado === 'Ocupada') ? 'disabled' : '';
    roomsOptions += `<option value="${r.id}" ${r.id===roomId ? 'selected' : ''} ${disabled}>${r.numero} - ${r.tipo} ${r.estado? '('+r.estado+')':''}</option>`;
  });

  modalContent.innerHTML = `
    <div class="modal-header">
      <h2>${res ? 'Editar' : 'Nueva'} Reserva</h2>
      <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <form id="reservaForm" class="modal-form">
        <div>
          <label for="reservaGuest">Huésped</label>
          <select id="reservaGuest">${usersOptions}</select>
        </div>
        <div>
          <label for="reservaRoom">Habitación</label>
          <select id="reservaRoom">${roomsOptions}</select>
        </div>
        <div>
          <label for="reservaCheckIn">Check-in</label>
          <input id="reservaCheckIn" type="date" value="${checkIn}">
        </div>
        <div>
          <label for="reservaCheckOut">Check-out</label>
          <input id="reservaCheckOut" type="date" value="${checkOut}">
        </div>
        <div>
          <label for="reservaStatus">Estado</label>
          <select id="reservaStatus">
            <option value="Confirmada" ${status==='Confirmada'?'selected':''}>Confirmada</option>
            <option value="Pendiente" ${status==='Pendiente'?'selected':''}>Pendiente</option>
            <option value="Cancelada" ${status==='Cancelada'?'selected':''}>Cancelada</option>
          </select>
        </div>
        <div>
          <label for="reservaTotal">Total</label>
          <input id="reservaTotal" type="number" step="0.01" value="${total}" placeholder="Opcional">
        </div>
      </form>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
      <button class="btn-primary" onclick="guardarReserva('${reserva||''}')">Guardar reserva</button>
    </div>
  `;

  document.getElementById('modal').classList.add('active');
}

async function guardarReserva(reservaId = '') {
  const guestId = document.getElementById('reservaGuest').value;
  const roomId = document.getElementById('reservaRoom').value;
  const checkInVal = document.getElementById('reservaCheckIn').value;
  const checkOutVal = document.getElementById('reservaCheckOut').value;
  const status = document.getElementById('reservaStatus').value;
  const totalVal = parseFloat(document.getElementById('reservaTotal').value) || 0;

  if (!guestId || !roomId || !checkInVal || !checkOutVal) {
    alert('Completa huésped, habitación y fechas.');
    return;
  }

  const checkIn = new Date(checkInVal + 'T12:00:00');
  const checkOut = new Date(checkOutVal + 'T12:00:00');
  if (checkOut <= checkIn) {
    alert('La fecha de check-out debe ser posterior a check-in.');
    return;
  }

  try {
    // Recolectar datos de huésped y habitación
    const guestDoc = await getDoc(doc(db, 'huespedes', guestId));
    const roomDoc = await getDoc(doc(db, 'habitaciones', roomId));
    if (!guestDoc.exists() || !roomDoc.exists()) {
      alert('Huésped o habitación inválidos.');
      return;
    }
    const guestName = guestDoc.data().nombreCompleto || guestDoc.data().usuario || guestDoc.data().correo;
    const roomNumber = roomDoc.data().numero;

    // Verificar conflictos: reservas existentes para la habitación
    const reservasSnap = await getDocs(query(collection(db, 'reservas'), where('roomId', '==', roomId)));
    let conflict = false;
    reservasSnap.forEach(d => {
      if (reservaId && d.id === reservaId) return; // ignore same
      const r = d.data();
      const rIn = r.checkIn && r.checkIn.toDate ? r.checkIn.toDate() : new Date(r.checkIn);
      const rOut = r.checkOut && r.checkOut.toDate ? r.checkOut.toDate() : new Date(r.checkOut);
      // overlap check
      if (!(checkOut <= rIn || checkIn >= rOut)) {
        conflict = true;
      }
    });

    if (conflict) {
      if (!confirm('Hay conflicto con otra reserva en la misma habitación y fechas. ¿Deseas continuar igual?')) {
        return;
      }
    }

    const reservaData = {
      guestId,
      guestName,
      roomId,
      roomNumber,
      tipoHab: roomDoc.data().tipo,
      checkIn: checkIn,
      checkOut: checkOut,
      status,
      total: totalVal,
      actualizado: new Date()
    };

    if (reservaId) {
      await updateDoc(doc(db, 'reservas', reservaId), reservaData);

      // Actualizar el ticket relacionado con las nuevas fechas
      const noches = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const ticketsRelacionados = await getDocs(query(collection(db, 'tickets'), where('reservaId', '==', reservaId)));
      const ticketUpdates = ticketsRelacionados.docs.map(tDoc =>
        updateDoc(doc(db, 'tickets', tDoc.id), {
          checkIn: checkIn,
          checkOut: checkOut,
          noches: noches,
          total: totalVal
        })
      );
      await Promise.all(ticketUpdates);

      alert('Reserva actualizada.');
    } else {
      reservaData.creado = new Date();
      await addDoc(collection(db, 'reservas'), reservaData);
      alert('Reserva creada.');
    }

    // Actualizar estado de habitación si es necesaria (si reserva activa en fechas)
    const hoy = new Date();
    if (status === 'Confirmada' && checkIn <= hoy && hoy < checkOut) {
      await updateDoc(doc(db, 'habitaciones', roomId), { estado: 'Ocupada', actualizado: new Date() });
    }

    cerrarModal();
    cargarReservas();
    cargarHabitaciones(document.getElementById('buscarHabitacion') ? document.getElementById('buscarHabitacion').value : '', document.getElementById('filtroEstado') ? document.getElementById('filtroEstado').value : '');
    cargarEstadisticas();
  } catch (error) {
    console.error('Error guardando reserva:', error);
    alert('No se pudo guardar la reserva. Revisa la consola.');
  }
}

async function editarReserva(id) {
  try {
    // mostrar modal con datos
    mostrarFormularioReserva(id);
  } catch (error) {
    console.error('Error al editar reserva:', error);
  }
}

async function eliminarReserva(id) {
  if (!confirm('¿Eliminar esta reserva?')) return;
  try {
    await deleteDoc(doc(db, 'reservas', id));
    alert('Reserva eliminada.');
    cargarReservas();
    cargarEstadisticas();
  } catch (error) {
    console.error('Error eliminando reserva:', error);
    alert('No se pudo eliminar la reserva.');
  }
}

// Funciones auxiliares
function mostrarFormularioHabitacion(habitacion = null) {
  habitacionEditando = habitacion ? habitacion.id : null;
  const numero = habitacion ? habitacion.numero : '';
  const tipo = habitacion ? habitacion.tipo : 'Matrimonial';
  const capacidad = habitacion ? habitacion.capacidad : '';
  const precioNoche = habitacion ? habitacion.precioNoche : '';
  const estado = habitacion ? habitacion.estado : 'Disponible';
  const descripcion = habitacion ? habitacion.descripcion || '' : '';

  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="modal-header">
      <h2>${habitacion ? 'Editar' : 'Agregar'} Habitación</h2>
      <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <form id="habitacionForm" class="modal-form">
        <div>
          <label for="numeroHabitacion">Número de habitación</label>
          <input id="numeroHabitacion" type="text" value="${numero}" placeholder="Ej. 101" required>
        </div>

        <div>
          <label for="tipoHabitacion">Tipo</label>
          <select id="tipoHabitacion">
            <option value="Matrimonial" ${tipo === 'Matrimonial' ? 'selected' : ''}>Matrimonial</option>
            <option value="King Size" ${tipo === 'King Size' ? 'selected' : ''}>King Size</option>
            <option value="Presidencial" ${tipo === 'Presidencial' ? 'selected' : ''}>Presidencial</option>
            <option value="Individual" ${tipo === 'Individual' ? 'selected' : ''}>Individual</option>
          </select>
        </div>

        <div>
          <label for="capacidadHabitacion">Capacidad</label>
          <input id="capacidadHabitacion" type="number" value="${capacidad}" placeholder="Ej. 2" min="1" required>
        </div>

        <div>
          <label for="precioHabitacion">Precio por noche</label>
          <input id="precioHabitacion" type="number" step="0.01" value="${precioNoche}" placeholder="Ej. 120.00" min="0" required>
        </div>

        <div>
          <label for="estadoHabitacion">Estado</label>
          <select id="estadoHabitacion">
            <option value="Disponible" ${estado === 'Disponible' ? 'selected' : ''}>Disponible</option>
            <option value="Ocupada" ${estado === 'Ocupada' ? 'selected' : ''}>Ocupada</option>
            <option value="Mantenimiento" ${estado === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
          </select>
        </div>

        <div style="grid-column: 1 / -1;">
          <label>Comodidades</label>
          <div style="display: flex; gap:10px; flex-wrap: wrap; align-items:center;">
            <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="amen_internet" ${habitacion && habitacion.amenities && habitacion.amenities.internet ? 'checked' : ''}> Internet</label>
            <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="amen_cable" ${habitacion && habitacion.amenities && habitacion.amenities.cable ? 'checked' : ''}> Cable TV</label>
            <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="amen_clima" ${habitacion && habitacion.amenities && habitacion.amenities.clima ? 'checked' : ''}> Clima</label>
            <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="amen_calefaccion" ${habitacion && habitacion.amenities && habitacion.amenities.calefaccion ? 'checked' : ''}> Calefacción</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <label for="numTVs" style="margin-right:6px;">TVs</label>
              <input id="numTVs" type="number" min="0" style="width:80px;" value="${habitacion && habitacion.numTVs ? habitacion.numTVs : 0}">
            </div>
          </div>
        </div>

        <div style="grid-column: 1 / -1;">
          <label for="descripcionHabitacion">Descripción</label>
          <textarea id="descripcionHabitacion" rows="3" placeholder="Opcional">${descripcion}</textarea>
        </div>
      </form>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
      <button type="button" class="btn-primary" onclick="guardarHabitacion()">Guardar</button>
    </div>
  `;
  document.getElementById('modal').classList.add('active');
}

async function guardarHabitacion() {
  const numero = document.getElementById('numeroHabitacion').value.trim();
  const tipo = document.getElementById('tipoHabitacion').value;
  const capacidad = parseInt(document.getElementById('capacidadHabitacion').value, 10);
  const precioNoche = parseFloat(document.getElementById('precioHabitacion').value);
  const estado = document.getElementById('estadoHabitacion').value;
  const descripcion = document.getElementById('descripcionHabitacion').value.trim();

  if (!numero || !tipo || !capacidad || isNaN(precioNoche) || !estado) {
    alert('Por favor completa todos los campos obligatorios de la habitación.');
    return;
  }

  try {
    const habitacionData = {
      numero,
      tipo,
      capacidad,
      precioNoche,
      estado,
      descripcion,
      amenities: {
        internet: !!document.getElementById('amen_internet').checked,
        cable: !!document.getElementById('amen_cable').checked,
        clima: !!document.getElementById('amen_clima').checked,
        calefaccion: !!document.getElementById('amen_calefaccion').checked,
      },
      numTVs: parseInt(document.getElementById('numTVs').value, 10) || 0,
      actualizado: new Date()
    };

    if (habitacionEditando) {
      await updateDoc(doc(db, 'habitaciones', habitacionEditando), habitacionData);
      alert('Habitación actualizada correctamente.');
    } else {
      habitacionData.creado = new Date();
      await addDoc(collection(db, 'habitaciones'), habitacionData);
      alert('Habitación registrada correctamente.');
    }

    habitacionEditando = null;
    cerrarModal();
    cargarHabitaciones(document.getElementById('buscarHabitacion').value, document.getElementById('filtroEstado').value);
    cargarEstadisticas();
  } catch (error) {
    console.error('Error guardando habitación:', error);
    alert('Hubo un error guardando la habitación. Revisa la consola.');
  }
}

async function editarHabitacion(id) {
  try {
    const habitacionRef = doc(db, 'habitaciones', id);
    const habitacionSnap = await getDoc(habitacionRef);
    if (!habitacionSnap.exists()) {
      alert('No se encontró la habitación.');
      return;
    }
    mostrarFormularioHabitacion({ id: habitacionSnap.id, ...habitacionSnap.data() });
  } catch (error) {
    console.error('Error al cargar la habitación:', error);
  }
}

async function eliminarHabitacion(id) {
  if (!confirm('¿Deseas eliminar esta habitación? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'habitaciones', id));
    alert('Habitación eliminada correctamente.');
    cargarHabitaciones(document.getElementById('buscarHabitacion').value, document.getElementById('filtroEstado').value);
    cargarEstadisticas();
  } catch (error) {
    console.error('Error eliminando habitación:', error);
    alert('No se pudo eliminar la habitación. Revisa la consola.');
  }
}

async function generarReporte(tipo) {
  try {
    if (tipo === 'usuarios') {
      await generarReportePDFUsuarios();
    } else if (tipo === 'ocupacion') {
      await generarReportePDFOcupacion();
    }
  } catch (error) {
    console.error(`Error generando reporte de ${tipo}:`, error);
    alert(`Error al generar reporte: ${error.message}`);
  }
}

async function generarReportePDFUsuarios() {
  try {
    const hoy = new Date();
    const hoyString = hoy.toISOString().split('T')[0];
    const fechaFormato = hoy.toLocaleDateString('es-MX');
    
    // Obtener reservas del día
    const reservasSnap = await getDocs(collection(db, 'reservas'));
    const hoyMs = hoy.setHours(0, 0, 0, 0);
    const mananaMs = hoyMs + (24 * 60 * 60 * 1000);
    
    let reservasHoy = [];
    reservasSnap.forEach(doc => {
      const r = doc.data();
      if (r.status === 'Confirmada') {
        let fechaCreado = null;
        
        if (r.creado && r.creado.toDate) {
          fechaCreado = r.creado.toDate().getTime();
        } else if (r.creado instanceof Date) {
          fechaCreado = r.creado.getTime();
        }
        
        if (fechaCreado && fechaCreado >= hoyMs && fechaCreado < mananaMs) {
          reservasHoy.push(r);
        }
      }
    });
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFillColor(47, 139, 58);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE USUARIOS', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Hotel Casa Usumacinta`, 105, 23, { align: 'center' });
    doc.text(`Fecha: ${fechaFormato}`, 105, 30, { align: 'center' });
    
    // Contenido
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    let yPos = 45;
    
    // Total de usuarios
    doc.setFont(undefined, 'bold');
    doc.setFillColor(230, 245, 230);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.text(`Total de Usuarios: ${reservasHoy.length}`, 20, yPos);
    yPos += 15;
    
    if (reservasHoy.length === 0) {
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text('No hay huéspedes registrados para hoy', 20, yPos);
    } else {
      // Tabla de usuarios
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Nombre', 20, yPos);
      doc.text('Habitación', 80, yPos);
      doc.text('Tipo', 130, yPos);
      doc.text('Check-in', 160, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'normal');
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos - 1, 200, yPos - 1);
      
      reservasHoy.forEach((r) => {
        const nombre = r.guestName || 'N/A';
        const habitacion = r.roomNumber || 'N/A';
        let tipoHab = 'N/A';
        
        // Obtener el tipo de habitación del nombre almacenado
        // Asumiendo que el tipo está en roomData
        tipoHab = r.tipoHab || 'N/A';
        
        const checkInDate = r.checkIn && r.checkIn.toDate ? r.checkIn.toDate().toLocaleDateString('es-MX') : new Date(r.checkIn).toLocaleDateString('es-MX');
        
        doc.text(nombre.substring(0, 25), 20, yPos);
        doc.text(habitacion.toString(), 80, yPos);
        doc.text(tipoHab.substring(0, 15), 130, yPos);
        doc.text(checkInDate, 160, yPos);
        yPos += 6;
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
          doc.setFont(undefined, 'bold');
          doc.text('Nombre', 20, yPos);
          doc.text('Habitación', 80, yPos);
          doc.text('Tipo', 130, yPos);
          doc.text('Check-in', 160, yPos);
          yPos += 6;
          doc.setFont(undefined, 'normal');
        }
      });
    }
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 105, 285, { align: 'center' });
    
    doc.save(`Reporte_Usuarios_${hoyString}.pdf`);
    alert('✅ Reporte de Usuarios generado exitosamente');
  } catch (error) {
    console.error('Error generando reporte de usuarios:', error);
    alert('Error al generar reporte: ' + error.message);
  }
}

async function generarReportePDFOcupacion() {
  try {
    const hoy = new Date();
    const hoyString = hoy.toISOString().split('T')[0];
    const fechaFormato = hoy.toLocaleDateString('es-MX');
    
    // Obtener todas las habitaciones
    const habitacionesSnap = await getDocs(collection(db, 'habitaciones'));
    let ocupadas = [];
    let disponibles = [];
    
    habitacionesSnap.forEach(doc => {
      const h = doc.data();
      const info = {
        numero: h.numero,
        tipo: h.tipo || 'N/A',
        capacidad: h.capacidad || 0,
        estado: h.estado
      };
      
      if (h.estado === 'Ocupada') {
        ocupadas.push(info);
      } else if (h.estado === 'Disponible') {
        disponibles.push(info);
      }
    });
    
    // Agrupar por tipo
    const agruparPorTipo = (lista) => {
      const agrupado = {};
      lista.forEach(h => {
        if (!agrupado[h.tipo]) {
          agrupado[h.tipo] = [];
        }
        agrupado[h.tipo].push(h);
      });
      return agrupado;
    };
    
    const ocupadasPorTipo = agruparPorTipo(ocupadas);
    const disponiblesPorTipo = agruparPorTipo(disponibles);
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFillColor(47, 139, 58);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE OCUPACIÓN', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Hotel Casa Usumacinta`, 105, 23, { align: 'center' });
    doc.text(`Fecha: ${fechaFormato}`, 105, 30, { align: 'center' });
    
    // Contenido
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    let yPos = 45;
    
    // Resumen general
    const totalHabitaciones = ocupadas.length + disponibles.length;
    doc.setFont(undefined, 'bold');
    doc.setFillColor(230, 245, 230);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.text(`Total de Habitaciones: ${totalHabitaciones}`, 20, yPos);
    yPos += 12;
    
    // Ocupadas
    doc.setFont(undefined, 'bold');
    doc.setFillColor(255, 243, 205);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.text(`Habitaciones Ocupadas: ${ocupadas.length}`, 20, yPos);
    yPos += 10;
    
    // Detalle de ocupadas por tipo
    if (ocupadas.length > 0) {
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Por Tipo:', 25, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'normal');
      Object.keys(ocupadasPorTipo).sort().forEach(tipo => {
        const cantidad = ocupadasPorTipo[tipo].length;
        const numeros = ocupadasPorTipo[tipo].map(h => h.numero).join(', ');
        doc.text(`• ${tipo}: ${cantidad} hab. (${numeros})`, 30, yPos);
        yPos += 5;
      });
      
      yPos += 5;
    }
    
    // Disponibles
    doc.setFont(undefined, 'bold');
    doc.setFillColor(200, 230, 201);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.text(`Habitaciones Disponibles: ${disponibles.length}`, 20, yPos);
    yPos += 10;
    
    // Detalle de disponibles por tipo
    if (disponibles.length > 0) {
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Por Tipo:', 25, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'normal');
      Object.keys(disponiblesPorTipo).sort().forEach(tipo => {
        const cantidad = disponiblesPorTipo[tipo].length;
        const numeros = disponiblesPorTipo[tipo].map(h => h.numero).join(', ');
        doc.text(`• ${tipo}: ${cantidad} hab. (${numeros})`, 30, yPos);
        yPos += 5;
      });
    }
    
    // Tasa de ocupación
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.setFillColor(224, 242, 254);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    const tasaOcupacion = totalHabitaciones > 0 ? ((ocupadas.length / totalHabitaciones) * 100).toFixed(1) : 0;
    doc.text(`Tasa de Ocupación: ${tasaOcupacion}%`, 20, yPos);
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 105, 285, { align: 'center' });
    
    doc.save(`Reporte_Ocupacion_${hoyString}.pdf`);
    alert('✅ Reporte de Ocupación generado exitosamente');
  } catch (error) {
    console.error('Error generando reporte de ocupación:', error);
    alert('Error al generar reporte: ' + error.message);
  }
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

// ============================================================
// VENTAS — Gestión de Productos
// ============================================================
const PRODUCTO_CHUNK_SIZE = 700000; // ~700 KB por chunk (max 6 chunks)

async function cargarVentas() {
  const container = document.getElementById('productosGrid');
  container.innerHTML = '<div class="empty-message"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</div>';
  try {
    const snap = await getDocs(collection(db, 'productos'));
    if (snap.empty) {
      container.innerHTML = '<div class="empty-message">No hay productos registrados aún.</div>';
      return;
    }
    const productos = [];
    snap.forEach(d => productos.push({ id: d.id, ...d.data() }));
    // Ordenar por fecha de creación (más reciente primero) de forma local
    productos.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const productosConImg = await Promise.all(productos.map(async (p) => {
      let imgSrc = '';
      if (p.imagenChunked) {
        try {
          const chunksSnap = await getDocs(collection(db, 'productos', p.id, 'imageChunks'));
          const chunks = {};
          chunksSnap.forEach(c => { chunks[c.id] = c.data().data; });
          let base64 = '', i = 1;
          while (chunks[`chunk${i}`]) { base64 += chunks[`chunk${i}`]; i++; }
          imgSrc = (p.imagenHeader || 'data:image/jpeg;base64,') + base64;
        } catch (e) { console.warn('Error cargando imagen chunked', e); }
      } else if (p.imagenInline) {
        imgSrc = (p.imagenHeader || 'data:image/jpeg;base64,') + p.imagenInline;
      }
      return { ...p, imgSrc };
    }));

    let html = '<div class="productos-grid">';
    productosConImg.forEach(p => {
      const precioFmt = Number(p.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 });
      const imgTag = p.imgSrc
        ? `<img src="${p.imgSrc}" alt="${p.nombre}" class="producto-img">`
        : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#d1d5db;"><i class="fas fa-image" style="font-size:36px;"></i></div>`;
      html += `
        <div class="producto-card">
          <div class="producto-img-wrap">${imgTag}</div>
          <div class="producto-info">
            <h4 class="producto-nombre">${p.nombre}</h4>
            <p class="producto-precio">$${precioFmt} MXN</p>
            <p class="producto-stock"><i class="fas fa-boxes-stacked"></i> Stock: <strong>${p.stock}</strong></p>
          </div>
          <div class="producto-actions">
            <button class="btn-action btn-edit" onclick="mostrarFormularioProducto('${p.id}')"><i class="fas fa-pen"></i> Editar</button>
            <button class="btn-action btn-delete" onclick="eliminarProducto('${p.id}', ${p.imagenChunked ? 'true' : 'false'})"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  } catch (e) {
    console.error('Error cargando ventas', e);
    container.innerHTML = '<div class="empty-message">Error al cargar los productos.</div>';
  }
}

function mostrarFormularioProducto(productoId = null) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  const isEditing = !!productoId;
  modalContent.innerHTML = `
    <div class="modal-header">
      <h2>${isEditing ? 'Editar Producto' : 'Agregar Producto'}</h2>
      <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <div id="productoFormError" style="display:none;color:#991b1b;margin-bottom:12px;padding:10px 14px;background:#fee2e2;border-radius:8px;font-size:14px;"></div>
      <div class="modal-form">
        <div>
          <label>Imagen del Producto</label>
          <div class="img-upload-area" id="imgUploadArea" onclick="document.getElementById('productoImgInput').click()">
            <img id="productoImgPreview" src="" style="display:none;width:100%;height:100%;object-fit:cover;">
            <div id="imgUploadPlaceholder">
              <i class="fas fa-image" style="font-size:32px;color:#C1A44D;"></i>
              <span>Clic para seleccionar imagen</span>
              <span style="font-size:11px;color:#d1d5db;">JPG, PNG, WEBP — máx. ~4 MB</span>
            </div>
          </div>
          <input type="file" id="productoImgInput" accept="image/*" style="display:none" onchange="previewProductoImg(this)">
        </div>
        <div>
          <label>Nombre del Producto *</label>
          <input type="text" id="productoNombre" placeholder="Ej: Jugo de naranja natural">
        </div>
        <div>
          <label>Precio (MXN) *</label>
          <input type="number" id="productoPrecio" placeholder="Ej: 45.00" min="0" step="0.01">
        </div>
        <div>
          <label>Stock *</label>
          <input type="number" id="productoStock" placeholder="Ej: 20" min="0" step="1">
        </div>
      </div>
    </div>
    <div style="padding:16px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #f3f4f6;">
      <button class="btn-action btn-view" onclick="cerrarModal()">Cancelar</button>
      <button class="btn-primary" id="btnGuardarProducto" onclick="guardarProducto('${productoId || ''}')">
        <i class="fas fa-save"></i> ${isEditing ? 'Guardar Cambios' : 'Agregar Producto'}
      </button>
    </div>
  `;
  modal.classList.add('active');
  if (isEditing) cargarDatosProductoEnModal(productoId);
}

async function cargarDatosProductoEnModal(productoId) {
  try {
    const snap = await getDoc(doc(db, 'productos', productoId));
    if (!snap.exists()) return;
    const p = snap.data();
    document.getElementById('productoNombre').value = p.nombre || '';
    document.getElementById('productoPrecio').value = p.precio || '';
    document.getElementById('productoStock').value = p.stock || '';

    let imgSrc = '';
    if (p.imagenChunked) {
      const chunksSnap = await getDocs(collection(db, 'productos', productoId, 'imageChunks'));
      const chunks = {};
      chunksSnap.forEach(c => { chunks[c.id] = c.data().data; });
      let base64 = '', i = 1;
      while (chunks[`chunk${i}`]) { base64 += chunks[`chunk${i}`]; i++; }
      imgSrc = (p.imagenHeader || 'data:image/jpeg;base64,') + base64;
    } else if (p.imagenInline) {
      imgSrc = (p.imagenHeader || 'data:image/jpeg;base64,') + p.imagenInline;
    }

    if (imgSrc) {
      const preview = document.getElementById('productoImgPreview');
      const placeholder = document.getElementById('imgUploadPlaceholder');
      preview.src = imgSrc;
      preview.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      // Persist existing image metadata so save skips re-upload if unchanged
      const input = document.getElementById('productoImgInput');
      input.dataset.existingHeader = p.imagenHeader || '';
      input.dataset.existingChunked = p.imagenChunked ? '1' : '0';
      input.dataset.existingInline = p.imagenChunked ? '' : (p.imagenInline || '');
    }
  } catch (e) {
    console.error('Error cargando datos del producto en modal', e);
  }
}

function previewProductoImg(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('productoImgPreview');
    const placeholder = document.getElementById('imgUploadPlaceholder');
    preview.src = e.target.result;
    preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    // Clear existing metadata so the new file is used
    delete input.dataset.existingHeader;
  };
  reader.readAsDataURL(input.files[0]);
}

async function procesarImagenProducto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const commaIdx = dataUrl.indexOf(',');
      const header = dataUrl.substring(0, commaIdx + 1);
      const base64 = dataUrl.substring(commaIdx + 1);
      if (base64.length <= PRODUCTO_CHUNK_SIZE) {
        resolve({ header, chunked: false, inline: base64 });
      } else {
        const chunks = [];
        for (let i = 0; i < base64.length; i += PRODUCTO_CHUNK_SIZE) {
          chunks.push(base64.substring(i, i + PRODUCTO_CHUNK_SIZE));
        }
        if (chunks.length > 6) {
          reject(new Error('La imagen es demasiado grande (máximo ~4 MB)'));
          return;
        }
        resolve({ header, chunked: true, chunks });
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function guardarProducto(productoId) {
  const nombre = document.getElementById('productoNombre').value.trim();
  const precio = parseFloat(document.getElementById('productoPrecio').value);
  const stock = parseInt(document.getElementById('productoStock').value, 10);
  const imgInput = document.getElementById('productoImgInput');
  const btn = document.getElementById('btnGuardarProducto');

  const mostrarError = (msg) => {
    const el = document.getElementById('productoFormError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  };

  if (!nombre)                     { mostrarError('El nombre del producto es obligatorio.'); return; }
  if (isNaN(precio) || precio < 0) { mostrarError('Ingresa un precio válido.'); return; }
  if (isNaN(stock)  || stock < 0)  { mostrarError('Ingresa un stock válido.'); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  document.getElementById('productoFormError').style.display = 'none';

  try {
    const isEditing = !!productoId;
    const now = new Date().toISOString();
    let imagenData = null;
    const hasNewFile = imgInput.files && imgInput.files[0];
    const hasExisting = imgInput.dataset.existingHeader !== undefined;

    if (hasNewFile) {
      imagenData = await procesarImagenProducto(imgInput.files[0]);
    }

    const docData = { nombre, precio, stock, updatedAt: now };
    if (!isEditing) docData.createdAt = now;

    if (imagenData) {
      docData.imagenHeader  = imagenData.header;
      docData.imagenChunked = imagenData.chunked;
      docData.imagenInline  = imagenData.chunked ? '' : imagenData.inline;
    }

    let targetId = productoId;
    if (isEditing) {
      await updateDoc(doc(db, 'productos', productoId), docData);
      // If replacing image and new one is chunked, remove old chunks first
      if (imagenData && imagenData.chunked) {
        const oldChunks = await getDocs(collection(db, 'productos', productoId, 'imageChunks'));
        await Promise.all(oldChunks.docs.map(c => deleteDoc(doc(db, 'productos', productoId, 'imageChunks', c.id))));
      }
    } else {
      const ref = await addDoc(collection(db, 'productos'), docData);
      targetId = ref.id;
    }

    if (imagenData && imagenData.chunked) {
      await Promise.all(imagenData.chunks.map((chunkData, idx) =>
        setDoc(doc(db, 'productos', targetId, 'imageChunks', `chunk${idx + 1}`), { data: chunkData })
      ));
    }

    cerrarModal();
    cargarVentas();
  } catch (e) {
    console.error('Error guardando producto', e);
    const el = document.getElementById('productoFormError');
    if (el) { el.textContent = e.message || 'Error al guardar el producto. Intenta de nuevo.'; el.style.display = 'block'; }
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-save"></i> ${productoId ? 'Guardar Cambios' : 'Agregar Producto'}`;
  }
}

async function eliminarProducto(productoId, esChunked) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
  try {
    if (esChunked) {
      const chunksSnap = await getDocs(collection(db, 'productos', productoId, 'imageChunks'));
      await Promise.all(chunksSnap.docs.map(c => deleteDoc(doc(db, 'productos', productoId, 'imageChunks', c.id))));
    }
    await deleteDoc(doc(db, 'productos', productoId));
    cargarVentas();
  } catch (e) {
    console.error('Error eliminando producto', e);
    alert('Error al eliminar el producto.');
  }
}

// ---- Registrar Venta ----
let _ventaProductosCatalogo = [];

async function mostrarFormularioVenta() {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="modal-header">
      <h2><i class="fas fa-receipt"></i> Registrar Venta</h2>
      <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body" style="text-align:center;padding:40px;">
      <i class="fas fa-spinner fa-spin" style="font-size:28px;color:#C1A44D;"></i>
      <p style="margin-top:12px;color:#6b7280;">Cargando productos...</p>
    </div>`;
  modal.classList.add('active');

  try {
    const snap = await getDocs(collection(db, 'productos'));
    _ventaProductosCatalogo = [];
    snap.forEach(d => _ventaProductosCatalogo.push({ id: d.id, ...d.data() }));
    // Ordenar por nombre localmente
    _ventaProductosCatalogo.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
  } catch (e) {
    console.error('Error cargando productos para venta', e);
    _ventaProductosCatalogo = [];
  }

  const hayProductos = _ventaProductosCatalogo.length > 0;
  const selectHtml = hayProductos
    ? `<select id="ventaProductoSelect" onchange="actualizarInfoProductoVenta()">
         <option value="">— Selecciona un producto —</option>
         ${_ventaProductosCatalogo.map(p =>
           `<option value="${p.id}" data-precio="${p.precio}" data-stock="${p.stock}">
              ${p.nombre} — $${Number(p.precio).toFixed(2)} (Stock: ${p.stock})
            </option>`).join('')}
       </select>`
    : `<p style="color:#9ca3af;font-size:14px;padding:10px;background:#f9fafb;border-radius:8px;text-align:center;">No hay productos disponibles. Agrega productos primero.</p>`;

  modalContent.innerHTML = `
    <div class="modal-header">
      <h2><i class="fas fa-receipt"></i> Registrar Venta</h2>
      <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <div id="ventaFormError" style="display:none;color:#991b1b;margin-bottom:12px;padding:10px 14px;background:#fee2e2;border-radius:8px;font-size:14px;"></div>
      <div class="modal-form">
        <div>
          <label>Nombre del Cliente *</label>
          <input type="text" id="ventaClienteNombre" placeholder="Ej: Juan García" autocomplete="off">
        </div>
        <div>
          <label>Producto *</label>
          ${selectHtml}
        </div>
        <div id="ventaInfoProducto" style="display:none;background:#f8faf7;padding:12px 16px;border-radius:10px;border:1px solid #dde8db;font-size:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="color:#6b7280;">Precio unitario:</span>
            <strong id="ventaPrecioUnitario" style="color:#C1A44D;">$0.00</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6b7280;">Stock disponible:</span>
            <strong id="ventaStockDisponible">0</strong>
          </div>
        </div>
        <div>
          <label>Cantidad *</label>
          <input type="number" id="ventaCantidad" min="1" max="9999" value="1" oninput="calcularTotalVenta()">
        </div>
        <div style="background:rgba(193,164,77,0.08);padding:14px 18px;border-radius:10px;border:1px solid rgba(193,164,77,0.25);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:14px;color:#374151;font-weight:600;">Total a pagar:</span>
            <strong id="ventaTotal" style="color:#C1A44D;font-size:22px;font-weight:800;">$0.00</strong>
          </div>
        </div>
        <div>
          <label>Monto Recibido (MXN) *</label>
          <input type="number" id="ventaMontoRecibido" min="0" step="0.01" placeholder="0.00" oninput="calcularCambioVenta()">
        </div>
        <div id="ventaCambioBox" style="display:none;background:#f0fdf4;padding:14px 18px;border-radius:10px;border:1px solid #bbf7d0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:14px;color:#374151;font-weight:600;">Cambio a entregar:</span>
            <strong id="ventaCambio" style="font-size:20px;font-weight:800;color:#166534;">$0.00</strong>
          </div>
        </div>
      </div>
    </div>
    <div style="padding:16px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #f3f4f6;">
      <button class="btn-action btn-view" onclick="cerrarModal()">Cancelar</button>
      <button class="btn-primary" id="btnGuardarVenta" onclick="guardarVenta()" ${!hayProductos ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
        <i class="fas fa-receipt"></i> Guardar y Generar Ticket
      </button>
    </div>`;
}

function actualizarInfoProductoVenta() {
  const select = document.getElementById('ventaProductoSelect');
  const infoDiv = document.getElementById('ventaInfoProducto');
  const cantInput = document.getElementById('ventaCantidad');
  if (!select || !select.value) { if (infoDiv) infoDiv.style.display = 'none'; return; }
  const opt = select.options[select.selectedIndex];
  const precio = parseFloat(opt.dataset.precio) || 0;
  const stock = parseInt(opt.dataset.stock, 10) || 0;
  document.getElementById('ventaPrecioUnitario').textContent = `$${precio.toFixed(2)}`;
  document.getElementById('ventaStockDisponible').textContent = stock;
  cantInput.max = stock;
  if (parseInt(cantInput.value, 10) > stock) cantInput.value = stock;
  infoDiv.style.display = 'block';
  calcularTotalVenta();
}

function calcularTotalVenta() {
  const select = document.getElementById('ventaProductoSelect');
  const cantInput = document.getElementById('ventaCantidad');
  const totalEl = document.getElementById('ventaTotal');
  if (!select || !select.value || !cantInput || !totalEl) return;
  const precio = parseFloat(select.options[select.selectedIndex].dataset.precio) || 0;
  const cant   = parseInt(cantInput.value, 10) || 0;
  totalEl.textContent = `$${(precio * cant).toFixed(2)}`;
  calcularCambioVenta();
}

function calcularCambioVenta() {
  const totalEl   = document.getElementById('ventaTotal');
  const montoInput = document.getElementById('ventaMontoRecibido');
  const cambioEl  = document.getElementById('ventaCambio');
  const cambioBox = document.getElementById('ventaCambioBox');
  if (!totalEl || !montoInput || !cambioEl) return;
  const total = parseFloat(totalEl.textContent.replace('$', '')) || 0;
  const monto = parseFloat(montoInput.value) || 0;
  if (monto <= 0) { if (cambioBox) cambioBox.style.display = 'none'; return; }
  const cambio = monto - total;
  if (cambioBox) {
    cambioBox.style.display = 'block';
    cambioBox.style.borderColor = cambio < 0 ? '#fecaca' : '#bbf7d0';
    cambioBox.style.background  = cambio < 0 ? '#fff5f5' : '#f0fdf4';
  }
  cambioEl.style.color = cambio < 0 ? '#dc2626' : '#166534';
  cambioEl.textContent = cambio < 0 ? `-$${Math.abs(cambio).toFixed(2)}` : `$${cambio.toFixed(2)}`;
}

async function guardarVenta() {
  const clienteNombre    = (document.getElementById('ventaClienteNombre')?.value || '').trim();
  const select           = document.getElementById('ventaProductoSelect');
  const cantInput        = document.getElementById('ventaCantidad');
  const montoInput       = document.getElementById('ventaMontoRecibido');
  const totalEl          = document.getElementById('ventaTotal');
  const btn              = document.getElementById('btnGuardarVenta');

  const mostrarError = (msg) => {
    const el = document.getElementById('ventaFormError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  };

  if (!clienteNombre)           { mostrarError('El nombre del cliente es obligatorio.'); return; }
  if (!select || !select.value) { mostrarError('Selecciona un producto.'); return; }
  const cant = parseInt(cantInput?.value, 10) || 0;
  if (cant <= 0)                { mostrarError('La cantidad debe ser mayor a 0.'); return; }

  const opt            = select.options[select.selectedIndex];
  const productoId     = select.value;
  const productoNombre = opt.text.split(' —')[0].trim();
  const precioUnitario = parseFloat(opt.dataset.precio) || 0;
  const stockActual    = parseInt(opt.dataset.stock, 10) || 0;
  const total          = parseFloat(totalEl?.textContent.replace('$', '')) || 0;
  const montoRecibido  = parseFloat(montoInput?.value) || 0;

  if (cant > stockActual)       { mostrarError(`Stock insuficiente. Solo hay ${stockActual} unidad(es) disponible(s).`); return; }
  if (montoRecibido <= 0)       { mostrarError('Ingresa el monto recibido.'); return; }
  if (montoRecibido < total)    { mostrarError(`El monto recibido ($${montoRecibido.toFixed(2)}) es menor al total ($${total.toFixed(2)}).`); return; }

  const cambio = montoRecibido - total;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  document.getElementById('ventaFormError').style.display = 'none';

  try {
    const now = new Date();
    const ventaData = {
      clienteNombre, productoId, productoNombre, precioUnitario,
      cantidad: cant, total, montoRecibido, cambio,
      fecha: now.toISOString(), createdAt: now.toISOString(),
    };
    const ventaRef = await addDoc(collection(db, 'ventas'), ventaData);
    await updateDoc(doc(db, 'productos', productoId), { stock: stockActual - cant });
    await generarTicketVentaPDF(ventaRef.id, ventaData);
    cerrarModal();
    cargarVentas();
  } catch (e) {
    console.error('Error guardando venta', e);
    const el = document.getElementById('ventaFormError');
    if (el) { el.textContent = 'Error al guardar la venta. Intenta de nuevo.'; el.style.display = 'block'; }
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-receipt"></i> Guardar y Generar Ticket';
  }
}

async function generarTicketVentaPDF(ventaId, venta) {
  try {
    const { jsPDF } = window.jspdf;
    const PW = 80;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [PW, 160] });

    const fechaObj = new Date(venta.fecha);
    const fechaStr = fechaObj.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const horaStr  = fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    // Header block
    doc.setFillColor(53, 70, 42);
    doc.rect(0, 0, PW, 23, 'F');
    doc.setTextColor(193, 164, 77);
    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('Hotel Casa', PW / 2, 8,  { align: 'center' });
    doc.text('Usumacinta', PW / 2, 14, { align: 'center' });
    doc.setFontSize(7); doc.setTextColor(190, 220, 190);
    doc.text('Emiliano Zapata Centro, Tabasco — Tel: 934 111 8398', PW / 2, 20, { align: 'center' });

    let y = 28;
    doc.setTextColor(0, 0, 0);

    // Ticket title & ID
    doc.setFontSize(10); doc.setFont(undefined, 'bold');
    doc.text('TICKET DE VENTA', PW / 2, y, { align: 'center' }); y += 4;
    doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
    doc.text(`Folio: #${ventaId.substring(0, 10).toUpperCase()}`, PW / 2, y, { align: 'center' }); y += 3;
    doc.text(`${fechaStr}   ${horaStr}`, PW / 2, y, { align: 'center' }); y += 5;

    doc.setDrawColor(200, 200, 200);
    doc.line(5, y, PW - 5, y); y += 5;

    // Customer
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8); doc.setFont(undefined, 'bold');
    doc.text('CLIENTE:', 5, y); y += 4;
    doc.setFont(undefined, 'normal');
    doc.text(venta.clienteNombre.substring(0, 38), 5, y); y += 6;

    doc.line(5, y, PW - 5, y); y += 5;

    // Product detail
    doc.setFont(undefined, 'bold');
    doc.text('PRODUCTO:', 5, y); y += 4;
    doc.setFont(undefined, 'normal');
    const nombreLines = doc.splitTextToSize(venta.productoNombre, PW - 10);
    doc.text(nombreLines, 5, y); y += nombreLines.length * 4 + 1;
    doc.text(`${venta.cantidad} unidad(es)  x  $${venta.precioUnitario.toFixed(2)} c/u`, 5, y); y += 6;

    doc.line(5, y, PW - 5, y); y += 5;

    // Totals table
    doc.setFontSize(9); doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', 5, y);
    doc.text(`$${venta.total.toFixed(2)}`, PW - 5, y, { align: 'right' }); y += 5;
    doc.setFont(undefined, 'normal'); doc.setFontSize(8);
    doc.text('Recibido:', 5, y);
    doc.text(`$${venta.montoRecibido.toFixed(2)}`, PW - 5, y, { align: 'right' }); y += 4;
    doc.setFont(undefined, 'bold');
    doc.text('Cambio:', 5, y);
    doc.text(`$${venta.cambio.toFixed(2)}`, PW - 5, y, { align: 'right' }); y += 8;

    doc.line(5, y, PW - 5, y); y += 6;

    // Footer
    doc.setFont(undefined, 'normal'); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text('¡Gracias por su compra!', PW / 2, y, { align: 'center' }); y += 4;
    doc.setFontSize(7);
    doc.text('www.casausumacinta.com', PW / 2, y, { align: 'center' });

    doc.save(`ticket-venta-${ventaId.substring(0, 8)}.pdf`);
  } catch (e) {
    console.error('Error generando PDF de venta', e);
    alert('Venta guardada correctamente. No se pudo generar el PDF.');
  }
}

// ---- Historial de Ventas ----
let _historialVentas = [];

async function mostrarHistorialVentas() {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="modal-header">
      <h2><i class="fas fa-clock-rotate-left"></i> Historial de Ventas</h2>
      <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body" style="text-align:center;padding:40px;">
      <i class="fas fa-spinner fa-spin" style="font-size:28px;color:#C1A44D;"></i>
      <p style="margin-top:12px;color:#6b7280;">Cargando historial...</p>
    </div>`;
  modal.classList.add('active');

  try {
    const snap = await getDocs(query(collection(db, 'ventas'), orderBy('createdAt', 'desc'), limit(200)));
    _historialVentas = [];
    snap.forEach(d => _historialVentas.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Error cargando historial de ventas', e);
    _historialVentas = [];
  }

  let rowsHtml = '';
  if (_historialVentas.length === 0) {
    rowsHtml = `<tr><td colspan="6" style="text-align:center;padding:36px;color:#9ca3af;"><i class="fas fa-receipt" style="font-size:28px;display:block;margin-bottom:10px;"></i>No hay ventas registradas aún.</td></tr>`;
  } else {
    _historialVentas.forEach((v, idx) => {
      const fechaObj = new Date(v.fecha || v.createdAt);
      const fechaStr = fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
      const horaStr  = fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      rowsHtml += `
        <tr>
          <td style="font-size:12px;color:#6b7280;white-space:nowrap;">${fechaStr}<br><span style="color:#9ca3af;">${horaStr}</span></td>
          <td style="font-weight:600;">${v.clienteNombre}</td>
          <td style="font-size:13px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.productoNombre}</td>
          <td style="text-align:center;font-weight:600;">${v.cantidad}</td>
          <td style="font-weight:700;color:#C1A44D;white-space:nowrap;">$${Number(v.total).toFixed(2)}</td>
          <td>
            <button class="btn-action btn-view" onclick="verTicketHistorial(${idx})" title="Descargar ticket PDF">
              <i class="fas fa-file-pdf"></i> Ticket
            </button>
          </td>
        </tr>`;
    });
  }

  const totalGeneral = _historialVentas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  modalContent.innerHTML = `
    <div class="modal-header">
      <h2><i class="fas fa-clock-rotate-left"></i> Historial de Ventas</h2>
      <button class="close-modal" onclick="cerrarModal()" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body" style="padding:0;">
      ${ _historialVentas.length > 0 ? `
      <div style="padding:12px 20px;background:#f8faf7;border-bottom:1px solid #e5e7eb;display:flex;gap:24px;font-size:13px;flex-wrap:wrap;">
        <span><i class="fas fa-receipt" style="color:#C1A44D;"></i> <strong>${_historialVentas.length}</strong> venta(s) registrada(s)</span>
        <span><i class="fas fa-peso-sign" style="color:#5FAB67;"></i> Total acumulado: <strong style="color:#35462A;">$${totalGeneral.toFixed(2)}</strong></span>
      </div>` : '' }
      <div style="overflow-x:auto;max-height:55vh;">
        <table class="users-table" style="min-width:520px;">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th style="text-align:center;">Cant.</th>
              <th>Total</th>
              <th>Ticket</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
    <div style="padding:14px 24px 18px;display:flex;justify-content:flex-end;border-top:1px solid #f3f4f6;">
      <button class="btn-action btn-view" onclick="cerrarModal()">Cerrar</button>
    </div>`;
}

function verTicketHistorial(idx) {
  const venta = _historialVentas[idx];
  if (venta) generarTicketVentaPDF(venta.id, venta);
}
// ============================================================

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

// Funciones de Caja
async function cargarCaja() {
  try {
    const cajaContent = document.getElementById('cajaContent');
    if (!cajaContent) return;
    
    // Obtener información de caja del día
    const hoy = new Date();
    const _padC = n => String(n).padStart(2, '0');
    // IMPORTANTE: usar fecha LOCAL para evitar desfase UTC (bug después de las 6 PM)
    const hoyString = `${hoy.getFullYear()}-${_padC(hoy.getMonth()+1)}-${_padC(hoy.getDate())}`;
    
    let cajaAbierta = null;
    let cajaCerrada = null;
    let totalIngresos = 0;
    
    try {
      // Obtener TODAS las cajas del día (abierta y cerrada)
      const cajasSnap = await getDocs(collection(db, 'cajas'));
      
      cajasSnap.forEach(doc => {
        const data = doc.data();
        let fechaString = '';
        // Preferir campo fechaYMD (string local confiable); si no, derivar de la fecha
        if (data.fechaYMD) {
          fechaString = data.fechaYMD;
        } else {
          const fa = data.fechaApertura;
          const d = fa && fa.toDate ? fa.toDate() : (fa instanceof Date ? fa : null);
          if (d) fechaString = `${d.getFullYear()}-${_padC(d.getMonth()+1)}-${_padC(d.getDate())}`;
        }
        
        if (fechaString === hoyString) {
          if (data.estado === 'Abierta') {
            cajaAbierta = { id: doc.id, ...data };
          } else if (data.estado === 'Cerrada') {
            cajaCerrada = { id: doc.id, ...data };
          }
        }
      });
    } catch (e) {
      console.warn('Advertencia al buscar cajas:', e.message);
    }
    
    // Calcular total de ingresos del día
    totalIngresos = await calcularTotalIngresosDia();
    
    if (cajaAbierta) {
      // Mostrar UI de caja abierta
      const horaApertura = cajaAbierta.horaApertura || 'No registrada';
      cajaContent.innerHTML = `
        <div style="background: #e8f5e9; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #27ae60;">
          <h3 style="color: #27ae60; margin: 0 0 15px 0;">✅ Caja Abierta</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <p style="margin: 0; color: #666; font-size: 13px;"><strong>Abierta por:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #2f5230;">${cajaAbierta.abiertoPor || 'No registrado'}</p>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 13px;"><strong>Hora de Apertura:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #2f5230;">${horaApertura}</p>
            </div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; color: #666; font-size: 13px;"><strong>Total de Ingresos del Día:</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #27ae60;">$${totalIngresos.toFixed(2)}</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-primary" onclick="cerrarCaja()" style="background: #c0392b;">🔒 Cerrar Caja</button>
            <button class="btn-primary" onclick="generarReportePDFDiario()" style="background: #3498db;">📄 Generar Reporte PDF</button>
          </div>
        </div>
      `;
    } else if (cajaCerrada) {
      // Mostrar UI indicando que la caja ya fue cerrada hoy
      const horaCierre = cajaCerrada.horaCierre || 'No registrada';
      cajaContent.innerHTML = `
        <div style="background: #f3e5f5; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #9c27b0;">
          <h3 style="color: #9c27b0; margin: 0 0 15px 0;">🔒 Caja Cerrada</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <p style="margin: 0; color: #666; font-size: 13px;"><strong>Abierta por:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #6a1b9a;">${cajaCerrada.abiertoPor || 'No registrado'}</p>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 13px;"><strong>Hora de Cierre:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #6a1b9a;">${horaCierre}</p>
            </div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0; color: #666; font-size: 13px;"><strong>Total de Ingresos del Día:</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #9c27b0;">$${totalIngresos.toFixed(2)}</p>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
            <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⚠️ Nota:</strong> La caja ya fue cerrada hoy. No se puede abrir una nueva caja el mismo día.</p>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn-primary" onclick="generarReportePDFDiario()" style="background: #3498db; flex: 1;">📄 Ver Reporte del Día</button>
          </div>
        </div>
      `;
    } else {
      // Mostrar UI para abrir caja (no hay caja hoy)
      cajaContent.innerHTML = `
        <div style="background: #fff3cd; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #f39c12;">
          <h3 style="color: #f39c12; margin: 0 0 15px 0;">ℹ️ Caja Cerrada</h3>
          <p style="color: #666; margin-bottom: 20px;">Abre la caja para comenzar a registrar ingresos del día.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <form id="formAbrirCaja" style="display: grid; gap: 15px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <label style="display: block; font-weight: 700; color: #2f5230; margin-bottom: 8px; font-size: 14px;">📅 Fecha de Apertura</label>
                  <input type="date" id="fechaAperturaCaja" required style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e0e6e9; font-size: 14px; background: white;">
                </div>
                <div>
                  <label style="display: block; font-weight: 700; color: #2f5230; margin-bottom: 8px; font-size: 14px;">💰 Saldo Inicial</label>
                  <input type="number" id="saldoInicial" placeholder="Monto inicial" step="0.01" value="0" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e0e6e9; font-size: 14px; background: white;">
                </div>
              </div>
              <div>
                <label style="display: block; font-weight: 700; color: #2f5230; margin-bottom: 8px; font-size: 14px;">👤 ¿Quién abre la caja?</label>
                <input type="text" id="quienAbreCaja" placeholder="Ej. Juan Pérez" required style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e0e6e9; font-size: 14px; background: white;">
              </div>
              <div style="display: flex; gap: 10px;">
                <button type="button" class="btn-primary" onclick="abrirCaja()" style="background: #27ae60; flex: 1;">🔓 Abrir Caja</button>
                <button type="reset" class="btn-secondary" style="flex: 1;">Limpiar</button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      // Mostrar fecha actual (solo lectura, no editable)
      setTimeout(() => {
        const n = new Date();
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        const display = document.getElementById('fechaAperturaCajaDisplay');
        if (display) display.value = `${n.getDate()} de ${meses[n.getMonth()]} de ${n.getFullYear()}`;
      }, 100);
    }
  } catch (error) {
    console.error('Error cargando caja:', error);
    document.getElementById('cajaContent').innerHTML = `
      <div style="background: #ffebee; padding: 20px; border-radius: 12px; border-left: 4px solid #c0392b;">
        <h3 style="color: #c0392b; margin: 0 0 10px 0;">⚠️ Error</h3>
        <p style="color: #666; margin: 0;">${error.message || 'Error al cargar información de caja'}</p>
        <button class="btn-primary" onclick="cargarCaja()" style="background: #2196F3; margin-top: 10px;">🔄 Reintentar</button>
      </div>
    `;
  }
}

async function abrirCaja() {
  const quienAbre = document.getElementById('quienAbreCaja')?.value?.trim();
  const saldoInicial = parseFloat(document.getElementById('saldoInicial')?.value || 0);
  
  if (!quienAbre) {
    alert('Ingresa el nombre de quien abre la caja');
    return;
  }
  
  // Siempre usar la fecha LOCAL de hoy — el usuario no puede cambiarla
  const _hoyAbre = new Date();
  const _padAb = n => String(n).padStart(2, '0');
  const fechaString = `${_hoyAbre.getFullYear()}-${_padAb(_hoyAbre.getMonth()+1)}-${_padAb(_hoyAbre.getDate())}`;
  
  try {
    // Verificar que no haya otra caja abierta o cerrada en la misma fecha
    let yaExisteAbierta = false;
    let yaExisteCerrada = false;
    try {
      const cajasSnap = await getDocs(collection(db, 'cajas'));
      cajasSnap.forEach(doc => {
        const data = doc.data();
        let fechaApertString = '';
        if (data.fechaYMD) {
          fechaApertString = data.fechaYMD;
        } else {
          const fa = data.fechaApertura;
          const d = fa && fa.toDate ? fa.toDate() : (fa instanceof Date ? fa : null);
          if (d) fechaApertString = `${d.getFullYear()}-${_padAb(d.getMonth()+1)}-${_padAb(d.getDate())}`;
        }
        if (fechaApertString === fechaString) {
          if (data.estado === 'Abierta') {
            yaExisteAbierta = true;
          } else if (data.estado === 'Cerrada') {
            yaExisteCerrada = true;
          }
        }
      });
    } catch (e) {
      console.warn('Advertencia verificando cajas:', e.message);
    }
    
    if (yaExisteAbierta) {
      alert('❌ Ya existe una caja abierta para esta fecha.');
      return;
    }
    
    if (yaExisteCerrada) {
      alert('❌ Ya existe una caja cerrada para esta fecha. No se puede abrir una nueva caja el mismo día una vez cerrada.');
      return;
    }
    
    // Obtener hora actual
    const ahora = new Date();
    const horaApertura = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Fecha al inicio del día local (sin depender del input)
    const fecha = new Date(_hoyAbre.getFullYear(), _hoyAbre.getMonth(), _hoyAbre.getDate(), 0, 0, 0, 0);
    
    const cajaData = {
      fechaApertura: fecha,
      fechaYMD: fechaString,
      horaApertura: horaApertura,
      abiertoPor: quienAbre,
      saldoInicial: saldoInicial,
      estado: 'Abierta',
      totalIngresosPrevisto: 0,
      creado: new Date(),
      actualizado: new Date()
    };
    
    const cajaRef = await addDoc(collection(db, 'cajas'), cajaData);
    
    // Si hay saldo inicial, crear transacción
    if (saldoInicial > 0) {
      const transaccionData = {
        fecha: fecha,
        tipo: 'Saldo Inicial',
        concepto: 'Saldo Inicial de Caja',
        monto: saldoInicial,
        cajaId: cajaRef.id,
        creado: new Date()
      };
      
      await addDoc(collection(db, 'transacciones_caja'), transaccionData);
    }
    
    alert(`✅ Caja abierta exitosamente a las ${horaApertura}\nSaldo Inicial: $${saldoInicial.toFixed(2)}`);
    cargarCaja();
  } catch (error) {
    console.error('Error al abrir caja:', error);
    alert('Error al abrir caja: ' + error.message);
  }
}

async function cerrarCaja() {
  if (!confirm('¿Estás seguro que deseas cerrar la caja? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    // Obtener caja abierta del día
    const hoy = new Date();
    const _padCj = n => String(n).padStart(2, '0');
    const hoyString = `${hoy.getFullYear()}-${_padCj(hoy.getMonth()+1)}-${_padCj(hoy.getDate())}`;
    
    let cajaAbiertaId = null;
    let cajaAbiertaData = null;
    
    try {
      const cajasAbiertas = await getDocs(query(collection(db, 'cajas'), where('estado', '==', 'Abierta')));
      cajasAbiertas.forEach(doc => {
        const data = doc.data();
        let fechaApertString = '';
        if (data.fechaYMD) {
          fechaApertString = data.fechaYMD;
        } else {
          const fa = data.fechaApertura;
          const d = fa && fa.toDate ? fa.toDate() : (fa instanceof Date ? fa : null);
          if (d) fechaApertString = `${d.getFullYear()}-${_padCj(d.getMonth()+1)}-${_padCj(d.getDate())}`;
        }
        if (fechaApertString === hoyString) {
          cajaAbiertaId = doc.id;
          cajaAbiertaData = data;
        }
      });
    } catch (e) {
      console.warn('Advertencia buscando cajas:', e.message);
    }
    
    if (!cajaAbiertaId) {
      alert('No hay caja abierta para cerrar.');
      return;
    }
    
    const totalIngresos = await calcularTotalIngresosDia();
    const ahora = new Date();
    const horaCierre = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Actualizar caja con información de cierre
    await updateDoc(doc(db, 'cajas', cajaAbiertaId), {
      estado: 'Cerrada',
      fechaCierre: new Date(hoyString),
      horaCierre: horaCierre,
      totalIngresosReal: totalIngresos,
      actualizado: new Date()
    });
    
    alert(`✅ Caja cerrada exitosamente a las ${horaCierre}\nTotal de ingresos: $${totalIngresos.toFixed(2)}`);
    cargarCaja();
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    alert('Error al cerrar caja: ' + error.message);
  }
}

async function calcularTotalIngresosDia() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyMs = hoy.getTime();
    const mananaMs = hoyMs + (24 * 60 * 60 * 1000);
    
    // Obtener todas las reservas y filtrar por fecha de creación
    let totalIngresos = 0;
    let totalEfectivo = 0;
    
    try {
      // Sumar ingresos de reservas confirmadas del día
      const reservasSnap = await getDocs(collection(db, 'reservas'));
      
      reservasSnap.forEach(doc => {
        const r = doc.data();
        if (r.status === 'Confirmada' && r.total) {
          let fechaCreado = null;
          
          if (r.creado && r.creado.toDate) {
            fechaCreado = r.creado.toDate().getTime();
          } else if (r.creado instanceof Date) {
            fechaCreado = r.creado.getTime();
          }
          
          // Verificar si la reserva fue creada hoy
          if (fechaCreado && fechaCreado >= hoyMs && fechaCreado < mananaMs) {
            totalIngresos += parseFloat(r.total) || 0;
          }
        }
      });
      
      // Sumar transacciones de caja del día (ingresos y saldo inicial)
      const transaccionesSnap = await getDocs(collection(db, 'transacciones_caja'));
      
      transaccionesSnap.forEach(doc => {
        const t = doc.data();
        if (t.fecha) {
          let fechaTrans = null;
          
          if (t.fecha && t.fecha.toDate) {
            fechaTrans = t.fecha.toDate().getTime();
          } else if (t.fecha instanceof Date) {
            fechaTrans = t.fecha.getTime();
          }
          
          // Verificar si la transacción es de hoy
          if (fechaTrans && fechaTrans >= hoyMs && fechaTrans < mananaMs) {
            if (t.tipo === 'Ingreso' || t.tipo === 'Saldo Inicial') {
              totalEfectivo += parseFloat(t.monto) || 0;
            }
          }
        }
      });

      // Sumar ventas del día
      const ventasSnap = await getDocs(collection(db, 'ventas'));
      ventasSnap.forEach(doc => {
        const v = doc.data();
        const fechaV = new Date(v.fecha || v.createdAt || 0).getTime();
        if (fechaV >= hoyMs && fechaV < mananaMs) {
          totalIngresos += Number(v.total) || 0;
        }
      });
    } catch (e) {
      console.warn('Advertencia calculando ingresos:', e.message);
    }
    
    // Retornar el total combinado: reservas + ventas
    return totalIngresos;
  } catch (error) {
    console.error('Error calculando ingresos:', error);
    return 0;
  }
}

async function generarReportePDFDiario() {
  try {
    const hoy = new Date();
    const _padR = n => String(n).padStart(2, '0');
    const hoyString = `${hoy.getFullYear()}-${_padR(hoy.getMonth()+1)}-${_padR(hoy.getDate())}`;
    const fechaFormato = hoy.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Obtener información de caja
    let cajaInfo = null;
    try {
      const cajasSnap = await getDocs(collection(db, 'cajas'));
      cajasSnap.forEach(doc => {
        const data = doc.data();
        let fechaApertString = data.fechaYMD || '';
        if (!fechaApertString) {
          const fa = data.fechaApertura;
          const d = fa && fa.toDate ? fa.toDate() : (fa instanceof Date ? fa : null);
          if (d) fechaApertString = `${d.getFullYear()}-${_padR(d.getMonth()+1)}-${_padR(d.getDate())}`;
        }
        if (fechaApertString === hoyString) {
          cajaInfo = data;
        }
      });
    } catch (e) {
      console.warn('Advertencia buscando cajas:', e.message);
    }
    
    // Obtener reservas del día
    const reservasSnap = await getDocs(collection(db, 'reservas'));
    const hoyMs = hoy.setHours(0, 0, 0, 0);
    const mananaMs = hoyMs + (24 * 60 * 60 * 1000);
    
    let reservasHoy = [];
    reservasSnap.forEach(doc => {
      const r = doc.data();
      if (r.status === 'Confirmada' && r.total) {
        let fechaCreado = null;
        
        if (r.creado && r.creado.toDate) {
          fechaCreado = r.creado.toDate().getTime();
        } else if (r.creado instanceof Date) {
          fechaCreado = r.creado.getTime();
        }
        
        if (fechaCreado && fechaCreado >= hoyMs && fechaCreado < mananaMs) {
          reservasHoy.push(r);
        }
      }
    });
    
    // Obtener transacciones de caja del día
    let transaccionesHoy = [];
    try {
      const transaccionesSnap = await getDocs(collection(db, 'transacciones_caja'));
      
      transaccionesSnap.forEach(doc => {
        const t = doc.data();
        if (t.fecha) {
          let fechaTrans = null;
          
          if (t.fecha && t.fecha.toDate) {
            fechaTrans = t.fecha.toDate().getTime();
          } else if (t.fecha instanceof Date) {
            fechaTrans = t.fecha.getTime();
          }
          
          if (fechaTrans && fechaTrans >= hoyMs && fechaTrans < mananaMs) {
            transaccionesHoy.push(t);
          }
        }
      });
    } catch (e) {
      console.warn('Advertencia obteniendo transacciones:', e.message);
    }
    
    const totalIngresos = await calcularTotalIngresosDia();
    
    // Obtener ventas del día
    let ventasHoy = [];
    let totalVentasHoy = 0;
    try {
      const ventasSnap = await getDocs(collection(db, 'ventas'));
      ventasSnap.forEach(docVenta => {
        const v = docVenta.data();
        const fechaV = new Date(v.fecha || v.createdAt || 0).getTime();
        if (fechaV >= hoyMs && fechaV < mananaMs) {
          ventasHoy.push(v);
          totalVentasHoy += Number(v.total) || 0;
        }
      });
    } catch (e) {
      console.warn('Advertencia obteniendo ventas del día:', e.message);
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFillColor(47, 139, 58);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('REPORTE DE CAJA DIARIO', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Fecha: ${fechaFormato}`, 105, 32, { align: 'center' });
    
    // Contenido
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    let yPos = 50;
    
    // Información de caja
    if (cajaInfo) {
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.text('INFORMACIÓN DE CAJA', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Abierta por: ${cajaInfo.abiertoPor}`, 20, yPos);
      yPos += 5;
      doc.text(`Hora de apertura: ${cajaInfo.horaApertura || 'No registrada'}`, 20, yPos);
      yPos += 5;
      doc.text(`Saldo Inicial: $${(cajaInfo.saldoInicial || 0).toFixed(2)}`, 20, yPos);
      yPos += 5;
      if (cajaInfo.estado === 'Cerrada') {
        doc.text(`Hora de cierre: ${cajaInfo.horaCierre || 'No registrada'}`, 20, yPos);
        yPos += 5;
      }
    }
    
    yPos += 8;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE INGRESOS', 20, yPos);
    yPos += 8;
    
    // Desglose: reservas + ventas
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Ingresos por Reservas:', 20, yPos);
    doc.text(`$${totalIngresos.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 5;
    doc.text('Ingresos por Ventas:', 20, yPos);
    doc.text(`$${totalVentasHoy.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 7;
    
    // Total general
    doc.setFillColor(230, 245, 230);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL GENERAL: $${(totalIngresos + totalVentasHoy).toFixed(2)}`, 20, yPos + 2);
    yPos += 15;
    
    // Detalle de reservas
    if (reservasHoy.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('DETALLE DE RESERVAS', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      // Encabezados de tabla
      doc.setFont(undefined, 'bold');
      doc.text('Huésped', 20, yPos);
      doc.text('Hab', 50, yPos);
      doc.text('Método', 75, yPos);
      doc.text('Total', 100, yPos);
      doc.text('Efectivo', 125, yPos);
      doc.text('Cambio', 150, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'normal');
      reservasHoy.forEach((r) => {
        const nombre = r.guestName || 'N/A';
        const habitacion = r.roomNumber || 'N/A';
        const metodo = r.paymentMethod || '—';
        const total = r.total ? `$${parseFloat(r.total).toFixed(2)}` : '$0.00';
        const efectivo = r.efectivoRecibido ? `$${parseFloat(r.efectivoRecibido).toFixed(2)}` : '—';
        const cambio = r.cambio ? `$${parseFloat(r.cambio).toFixed(2)}` : '—';
        
        doc.text(nombre.substring(0, 18), 20, yPos);
        doc.text(habitacion, 50, yPos);
        doc.text(metodo, 75, yPos);
        doc.text(total, 100, yPos);
        doc.text(efectivo, 125, yPos);
        doc.text(cambio, 150, yPos);
        yPos += 5;
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
    } else {
      doc.setFontSize(10);
      doc.text('No hay reservas confirmadas para hoy', 20, yPos);
      yPos += 10;
    }
    
    // Transacciones de efectivo
    if (transaccionesHoy.length > 0) {
      yPos += 5;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('MOVIMIENTOS DE CAJA', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('Concepto', 20, yPos);
      doc.text('Tipo', 80, yPos);
      doc.text('Monto', 130, yPos);
      yPos += 5;
      
      doc.setFont(undefined, 'normal');
      let totalMovimientos = 0;
      transaccionesHoy.forEach((t) => {
        const concepto = t.concepto || 'N/A';
        const tipo = t.tipo || '—';
        const monto = `$${parseFloat(t.monto || 0).toFixed(2)}`;
        
        doc.text(concepto.substring(0, 40), 20, yPos);
        doc.text(tipo, 80, yPos);
        doc.text(monto, 130, yPos);
        yPos += 5;
        
        totalMovimientos += parseFloat(t.monto || 0);
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      // Total movimientos
      doc.setFont(undefined, 'bold');
      doc.text(`Total en Efectivo: $${totalMovimientos.toFixed(2)}`, 20, yPos + 3);
      yPos += 12;
    }
    
    // VENTAS DEL DÍA
    yPos += 5;
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('VENTAS DEL DÍA', 20, yPos);
    yPos += 7;
    
    if (ventasHoy.length > 0) {
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(225, 245, 225);
      doc.rect(20, yPos - 4, 170, 7, 'F');
      doc.text('Cliente', 22, yPos);
      doc.text('Producto', 66, yPos);
      doc.text('Cant.', 128, yPos);
      doc.text('P. Unit.', 146, yPos);
      doc.text('Total', 172, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');
      ventasHoy.forEach(v => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text((v.clienteNombre || '—').substring(0, 22), 22, yPos);
        doc.text((v.productoNombre || '—').substring(0, 30), 66, yPos);
        doc.text(String(v.cantidad || 0), 130, yPos);
        doc.text(`$${Number(v.precioUnitario || 0).toFixed(2)}`, 146, yPos);
        doc.text(`$${Number(v.total || 0).toFixed(2)}`, 172, yPos);
        yPos += 5;
      });
      doc.setDrawColor(180, 180, 180);
      doc.line(20, yPos, 190, yPos);
      yPos += 5;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text(`Total en Ventas: $${totalVentasHoy.toFixed(2)}`, 20, yPos);
      yPos += 6;
    } else {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('No hay ventas registradas para hoy', 20, yPos);
    }
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 105, 285, { align: 'center' });
    
    // Descargar
    doc.save(`Reporte_Caja_${hoyString}.pdf`);
    alert('✅ Reporte PDF generado exitosamente');
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar PDF: ' + error.message);
  }
}

async function generarTicketPDF(reservaId, reservaData, roomData, huespedesIds, nombrePrincipal, telefonoPrincipal) {
  try {
    const { jsPDF } = window.jspdf;
    
    // Formato ticket (ancho: 80mm, alto: 150mm)
    const pageWidth = 80;
    const pageHeight = 150;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight]
    });
    
    const checkInDate = reservaData.checkIn && reservaData.checkIn.toDate ? reservaData.checkIn.toDate() : new Date(reservaData.checkIn);
    const checkOutDate = reservaData.checkOut && reservaData.checkOut.toDate ? reservaData.checkOut.toDate() : new Date(reservaData.checkOut);
    
    // Encabezado hotel
    doc.setFillColor(47, 139, 58);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Hotel Casa', pageWidth / 2, 7, { align: 'center' });
    doc.text('Usumacinta', pageWidth / 2, 13, { align: 'center' });
    
    // Contenido
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    let yPos = 25;
    
    // Número de ticket
    doc.setFont(undefined, 'bold');
    doc.text(`TICKET #${reservaId.substring(0, 8).toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    // Línea divisora
    doc.setDrawColor(200, 200, 200);
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += 4;
    
    // Información del huésped
    doc.setFont(undefined, 'bold');
    doc.text('HUÉSPED:', 5, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 4;
    doc.text(nombrePrincipal.substring(0, 30), 5, yPos);
    yPos += 3;
    doc.text(`Telf: ${telefonoPrincipal}`, 5, yPos);
    yPos += 5;
    
    // Información de la habitación
    doc.setFont(undefined, 'bold');
    doc.text('HABITACIÓN:', 5, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 4;
    doc.text(`No. ${roomData.numero}`, 5, yPos);
    yPos += 3;
    doc.text(`Tipo: ${roomData.tipo}`, 5, yPos);
    yPos += 3;
    doc.text(`Capacidad: ${roomData.capacidad} persona(s)`, 5, yPos);
    yPos += 5;
    
    // Información de la reserva
    doc.setFont(undefined, 'bold');
    doc.text('RESERVA:', 5, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 4;
    doc.text(`Check-in: ${checkInDate.toLocaleDateString('es-MX')}`, 5, yPos);
    yPos += 3;
    doc.text(`Check-out: ${checkOutDate.toLocaleDateString('es-MX')}`, 5, yPos);
    yPos += 3;
    doc.text(`Noches: ${reservaData.noches}`, 5, yPos);
    yPos += 3;
    doc.text(`Precio/Noche: $${parseFloat(reservaData.precioNoche).toFixed(2)}`, 5, yPos);
    yPos += 5;
    
    // Total
    doc.setFillColor(230, 245, 230);
    doc.rect(5, yPos - 2, pageWidth - 10, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text(`TOTAL: $${parseFloat(reservaData.total).toFixed(2)}`, pageWidth / 2, yPos + 2, { align: 'center' });
    yPos += 10;
    
    // Tipo de pago
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Pago: ${reservaData.paymentMethod}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    
    // Fecha de generación
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const ahora = new Date();
    doc.text(`Generado: ${ahora.toLocaleDateString('es-MX')} ${ahora.toLocaleTimeString('es-MX')}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Guardar en Firestore
    const ticketData = {
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
    };
    
    await addDoc(collection(db, 'tickets'), ticketData);
    
    // Descargar PDF automáticamente
    const timestamp = ahora.toISOString().replace(/[:.]/g, '-').substring(0, 19);
    doc.save(`Ticket_${nombrePrincipal.replace(/\s+/g, '_')}_${timestamp}.pdf`);
    
  } catch (error) {
    console.error('Error generando ticket PDF:', error);
  }
}

async function cargarTickets() {
  try {
    const ticketsSnap = await getDocs(query(collection(db, 'tickets'), orderBy('creado', 'desc')));
    
    const ticketsContent = document.getElementById('ticketsContent');
    
    if (ticketsSnap.empty) {
      ticketsContent.innerHTML = '<p>No hay tickets generados aún.</p>';
      return;
    }
    
    let html = `
      <div style="margin-bottom: 15px;">
        <button class="btn-primary" onclick="location.reload()">🔄 Actualizar</button>
      </div>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0; border-bottom: 2px solid #999;">
              <th style="padding: 10px; text-align: left;">Huésped</th>
              <th style="padding: 10px; text-align: left;">Habitación</th>
              <th style="padding: 10px; text-align: left;">Check-in</th>
              <th style="padding: 10px; text-align: left;">Check-out</th>
              <th style="padding: 10px; text-align: center;">Total</th>
              <th style="padding: 10px; text-align: center;">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    ticketsSnap.forEach(doc => {
      const t = doc.data();
      const checkInDate = t.checkIn && t.checkIn.toDate ? t.checkIn.toDate().toLocaleDateString('es-MX') : new Date(t.checkIn).toLocaleDateString('es-MX');
      const checkOutDate = t.checkOut && t.checkOut.toDate ? t.checkOut.toDate().toLocaleDateString('es-MX') : new Date(t.checkOut).toLocaleDateString('es-MX');
      const fechaCreado = t.creado && t.creado.toDate ? t.creado.toDate().toLocaleDateString('es-MX') : new Date(t.creado).toLocaleDateString('es-MX');
      
      html += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px;">${t.nombreHuesped}</td>
          <td style="padding: 10px;">${t.numeroHabitacion} (${t.tipoHabitacion})</td>
          <td style="padding: 10px;">${checkInDate}</td>
          <td style="padding: 10px;">${checkOutDate}</td>
          <td style="padding: 10px; text-align: center; font-weight: bold;">$${parseFloat(t.total).toFixed(2)}</td>
          <td style="padding: 10px; text-align: center;">
            <button class="btn-primary" style="padding: 6px 12px; font-size: 12px; margin: 0 2px;" onclick="descargarTicket('${doc.id}', '${t.nombreHuesped}', '${fechaCreado}')">📥 Descargar</button>
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    ticketsContent.innerHTML = html;
    
  } catch (error) {
    console.error('Error cargando tickets:', error);
    document.getElementById('ticketsContent').innerHTML = `<p style="color: red;">Error al cargar tickets: ${error.message}</p>`;
  }
}

async function descargarTicket(ticketId, nombreHuesped, fechaCreado) {
  try {
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
    
    if (!ticketDoc.exists()) {
      alert('Ticket no encontrado');
      return;
    }
    
    const t = ticketDoc.data();
    const { jsPDF } = window.jspdf;
    
    // Formato ticket (ancho: 80mm, alto: 150mm)
    const pageWidth = 80;
    const pageHeight = 150;
    
    const docPDF = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight]
    });
    
    const checkInDate = t.checkIn && t.checkIn.toDate ? t.checkIn.toDate() : new Date(t.checkIn);
    const checkOutDate = t.checkOut && t.checkOut.toDate ? t.checkOut.toDate() : new Date(t.checkOut);
    
    // Encabezado hotel
    docPDF.setFillColor(47, 139, 58);
    docPDF.rect(0, 0, pageWidth, 20, 'F');
    docPDF.setTextColor(255, 255, 255);
    docPDF.setFontSize(16);
    docPDF.setFont(undefined, 'bold');
    docPDF.text('Hotel Casa', pageWidth / 2, 7, { align: 'center' });
    docPDF.text('Usumacinta', pageWidth / 2, 13, { align: 'center' });
    
    // Contenido
    docPDF.setTextColor(0, 0, 0);
    docPDF.setFontSize(8);
    let yPos = 25;
    
    // Número de ticket
    docPDF.setFont(undefined, 'bold');
    docPDF.text(`TICKET #${t.reservaId.substring(0, 8).toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    // Línea divisora
    docPDF.setDrawColor(200, 200, 200);
    docPDF.line(5, yPos, pageWidth - 5, yPos);
    yPos += 4;
    
    // Información del huésped
    docPDF.setFont(undefined, 'bold');
    docPDF.text('HUÉSPED:', 5, yPos);
    docPDF.setFont(undefined, 'normal');
    yPos += 4;
    docPDF.text(t.nombreHuesped.substring(0, 30), 5, yPos);
    yPos += 3;
    docPDF.text(`Telf: ${t.telefonoHuesped}`, 5, yPos);
    yPos += 5;
    
    // Información de la habitación
    docPDF.setFont(undefined, 'bold');
    docPDF.text('HABITACIÓN:', 5, yPos);
    docPDF.setFont(undefined, 'normal');
    yPos += 4;
    docPDF.text(`No. ${t.numeroHabitacion}`, 5, yPos);
    yPos += 3;
    docPDF.text(`Tipo: ${t.tipoHabitacion}`, 5, yPos);
    yPos += 3;
    docPDF.text(`Capacidad: ${t.capacidadHabitacion} persona(s)`, 5, yPos);
    yPos += 5;
    
    // Información de la reserva
    docPDF.setFont(undefined, 'bold');
    docPDF.text('RESERVA:', 5, yPos);
    docPDF.setFont(undefined, 'normal');
    yPos += 4;
    docPDF.text(`Check-in: ${checkInDate.toLocaleDateString('es-MX')}`, 5, yPos);
    yPos += 3;
    docPDF.text(`Check-out: ${checkOutDate.toLocaleDateString('es-MX')}`, 5, yPos);
    yPos += 3;
    docPDF.text(`Noches: ${t.noches}`, 5, yPos);
    yPos += 3;
    docPDF.text(`Precio/Noche: $${parseFloat(t.precioNoche).toFixed(2)}`, 5, yPos);
    yPos += 5;
    
    // Total
    docPDF.setFillColor(230, 245, 230);
    docPDF.rect(5, yPos - 2, pageWidth - 10, 8, 'F');
    docPDF.setFont(undefined, 'bold');
    docPDF.setFontSize(9);
    docPDF.text(`TOTAL: $${parseFloat(t.total).toFixed(2)}`, pageWidth / 2, yPos + 2, { align: 'center' });
    yPos += 10;
    
    // Tipo de pago
    docPDF.setFontSize(8);
    docPDF.setFont(undefined, 'normal');
    docPDF.text(`Pago: ${t.tipoPago}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    
    // Fecha de generación
    docPDF.setFontSize(7);
    docPDF.setTextColor(150, 150, 150);
    docPDF.text(`Generado: ${fechaCreado}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Descargar
    docPDF.save(`Ticket_${nombreHuesped.replace(/\s+/g, '_')}_${fechaCreado}.pdf`);
    
  } catch (error) {
    console.error('Error descargando ticket:', error);
    alert('Error al descargar ticket: ' + error.message);
  }
}

// Exportar funciones globales
window.cambiarSeccion = cambiarSeccion;
window.cerrarSesion = cerrarSesion;
window.cargarHabitaciones = cargarHabitaciones;
window.cargarHuespedes = cargarHuespedes;
window.cargarReservas = cargarReservas;
window.mostrarFormularioHabitacion = mostrarFormularioHabitacion;
window.guardarHabitacion = guardarHabitacion;
window.editarHabitacion = editarHabitacion;
window.eliminarHabitacion = eliminarHabitacion;
window.mostrarFormularioReserva = mostrarFormularioReserva;
window.mostrarFormularioHuesped = mostrarFormularioHuesped;
window.guardarHuesped = guardarHuesped;
window.editarHuesped = editarHuesped;
window.eliminarHuesped = eliminarHuesped;
window.verDetallesHuesped = verDetallesHuesped;
window.guardarReserva = guardarReserva;
window.editarReserva = editarReserva;
window.eliminarReserva = eliminarReserva;
window.generarReporte = generarReporte;
window.generarReportePDFUsuarios = generarReportePDFUsuarios;
window.generarReportePDFOcupacion = generarReportePDFOcupacion;
window.exportarDatos = exportarDatos;
window.limpiarCache = limpiarCache;
window.irASeccion = irASeccion;
window.cerrarModal = cerrarModal;
window.cargarReportes = cargarReportes;
window.verDetallesUsuario = verDetallesUsuario;
window.seleccionarCantidad = seleccionarCantidad;
window.generarFormulariosHuespedes = generarFormulariosHuespedes;
window.guardarMultiplesHuespedes = guardarMultiplesHuespedes;
window.actualizarHabitacionesPorCapacidad = actualizarHabitacionesPorCapacidad;
window.calcularTotal = calcularTotal;
window.actualizarPorcentajePago = actualizarPorcentajePago;
window.cargarCaja = cargarCaja;
window.abrirCaja = abrirCaja;
window.cerrarCaja = cerrarCaja;
window.calcularTotalIngresosDia = calcularTotalIngresosDia;
window.generarReportePDFDiario = generarReportePDFDiario;
window.mostrarCampoEfectivo = mostrarCampoEfectivo;
window.calcularCambio = calcularCambio;
window.generarTicketPDF = generarTicketPDF;
window.cargarTickets = cargarTickets;
window.descargarTicket = descargarTicket;
window.filtrarHuespedes = filtrarHuespedes;
window.cargarVentas = cargarVentas;
window.mostrarFormularioProducto = mostrarFormularioProducto;
window.guardarProducto = guardarProducto;
window.eliminarProducto = eliminarProducto;
window.previewProductoImg = previewProductoImg;
window.mostrarFormularioVenta = mostrarFormularioVenta;
window.actualizarInfoProductoVenta = actualizarInfoProductoVenta;
window.calcularTotalVenta = calcularTotalVenta;
window.calcularCambioVenta = calcularCambioVenta;
window.guardarVenta = guardarVenta;
window.mostrarHistorialVentas = mostrarHistorialVentas;
window.verTicketHistorial = verTicketHistorial;

function cerrarSesion() {
  if (confirm('¿Deseas cerrar sesión?')) {
    signOut(auth).then(() => {
      window.location.href = 'index.html';
    }).catch(error => {
      console.error('Error al cerrar sesión:', error);
    });
  }
}
