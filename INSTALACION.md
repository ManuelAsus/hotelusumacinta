# 🔧 Guía de Instalación y Configuración

## Requisitos Previos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexión a Internet
- Permisos de cámara habilitados
- Firebase cuenta configurada

## ⚙️ Instalación

### 1. Descargar los archivos

```bash
# Los archivos ya están en tu carpeta:
c:\Users\55221\Downloads\hotelcasausumacinta\
```

### 2. Configurar Firebase (YA HECHO)

✅ Firebase ya está configurado en `firebasedatosdeconexion/firebase.txt`

Verifica que tengas:
- ✅ Firestore Database habilitado
- ✅ Authentication (correo/contraseña) habilitado
- ✅ Storage habilitado

### 3. Crear usuario administrador

1. Abre `agregarusuario.html` en tu navegador
2. Completa el formulario con tus datos
3. **IMPORTANTE:** Debes tener acceso a una cámara para las fotos
4. Una vez creado, podrás usar ese usuario para iniciar sesión

### 4. Iniciar sesión

1. Abre `index.html`
2. Usa el usuario y contraseña que creaste
3. Se capturará automáticamente una foto de seguridad

## 🚀 Primer uso

### Paso 1: Crear usuario de prueba
```
Abre: agregarusuario.html
- Nombre: Juan Prueba
- Usuario: juanprueba
- Correo: juan@test.com
- Contraseña: 123456
- Carga documentos
- Captura foto
```

### Paso 2: Iniciar sesión
```
Abre: index.html
- Usuario: juanprueba
- Contraseña: 123456
- Toma foto automáticamente
```

### Paso 3: Acceder al Dashboard
```
Serás redirigido automáticamente a dashboard.html
- Verás estadísticas
- Acceso rápido a funciones
- Información de la sesión
```

## 📱 Uso en Móvil

1. Abre la URL en tu navegador móvil
2. Permite permisos de cámara
3. La interfaz se adaptará automáticamente
4. Funciona igual en navegador móvil

## 🌐 Servir localmente

### Opción 1: Usar Python (fácil)

```bash
# Python 3
python -m http.server 8000

# Luego accede a: http://localhost:8000
```

### Opción 2: Usar Node.js

```bash
# Instalar http-server
npm install -g http-server

# Ejecutar
http-server

# Luego accede a: http://localhost:8080
```

### Opción 3: Usar VS Code Live Server

1. Instala la extensión "Live Server" en VS Code
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

## 🔐 Configuración de Seguridad

### Permisos de Cámara

Algunos navegadores requieren HTTPS para acceder a la cámara:
- ✅ Localhost: Funciona en HTTP
- ✅ HTTPS: Funciona en cualquier sitio
- ❌ HTTP remoto: No funciona (excepto localhost)

### Almacenamiento de Archivos

Los archivos se guardan en:
- Firebase Storage (archivos documentos)
- Firestore (información del usuario)
- LocalStorage (datos de sesión)

## 🆘 Troubleshooting

### No puedo crear usuario
**Problema:** Error de contraseña
**Solución:** La contraseña debe tener al menos 6 caracteres

**Problema:** Usuario ya existe
**Solución:** Elige un nombre de usuario diferente

**Problema:** Error de Firebase
**Solución:** Verifica que tu Internet esté activa

### La cámara no funciona
**Problema:** "Permiso de cámara denegado"
**Solución:** 
1. Permite permisos en el navegador
2. Recarga la página

**Problema:** "Cámara no disponible"
**Solución:** 
1. Verifica que tu dispositivo tenga cámara
2. Cierra otras aplicaciones que usen la cámara
3. Reinicia el navegador

### No puedo iniciar sesión
**Problema:** "Usuario o contraseña incorrectos"
**Solución:** Verifica credenciales

**Problema:** Queda en espera de foto
**Solución:** 
1. Recarga la página
2. Asegúrate de que tu cámara funciona

### Formspree no recibe correos
**Problema:** "Error al enviar"
**Solución:** 
1. Verifica conexión a Internet
2. Verifica que el endpoint sea: `mdawakab`

## 📊 Estructura de Datos

### Firestore - Colección: usuarios
```json
{
  "userId": "uuid",
  "usuario": "juanprueba",
  "nombreCompleto": "Juan Pérez",
  "correo": "juan@test.com",
  "fechaNacimiento": "1990-01-01",
  "telefono": "+52 5512345678",
  "direccion": "Calle 123, Apt 4",
  "archivos": {
    "ineAnverso": "filename",
    "ineReverso": "filename",
    "comprobanteDomicilio": "filename",
    "fotoPerfil": "filename"
  },
  "fotoCreacion": "filename",
  "fechaCreacion": "2026-05-31",
  "creadoPor": "usuario_id",
  "activo": true
}
```

### Firebase Storage - Carpetas
```
storage/
├── ineanverso/        → Fotos INE anverso
├── inereverso/        → Fotos INE reverso
├── comprobante de domicilio/ → Comprobantes
├── fotodeperfil/      → Fotos de perfil
├── fotosagregarusuarioeditareliminar/ → Auditoría
└── fotoiniciodesesion/ → Fotos de login
```

## 🎯 Funcionalidades en Detalle

### Login (index.html)
- Autenticación con usuario/contraseña
- Captura automática de foto
- Recuperación de contraseña por email
- Registro de fecha/hora de acceso

### Agregar Usuario (agregarusuario.html)
- Creación de nuevos usuarios
- Captura de documentos (INE, comprobante)
- Foto de perfil
- Validación completa de datos
- Captura de foto de quién crea el usuario

### Dashboard (dashboard.html)
- Panel SPA (Single Page Application)
- Estadísticas en tiempo real
- Navegación entre secciones
- Gestión de usuarios (ver, editar, eliminar)
- Gestión de habitaciones (base)
- Gestión de reservas (base)
- Reportes (estructura)

## 📈 Expandir Funcionalidades

### Agregar nueva sección al Dashboard

1. Abre `dashboard.html`
2. Agrega un nuevo botón en el sidebar
3. Agrega un nuevo `<div class="content-section">`
4. En `dashboard.js` agrega la lógica

Ejemplo:
```html
<button class="nav-item" data-section="nuevaseccion">🏷️ Nueva Sección</button>
```

```html
<div id="nuevaseccion" class="content-section">
  <div class="content-card">
    <h2>Nueva Sección</h2>
    <!-- Contenido aquí -->
  </div>
</div>
```

### Agregar base de datos

1. En Firebase Console
2. Crea nueva colección
3. En `dashboard.js` agrega queries de Firestore
4. Actualiza la UI

## 🔄 Copias de Seguridad

### Exportar datos
1. Ve a Configuración en Dashboard
2. Click en "Exportar Datos"
3. Se descargará un archivo JSON

### Restaurar datos
```javascript
// En la consola del navegador
const datos = /* tu JSON */;
// Guardar en Firestore
```

## 📞 Soporte

Para problemas:
1. Abre consola del navegador (F12)
2. Revisa los errores
3. Intenta recargar la página
4. Verifica conexión a Internet

---

**¿Necesitas ayuda?** Contacta al administrador del sistema.
