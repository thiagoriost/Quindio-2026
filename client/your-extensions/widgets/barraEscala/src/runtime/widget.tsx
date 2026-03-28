/** @jsx jsx */
// import {useState, useCallback, useEffect, useRef } from 'react'
import { React, type AllWidgetProps } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import '../styles/styles.scss'
import { useCallback, useEffect, useRef, useState } from "react"


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
  /**
   * Estado reactivo para la instancia activa de JimuMapView.
   * Permite acceder y actualizar la vista del mapa utilizada por el widget.
   */
  const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null)

  /**
   * Estado para el nivel de escala actual del mapa (LOD).
   * Se actualiza automáticamente al cambiar la escala del mapa.
   */
  const [currentScale, setCurrentScale] = useState<number | null>(null)

  /**
   * Estado para las coordenadas planas del puntero en el SR actual del mapa.
   * Estructura: { x, y, sr }.
   */
  const [pointerCoords, setPointerCoords] = useState<{x: number, y: number, sr: number} | null>(null)

  /**
   * Estado para las coordenadas geográficas (lat/lon) del puntero en SR 4326.
   * Estructura: { lat, lon, sr }.
   */
  const [pointerGeoCoords, setPointerGeoCoords] = useState<{lat: number, lon: number, sr: number} | null>(null)

  /**
   * Estado para las coordenadas planas del puntero proyectadas a SR 9377 (MAGNA Bogotá).
   * Estructura: { x, y, sr }.
   */
  const [pointerCoords9377, setPointerCoords9377] = useState<{x: number, y: number, sr: number} | null>(null)

  /**
   * Estado para las coordenadas geográficas (lat/lon) del puntero proyectadas desde SR 9377 a SR 4326.
   * Estructura: { lat, lon, sr }.
   */
  const [pointerGeoCoords9377, setPointerGeoCoords9377] = useState<{lat: number, lon: number, sr: number} | null>(null)

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
        if (loggerValue) console.log({view, prev, curr, newScale})
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
   * Muestra coordenadas planas y geográficas en la SR por defecto y proyectadas a SR 9377 (MAGNA Bogotá).
   * Si hay transformaciones oficiales, las utiliza para la proyección.
   * @param {__esri.Point | null} point Punto del mapa a visualizar o null para limpiar.
   */
  const visualizarCoordenadas = useCallback((point: __esri.Point | null) => {

    if (loggerValue) console.log({point})
    if (!point) {
      setPointerCoords(null)
      setPointerGeoCoords(null)
      setPointerCoords9377(null)
      setPointerGeoCoords9377(null)
      return
    }

    // SR por defecto
    setPointerCoords({ x: point.x, y: point.y, sr: point.spatialReference?.wkid || 0 })

    // Geográficas en SR por defecto
    if (point.spatialReference && point.spatialReference.wkid === 4326) {
      setPointerGeoCoords({ lat: point.y, lon: point.x, sr: 4326 })
    } else if ((window as any).require) {
      (window as any).require(['esri/geometry/support/webMercatorUtils'], (webMercatorUtils: any) => {
        const geoPoint = webMercatorUtils.webMercatorToGeographic(point)
        setPointerGeoCoords({ lat: geoPoint.y, lon: geoPoint.x, sr: 4326 })
      })
    } else {
      setPointerGeoCoords(null)
    }

    // Proyección a 9377 (MAGNA Bogotá)
    const tryProject9377 = async (retryCount = 0) => {
      const projection = (window as any).arcgisProjection
      const PointArcgis = (window as any).arcgisPoint
      const SpatialReference = (window as any).arcgisSpatialReference

      // Si los módulos aún no están listos, reintenta hasta 5 veces
      if (!projection || !PointArcgis || !SpatialReference) {
        if (retryCount < 5) {
          setTimeout(() => tryProject9377(retryCount + 1), 300)
        } else {
          setPointerCoords9377(null)
          setPointerGeoCoords9377(null)
        }
        return
      }
      await projection.load?.()
      const targetSR = new SpatialReference({ wkid: 9377 })
      const srcPoint = new PointArcgis({ x: point.x, y: point.y, spatialReference: point.spatialReference })
      let projected = null
      let usedTransformation = null
      try {
        // Buscar transformaciones oficiales
        const transformations = projection.getTransformations(srcPoint.spatialReference, targetSR)
        usedTransformation = transformations && transformations.length > 0 ? transformations[0] : null
        projected = projection.project(srcPoint, targetSR)
        if (loggerValue) console.log({projected, srcPoint: srcPoint.spatialReference.wkid, targetSR: targetSR.wkid, transformations: transformations, usedTransformation})
        if (!projected) {
          console.warn('La proyección retornó null. Es probable que falten archivos de grids para la transformación geodésica (por ejemplo, ntv2, nadgrids, etc.). Verifica la configuración de ArcGIS JS API y la disponibilidad de los grids requeridos para la transformación oficial seleccionada.', {srcPoint, targetSR, usedTransformation})
        }
      } catch (e) {
        projected = null
      }
      if (projected) {
        setPointerCoords9377({ x: projected.x, y: projected.y, sr: 9377 })
        // Obtener geográficas de 9377
        const geo9377 = projection.project(projected, new SpatialReference({ wkid: 4326 }))
        if (geo9377) {
          setPointerGeoCoords9377({ lat: geo9377.y, lon: geo9377.x, sr: 4326 })
        } else {
          setPointerGeoCoords9377(null)
        }
      } else {
        setPointerCoords9377(null)
        setPointerGeoCoords9377(null)
      }
    }
    tryProject9377()
  }, [])


  /**
   * Maneja el cambio manual de escala desde el elemento select.
   * Realiza el zoom a la escala seleccionada.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - Evento de cambio del select.
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!jimuMapView) return

    const selectedLevel = Number(event.target.value)
    if (loggerValue) console.log({selectedLevel})
    const selectedLod = LODS.find(l => l.level === selectedLevel)

    if (!selectedLod) return

    jimuMapView.view.goTo({
      scale: selectedLod.scale
    })
  }

  /**
   * Efecto que carga dinámicamente el módulo de utilidades al montar el componente.
   * Este módulo puede contener funciones auxiliares (por ejemplo, para logging o cálculos específicos)
   * que se usan en el widget. El resultado se almacena en el estado local 'utilsModule'.
   * Se ejecuta solo una vez al inicio (dependencias vacías).
   */
  // Estado reactivo para logger
  const [loggerValue, setLoggerValue] = useState<any>(null)

  useEffect(() => {
    // Validar logger en localStorage y actualizar el estado
    let loggerParsed = null
    try {
      loggerParsed = JSON.parse(localStorage.getItem('logger'))?.logger
    } catch (e) {
      loggerParsed = localStorage.getItem('logger')
    }
    setLoggerValue(loggerParsed)

    // Carga dinámica de proyección de ArcGIS JS API (compatible con CDN)
    if (!(window as any).arcgisProjectionLoaded) {
      (window as any).require && (window as any).require([
        'esri/geometry/projection',
        'esri/geometry/Point',
        'esri/geometry/SpatialReference'
      ], (projection: any, Point: any, SpatialReference: any) => {
        (window as any).arcgisProjection = projection;
        (window as any).arcgisPoint = Point;
        (window as any).arcgisSpatialReference = SpatialReference;
        (window as any).arcgisProjectionLoaded = true
      })
    }
  }, [])

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
            <label style={{marginBottom:'0px'}}>
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
        {(jimuMapView && jimuMapView.view && loggerValue) &&
          <span className='borderBottom'>SR actual: {jimuMapView.view.spatialReference.wkid}</span>
        }
        {(pointerCoords && loggerValue) && (
          <div className='planasCoordeStyle'>
            <span className="barraEscalaCoordsLabel">Coordenadas planas (SR {pointerCoords.sr}):</span>
            <br />
            <span className="barraEscalaCoordsValue">
              X: {pointerCoords.x.toFixed(2)}, Y: {pointerCoords.y.toFixed(2)}
            </span>
            <br />
          </div>
        )}
        {pointerGeoCoords && (
          <div>
            <span className="barraEscalaCoordsLabel">Coordenadas geográficas (SR {pointerGeoCoords.sr}):</span>
            <br />
            <span className="barraEscalaCoordsValue">
              Lat: {pointerGeoCoords.lat.toFixed(6)}, Lon: {pointerGeoCoords.lon.toFixed(6)}
            </span>
          </div>
        )}
        {pointerCoords9377 && (
          <div className='planasCoordeStyle'>
            <span className="barraEscalaCoordsLabel">Coordenadas planas (SR 9377):</span>
            <br />
            <span className="barraEscalaCoordsValue">
              X: {pointerCoords9377.x.toFixed(2)}, Y: {pointerCoords9377.y.toFixed(2)}
            </span>
            <br />
          </div>
        )}
        {(pointerGeoCoords9377 && loggerValue) && (
          <div>
            <span className="barraEscalaCoordsLabel">Coordenadas geográficas (SR 4326, desde 9377):</span>
            <br />
            <span className="barraEscalaCoordsValue">
              Lat: {pointerGeoCoords9377.lat.toFixed(6)}, Lon: {pointerGeoCoords9377.lon.toFixed(6)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Widget