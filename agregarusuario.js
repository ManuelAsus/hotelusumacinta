import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
// No se usa Firebase Storage: almacenaremos archivos como Base64 en Firestore

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// storage no usado cuando guardamos Base64

let stream = null;
let fotoCapturada = false;
let camaraActiva = false;

// Obtener referencias del DOM
const formAgregarUsuario = document.getElementById('formAgregarUsuario');
const tabButtons = document.querySelectorAll('.nav-item');
const videoCapture = document.getElementById('videoCapture');
const iniciarCamaraBtn = document.getElementById('iniciarCamara');
const tomarFotoBtn = document.getElementById('tomarFoto');
const detenerCamaraBtn = document.getElementById('detenerCamara');
const fotoCreacionStatus = document.getElementById('fotoCreacionStatus');
const mensajeAgregar = document.getElementById('mensajeAgregar');

// Event Listeners
formAgregarUsuario.addEventListener('submit', handleAgregarUsuario);
tabButtons.forEach(btn => btn.addEventListener('click', cambiarTab));

// Search handlers
const searchInput = document.getElementById('searchUsuarios');
const searchClear = document.getElementById('searchClear');
if (searchInput) searchInput.addEventListener('input', () => cargarListaUsuarios(searchInput.value.trim()));
if (searchClear) searchClear.addEventListener('click', () => { if (searchInput) { searchInput.value=''; cargarListaUsuarios(''); } });

// Inputs de archivo
document.getElementById('ineAnverso').addEventListener('change', (e) => previewArchivo(e, 'ineAnverso'));
document.getElementById('ineReverso').addEventListener('change', (e) => previewArchivo(e, 'ineReverso'));
document.getElementById('comprobanteDomicilio').addEventListener('change', (e) => previewArchivo(e, 'comprobanteDomicilio'));
document.getElementById('fotoPerfil').addEventListener('change', (e) => previewArchivo(e, 'fotoPerfil'));

// Botones de cámara
iniciarCamaraBtn.addEventListener('click', iniciarCamara);
tomarFotoBtn.addEventListener('click', tomarFoto);
detenerCamaraBtn.addEventListener('click', detenerCamara);

// Cambiar entre tabs
function cambiarTab(e) {
  const tabName = e.target.dataset.tab;
  
  // Remover clase active de todos
  tabButtons.forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Agregar clase active al clickeado
  e.target.classList.add('active');
  // Si se pidió la pestaña 'editar', redirigimos a la lista principal para evitar la vista separada
  if (tabName === 'editar') {
    document.getElementById('lista').classList.add('active');
    // cargar lista para edición (mismos botones Editar disponibles en la tabla)
    cargarListaUsuarios();
    mostrarMensaje('Selecciona un usuario en la lista para editar', 'success');
    return;
  }

  document.getElementById(tabName).classList.add('active');
  
  // Cargar contenido según la tab
  if (tabName === 'lista') {
    cargarListaUsuarios();
  } else if (tabName === 'editar') {
    cargarFormularioEditar();
  } else if (tabName === 'eliminar') {
    cargarFormularioEliminar();
  }
}

// Preview de archivo
function previewArchivo(e, fieldName) {
  const file = e.target.files[0];
  if (!file) return;

  // Mostrar nombre del archivo con tamaño
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  const fileNameElement = document.getElementById(fieldName + 'Name');
  
  fileNameElement.textContent = `✅ ${file.name} (${sizeMB} MB)`;
  fileNameElement.classList.add('has-file');
  fileNameElement.classList.remove('no-file');

  console.log(`Archivo seleccionado: ${fieldName} - ${file.name}`);
}

// Iniciar cámara
async function iniciarCamara() {
  try {
    camaraActiva = true;
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });

    videoCapture.srcObject = stream;
    videoCapture.play();
    
    iniciarCamaraBtn.style.display = 'none';
    tomarFotoBtn.style.display = 'inline-block';
    detenerCamaraBtn.style.display = 'inline-block';
    fotoCreacionStatus.textContent = '🟢 Cámara activa';

  } catch (error) {
    console.error('Error:', error);
    fotoCreacionStatus.textContent = '❌ No se pudo acceder a la cámara';
  }
}

// Tomar foto
function tomarFoto() {
  const canvas = document.getElementById('canvasCapture');
  const context = canvas.getContext('2d');

  canvas.width = videoCapture.videoWidth;
  canvas.height = videoCapture.videoHeight;
  context.drawImage(videoCapture, 0, 0, canvas.width, canvas.height);

  fotoCapturada = true;
  fotoCreacionStatus.textContent = '✅ Foto capturada correctamente';
  tomarFotoBtn.textContent = 'Tomar otra foto';
}

