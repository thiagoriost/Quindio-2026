# Widget: consulta_simple2

Este widget forma parte de una extensión personalizada para ArcGIS Experience Builder. Su objetivo principal es facilitar consultas simples sobre datos geoespaciales, mostrando resultados en una tabla y permitiendo la interacción con el mapa.

## Estructura del Widget

```
consulta_simple2/
├── config.json                # Configuración del widget
├── manifest.json              # Metadatos del widget
├── src/
│   ├── config.ts              # Configuración interna
│   └── runtime/
│       ├── style.css          # Estilos principales
│       ├── widget.tsx         # Componente principal del widget
│       └── components/
│           ├── dialogsCS.tsx      # Diálogos modales
│           ├── drawMap.tsx        # Herramientas de dibujo en el mapa
│           ├── filtersCS.tsx      # Filtros de consulta
│           └── tablaResultCS.tsx  # Tabla de resultados
│   ├── setting/
│   │   ├── setting.tsx         # Configuración del widget en el builder
│   │   └── styles/style.css    # Estilos de configuración
│   └── types/interfaceResponseConsultaSimple.ts # Tipos de respuesta
├── tests/consulta_simple-widget.test.tsx # Pruebas unitarias
```

## Funcionalidades principales

- Permite realizar consultas simples sobre capas de datos.
- Muestra los resultados en una tabla interactiva.
- Ofrece filtros personalizables para refinar las búsquedas.
- Permite dibujar sobre el mapa para delimitar áreas de consulta.
- Incluye diálogos modales para interacción avanzada.

## Uso

1. Agrega el widget `consulta_simple2` a tu aplicación en Experience Builder.
2. Configura los parámetros necesarios desde el panel de configuración (`setting.tsx`).
3. Utiliza los filtros y herramientas de dibujo para realizar consultas.
4. Visualiza y exporta los resultados desde la tabla.

## Desarrollo y pruebas

- El código fuente principal se encuentra en `src/runtime/widget.tsx` y sus componentes asociados.
- Los estilos personalizados están en `src/runtime/style.css` y `src/setting/styles/style.css`.
- Las pruebas unitarias están en `tests/consulta_simple-widget.test.tsx`.

## Contacto

Para dudas o mejoras, contactar al equipo de desarrollo de IGAC.
