import { React, type AllWidgetProps } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import Point from "@arcgis/core/geometry/Point"
import SpatialReference from "@arcgis/core/geometry/SpatialReference"

import CoordinateForm from "./CoordinateForm"
import { drawPoint } from "./mapActions"

export default function Widget(props: AllWidgetProps<any>) {

  /** @type {JimuMapView|undefined} Referencia al mapa de Jimu */
  const [varJimuMapView, setJimuMapView] = React.useState<JimuMapView>()

  /**
     * Manejador del cambio de vista activa del mapa.
     * Guarda la referencia al mapa en el estado del componente.
     *
     * @param {JimuMapView} jmv - Vista del mapa de Jimu
     * @returns {void}
     */
    const activeViewChangeHandler = (jmv: JimuMapView) => {
      if (jmv) {
        setJimuMapView(jmv)
      }
    }

  const handleLocate = (data, type) => {

    console.log("handleLocate", data, type)

    if (!varJimuMapView) return

    let point

    if (type === "PLANAR") {

      point = new Point({
        x: Number(data.x),
        y: Number(data.y),
        spatialReference: new SpatialReference({ wkid: 9377 })
      })

    }

    if (type === "GEOGRAPHIC_DECIMAL") {

      point = new Point({
        longitude: Number(data.lon),
        latitude: Number(data.lat),
        spatialReference: { wkid: 4326 }
      })

    }

    drawPoint(varJimuMapView, point)

  }

  return (

    <div>

      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
            <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
          )}

      {/* <JimuMapViewComponent
        useMapWidgetId="map"
        onActiveViewChange={(jmv) => { setView(jmv.view) }}
      /> */}

      {
        varJimuMapView && <CoordinateForm onLocate={handleLocate} />
      }

    </div>

  )
}