// Detener cámara
function detenerCamara() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  camaraActiva = false;
  videoCapture.srcObject = null;
  iniciarCamaraBtn.style.display = 'inline-block';
  tomarFotoBtn.style.display = 'none';
  detenerCamaraBtn.style.display = 'none';
  fotoCreacionStatus.textContent = 'Cámara desactivada';
}

// Manejar agregar usuario
async function handleAgregarUsuario(e) {
  e.preventDefault();
  try {


    // Validar que todos los archivos estén presentes
    const ineAnverso = document.getElementById('ineAnverso');
    const ineReverso = document.getElementById('ineReverso');
    const comprobanteDomicilio = document.getElementById('comprobanteDomicilio');
    const fotoPerfil = document.getElementById('fotoPerfil');

    if (!ineAnverso.files[0]) {
      mostrarMensaje('Debe cargar el INE Anverso', 'error');
      return;
    }
    if (!ineReverso.files[0]) {
      mostrarMensaje('Debe cargar el INE Reverso', 'error');
      return;
    }
    if (!comprobanteDomicilio.files[0]) {
      mostrarMensaje('Debe cargar el comprobante de domicilio', 'error');
      return;
    }
    if (!fotoPerfil.files[0]) {
      mostrarMensaje('Debe cargar una foto de perfil', 'error');
      return;
    }

    if (!fotoCapturada) {
      mostrarMensaje('Debe capturar una foto de creación del usuario', 'error');
      return;
    }

    mostrarMensaje('Procesando... Por favor espera', 'success');

    const correo = document.getElementById('correo').value.trim();
    const usuario = document.getElementById('usuario').value.trim();
    const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    // Validar email
    if (!correo.includes('@')) {
      mostrarMensaje('Correo electrónico inválido', 'error');
      return;
    }

    // Verificar que el nombre de usuario no exista ya
    const existingUserQuery = query(collection(db, 'usuarios'), where('usuario', '==', usuario));
    const querySnapshot = await getDocs(existingUserQuery);
    
    if (!querySnapshot.empty) {
      mostrarMensaje('El nombre de usuario ya existe', 'error');
      return;
    }

    // Verificar que el correo no exista ya en Firestore
    const existingEmailQuery = query(collection(db, 'usuarios'), where('correo', '==', correo));
    const emailSnapshot = await getDocs(existingEmailQuery);

    if (!emailSnapshot.empty) {
      mostrarMensaje('El correo ya está registrado. Usa otro correo.', 'error');
      return;
    }

    // Generar un ID de usuario interno sin cambiar el usuario autenticado actual
    const userRef = doc(collection(db, 'usuarios'));
    const userId = userRef.id;

    // Subir archivos
    const archivos = {
      ineAnverso: await subirArchivo('ineAnverso', 'ineanverso', userId),
      ineReverso: await subirArchivo('ineReverso', 'inereverso', userId),
      comprobanteDomicilio: await subirArchivo('comprobanteDomicilio', 'comprobante de domicilio', userId),
      fotoPerfil: await subirArchivo('fotoPerfil', 'fotodeperfil', userId),
      fotoCreacion: await subirFotoCapturada(userId)
    };

    console.log('Archivos subidos:', archivos);

    // Obtener usuario actualmente autenticado
    const usuarioActual = auth.currentUser?.uid || 'Sistema';

    // Guardar datos en Firestore
    await setDoc(userRef, {
      userId: userId,
      usuario: usuario,
      nombreCompleto: nombreCompleto,
      correo: correo,
      fechaNacimiento: fechaNacimiento,
      telefono: telefono,
      direccion: direccion,
      archivos: archivos,
      fotoCreacion: archivos.fotoCreacion,
      fechaCreacion: new Date(),
      creadoPor: usuarioActual,
      activo: true,
      timestamp: new Date().getTime()
    });

    console.log('Usuario guardado en Firestore');
    mostrarMensaje('✅ Usuario creado exitosamente', 'success');
    
    // Limpiar formulario
    formAgregarUsuario.reset();
    fotoCapturada = false;
    detenerCamara();
    fotoCreacionStatus.textContent = '';

    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('Error completo:', error);
    mostrarMensaje('Error al crear usuario: ' + error.message, 'error');
  }
}

