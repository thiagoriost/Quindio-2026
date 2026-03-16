// import Point from "@arcgis/core/geometry/Point"
import Graphic from "@arcgis/core/Graphic"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"

/**
 * Dibuja un punto en el mapa y centra la vista en él.
 * Si no existe la capa de gráficos, la crea.
 *
 * @param {any} varJimuMapView - Vista del mapa de ArcGIS
 * @param {any} point - Geometría del punto a dibujar
 * @param {string} typeCoordeninate - Tipo de coordenada (PLANAR, GEOGRAPHIC_DECIMAL, GEOGRAPHIC_DMS)
 * @param {string} textoGeographicDMS - Texto de coordenadas en formato DMS
 */
export const drawPoint = (varJimuMapView, point, typeCoordeninate, textoGeographicDMS) => {

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

  // -------------------------
  // TEXTO DE COORDENADAS
  // -------------------------

  let coordText = ""

  if(typeCoordeninate === "GEOGRAPHIC_DMS") {
    coordText = textoGeographicDMS
  } else if (point.longitude && point.latitude) {
    coordText = `Lat: ${point.latitude.toFixed(6)}, Lon:${point.longitude.toFixed(6)}`
  } else {
    coordText = `X: ${point.x.toFixed(2)}, Y:${point.y.toFixed(2)}`
  }

  // -------------------------
  // PUNTO
  // -------------------------

  const pointGraphic = new Graphic({
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

  // -------------------------
  // TEXTO SOBRE EL PUNTO
  // -------------------------

  const textGraphic = new Graphic({
    geometry: point,
    symbol: {
      type: "text",
      text: coordText,
      color: "black",
      haloColor: "white",
      haloSize: 1.5,
      font: {
        size: 10,
        family: "Arial"
      },
      yoffset: 15
    }
  })

  layer.add(pointGraphic)
  layer.add(textGraphic)

  varJimuMapView.view.goTo({
    center: point,
    zoom: 16
  })
}

export const clearPoint = (varJimuMapView) => {

  if (!varJimuMapView || !varJimuMapView.view) {
    console.error("clearPoint: vista del mapa no disponible")
    return
  }

  const layer = varJimuMapView.view.map.findLayerById("coord-layer")

  if (layer) {
    layer.removeAll()
    varJimuMapView.view.goTo({
      zoom: 10
    })
  }
}