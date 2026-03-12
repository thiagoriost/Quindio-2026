// import Point from "@arcgis/core/geometry/Point"
import Graphic from "@arcgis/core/Graphic"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"

/**
 * Dibuja un punto en el mapa y centra la vista en él.
 * Si no existe la capa de gráficos, la crea.
 *
 * @param {any} varJimuMapView - Vista del mapa de ArcGIS
 * @param {any} point - Geometría del punto a dibujar
 */
export const drawPoint = (varJimuMapView, point) => {

  // Validación defensiva
  if (!varJimuMapView || !varJimuMapView.view) {
    console.error("drawPoint: 'varJimuMapView' o 'varJimuMapView.view' es undefined", { varJimuMapView })
    return
  }

  let layer = varJimuMapView.view.map.findLayerById("coord-layer")

  if (!layer) {
    layer = new GraphicsLayer({ id: "coord-layer" })
    varJimuMapView.view.map.add(layer)
  }

  layer.removeAll()

  const graphic = new Graphic({
    geometry: point,
    symbol: {
      type: "simple-marker",
      color: "red",
      size: 10,
      outline: {
        color: "white",
        width: 1
      }
    }
  })

  layer.add(graphic)

  varJimuMapView.view.goTo({
    center: point,
    zoom: 16
  })
}