// "Subir" archivo -> leer como Base64 y devolver metadata + dataURL
async function subirArchivo(inputId, carpeta, userId) {
  const input = document.getElementById(inputId);
  const file = input?.files?.[0];
  if (!file) return null;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  return {
    filename: `${userId}_${Date.now()}_${file.name}`,
    contentType: file.type,
    size: file.size,
    dataUrl: dataUrl
  };
}

// Obtener foto capturada como Base64
async function subirFotoCapturada(userId) {
  const canvas = document.getElementById('canvasCapture');

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const filename = `creacion_${userId}_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
        resolve({ filename, dataUrl });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
  });
}

// Cargar lista de usuarios
async function cargarListaUsuarios(filter = '') {
  const contenido = document.getElementById('contenidoLista');
  try {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    if (querySnapshot.empty) {
      contenido.innerHTML = '<p>No hay usuarios registrados</p>';
      return;
    }

    // Recolectar usuarios y aplicar filtro local
    const users = [];
    querySnapshot.forEach(doc => users.push({ id: doc.id, data: doc.data() }));
    const q = (filter || '').toLowerCase();
    const filtered = q ? users.filter(u => {
      const d = u.data;
      return (d.nombreCompleto || '').toLowerCase().includes(q) || (d.telefono || '').toLowerCase().includes(q) || (d.usuario || '').toLowerCase().includes(q);
    }) : users;

    if (filtered.length === 0) {
      contenido.innerHTML = '<p>No se encontraron usuarios para la búsqueda</p>';
      return;
    }

    let html = '<table class="users-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>';
    filtered.forEach(u => {
      const usuario = u.data;
      html += `
        <tr>
          <td>${usuario.usuario}</td>
          <td>${usuario.nombreCompleto}</td>
          <td>${usuario.correo}</td>
          <td>${usuario.telefono || ''}</td>
          <td>
            <button class="btn-action btn-view" onclick="verDetallesUsuario('${u.id}')">Ver</button>
            <button class="btn-action btn-edit" onclick="prepararEdicion('${u.id}')">Editar</button>
            <button class="btn-action btn-delete" onclick="prepararEliminacion('${u.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    contenido.innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
    contenido.innerHTML = '<p>Error al cargar usuarios</p>';
  }
}

