# 🏗️ Arquitectura del Sistema Hotelero

## 📐 Estructura General

```
CLIENTE (Frontend)
    ↓
HTML/CSS/JavaScript
    ↓
Firebase (Backend)
    ├── Firestore (Base de datos)
    ├── Authentication (Autenticación)
    └── Storage (Almacenamiento de archivos)
    ↓
Formspree (Email)
```

## 🔄 Flujo de Datos

### 1. Crear Usuario (agregarusuario.html)
```
1. Usuario ingresa datos en formulario
   ↓
2. Validaciones en cliente (JavaScript)
   ↓
3. Captura foto con cámara
   ↓
4. Crea cuenta en Firebase Auth (correo + contraseña)
   ↓
5. Sube archivos a Firebase Storage
   ├── INE Anverso → storage/ineanverso/
   ├── INE Reverso → storage/inereverso/
   ├── Comprobante → storage/comprobante de domicilio/
   ├── Foto Perfil → storage/fotodeperfil/
   └── Foto Creación → storage/fotosagregarusuarioeditareliminar/
   ↓
6. Guarda datos en Firestore → usuarios/
```

### 2. Login (index.html)
```
1. Usuario ingresa usuario + contraseña
   ↓
2. Busca usuario en Firestore
   ↓
3. Obtiene correo correspondiente
   ↓
4. Autentica con Firebase Auth
   ↓
5. Captura foto de inicio de sesión
   ↓
6. Sube foto → storage/fotoiniciodesesion/
   ↓
7. Registra en Firestore → loginicios/
   ↓
8. Redirige a dashboard.html
```

### 3. Recuperar Contraseña (formulario en index.html)
```
1. Usuario completa formulario
   ├── Nombre completo
   ├── Correo
   └── Teléfono
   ↓
2. Se envía a Formspree
   ↓
3. Formspree envía correo a administrador
   ↓
4. Admin verifica y reestablece contraseña
```

### 4. Dashboard (dashboard.html - SPA)
```
1. Carga datos de Firestore
   ├── Total usuarios
   ├── Habitaciones disponibles
   ├── Reservas activas
   └── Actividad reciente
   ↓
2. Navegación sin recargar página
   ├── Inicio
   ├── Usuarios
   ├── Habitaciones
   ├── Reservas
   ├── Reportes
   └── Configuración
   ↓
3. Cada sección carga datos dinámicamente
```

## 📁 Archivos Principales

### Frontend (HTML)
- **index.html** - Página de login
- **agregarusuario.html** - Gestión de usuarios
- **dashboard.html** - Panel principal (SPA)
- **test.html** - Sistema de pruebas

### JavaScript (Lógica)
- **config.js** - Configuración de Firebase
- **login.js** - Autenticación y login
- **agregarusuario.js** - Gestión de usuarios (crear)
- **edicionusuarios.js** - Edición de usuarios
- **dashboard.js** - Lógica del dashboard
- **utils.js** - Funciones compartidas

### Estilos
- **styles.css** - CSS responsivo (web, tablet, móvil)

### Documentación
- **README.md** - Guía completa del sistema
- **INSTALACION.md** - Guía de instalación y setup
- **ARQUITECTURA.md** - Este documento

## 🗄️ Base de Datos Firestore

### Colección: usuarios
```javascript
{
  userId: "string",           // UID de Firebase Auth
  usuario: "string",          // Nombre de usuario único
  nombreCompleto: "string",   // Nombre del usuario
  correo: "string",           // Email
  fechaNacimiento: "date",    // Fecha de nacimiento
  telefono: "string",         // Teléfono
  direccion: "string",        // Dirección
  archivos: {
    ineAnverso: "string",     // Nombre archivo en Storage
    ineReverso: "string",
    comprobanteDomicilio: "string",
    fotoPerfil: "string"
  },
  fotoCreacion: "string",     // Foto de quién lo creó
  fechaCreacion: "timestamp", // Cuándo se creó
  creadoPor: "string",        // ID de quién lo creó
  activo: "boolean",          // Si está activo
  timestamp: "number"         // Timestamp para ordenar
}
```

### Colección: loginicios
```javascript
{
  userId: "string",           // UID del usuario
  fechaHora: "timestamp",     // Cuándo inició sesión
  foto: "string",             // Archivo de foto
  timestamp: "number"
}
```

### Colección: eliminaciones (auditoría)
```javascript
{
  usuarioEliminado: "string", // Usuario que fue eliminado
  usuarioQueElimino: "string",// ID de quién lo eliminó
  fechaEliminacion: "timestamp",
  fotoEliminacion: "string"   // Foto de quién lo eliminó
}
```

## 🔐 Firebase Storage

