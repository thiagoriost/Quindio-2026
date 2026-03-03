/** @jsx jsx */
import {useState, useCallback, useEffect, useRef } from 'react'
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

/**
 * Arreglo de niveles de detalle (LODS) utilizados para definir las escalas y resoluciones disponibles en el widget de barra de escala.
 * Cada elemento representa un nivel de zoom del mapa, con su resolución y escala asociada.
 * Este arreglo permite al widget mostrar opciones de escala predefinidas y realizar conversiones entre escala y nivel de detalle.
 * Es fundamental para sincronizar la escala visualizada en el mapa y para permitir al usuario seleccionar una escala específica.
 * @type {LOD[]}
 */
const LODS: LOD[] = [
  { level: 0, resolution: 0.00237946100583028, scale: 1000000 },
  { level: 1, resolution: 0.00118973050291514, scale: 500000 },
  { level: 2, resolution: 0.000713838301749084, scale: 300000 },
  { level: 3, resolution: 0.000356919150874542, scale: 150000 },
  { level: 4, resolution: 0.000237946100583028, scale: 100000 },
  { level: 5, resolution: 0.000118973050291514, scale: 50000 },
  { level: 6, resolution: 0.000059486525145757, scale: 25000 },
  { level: 7, resolution: 0.0000237946100583028, scale: 10000 },
  { level: 8, resolution: 0.0000118973050291514, scale: 5000 },
  { level: 9, resolution: 0.00000475892201166056, scale: 2000 },
  { level: 10, resolution: 0.00000118973050291514, scale: 500 }
]

/**
 * Widget de barra de escala para ArcGIS Experience Builder.
 * Permite seleccionar y visualizar la escala del mapa de manera interactiva.
 *
 * @module BarraEscalaWidget
 * @author IGAC-Rigoberto Rios
 * @see https://developers.arcgis.com/experience-builder/
 */