// Ver detalles de usuario
async function verDetallesUsuario(docId) {
  try {
    const userRef = doc(db, 'usuarios', docId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const usuario = snap.data();

    const body = document.getElementById('viewModalBody');
    // Header with avatar
    const archivos = usuario.archivos || {};
    const fotoPerfil = archivos.fotoPerfil?.dataUrl || null;
    let headerHtml = '<div class="modal-header">';
    if (fotoPerfil) headerHtml += `<div class="avatar"><img src="${fotoPerfil}" alt="avatar"></div>`;
    else {
      const initials = (usuario.nombreCompleto || usuario.usuario || '').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
      headerHtml += `<div class="avatar"><div style="font-weight:700;color:#556;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px">${initials}</div></div>`;
    }
    headerHtml += `<div class="modal-meta"><h3 style="margin:0;color:#35462A;">${usuario.nombreCompleto || 'Usuario'}</h3><p style="margin:6px 0 0;color:#5a5a5a;font-size:14px;">@${usuario.usuario || 'sin_usuario'}</p></div>`;
    headerHtml += '</div>';

    let html = `<div class="modal-body">${headerHtml}<hr/><div class="modal-section"><div class="section-title">Datos del usuario</div>`;
    html += `<div class="view-row"><span class="view-label">Correo</span><span class="view-value">${usuario.correo || '-'}</span></div>`;
    html += `<div class="view-row"><span class="view-label">Teléfono</span><span class="view-value">${usuario.telefono || '-'}</span></div>`;
    html += `<div class="view-row"><span class="view-label">Dirección</span><span class="view-value">${usuario.direccion || '-'}</span></div>`;
    html += `<div class="view-row"><span class="view-label">Fecha Nacimiento</span><span class="view-value">${usuario.fechaNacimiento || '-'}</span></div>`;
    if (usuario.fechaCreacion) {
      try { html += `<div class="view-row"><span class="view-label">Creado</span><span class="view-value">${usuario.fechaCreacion.toDate().toLocaleString('es-MX')}</span></div>`; } catch(e){ html += `<div class="view-row"><span class="view-label">Creado</span><span class="view-value">${String(usuario.fechaCreacion)}</span></div>`; }
    }
    html += '</div></div>';

    function fileSection(label, obj) {
      if (!obj) return '';
      const fn = obj.filename || '';
      const dataUrl = obj.dataUrl || '';
      if (!dataUrl) return `<p><strong>${label}:</strong> ${fn} (sin datos)</p>`;
      let section = `<div class="file-preview"><div>`;
      if (dataUrl.startsWith('data:image')) {
        section += `<img src="${dataUrl}" alt="${fn}">`;
      } else if (dataUrl.startsWith('data:application/pdf')) {
        section += `<div style="width:120px;height:120px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;background:#f7f7f7;">PDF</div>`;
      } else {
        section += `<div style="width:120px;height:120px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;background:#f7f7f7;">Archivo</div>`;
      }
      section += `</div><div><p><strong>${label}:</strong><br>${fn}</p><p><a class="file-link" data-fn="${fn}" href="#" data-url="${dataUrl}">Descargar</a></p></div></div>`;
      return section;
    }

    html = headerHtml + '<hr/>' + html;
    html += fileSection('INE Anverso (Foto/PDF)', archivos.ineAnverso);
    html += fileSection('INE Reverso (Foto/PDF)', archivos.ineReverso);
    html += fileSection('Comprobante de Domicilio (Foto/PDF)', archivos.comprobanteDomicilio);
    html += fileSection('Foto de Perfil (Foto/PDF)', archivos.fotoPerfil);

    body.innerHTML = `${html}<div class="modal-footer"><button id="viewEditBtn" class="btn-primary">✏️ Editar</button><button id="viewDeleteBtn" class="btn-danger">🗑️ Eliminar</button><button id="viewCloseBtn" class="btn-secondary">Cerrar</button></div>`;
    const viewModal = document.getElementById('viewModal');
    viewModal.style.display = 'flex';

    body.querySelectorAll('.file-link').forEach(a => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const url = a.getAttribute('data-url');
        const name = a.getAttribute('data-fn') || 'archivo';
        downloadDataUrl(url, name);
      });
    });

    document.getElementById('viewCloseBtn').onclick = () => { viewModal.style.display = 'none'; };
    document.getElementById('viewEditBtn').onclick = () => { viewModal.style.display = 'none'; prepararEdicion(docId); };
    document.getElementById('viewDeleteBtn').onclick = async () => { viewModal.style.display = 'none'; prepararEliminacion(docId); };
    document.getElementById('viewModalClose').onclick = () => { viewModal.style.display = 'none'; };
  } catch (error) {
    console.error('Error:', error);
  }
}

