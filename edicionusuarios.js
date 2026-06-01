import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";
import { mostrarMensaje, tomarFoto } from './utils.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let usuarioSeleccionado = null;
let stream = null;
let camaraEdicionActiva = false;
let fotoEdicionCapturada = false;

// Cargar formulario de edición
export async function cargarFormularioEdicion(usuarioId) {
  try {
    const usuariosSnap = await getDocs(collection(db, 'usuarios'));
    const contenidoDiv = document.getElementById('contenidoEditar');
    
    if (!usuarioId) {
      // Mostrar lista de selección
      let html = '<h3>Selecciona un usuario para editar:</h3><table class="users-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Acciones</th></tr></thead><tbody>';
      
      usuariosSnap.forEach(doc => {
        const usuario = doc.data();
        html += `
          <tr>
            <td>${usuario.usuario}</td>
            <td>${usuario.nombreCompleto}</td>
            <td><button class="btn-action btn-edit" onclick="abrirFormularioEdicion('${doc.id}')">Editar</button></td>
          </tr>
        `;
      });
      
      html += '</tbody></table>';
      contenidoDiv.innerHTML = html;
      return;
    }

    // Mostrar formulario de edición
    const usuarioDoc = usuariosSnap.docs.find(d => d.id === usuarioId);
    if (!usuarioDoc) return;

    const usuario = usuarioDoc.data();
    usuarioSeleccionado = { id: usuarioId, ...usuario };

    let html = `
      <form id="formEditarUsuario" onsubmit="guardarCambiosUsuario(event, '${usuarioId}')">
        <div class="form-grid">
          <div class="form-group">
            <label>Nombre Completo:</label>
            <input type="text" value="${usuario.nombreCompleto}" id="editNombreCompleto" required>
          </div>

          <div class="form-group">
            <label>Usuario:</label>
            <input type="text" value="${usuario.usuario}" id="editUsuario" disabled title="No se puede cambiar el usuario">
          </div>

          <div class="form-group">
            <label>Correo Electrónico:</label>
            <input type="email" value="${usuario.correo}" id="editCorreo" required>
          </div>

          <div class="form-group">
            <label>Fecha de Nacimiento:</label>
            <input type="date" value="${usuario.fechaNacimiento}" id="editFechaNacimiento" required>
          </div>

          <div class="form-group">
            <label>Teléfono:</label>
            <input type="tel" value="${usuario.telefono}" id="editTelefono" required>
          </div>

          <div class="form-group full">
            <label>Dirección:</label>
            <input type="text" value="${usuario.direccion}" id="editDireccion" required>
          </div>

          <div class="form-group">
            <label>INE Anverso:</label>
            <div class="file-input-wrapper">
              <label class="file-input-label">Cambiar archivo (opcional)</label>
              <input type="file" id="editIneAnverso" accept="image/*,.pdf">
            </div>
            <small>Archivo actual: ${usuario.archivos?.ineAnverso || 'No cargado'}</small>
          </div>

          <div class="form-group">
            <label>INE Reverso:</label>
            <div class="file-input-wrapper">
              <label class="file-input-label">Cambiar archivo (opcional)</label>
              <input type="file" id="editIneReverso" accept="image/*,.pdf">
            </div>
            <small>Archivo actual: ${usuario.archivos?.ineReverso || 'No cargado'}</small>
          </div>

          <div class="form-group full">
            <label>Comprobante de Domicilio:</label>
            <div class="file-input-wrapper">
              <label class="file-input-label">Cambiar archivo (opcional)</label>
              <input type="file" id="editComprobanteDomicilio" accept="image/*,.pdf">
            </div>
            <small>Archivo actual: ${usuario.archivos?.comprobanteDomicilio || 'No cargado'}</small>
          </div>

          <div class="form-group full">
            <label>Foto de Perfil:</label>
            <div class="file-input-wrapper">
              <label class="file-input-label">Cambiar archivo (opcional)</label>
              <input type="file" id="editFotoPerfil" accept="image/*,.pdf">
            </div>
            <small>Archivo actual: ${usuario.archivos?.fotoPerfil || 'No cargado'}</small>
          </div>
        </div>

        <div class="camera-section">
          <h3>📷 Capturar Foto de Edición</h3>
          <p>Se capturará quién está editando este usuario</p>
          <video id="videoEdicion" style="width: 100%; max-width: 300px; border-radius: 5px; background: #000; margin: 10px 0; display: none;"></video>
          <canvas id="canvasEdicion" style="display: none;"></canvas>
          <div class="camera-buttons">
            <button type="button" class="btn-camera" id="iniciarCamaraEdicion">Iniciar Cámara</button>
            <button type="button" class="btn-camera stop" id="tomarFotoEdicion" style="display: none;">Tomar Foto</button>
            <button type="button" class="btn-camera stop" id="detenerCamaraEdicion" style="display: none;">Detener</button>
          </div>
          <div id="fotoEdicionStatus" style="margin-top: 10px; color: #e74c3c; font-weight: bold;"></div>
        </div>

        <div class="button-group">
          <button type="submit" class="btn-submit" id="btnGuardarCambios">Guardar Cambios</button>
          <button type="button" class="btn-cancel" onclick="volverAListaEdicion()">Cancelar</button>
        </div>
      </form>
    `;

    contenidoDiv.innerHTML = html;

    // Event listeners para cámara de edición
    document.getElementById('iniciarCamaraEdicion').addEventListener('click', iniciarCamaraEdicion);
    document.getElementById('tomarFotoEdicion').addEventListener('click', tomarFotoEdicion);
    document.getElementById('detenerCamaraEdicion').addEventListener('click', detenerCamaraEdicion);

  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(document.getElementById('contenidoEditar'), 'Error al cargar usuario', 'error');
  }
}

