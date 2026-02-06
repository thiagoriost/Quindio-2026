# 📦 ArcGIS Experience Builder 1.19

> **Carpeta de extensiones personalizadas** para el desarrollo de widgets y themes.

---

## 📚 Documentación Oficial

| Recurso | Enlace |
|---------|--------|
| 📥 Descargas | [developers.arcgis.com/experience-builder/guide/downloads/](https://developers.arcgis.com/experience-builder/guide/downloads/) |
| 🆕 Novedades | [developers.arcgis.com/experience-builder/guide/whats-new/](https://developers.arcgis.com/experience-builder/guide/whats-new/) |

---

## 🚀 Novedades en la Versión 1.19

### ♿ Accesibilidad

- **Navegación con teclado**: Usa `Enter` o `Espacio` para agregar widgets al canvas desde el panel de inserción.
- **Configuración de accesibilidad por widget**: Nueva opción "Enable accessibility settings" que agrega etiquetas legibles por lectores de pantalla.
- **Salto rápido a widgets**: Para widgets de primer nivel, activa "Enable in skip to" para añadir atajos de teclado.
- **Contraste de colores automático**: Al cambiar el color de fondo, se selecciona automáticamente un color de texto con contraste adecuado (mínimo 4.5:1).
- **Widgets actualizados**: Widget Controller ahora soporta características de accesibilidad.
- **Plantillas optimizadas**: Chronology, Frame, Preface y Ribbon.
- **Anuncios de cambios**: Los widgets Search y List anuncian cambios en sugerencias y resultados.

---

### 🎯 Acciones

- **Exportación de datos**: Nueva notificación que muestra el progreso de exportación.

---

### 🧮 Arcade

- **Campos automáticos**: Los campos usados en el perfil de formato del widget se agregan automáticamente a la lista de campos utilizados.

---

### 🛠️ Builder

- **Panel de inserción mejorado**: Desactiva "Live view" y "Lock layout" directamente desde el panel.

---

### ⚙️ Configuración General

- **Restricción de visibilidad de páginas**: Limita quién puede ver páginas específicas según:
  - Tipo de usuario
  - Membresía de grupo
- Las páginas restringidas no aparecen en menús para usuarios sin permisos.

---

### 🎨 Configuración de Estilos

- **Color de primer plano**: Disponible en la sección Background de los estilos de widget.
- **Aplicable a**: Páginas, ventanas, items de List, Card, Accordion, secciones y grupos de pantalla.

---

### 📋 Plantillas

| Novedad | Descripción |
|---------|-------------|
| 🆕 Compass Grid | Nueva plantilla de página |
| 📂 Galería expandida | Ahora incluye plantillas de ArcGIS Online y ArcGIS Living Atlas |
| 🔢 Contadores | Las galerías muestran cantidad de elementos según filtros |
| 🌐 Compartir | Accede a plantillas de usuarios fuera de tu organización (si el administrador lo permite) |

---

### 🎭 Configuración de Temas

#### Nuevas características:

| Elemento | Opciones disponibles |
|----------|---------------------|
| **Temas prediseñados** | 6 nuevos temas personalizables |
| **Colores** | Primarios, secundarios, funcionales (info, éxito, advertencia, error) y neutros |
| **Superficies** | Páginas, celdas de tabla, ventanas |
| **Elementos interactivos** | Botones dropdown, toggles (on/off), indicador de foco |
| **Tipografía** | Fuentes para encabezados y texto, tamaño general, Google Fonts |
| **Otros** | Radio de bordes, estilo de subrayado para enlaces |

> ⚠️ **Advertencias de accesibilidad**: Se muestran alertas cuando las combinaciones de texto y fondo no cumplen el contraste mínimo (4.5:1).

---

### 🌐 Sitio Web

- **Menú ArcGIS Online** en el header de experience.arcgis.com
- **Ventana de Recursos** con enlaces a:
  - 📖 Documentación
  - 📝 Artículos del ArcGIS Blog
  - 🎓 Entrenamiento en Esri Academy
  - 👨‍💻 Documentación para desarrolladores

---

### 🪟 Ventanas

- **Redimensionamiento**: Arrastra las esquinas de las ventanas para cambiar su tamaño.

---

## 📁 Estructura de esta Carpeta

```
your-extensions/
├── themes/          # Temas personalizados
├── widgets/         # Widgets personalizados
└── README.md        # Este archivo
```

---

## 🔗 Recursos Adicionales

- [Guía de desarrollo de widgets](https://developers.arcgis.com/experience-builder/guide/extend-base-widget/)
- [Crear temas personalizados](https://developers.arcgis.com/experience-builder/guide/theme-development/)
- [API Reference](https://developers.arcgis.com/experience-builder/api-reference/)
