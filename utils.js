// Utilidades compartidas del sistema

export function mostrarMensaje(elemento, mensaje, tipo = 'error') {
  if (elemento) {
    elemento.textContent = mensaje;
    elemento.className = `message-container ${tipo}`;
    if (tipo === 'error') {
      setTimeout(() => {
        elemento.className = 'message-container';
      }, 5000);
    }
  }
}

export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarTelefono(telefono) {
  const regex = /^[\d\s\-\+\(\)]+$/;
  return regex.test(telefono) && telefono.replace(/\D/g, '').length >= 10;
}

export function validarContraseña(contraseña) {
  return contraseña.length >= 6;
}

export function formatearFecha(fecha) {
  if (!fecha) return '';
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(fecha).toLocaleDateString('es-MX', options);
}

export function generarId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function obtenerHoraActual() {
  const ahora = new Date();
  return ahora.toLocaleString('es-MX');
}

export async function tomarFoto(videoElement) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export function formatearDatos(datos) {
  const datosFormateados = {};
  
  for (const [key, value] of Object.entries(datos)) {
    if (value instanceof Date) {
      datosFormateados[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null) {
      datosFormateados[key] = formatearDatos(value);
    } else {
      datosFormateados[key] = value;
    }
  }
  
  return datosFormateados;
}

export function limpiarFormulario(formularioId) {
  const formulario = document.getElementById(formularioId);
  if (formulario) {
    formulario.reset();
  }
}

export function mostrarCarga(mostrar = true) {
  let loader = document.getElementById('cargaGlobal');
  
  if (mostrar) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'cargaGlobal';
      loader.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
            <p>Procesando...</p>
          </div>
        </div>
      `;
      document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
  } else {
    if (loader) {
      loader.style.display = 'none';
    }
  }
}

export function exportarJSON(datos, nombreArchivo = 'datos') {
  const json = JSON.stringify(datos, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nombreArchivo}_${Date.now()}.json`;
  link.click();
}

export function obtenerParametroURL(nombre) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nombre);
}

export function redirigir(url, tiempo = 0) {
  if (tiempo > 0) {
    setTimeout(() => {
      window.location.href = url;
    }, tiempo);
  } else {
    window.location.href = url;
  }
}