function downloadDataUrl(dataUrl, filename) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  const blob = new Blob([u8arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Cargar formulario de edición
function cargarFormularioEditar() {
  const contenido = document.getElementById('contenidoEditar');
  contenido.innerHTML = `
    <p>Selecciona un usuario para editar:</p>
    <div id="listaEditar"></div>
  `;
  
  cargarListaParaEditar();
}

// Cargar formulario de eliminación
function cargarFormularioEliminar() {
  const contenido = document.getElementById('contenidoEliminar');
  contenido.innerHTML = `
    <p style="color: #e74c3c;">⚠️ Advertencia: Esta acción no se puede deshacer</p>
    <div id="listaEliminar"></div>
  `;
  
  cargarListaParaEliminar();
}

// Cargar lista para editar
async function cargarListaParaEditar() {
  const contenido = document.getElementById('listaEditar');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    
    let html = '<table class="users-table"><thead><tr><th>Usuario</th><th>Nombre</th></tr></thead><tbody>';

    querySnapshot.forEach(doc => {
      const usuario = doc.data();
      html += `
        <tr>
          <td>${usuario.usuario}</td>
          <td>${usuario.nombreCompleto}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    contenido.innerHTML = html + '<p style="margin-top:12px;color:#666;">La edición está deshabilitada desde la barra lateral.</p>';

  } catch (error) {
    console.error('Error:', error);
    contenido.innerHTML = '<p>Error al cargar usuarios</p>';
  }
}

// Cargar lista para eliminar
async function cargarListaParaEliminar() {
  const contenido = document.getElementById('listaEliminar');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    
    let html = '<table class="users-table"><thead><tr><th>Usuario</th><th>Nombre</th></tr></thead><tbody>';

    querySnapshot.forEach(doc => {
      const usuario = doc.data();
      html += `
        <tr>
          <td>${usuario.usuario}</td>
          <td>${usuario.nombreCompleto}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    contenido.innerHTML = html + '<p style="margin-top:12px;color:#e74c3c;">La eliminación manual desde la interfaz está deshabilitada.</p>';

  } catch (error) {
    console.error('Error:', error);
    contenido.innerHTML = '<p>Error al cargar usuarios</p>';
  }
}

// Preparar edición
window.prepararEdicion = async function(docId) {
  try {
    const userRef = doc(db, 'usuarios', docId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) { mostrarMensaje('Usuario no encontrado', 'error'); return; }
    const usuario = snap.data();

    // Poblar formulario de edición
    document.getElementById('editNombreCompleto').value = usuario.nombreCompleto || '';
    document.getElementById('editCorreo').value = usuario.correo || '';
    document.getElementById('editTelefono').value = usuario.telefono || '';
    document.getElementById('editDireccion').value = usuario.direccion || '';
    document.getElementById('editActivo').value = usuario.activo ? 'true' : 'false';
    document.getElementById('editPassword').value = '';
    document.getElementById('editConfirmPassword').value = '';
    const subtitle = document.getElementById('editModalSubtitle');
    if (subtitle) subtitle.textContent = `Editando ${usuario.usuario || ''}`;
    const avatarEl = document.getElementById('editModalAvatar');
    const fotoPerfil = usuario.archivos?.fotoPerfil?.dataUrl;
    if (avatarEl) {
      avatarEl.innerHTML = fotoPerfil ? `<img src="${fotoPerfil}" alt="avatar">` : `<span style="font-size:24px;color:#6b6b6b;">👤</span>`;
    }

    // Guardar archivos actuales en memoria
    const currentArchivos = usuario.archivos || {};

    // Poblar previews de archivos en el modal de edición
    const previewsContainer = document.getElementById('editFilePreviews');
    previewsContainer.innerHTML = '';
    const keys = [ {k:'ineAnverso', label:'INE Anverso'}, {k:'ineReverso', label:'INE Reverso'}, {k:'comprobanteDomicilio', label:'Comprobante Domicilio'}, {k:'fotoPerfil', label:'Foto de Perfil'} ];
    keys.forEach(item => {
      const obj = currentArchivos[item.k];
      const div = document.createElement('div');
      div.className = 'file-preview';
      if (!obj) {
        div.innerHTML = `<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px dashed #ddd">N/D</div><div style="flex:1"><strong>${item.label}</strong><p>No disponible</p></div>`;
      } else {
        const dataUrl = obj.dataUrl || '';
        let thumb = '';
        if (dataUrl.startsWith('data:image')) thumb = `<img src="${dataUrl}" alt="${obj.filename}">`;
        else thumb = `<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;background:#f7f7f7;border:1px solid #eee">${obj.contentType && obj.contentType.includes('pdf') ? 'PDF' : 'Archivo'}</div>`;
        const dl = `<div class="file-actions"><strong>${item.label}</strong><span>${obj.filename || ''}</span><a class="file-link" href="#" data-url="${dataUrl}" data-fn="${obj.filename}">Descargar</a></div>`;
        div.innerHTML = `<div>${thumb}</div>${dl}`;
      }
      previewsContainer.appendChild(div);
    });

    // attach download handlers
    previewsContainer.querySelectorAll('.file-link').forEach(a => {
      a.addEventListener('click', (ev) => { ev.preventDefault(); downloadDataUrl(a.getAttribute('data-url'), a.getAttribute('data-fn') || 'archivo'); });
    });

    // Mostrar modal
    const editModal = document.getElementById('editModal');
    editModal.style.display = 'flex';

    // Cancelar
    document.getElementById('editModalClose').onclick = () => { editModal.style.display = 'none'; };
    document.getElementById('cancelEdit').onclick = () => { editModal.style.display = 'none'; };

    // Manejar submit (reemplazamos handler anterior para evitar duplicados)
    const form = document.getElementById('editUserForm');
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        mostrarMensaje('Guardando cambios...', 'success');
        const newPassword = document.getElementById('editPassword').value.trim();
        const confirmPassword = document.getElementById('editConfirmPassword').value.trim();
        if (newPassword && newPassword !== confirmPassword) {
          mostrarMensaje('Las contraseñas no coinciden', 'error');
          return;
        }
        if (newPassword && newPassword.length < 6) {
          mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres', 'error');
          return;
        }
        const updated = {
          nombreCompleto: document.getElementById('editNombreCompleto').value.trim(),
          correo: document.getElementById('editCorreo').value.trim(),
          telefono: document.getElementById('editTelefono').value.trim(),
          direccion: document.getElementById('editDireccion').value.trim(),
          activo: document.getElementById('editActivo').value === 'true',
          timestamp: new Date().getTime()
        };
        if (newPassword) {
          updated.password = newPassword;
          updated.passwordUpdatedAt = new Date();
        }

        // Manejar archivos nuevos (si se seleccionan)
        const fileInputs = [
          { id: 'editIneAnverso', key: 'ineAnverso' },
          { id: 'editIneReverso', key: 'ineReverso' },
          { id: 'editComprobanteDomicilio', key: 'comprobanteDomicilio' },
          { id: 'editFotoPerfil', key: 'fotoPerfil' }
        ];

        for (const fi of fileInputs) {
          const input = document.getElementById(fi.id);
          if (input && input.files && input.files[0]) {
            const file = input.files[0];
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(file);
            });
            currentArchivos[fi.key] = { filename: `${usuario.userId || docId}_${Date.now()}_${file.name}`, contentType: file.type, size: file.size, dataUrl };
          }
        }

        updated.archivos = currentArchivos;

        // Tomar foto de evidencia antes de guardar
        mostrarMensaje('Tomando foto de evidencia...', 'success');
        let evidencia = null;
        try {
          evidencia = await capturarFotoEdicion(usuario.userId || docId);
        } catch (err) {
          console.warn('No se pudo capturar evidencia:', err);
        }

        if (evidencia) {
          updated.edicionEvidencia = evidencia;
          updated.editedAt = new Date();
          updated.editedBy = auth.currentUser?.uid || 'Sistema';
        }

        await updateDoc(userRef, updated);

        // Registrar evento de edición
        try {
          await addDoc(collection(db, 'ediciones'), {
            usuarioId: docId,
            editor: auth.currentUser?.uid || 'Sistema',
            fechaEdicion: new Date(),
            cambios: updated,
            evidencia: evidencia || null
          });
        } catch (logErr) {
          console.warn('No se pudo registrar la edición en collection ediciones:', logErr);
        }

        mostrarMensaje('Cambios guardados', 'success');
        editModal.style.display = 'none';
        // Refrescar listas
        cargarListaUsuarios();
        cargarListaParaEditar();
      } catch (err) {
        console.error('Error guardando edición:', err);
        mostrarMensaje('Error al guardar cambios', 'error');
      }
    };

  } catch (error) {
    console.error('Editar error:', error);
    mostrarMensaje('Error al preparar edición', 'error');
  }
};

