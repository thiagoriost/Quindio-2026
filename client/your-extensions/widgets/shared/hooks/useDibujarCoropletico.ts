import { React } from 'jimu-core'
import type { JimuMapView } from 'jimu-arcgis'
import { dibujarFeaturesCoropletico, type CoroplethConfig } from '../utils/export.utils'

/**
 * Hook que gestiona el ciclo de vida completo del dibujo coroplético en el mapa.
 *
 * - Dibuja automáticamente cuando `features`, `jimuMapView` o `coroplethConfig` cambian.
 * - Limpia los gráficos anteriores antes de dibujar nuevos.
 * - Limpia los gráficos al desmontar el componente.
 *
 * @param {Object} params
 * @param {__esri.Graphic[]} params.features - Features a dibujar (puede venir de Redux, se clonan internamente).
 * @param {JimuMapView} params.jimuMapView - Vista activa del mapa.
 * @param {CoroplethConfig} [params.coroplethConfig] - Configuración coroplética (field + leyenda).
 * @param {boolean} [params.enabled=true] - Controla si el hook debe dibujar. Útil para condicionar
 *   el renderizado sin desmontar el hook (ej. solo dibujar cuando showGraphic es true).
 *
 * @returns {__esri.Graphic[]} Array de gráficos actualmente dibujados en el mapa.
 *
 * @example
 * ```tsx
 * const graphics = useDibujarCoropletico({
 *   features: data.features,
 *   jimuMapView,
 *   coroplethConfig: { field: "TOTALESTUDIANTES", leyenda },
 *   enabled: data.withGraphic?.showGraphic
 * })
 * ```
 */
export const useDibujarCoropletico = ({
  features,
  jimuMapView,
  coroplethConfig,
  enabled = true
}: {
  features: __esri.Graphic[]
  jimuMapView: JimuMapView
  coroplethConfig?: CoroplethConfig
  enabled?: boolean
}): __esri.Graphic[] => {
  // console.log('useDibujarCoropletico', { features, jimuMapView, coroplethConfig, enabled })
  const graphicsRef = React.useRef<__esri.Graphic[]>([])

  React.useEffect(() => {
    // Limpiar gráficos anteriores
    if (graphicsRef.current.length && jimuMapView?.view) {
      jimuMapView.view.graphics.removeMany(graphicsRef.current)
      graphicsRef.current = []
    }

    if (!enabled || !features?.length || !jimuMapView) {
      return
    }

    const newGraphics = dibujarFeaturesCoropletico({
      features,
      jimuMapView,
      coroplethConfig
    })

    graphicsRef.current = newGraphics

    // Cleanup al desmontar o cuando cambien las dependencias
    return () => {
      if (graphicsRef.current.length && jimuMapView?.view) {
        jimuMapView.view.graphics.removeMany(graphicsRef.current)
        graphicsRef.current = []
      }
    }
  }, [features, jimuMapView, coroplethConfig?.field, coroplethConfig?.leyenda, enabled])

  return graphicsRef.current
}
