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
import { clearPoint } from "../../../../widgets/utils/module"




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
      /> */}      {
        varJimuMapView && (
          <h1>consultaAvanzadaAlfanumerica</h1>
        )
      }
    </div>
  )
}

export default Widget