const Widget = (props: AllWidgetProps<any>) => {
  /** @type {any} Módulo de utilidades cargado dinámicamente */
    const [utilsModule, setUtilsModule] = useState<any>(null)
  // Estado para congelar la actualización de coordenadas
  const [freezeCoords, setFreezeCoords] = useState(false)
  // Referencia para mantener el valor actualizado de freezeCoords en los listeners
  const freezeCoordsRef = useRef(freezeCoords)
  // Sincronizar el valor de freezeCoordsRef con freezeCoords
  useEffect(() => {
    freezeCoordsRef.current = freezeCoords
  }, [freezeCoords])
  // Estado para almacenar el gráfico del marcador
  const [markerGraphic, setMarkerGraphic] = useState<any>(null)
  const markerGraphicRef = useRef(markerGraphic)
  useEffect(() => {
    markerGraphicRef.current = markerGraphic
  }, [markerGraphic])
  // Handler to set the JimuMapView instance when the map view becomes active
  const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null)
  const [currentScale, setCurrentScale] = useState<number | null>(null)
  const [pointerCoords, setPointerCoords] = useState<{x: number, y: number} | null>(null)
  const [pointerGeoCoords, setPointerGeoCoords] = useState<{lat: number, lon: number} | null>(null)

  /**
   * Efecto que carga dinámicamente el módulo de utilidades al montar el componente.
   * Este módulo puede contener funciones auxiliares (por ejemplo, para logging o cálculos específicos)
   * que se usan en el widget. El resultado se almacena en el estado local 'utilsModule'.
   * Se ejecuta solo una vez al inicio (dependencias vacías).
   */
  useEffect(() => {
    import('../../../utils/module').then(modulo => { setUtilsModule(modulo) })
  }, [])

    /**
     * Maneja el evento de cambio de vista activa en el widget de mapa.
     * Asigna la instancia de JimuMapView al estado local y, si la vista es de tipo MapView,
     * inicia la observación de la escala y los eventos de puntero mediante watchScale.
     * Esto permite que el widget sincronice su estado con la vista activa del mapa y actualice la escala y coordenadas.
     * @param {JimuMapView} jimuMapView Instancia activa de JimuMapView proporcionada por el componente de mapa.
     */
    const onActiveViewChange = (jimuMapView: JimuMapView) => {
      setJimuMapView(jimuMapView)
      if (jimuMapView && jimuMapView.view) {
        // Solo llamar a watchScale si la vista es MapView (no SceneView)
        const view = jimuMapView.view as __esri.MapView
        // Verifica una propiedad única de MapView (por ejemplo, 'center')
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
        if (utilsModule?.logger()) console.log({view, prev, curr, newScale})
        return Math.abs(curr.scale - newScale) < Math.abs(prev.scale - newScale)
          ? curr
          : prev
      })
      setCurrentScale(closest.level)
    })
    // Escuchar el movimiento del puntero para actualizar coordenadas SOLO si no está congelado
    view.on('pointer-move', (evt: __esri.ViewPointerMoveEvent) => {
      if (freezeCoordsRef.current) return
      const point = view.toMap({ x: evt.x, y: evt.y })
      visualizarCoordenadas(point)
    })

    // Escuchar click para congelar coordenadas y colocar marcador
    view.on('click', (evt: __esri.ViewClickEvent) => {
      // if (!freezeCoordsRef.current) {
        setFreezeCoords(true)
        const point = view.toMap({ x: evt.x, y: evt.y })
        visualizarCoordenadas(point)
        if (point) {
          (window as any).require([
            'esri/Graphic',
            'esri/symbols/SimpleMarkerSymbol'
          ], (Graphic: any, SimpleMarkerSymbol: any) => {
            if (markerGraphicRef.current) {
              view.graphics.remove(markerGraphicRef.current)
            }
            // Obtener el color de la variable CSS --color-primary
            const colorPrimary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#0078d4'
            // Convertir color hex a array RGBA
            function hexToRgba(hex: string, alpha = 1) {
              let c = hex.replace('#', '')
              if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
              const num = parseInt(c, 16)
              return [
                (num >> 16) & 255,
                (num >> 8) & 255,
                num & 255,
                alpha
              ]
            }
            const marker = new Graphic({
              geometry: point,
              symbol: new SimpleMarkerSymbol({
                style: 'diamond',
                color: hexToRgba(colorPrimary, 1),
                size: '16px',
                outline: {
                  color: [255, 255, 255],
                  width: 2
                }
              })
            })
            view.graphics.add(marker)
            setMarkerGraphic(marker)
          })
        }
      // }
    })
  }, [])

    /**
     * Actualiza el estado del widget con las coordenadas del puntero en el mapa.
     * Asigna las coordenadas planas (x, y) y, si es posible, convierte y asigna las coordenadas geográficas (lat, lon).
     * Si el punto está en Web Mercator, realiza la conversión a geográficas usando webMercatorUtils.
     * Si no hay punto, limpia ambos estados de coordenadas.
     * @param {__esri.Point | null} point Punto del mapa a visualizar o null para limpiar.
     */
    const visualizarCoordenadas = (point: __esri.Point | null) => {
      if (point) {
        setPointerCoords({ x: point.x, y: point.y })
        // --- Conversión y asignación de coordenadas geográficas ---
        if (point.spatialReference && point.spatialReference.wkid === 4326) {
          setPointerGeoCoords({ lat: point.y, lon: point.x })
        } else if ((window as any).require) {
          (window as any).require(['esri/geometry/support/webMercatorUtils'], (webMercatorUtils: any) => {
            const geoPoint = webMercatorUtils.webMercatorToGeographic(point)
            setPointerGeoCoords({ lat: geoPoint.y, lon: geoPoint.x })
          })
        } else {
          setPointerGeoCoords(null)
        }
      } else {
        setPointerCoords(null)
        setPointerGeoCoords(null)
      }
    }


  /**
   * Maneja el cambio manual de escala desde el elemento select.
   * Realiza el zoom a la escala seleccionada.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - Evento de cambio del select.
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!jimuMapView) return

    const selectedLevel = Number(event.target.value)
    if (utilsModule?.logger()) console.log({selectedLevel})
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
      <div className="barraEscalaHeader borderBottom">
        <span className="barraEscalaIcon">🔍</span>
        <span className="barraEscalaTitle">Escala:</span>
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
      </div>
      {
        freezeCoords &&
          <div className='borderBottom'>
            <label>
              <input
                type="checkbox"
                checked={!freezeCoords}
                onChange={e => {
                  const checked = e.target.checked
                  setFreezeCoords(!checked)
                  if (checked && jimuMapView && jimuMapView.view && markerGraphic) {
                    // Eliminar marcador si se reanuda
                    jimuMapView.view.graphics.remove(markerGraphic)
                    setMarkerGraphic(null)
                  }
                }}
              />{' '}
              Etiquetar coordenadas
            </label>
          </div>
      }
      <div className="barraEscalaCoordsContainer">
        {jimuMapView && jimuMapView.view &&
          <span className='borderBottom'>SR_b: {jimuMapView.view.spatialReference.wkid}</span>
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