import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getBytes } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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
    // Validaciones
    const contraseña = document.getElementById('contraseña').value;
    const confirmarContraseña = document.getElementById('confirmarContraseña').value;

    if (contraseña !== confirmarContraseña) {
      mostrarMensaje('Las contraseñas no coinciden', 'error');
      return;
    }

    if (contraseña.length < 6) {
      mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

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

// Subir archivo
async function subirArchivo(inputId, carpeta, userId) {
  const file = document.getElementById(inputId).files[0];
  if (!file) return null;

  const timestamp = new Date().getTime();
  const filename = `${userId}_${timestamp}_${file.name}`;
  const fileRef = ref(storage, `${carpeta}/${filename}`);

  await uploadBytes(fileRef, file);
  return filename;
}

// Subir foto capturada
async function subirFotoCapturada(userId) {
  const canvas = document.getElementById('canvasCapture');
  
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `creacion_${userId}_${timestamp}.jpg`;
      const photoRef = ref(storage, `fotosagregarusuarioeditareliminar/${filename}`);

      await uploadBytes(photoRef, blob);
      resolve(filename);
    }, 'image/jpeg', 0.9);
  });
}

// Cargar lista de usuarios
async function cargarListaUsuarios() {
  const contenido = document.getElementById('contenidoLista');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    
    if (querySnapshot.empty) {
      contenido.innerHTML = '<p>No hay usuarios registrados</p>';
      return;
    }

    let html = '<table class="users-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>';

    querySnapshot.forEach(doc => {
      const usuario = doc.data();
      html += `
        <tr>
          <td>${usuario.usuario}</td>
          <td>${usuario.nombreCompleto}</td>
          <td>${usuario.correo}</td>
          <td>${usuario.telefono}</td>
          <td>
            <button class="btn-action btn-view" onclick="verDetallesUsuario('${doc.id}')">Ver</button>
            <button class="btn-action btn-edit" onclick="prepararEdicion('${doc.id}')">Editar</button>
            <button class="btn-action btn-delete" onclick="prepararEliminacion('${doc.id}')">Eliminar</button>
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
    const userDoc = await getDocs(query(collection(db, 'usuarios'), where('__name__', '==', docId)));
    if (userDoc.empty) return;

    const usuario = userDoc.docs[0].data();
    
    alert(`
Usuario: ${usuario.usuario}
Nombre: ${usuario.nombreCompleto}
Correo: ${usuario.correo}
Teléfono: ${usuario.telefono}
Dirección: ${usuario.direccion}
Fecha Nacimiento: ${usuario.fechaNacimiento}
Creado: ${usuario.fechaCreacion.toDate().toLocaleString('es-MX')}
Creado por: ${usuario.creadoPor}
    `);
  } catch (error) {
    console.error('Error:', error);
  }
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
    
    let html = '<table class="users-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Acciones</th></tr></thead><tbody>';

    querySnapshot.forEach(doc => {
      const usuario = doc.data();
      html += `
        <tr>
          <td>${usuario.usuario}</td>
          <td>${usuario.nombreCompleto}</td>
          <td><button class="btn-action btn-edit" onclick="prepararEdicion('${doc.id}')">Seleccionar</button></td>
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

// Cargar lista para eliminar
async function cargarListaParaEliminar() {
  const contenido = document.getElementById('listaEliminar');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    
    let html = '<table class="users-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Acciones</th></tr></thead><tbody>';

    querySnapshot.forEach(doc => {
      const usuario = doc.data();
      html += `
        <tr>
          <td>${usuario.usuario}</td>
          <td>${usuario.nombreCompleto}</td>
          <td><button class="btn-action btn-delete" onclick="prepararEliminacion('${doc.id}')">Eliminar</button></td>
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

// Preparar edición
window.prepararEdicion = async function(docId) {
  // Implementación completa en la siguiente parte
  console.log('Editar usuario:', docId);
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
    const canvas = document.createElement('canvas');
    const video = document.createElement('video');
    video.srcObject = stream;

    setTimeout(() => {
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach(track => track.stop());

      canvas.toBlob(async (blob) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `eliminacion_${userId}_${timestamp}.jpg`;
        const photoRef = ref(storage, `fotosagregarusuarioeditareliminar/${filename}`);
        await uploadBytes(photoRef, blob);
      }, 'image/jpeg', 0.9);
    }, 500);

  } catch (error) {
    console.error('Error capturando foto:', error);
  }
}

// Exportar funciones globales
window.verDetallesUsuario = verDetallesUsuario;
window.mostrarMensaje = mostrarMensaje;
window.cerrarSesion = cerrarSesion;
