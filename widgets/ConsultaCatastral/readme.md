⚠️ Soporte de Map Widget y protección contra .view null

Este widget depende de un Map Widget mediante la propiedad:

"supportMapWidget": true


En ArcGIS Experience Builder, cada instancia de un widget tiene configuración independiente.
Cuando el widget se agrega dentro de un Widget Controller, no hereda automáticamente la configuración de otra instancia que ya esté conectada a un mapa.

Si el usuario no selecciona manualmente un Map Widget en el panel de Settings:

props.useMapWidgetIds será undefined

JimuMapViewComponent no recibirá useMapWidgetId

No se creará ningún MapView

jimuMapView.view permanecerá null

Cualquier acceso a .view generará el error:

Cannot read properties of null (reading 'view')


Para prevenir este escenario, el widget implementa un early return pattern que:

Valida que exista useMapWidgetIds

Evita renderizar el JimuMapViewComponent sin configuración válida

Muestra un mensaje claro en el runtime

Previene errores cuando el widget está dentro de un Widget Controller

Este comportamiento es intencional y forma parte de la estrategia de programación defensiva del widget.