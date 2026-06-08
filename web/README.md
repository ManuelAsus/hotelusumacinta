# Hotel Casa Usumacinta - Página Web

## 📱 Bienvenida a la Página Web Responsiva del Hotel

Esta es la página web oficial del Hotel Casa Usumacinta, diseñada para ser hermosa, funcional y completamente responsiva en todos los dispositivos.

## ✨ Características

### 🎨 Diseño Moderno
- Paleta de colores profesional y elegante
- Interfaz intuitiva y atractiva
- Animaciones suaves y transiciones agradables
- Tipografía cuidada

### 📱 Totalmente Responsivo
- **Computadoras de escritorio** (1200px+)
- **Tablets** (768px - 1199px)
- **Celulares** (480px - 767px)
- **Dispositivos móviles pequeños** (menos de 480px)

### 🔧 Características Técnicas

#### Header Sticky
- Menú de navegación fijo
- Logo del hotel
- Botón de reserva prominente
- Menú hamburguesa en dispositivos móviles

#### Secciones Principales

1. **Hero Section**
   - Imagen de portada del hotel
   - Efecto parallax al hacer scroll
   - Zoom animado
   - Llamada a la acción

2. **Acerca de Nosotros**
   - Información del hotel
   - Lista de características
   - Imagen representativa

3. **Nuestras Habitaciones**
   - Tarjetas interactivas
   - Tres tipos: Simple, Doble, Suite
   - Información de comodidades
   - Capacidad de huéspedes

4. **Galería del Hotel**
   - Grilla de imágenes responsiva
   - Modal para ver imágenes en grande
   - Efectos hover profesionales
   - 6 imágenes de interiores del hotel

5. **Servicios**
   - 6 servicios principales
   - Iconos coloridos
   - Descripción detallada
   - Diseño de tarjetas

6. **Contacto**
   - Información de contacto
   - Formulario de contacto funcional
   - Validación de datos
   - Integración con teléfono, email, ubicación

7. **Footer**
   - Enlaces rápidos
   - Redes sociales
   - Información del hotel
   - Copyright

## 📁 Estructura de Archivos

```
web/
├── index.html          # Página principal
├── styles.css          # Estilos responsive
└── script.js           # JavaScript interactivo
```

## 🚀 Cómo Usar

### Opción 1: Abrir en el Navegador
1. Ve a la carpeta `web`
2. Haz doble clic en `index.html`
3. ¡La página se abrirá en tu navegador predeterminado!

### Opción 2: Con Servidor Local
```bash
# Si tienes Python instalado (versión 3)
python -m http.server 8000

# Si tienes Python 2
python -m SimpleHTTPServer 8000

# Si tienes Node.js instalado
npx http-server

# Luego abre en tu navegador: http://localhost:8000
```

## 🎨 Paleta de Colores

La página usa los colores oficiales del hotel:

- **#F4F1E4** - Beige claro (fondo)
- **#35462A** - Verde oscuro (primario)
- **#C1A44D** - Dorado (acentos)
- **#5FAB67** - Verde claro (secundario)
- **#966237** - Marrón (alternativo)
- **#B9B585** - Verde sage (terciario)

## 📸 Imágenes Utilizadas

- **Portada**: `../FOTOPORTADAHOTEL/hotelusumacinta.jpg`
- **Interiores**: `../IMAGENESINTERIORESDELHOTEL/` (10 imágenes)
- **Logo**: `../LOGO/LOGO.png`
- **Otros**: Íconos de Font Awesome

## 🔧 Funcionalidades JavaScript

### ✅ Menú Responsivo
- Toggle automático en dispositivos móviles
- Cierre automático al hacer clic en un enlace
- Cierre al hacer clic fuera

### ✅ Scroll Suave
- Navegación suave entre secciones
- Efectos parallax en hero

### ✅ Galería Interactiva
- Click para ver imagen en grande
- Modal con zoom
- Cierre con ESC o click fuera

### ✅ Validación de Formulario
- Validación de campos requeridos
- Mensaje de éxito al enviar
- Limpieza automática del formulario

### ✅ Animaciones al Scroll
- Elementos se animan cuando entran en vista
- Observador de intersección
- Transiciones suaves

## 💻 Compatibilidad

### Navegadores
- ✅ Chrome (versión 90+)
- ✅ Firefox (versión 88+)
- ✅ Safari (versión 14+)
- ✅ Edge (versión 90+)
- ✅ Navegadores móviles

### Dispositivos Testeados
- ✅ iPhone (todas las resoluciones)
- ✅ Samsung Galaxy
- ✅ iPad y tablets
- ✅ Computadoras de escritorio
- ✅ Laptops

## 🎯 Resoluciones Soportadas

| Dispositivo | Ancho | Breakpoint |
|---|---|---|
| Móvil Pequeño | 320px - 480px | `@media (max-width: 480px)` |
| Móvil | 480px - 768px | Responsive base |
| Tablet | 768px - 1024px | `@media (max-width: 768px)` |
| Desktop | 1024px+ | Estándar |
| Ultra-wide | 1920px+ | Escalado automático |

## 📝 Notas de Desarrollo

### Fuentes Externas
- **Font Awesome**: Iconos profesionales
- **Google Fonts**: (Integrado via sistema)

### Características Especiales

1. **Gradientes**: Fondos degradados profesionales
2. **Sombras**: Profundidad visual con box-shadows
3. **Transiciones**: Animaciones suaves de 0.3s
4. **Transform**: Efectos de escala y traslación
5. **Cursor**: Cambio de cursor al interactuar

## 🔐 Seguridad

- Formulario con validación básica
- No hay conexión directa a base de datos
- Rutas relativas para imágenes
- Sin datos sensibles expuestos

## 🚀 Mejoras Futuras

Posibles mejoras para versiones futuras:

- [ ] Integración con sistema de reservas
- [ ] Chat en vivo
- [ ] Newsletter
- [ ] Testimonios de clientes
- [ ] Blog del hotel
- [ ] Maps integrado
- [ ] Multi-idioma
- [ ] Búsqueda de disponibilidad

## 📞 Contacto

Para más información sobre el hotel:
- Teléfono: +1 (XXX) XXX-XXXX
- Email: info@casausumacinta.com
- Ubicación: Tu Destino, Región

## ©️ Derechos de Autor

© 2024 Hotel Casa Usumacinta. Todos los derechos reservados.

---

**¡Gracias por visitarnos!** 🏨✨
