import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let video = null;
let stream = null;
let loginSuccessful = false;

// Obtener referencias del DOM
const formLogin = document.getElementById('formLogin');
const formForgotPassword = document.getElementById('formForgotPassword');
const messageContainer = document.getElementById('messageContainer');

// Event Listeners
formLogin.addEventListener('submit', handleLogin);
formForgotPassword.addEventListener('submit', handleForgotPassword);

// Manejar el login
async function handleLogin(e) {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const contraseña = document.getElementById('contraseña').value;

  if (!usuario || !contraseña) {
    mostrarMensaje('Por favor completa todos los campos', 'error');
    return;
  }

  try {
    // Buscar el usuario por nombre de usuario en Firestore
    const usersRef = collection(db, 'usuarios');
    const q = query(usersRef, where('usuario', '==', usuario));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      mostrarMensaje('Usuario no encontrado', 'error');
      return;
    }

    const usuarioData = querySnapshot.docs[0].data();
    const correo = usuarioData.correo;

    // Intentar iniciar sesión con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, correo, contraseña);
    
    loginSuccessful = true;
    mostrarMensaje('Login exitoso. Accediendo al sistema...', 'success');

    // Iniciar captura de foto
    iniciarCapturaDeFoto(userCredential.user.uid);

  } catch (error) {
    console.error('Error:', error);
    if (error.code === 'auth/invalid-credential') {
      mostrarMensaje('Usuario o contraseña incorrectos', 'error');
    } else if (error.code === 'auth/user-not-found') {
      mostrarMensaje('Usuario no encontrado', 'error');
    } else {
      mostrarMensaje('Error en el login: ' + error.message, 'error');
    }
  }
}

// Iniciar captura de foto
async function iniciarCapturaDeFoto(userId) {
  try {
    const cameraPreview = document.getElementById('cameraPreview');
    video = document.getElementById('videoLogin');
    
    cameraPreview.style.display = 'block';
    formLogin.style.display = 'none';

    // Acceder a la cámara
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });

    video.srcObject = stream;

    // Asegurar reproducción automática y en móviles
    video.autoplay = true;
    video.playsInline = true;
    try {
      await video.play();
    } catch (playError) {
      console.warn('video.play() falló:', playError);
    }

    // Capturar foto (asegurar un único listener)
    const captureBtn = document.getElementById('capturePhoto');
    captureBtn.replaceWith(captureBtn.cloneNode(true));
    document.getElementById('capturePhoto').addEventListener('click', () => {
      capturarFoto(userId);
    });

  } catch (error) {
    console.error('Error al acceder a la cámara:', error);
    mostrarMensaje('No se pudo acceder a la cámara', 'error');
    loginSuccessful = false;
  }
}

// Capturar foto de login
async function capturarFoto(userId) {
  try {
    const canvas = document.getElementById('canvasLogin');
    const context = canvas.getContext('2d');
    const videoEl = document.getElementById('videoLogin');

    const w = videoEl.videoWidth || 640;
    const h = videoEl.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    context.drawImage(videoEl, 0, 0, w, h);

    // Obtener Base64 (dataURL)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `login_${userId}_${timestamp}.jpg`;

    // Registrar en Firestore guardando la imagen como Base64 (campo fotoDataUrl)
    const loginLogRef = collection(db, 'loginicios');
    await addDoc(loginLogRef, {
      userId: userId,
      fechaHora: new Date(),
      fotoFilename: filename,
      fotoDataUrl: dataUrl,
      timestamp: new Date().getTime()
    });

    // Detener stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Redirigir al dashboard
    window.location.href = 'dashboard.html';

  } catch (error) {
    console.error('Error capturando foto:', error);
    mostrarMensaje('Error al capturar la foto', 'error');
  }
}

// Manejar formulario de contraseña olvidada
async function handleForgotPassword(e) {
  e.preventDefault();

  const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const telefono = document.getElementById('telefono').value.trim();

  if (!nombreCompleto || !correo || !telefono) {
    mostrarMensaje('Por favor completa todos los campos', 'error');
    return;
  }

  try {
    // Enviar a Formspree
    const response = await fetch('https://formspree.io/f/mdawakab', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombreCompleto: nombreCompleto,
        correo: correo,
        telefono: telefono,
        asunto: 'Recuperación de Contraseña - Hotel Casausumacinta',
        timestamp: new Date().toLocaleString('es-MX')
      })
    });

    if (response.ok) {
      mostrarMensaje('Se ha enviado tu solicitud. Revisa tu correo pronto.', 'success');
      formForgotPassword.reset();
      setTimeout(() => {
        volverAlLogin();
      }, 2000);
    } else {
      mostrarMensaje('Error al enviar el formulario', 'error');
    }

  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje('Error al procesar tu solicitud', 'error');
  }
}

// Funciones auxiliares
function mostrarMensaje(mensaje, tipo) {
  messageContainer.textContent = mensaje;
  messageContainer.className = `message-container ${tipo}`;
  
  if (tipo === 'error') {
    setTimeout(() => {
      messageContainer.className = 'message-container';
    }, 5000);
  }
}

function mostrarFormularioOlvideContraseña(e) {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('forgotPasswordForm').style.display = 'block';
}

function volverAlLogin(e) {
  if (e) e.preventDefault();
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('forgotPasswordForm').style.display = 'none';
  formForgotPassword.reset();
  messageContainer.className = 'message-container';
}

// Nota: `addDoc` ya se importa arriba junto con otros helpers de Firestore