// Preparar eliminación
window.prepararEliminacion = async function(docId) {
  if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
    try {
      // Registrar eliminación
      const userDoc = await getDocs(query(collection(db, 'usuarios'), where('__name__', '==', docId)));
      const usuario = userDoc.docs[0].data();
      
      const usuarioActual = auth.currentUser?.uid || 'Sistema';

      // Guardar registro de eliminación
      await addDoc(collection(db, 'eliminaciones'), {
        usuarioEliminado: usuario.usuario,
        usuarioQueElimino: usuarioActual,
        fechaEliminacion: new Date(),
        fotoEliminacion: await capturarFotoEliminar(usuario.userId)
      });

      // Eliminar documento
      await deleteDoc(doc(db, 'usuarios', docId));
      
      mostrarMensaje('Usuario eliminado correctamente', 'success');
      cargarListaParaEliminar();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar usuario', 'error');
    }
  }
};

// Funciones auxiliares
function mostrarMensaje(mensaje, tipo) {
  mensajeAgregar.textContent = mensaje;
  mensajeAgregar.className = `message-container ${tipo}`;
}

function cerrarSesion() {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  });
}

async function capturarFotoEliminar(userId) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stream.getTracks().forEach(track => track.stop());

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const filename = `eliminacion_${userId}_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
    return { filename, dataUrl };
  } catch (error) {
    console.error('Error capturando foto:', error);
    return null;
  }
}

// Capturar foto para evidencias de edición
async function capturarFotoEdicion(userId) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    const video = document.createElement('video');
    video.srcObject = stream;
    // ensure play
    video.autoplay = true; video.playsInline = true;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stream.getTracks().forEach(track => track.stop());

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const filename = `edicion_${userId}_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
    return { filename, dataUrl };
  } catch (error) {
    console.error('Error capturando foto de edición:', error);
    throw error;
  }
}

// Exportar funciones globales
window.verDetallesUsuario = verDetallesUsuario;
window.mostrarMensaje = mostrarMensaje;
window.cerrarSesion = cerrarSesion;