```
storage/
├── ineanverso/
│   └── {userId}_{timestamp}_{filename}
├── inereverso/
│   └── {userId}_{timestamp}_{filename}
├── comprobante de domicilio/
│   └── {userId}_{timestamp}_{filename}
├── fotodeperfil/
│   └── {userId}_{timestamp}_{filename}
├── fotosagregarusuarioeditareliminar/
│   ├── creacion__{userId}_{timestamp}.jpg
│   ├── edicion_{userId}_{timestamp}.jpg
│   └── eliminacion_{userId}_{timestamp}.jpg
└── fotoiniciodesesion/
    └── login_{userId}_{timestamp}.jpg
```

## 🔌 APIs Externas

### Firebase SDK
- `firebase-app.js` - Inicialización
- `firebase-auth.js` - Autenticación
- `firebase-firestore.js` - Base de datos
- `firebase-storage.js` - Almacenamiento

### Formspree
- Endpoint: `https://formspree.io/f/mdawakab`
- Método: POST
- Campos: nombreCompleto, correo, telefono

## 🌐 Flujo de Aplicación

```
Usuario accede a index.html
    ↓
¿Autenticado?
    ├─→ NO → Muestra formulario login
    │         ↓
    │     ¿Credenciales válidas?
    │         ├─→ NO → Muestra error
    │         └─→ SÍ → Captura foto → dashboard
    │
    └─→ SÍ → Redirige a dashboard

En dashboard (SPA):
    ↓
Navega sin recargar página
    ├─→ Inicio: Estadísticas y actividad
    ├─→ Usuarios: CRUD de usuarios
    ├─→ Habitaciones: Gestión de habitaciones
    ├─→ Reservas: Gestión de reservas
    ├─→ Reportes: Reportes del sistema
    └─→ Configuración: Opciones del sistema
```

## 🎯 Funcionalidades de Seguridad

### 1. Auditoría de Acceso
```
- Se registra cada login
- Se captura foto del usuario
- Se guarda fecha/hora
- Se almacena en loginicios/
```

### 2. Auditoría de Cambios
```
- Se registra cada creación de usuario
- Se captura foto de quién lo creó
- Se registra cada edición
- Se captura foto de quién lo editó
- Se guarda fecha/hora de cada acción
```

### 3. Auditoría de Eliminación
```
- Se registra cada eliminación
- Se guarda quién fue eliminado
- Se captura foto de quién lo eliminó
- Se registra fecha/hora
- Se almacena en eliminaciones/
```

### 4. Autenticación Firebase
```
- Contraseñas encriptadas
- Tokens JWT
- Sesiones seguras
- Recuperación de contraseña por email
```

## 📱 Responsividad

### Breakpoints
```css
Desktop:  > 1024px
Tablet:   768px - 1023px
Móvil:    < 768px
```

### Adaptaciones
```
Desktop:
  - Sidebar fijo
  - 2+ columnas
  - Menú horizontal

Tablet:
  - Sidebar colapsable
  - 1-2 columnas
  - Menú responsivo

Móvil:
  - Sidebar oculto/drawer
  - 1 columna
  - Menú vertical
```

## 🔄 Ciclo de Vida de una Sesión

```
1. Usuario abre index.html
   └─ Verifica autenticación

2. Sin autenticación
   └─ Muestra login
   └─ Usuario ingresa datos
   └─ Sistema valida
   └─ Captura foto
   └─ Registra en loginicios

3. Con autenticación
   └─ Redirige a dashboard
   └─ Carga estadísticas
   └─ Muestra navegación SPA

4. En dashboard
   └─ Usuario navega por secciones
   └─ Cada sección carga datos
   └─ SPA sin recargar página

5. Cerrar sesión
   └─ signOut de Firebase
   └─ Redirige a index.html
```

## 🚀 Performance

### Optimizaciones
- **SPA**: Evita recargas de página
- **Lazy Loading**: Carga datos solo cuando se necesitan
- **LocalStorage**: Cacheo de datos
- **Validación cliente**: Reduce viajes al servidor
- **Compresión**: Fotos en JPEG 0.9 calidad

### Límites Recomendados
- Archivos: < 5MB (INE, comprobante)
- Fotos: < 2MB (comprimidas)
- Usuarios: Base datos escalable

## 🔧 Extensibilidad

### Agregar nueva colección
```javascript
// En Firestore
db.collection('nueva_coleccion').add({
  datos: valores
});
```

### Agregar nuevo campo a usuario
```javascript
// En el formulario
<input type="text" id="nuevoCampo">

// En agregarusuario.js
nuevoCampo: document.getElementById('nuevoCampo').value
```

### Agregar nueva sección al dashboard
```javascript
// En dashboard.html
<button class="nav-item" data-section="nueva">Nueva</button>
<div id="nueva" class="content-section">...</div>

// En dashboard.js
cambiarSeccion('nueva')
```

---

**Versión:** 1.0  
**Última actualización:** Mayo 31, 2026
