/** @jsx jsx */
import {useState, useCallback } from 'react'
import type { AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import '../styles/styles.scss'


/**
 * Representa un nivel de detalle (Level of Detail, LOD) para el mapa.
 * @typedef {Object} LOD
 * @property {number} level - Nivel de zoom o detalle.
 * @property {number} resolution - Resolución asociada al nivel.
 * @property {number} scale - Escala asociada al nivel.
 */
interface LOD {
  level: number
  resolution: number
  scale: number
}

const LODS: LOD[] = [
  { level: 0, resolution: 0.00118973050291514, scale: 500000 },
  { level: 1, resolution: 0.000713838301749084, scale: 300000 },
  { level: 2, resolution: 0.000356919150874542, scale: 150000 },
  { level: 3, resolution: 0.000237946100583028, scale: 100000 },
  { level: 4, resolution: 0.000118973050291514, scale: 50000 },
  { level: 5, resolution: 0.000059486525145757, scale: 25000 },
  { level: 6, resolution: 0.0000237946100583028, scale: 10000 },
  { level: 7, resolution: 0.0000118973050291514, scale: 5000 },
  { level: 8, resolution: 0.00000475892201166056, scale: 2000 },
  { level: 9, resolution: 0.00000118973050291514, scale: 500 }
]

/**
 * Widget de barra de escala para ArcGIS Experience Builder.
 * Permite seleccionar y visualizar la escala del mapa de manera interactiva.
 *
 * @module BarraEscalaWidget
 * @author IGAC
 * @see https://developers.arcgis.com/experience-builder/
 */
const Widget = (props: AllWidgetProps<any>) => {
  // Handler to set the JimuMapView instance when the map view becomes active
  const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null)
  const [currentScale, setCurrentScale] = useState<number | null>(null)
  const [pointerCoords, setPointerCoords] = useState<{x: number, y: number} | null>(null)
  const [pointerGeoCoords, setPointerGeoCoords] = useState<{lat: number, lon: number} | null>(null)

  const onActiveViewChange = (jimuMapView: JimuMapView) => {
    setJimuMapView(jimuMapView)
    if (jimuMapView && jimuMapView.view) {
      // Only call watchScale if the view is a MapView (not SceneView)
      const view = jimuMapView.view as __esri.MapView
      // Check for a property unique to MapView (e.g., 'center')
      if (view && 'center' in view) {
        watchScale(view)
      }
    }
  }

  /**
   * Sincroniza el estado del widget cuando cambia la escala del mapa.
   * Busca el nivel de detalle (LOD) más cercano a la escala actual del mapa y actualiza el estado.
   * @param {__esri.MapView} view - Instancia de MapView de ArcGIS.
   */
  const watchScale = useCallback((view: __esri.MapView) => {
    view.watch('scale', (newScale: number) => {
      const closest = LODS.reduce((prev, curr) => {
        console.log({view, prev, curr, newScale})
        return Math.abs(curr.scale - newScale) < Math.abs(prev.scale - newScale)
          ? curr
          : prev
      })
      setCurrentScale(closest.level)
    })
    // Escuchar el movimiento del puntero para actualizar coordenadas
    view.on('pointer-move', (evt: __esri.ViewPointerMoveEvent) => {
      // Convertir a coordenadas planas (x, y)
      const point = view.toMap({ x: evt.x, y: evt.y })
      if (point) {
        setPointerCoords({ x: point.x, y: point.y })
        // --- Conversión y asignación de coordenadas geográficas ---
        // Verifica si el punto ya está en el sistema de referencia geográfico (WKID 4326)
        if (point.spatialReference && point.spatialReference.wkid === 4326) {
          // Si ya está en 4326, asigna directamente latitud (y) y longitud (x)
          setPointerGeoCoords({ lat: point.y, lon: point.x })
        } else if ((window as any).require) {
          // Si no está en 4326 pero existe el cargador AMD de ArcGIS, carga el módulo de utilidades
          (window as any).require(['esri/geometry/support/webMercatorUtils'], (webMercatorUtils: any) => {
            // Convierte el punto a coordenadas geográficas (WGS84)
            const geoPoint = webMercatorUtils.webMercatorToGeographic(point)
            // Asigna la latitud y longitud convertidas al estado
            setPointerGeoCoords({ lat: geoPoint.y, lon: geoPoint.x })
          })
        } else {
          // Si no es posible convertir, limpia el estado de coordenadas geográficas
          setPointerGeoCoords(null)
        }
      } else {
        // Si no hay punto válido, limpia ambos estados de coordenadas
        setPointerCoords(null)
        setPointerGeoCoords(null)
      }
    })
  }, [])

  /**
   * Maneja el cambio manual de escala desde el elemento select.
   * Realiza el zoom a la escala seleccionada.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - Evento de cambio del select.
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log({event})
    if (!jimuMapView) return

    const selectedLevel = Number(event.target.value)
    console.log({selectedLevel})
    const selectedLod = LODS.find(l => l.level === selectedLevel)

    if (!selectedLod) return

    jimuMapView.view.goTo({
      scale: selectedLod.scale
    })
  }

  return (
    <div className="divBarraEscala barraEscalaModern">
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />
      <div className="barraEscalaHeader">
        <span className="barraEscalaIcon">🔍</span>
        <span className="barraEscalaTitle">Escala:</span>
      </div>
      <div className="barraEscalaSelectContainer">
        <select
          className="barraEscalaSelect"
          value={currentScale ?? ''}
          onChange={handleChange}
        >
          {LODS.map(lod => (
            <option key={lod.level} value={lod.level}>
              {`1:${lod.scale.toLocaleString('es-CO')}`}
            </option>
          ))}
        </select>
      </div>
      <div className="barraEscalaCoordsContainer">
        {jimuMapView && jimuMapView.view &&
          <span className='spacialReferenceStyle'>SR: {jimuMapView.view.spatialReference.wkid}</span>
        }

          {pointerCoords && (
            <div className='planasCoordeStyle'>
              <span className="barraEscalaCoordsLabel">Coordenadas planas:</span>
              <br />
              <span className="barraEscalaCoordsValue">
                X: {pointerCoords.x.toFixed(2)}, Y: {pointerCoords.y.toFixed(2)}
              </span>
              <br />
            </div>
          )}
          {pointerGeoCoords && (
            <div >
              <span className="barraEscalaCoordsLabel">Coordenadas geográficas:</span>
              <br />
              <span className="barraEscalaCoordsValue">
                Lat: {pointerGeoCoords.lat.toFixed(6)}, Lon: {pointerGeoCoords.lon.toFixed(6)}
              </span>
            </div>
          )}

      </div>
    </div>
  )
}

export default Widget