// Iniciar cámara para edición
async function iniciarCamaraEdicion() {
  try {
    camaraEdicionActiva = true;
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });

    const video = document.getElementById('videoEdicion');
    video.style.display = 'block';
    video.srcObject = stream;

    document.getElementById('iniciarCamaraEdicion').style.display = 'none';
    document.getElementById('tomarFotoEdicion').style.display = 'inline-block';
    document.getElementById('detenerCamaraEdicion').style.display = 'inline-block';
    document.getElementById('fotoEdicionStatus').textContent = '🟢 Cámara activa';

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('fotoEdicionStatus').textContent = '❌ No se pudo acceder a la cámara';
  }
}

// Tomar foto de edición
function tomarFotoEdicion() {
  const canvas = document.getElementById('canvasEdicion');
  const video = document.getElementById('videoEdicion');
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  fotoEdicionCapturada = true;
  document.getElementById('fotoEdicionStatus').textContent = '✅ Foto capturada correctamente';
  document.getElementById('tomarFotoEdicion').textContent = 'Tomar otra foto';
}

// Detener cámara de edición
function detenerCamaraEdicion() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  camaraEdicionActiva = false;
  const video = document.getElementById('videoEdicion');
  video.style.display = 'none';
  video.srcObject = null;
  document.getElementById('iniciarCamaraEdicion').style.display = 'inline-block';
  document.getElementById('tomarFotoEdicion').style.display = 'none';
  document.getElementById('detenerCamaraEdicion').style.display = 'none';
  document.getElementById('fotoEdicionStatus').textContent = '';
}

// Guardar cambios
export async function guardarCambiosUsuario(event, usuarioId) {
  event.preventDefault();

  if (!fotoEdicionCapturada) {
    alert('Debe capturar una foto de edición');
    return;
  }

  try {
    const nombreCompleto = document.getElementById('editNombreCompleto').value;
    const correo = document.getElementById('editCorreo').value;
    const telefono = document.getElementById('editTelefono').value;
    const fechaNacimiento = document.getElementById('editFechaNacimiento').value;
    const direccion = document.getElementById('editDireccion').value;

    const actualizaciones = {
      nombreCompleto,
      correo,
      telefono,
      fechaNacimiento,
      direccion,
      fechaEdicion: new Date(),
      editadoPor: auth.currentUser?.uid || 'Sistema'
    };

    // Subir archivos opcionales
    const nuevosCambios = await subirArchivosEdicion(usuarioId);
    Object.assign(actualizaciones, nuevosCambios);

    // Subir foto de edición
    const canvas = document.getElementById('canvasEdicion');
    const fotoEdicion = await subirFotoEdicion(usuarioId, canvas);
    actualizaciones.fotoEdicion = fotoEdicion;

    // Actualizar en Firestore
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    await updateDoc(usuarioRef, actualizaciones);

    alert('Usuario actualizado correctamente');
    volverAListaEdicion();

  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar usuario: ' + error.message);
  }
}

// Subir archivos de edición
async function subirArchivosEdicion(usuarioId) {
  const cambios = {};

  const archivosActualizar = [
    { inputId: 'editIneAnverso', carpeta: 'ineanverso', key: 'ineAnverso' },
    { inputId: 'editIneReverso', carpeta: 'inereverso', key: 'ineReverso' },
    { inputId: 'editComprobanteDomicilio', carpeta: 'comprobante de domicilio', key: 'comprobanteDomicilio' },
    { inputId: 'editFotoPerfil', carpeta: 'fotodeperfil', key: 'fotoPerfil' }
  ];

  for (const archivo of archivosActualizar) {
    const inputElement = document.getElementById(archivo.inputId);
    if (inputElement.files.length > 0) {
      const file = inputElement.files[0];
      const timestamp = new Date().getTime();
      const filename = `${usuarioId}_${timestamp}_${file.name}`;
      const fileRef = ref(storage, `${archivo.carpeta}/${filename}`);

      await uploadBytes(fileRef, file);
      cambios[`archivos.${archivo.key}`] = filename;
    }
  }

  return cambios;
}

// Subir foto de edición
async function subirFotoEdicion(usuarioId, canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `edicion_${usuarioId}_${timestamp}.jpg`;
      const photoRef = ref(storage, `fotosagregarusuarioeditareliminar/${filename}`);

      await uploadBytes(photoRef, blob);
      resolve(filename);
    }, 'image/jpeg', 0.9);
  });
}

// Volver a lista de edición
function volverAListaEdicion() {
  detenerCamaraEdicion();
  fotoEdicionCapturada = false;
  usuarioSeleccionado = null;
  cargarFormularioEdicion();
}

// Exportar funciones globales
window.abrirFormularioEdicion = cargarFormularioEdicion;
window.guardarCambiosUsuario = guardarCambiosUsuario;
window.volverAListaEdicion = volverAListaEdicion;
window.iniciarCamaraEdicion = iniciarCamaraEdicion;
window.tomarFotoEdicion = tomarFotoEdicion;
window.detenerCamaraEdicion = detenerCamaraEdicion;
