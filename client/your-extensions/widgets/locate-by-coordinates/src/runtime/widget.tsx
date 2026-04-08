/**
 * Widget principal para ubicar puntos en el mapa a partir de coordenadas.
 * Permite seleccionar el tipo de coordenada, ingresar valores y visualizar el punto en el mapa.
 *
 * @component
 * @param {AllWidgetProps<any>} props - Propiedades del widget proporcionadas por ArcGIS Experience Builder
 * @returns {JSX.Element} Componente del widget
 *
 * @author IGAC - DIP
 * @since 2026
 */
import { React, type AllWidgetProps } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import Point from "@arcgis/core/geometry/Point"
import SpatialReference from "@arcgis/core/geometry/SpatialReference"
import * as projection from "@arcgis/core/geometry/projection"

import CoordinateForm from "./CoordinateForm"
import { clearPoint, drawPoint } from "./mapActions"
import { dmsToDecimal } from "./coordinateUtils"
import { validaLoggerLocalStorage } from "../../../shared/utils/export.utils"

const Widget = (props: AllWidgetProps<any>) => {
  /**
   * Estado para almacenar la referencia a la vista del mapa de Jimu.
   * @type {[JimuMapView | undefined, Function]}
   */
  const [varJimuMapView, setJimuMapView] = React.useState<JimuMapView>()
  const [initialExtent, setInitialExtent] = React.useState(null)
  const [initialZoom, setInitialZoom] = React.useState<number | null>(null)

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
      if (!initialExtent) {
        setInitialExtent(jmv.view.extent.clone())
        setInitialZoom(jmv.view.zoom)
      }
    }
  }

  /**
   * Restaura la vista del mapa a la extensión y zoom iniciales.
   * @returns {void}
   */
  const goToInitialExtent = () => {

    if (!varJimuMapView || !initialExtent) return

    varJimuMapView.view.goTo({
      target: initialExtent,
      zoom: initialZoom
    })
    
  }

  /**
   * Manejador para ubicar el punto en el mapa según el tipo de coordenada.
   * Crea un punto con la referencia espacial correspondiente y lo dibuja en el mapa.
   *
   * @param {PlanarCoordinates | GeographicDecimal | GeographicDMS} data - Datos de coordenadas ingresados por el usuario
   * @param {CoordinateType} type - Tipo de coordenada: "PLANAR", "GEOGRAPHIC_DECIMAL" o "GEOGRAPHIC_DMS"
   * @returns {Promise<void>}
   */
  const handleLocate = async (data: { x: any; y: any; lon: any; lat: any; latDeg: any; latMin: any; latSec: any; lonDeg: any; lonMin: any; lonSec: any }, type: string) => {
    if(validaLoggerLocalStorage('logger')) console.log("handleLocate", data, type)
    if (!varJimuMapView) return
    // Log para depuración del estado de la vista y su propiedad map
    if(validaLoggerLocalStorage('logger')) console.log("varJimuMapView:", varJimuMapView)
    if(validaLoggerLocalStorage('logger')) console.log("varJimuMapView.view.map:", varJimuMapView && varJimuMapView?.view?.map)
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
    let textoGeographicDMS = ''
    if (type === "GEOGRAPHIC_DMS") {
      textoGeographicDMS = `Lat: ${data.latDeg}° ${data.latMin}' ${data.latSec}'', Lon: ${data.lonDeg}° ${data.lonMin}' ${data.lonSec}''`
      const mapSR = varJimuMapView.view.spatialReference
      const latDecimal = dmsToDecimal(
        Number(data.latDeg),
        Number(data.latMin),
        Number(data.latSec)
      )

      const lonDecimal = dmsToDecimal(
        Number(data.lonDeg),
        Number(data.lonMin),
        Number(data.lonSec)
      )

      let point4326 = new Point({
        longitude: lonDecimal,
        latitude: latDecimal,
        spatialReference: { wkid: 4326 }
      })

      if (mapSR.wkid !== 4326) {

        await projection.load()

        point4326 = projection.project(point4326, mapSR) as Point
      }

      point = point4326
    }
    drawPoint(varJimuMapView, point, type, textoGeographicDMS)
  }

  /**
   * Limpia el punto dibujado en el mapa.
   * @returns {void}
   */
  const handleClear = () => {
    if (!varJimuMapView) return
    clearPoint(varJimuMapView)
  }

  /**
   * Efecto que limpia el punto y restaura la vista inicial cuando el widget se cierra.
   */
  React.useEffect(() => {
    if (props.state === 'CLOSED') {
      handleClear()
      goToInitialExtent()
    }  
    
  }, [props])
  

  return (
    <div style={{height:'100%'}}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}
      {/* <JimuMapViewComponent
        useMapWidgetId="map"
        onActiveViewChange={(jmv) => { setView(jmv.view) }}
      /> */}
      {
        varJimuMapView && (
          <CoordinateForm
            onLocate={handleLocate}
            disabled={!varJimuMapView.view.map}
            mapReady={!!varJimuMapView.view.map}
            key={varJimuMapView.view.map ? 'ready' : 'not-ready'}
            onClear={handleClear}
          />
        )
      }
    </div>
  )
}

export default Widget