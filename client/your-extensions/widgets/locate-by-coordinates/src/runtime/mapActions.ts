// import Point from "@arcgis/core/geometry/Point"
import Graphic from "@arcgis/core/Graphic"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"

export const drawPoint = (view, point) => {

  let layer = view.map.findLayerById("coord-layer")

  if (!layer) {
    layer = new GraphicsLayer({ id: "coord-layer" })
    view.map.add(layer)
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

  view.goTo({
    center: point,
    zoom: 16
  })
}