/** @jsx jsx */
import {useState, useCallback } from 'react'
import type { AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'

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

  const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null)
  const [currentScale, setCurrentScale] = useState<number | null>(null)


  /**
   * Sincroniza el estado del widget cuando cambia la escala del mapa.
   * Busca el nivel de detalle (LOD) más cercano a la escala actual del mapa y actualiza el estado.
   * @param {__esri.MapView} view - Instancia de MapView de ArcGIS.
   */
  const watchScale = useCallback((view: __esri.MapView) => {
    view.watch('scale', (newScale: number) => {
      const closest = LODS.reduce((prev, curr) =>
        Math.abs(curr.scale - newScale) < Math.abs(prev.scale - newScale)
          ? curr
          : prev
      )
      setCurrentScale(closest.level)
    })
  }, [])


  /**
   * Callback que se ejecuta cuando el MapView está disponible o cambia.
   * Inicializa el estado y comienza a observar los cambios de escala.
   * @param {JimuMapView} jmv - Instancia de JimuMapView proporcionada por el widget de mapa.
   */
  const onActiveViewChange = useCallback((jmv: JimuMapView) => {
    if (!jmv) return

    setJimuMapView(jmv)
    const view = jmv.view as __esri.MapView

    setCurrentScale(view.zoom)
    watchScale(view)
  }, [watchScale])

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
    <div className="divBarraEscala">
      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={onActiveViewChange}
      />
        <h1>Rigo</h1>
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
  )
}

export default Widget