# 🏨 Sistema Hotelero Casausumacinta

Sistema de gestión hotelera multiplataforma (web, escritorio, móvil) responsivo construido con HTML, CSS, JavaScript, Firebase y Formspree.

## 📋 Características

### ✅ Autenticación y Seguridad
- Login seguro con usuario y contraseña
- Recuperación de contraseña vía Formspree
- Captura de foto al iniciar sesión
- Autenticación Firebase con Firestore
- Registro de auditoría de todas las acciones

### 👥 Gestión de Usuarios
- **Crear usuarios** con captura fotográfica
- **Campos requeridos:**
  - Nombre completo
  - Usuario (único)
  - Correo electrónico
  - Fecha de nacimiento
  - Teléfono
  - Dirección
  - INE Anverso (imagen/PDF)
  - INE Reverso (imagen/PDF)
  - Comprobante de Domicilio (imagen/PDF)
  - Foto de Perfil (imagen/PDF)
  - Contraseña

- **Editar usuarios** con registro de cambios
- **Eliminar usuarios** con auditoría
- **Ver listado** de todos los usuarios

### 🎥 Captura de Seguridad
- Foto automática al crear usuario
- Foto automática al editar usuario
- Foto automática al eliminar usuario
- Foto automática al iniciar sesión
- Registro de fecha/hora de cada acción
- Registro de quién realizó cada acción

### 📊 Dashboard
- Panel de control SPA (Single Page Application)
- Estadísticas en tiempo real
- Actividad reciente
- Acceso rápido a funciones principales
- Navegación intuitiva

## 🗂️ Estructura de Carpetas

```
hotelcasausumacinta/
├── comprobante de domicilio/    (Comprobantes de domicilio)
├── fotodeperfil/                 (Fotos de perfil)
├── ineanverso/                   (INE anverso)
├── inereverso/                   (INE reverso)
├── fotosagregarusuarioeditareliminar/ (Fotos de auditoría)
├── fotoiniciodesesion/           (Fotos de login)
├── firebasedatosdeconexion/
│   └── firebase.txt              (Configuración Firebase)
├── config.js                      (Configuración de Firebase)
├── styles.css                     (Estilos generales)
├── index.html                     (Página de login)
├── login.js                       (Lógica de login)
├── agregarusuario.html           (Gestión de usuarios)
├── agregarusuario.js             (Lógica de usuarios)
├── dashboard.html                 (Panel principal)
├── dashboard.js                   (Lógica del dashboard)
└── README.md                      (Este archivo)
```

## 🚀 Uso del Sistema

### 1. Primera vez - Crear usuario
1. Abre `agregarusuario.html`
2. Completa todos los campos del formulario
3. Carga los documentos requeridos
4. Presiona "Iniciar Cámara" y captura una foto
5. Haz clic en "Crear Usuario"

### 2. Iniciar Sesión
1. Abre `index.html`
2. Ingresa tu usuario y contraseña
3. Se capturará automáticamente una foto de seguridad
4. Accederás al dashboard

### 3. Recuperar Contraseña
1. En la página de login, haz clic en "¿Olvidaste tu contraseña?"
2. Completa el formulario con:
   - Nombre completo
   - Correo electrónico
   - Número de teléfono
3. Se enviará el formulario a: https://formspree.io/f/mdawakab

### 4. Gestión de Usuarios (agregarusuario.html)
- **Ver Usuarios:** Lista completa de todos los usuarios registrados
- **Editar Usuario:** Modifica datos y captura foto del cambio
- **Eliminar Usuario:** Elimina usuario con auditoría completa

### 5. Dashboard (dashboard.html)
- Vista principal del sistema (SPA)
- Estadísticas de usuarios y habitaciones
- Acceso rápido a funciones
- Actividad reciente

## 🔧 Configuración Firebase

La configuración de Firebase está guardada en `firebasedatosdeconexion/firebase.txt` con:
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID
- Measurement ID

**Estado actual:**
- ✅ Firestore habilitado
- ✅ Autenticación por correo/contraseña habilitada
- ✅ Firebase Storage habilitado

## 📱 Responsividad

El sistema es **totalmente responsivo**:
- ✅ Desktop (resoluciones 1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Móvil (320px - 767px)

Todos los layouts se adaptan automáticamente según el dispositivo.

## 🌐 Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Firebase (Firestore + Authentication + Storage)
- **Recuperación de contraseña:** Formspree (https://formspree.io)
- **Cámara:** MediaDevices API
- **Almacenamiento local:** LocalStorage

## 🔐 Seguridad

1. **Autenticación Firebase:** Contraseñas encriptadas
2. **Auditoría completa:** Todas las acciones quedan registradas
3. **Fotos de seguridad:** Se capturan fotos de cada acción importante
4. **Historial de cambios:** Fecha, hora y quién realizó cada acción
5. **Datos en Storage:** Archivos guardados en Firebase Storage

## 📝 Base de Datos (Firestore)

### Colecciones

#### usuarios
```
{
  userId: string,
  usuario: string,
  nombreCompleto: string,
  correo: string,
  fechaNacimiento: date,
  telefono: string,
  direccion: string,
  archivos: {
    ineAnverso: string,
    ineReverso: string,
    comprobanteDomicilio: string,
    fotoPerfil: string,
    fotoCreacion: string
  },
  fotoCreacion: string,
  fechaCreacion: timestamp,
  creadoPor: string,
  activo: boolean,
  timestamp: number
}
```

#### loginicios
```
{
  userId: string,
  fechaHora: timestamp,
  foto: string,
  timestamp: number
}
```

#### eliminaciones
```
{
  usuarioEliminado: string,
  usuarioQueElimino: string,
  fechaEliminacion: timestamp,
  fotoEliminacion: string
}
```

## 🆘 Solución de Problemas

### No funciona la cámara
- Permite permisos de cámara en tu navegador
- Intenta en HTTPS o localhost
- Algunos navegadores requieren contexto seguro

### Las fotos no se guardan
- Verifica que Storage esté habilitado en Firebase
- Confirma que la carpeta existe en Storage
- Revisa la consola del navegador (F12)

### Login no funciona
- Verifica credenciales de Firebase en config.js
- Confirma que el usuario existe en el sistema
- Revisa que el correo sea correcto en Firestore

### Formspree no envía correos
- Verifica que el ID del endpoint sea correcto: `mdawakab`
- Revisa el correo de spam
- Confirma que Formspree esté habilitado

## 📞 Contacto y Soporte

Para cambios o nuevas funcionalidades, contacta al administrador del sistema.

---

**Versión:** 1.0  
**Última actualización:** Mayo 31, 2026  
**Hotel:** Casausumacinta
