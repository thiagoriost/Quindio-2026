import { React } from 'jimu-core'
import { IMState } from 'jimu-core'
import { useSelector } from 'react-redux'
import { goToInitialExtent } from '../utils/export.utils'
import { JimuMapView } from 'jimu-arcgis'

/**
 * Hook personalizado que detecta cuando un widget de ArcGIS Experience Builder
 * cambia su estado de `OPENED` a `CLOSED`. Este hook solo detecta cierre del widget.
 *
 * Este hook observa el estado del widget en el store global (IMState)
 * mediante `useSelector` y ejecuta un callback opcional únicamente
 * cuando ocurre una transición real de abierto → cerrado.
 *
 * No se ejecuta:
 * - En el primer render
 * - Si el widget ya estaba cerrado
 * - Si cambia a cualquier otro estado distinto de CLOSED
 *
 * @param {string} widgetId - ID único del widget (props.id en Experience Builder).
 * @param {() => void} [onClose] - Función opcional que se ejecuta cuando el widget se cierra.
 *
 * @example
 * useOnWidgetClose(props.id, () => {
 *   console.log('El widget fue cerrado')
 *   limpiarResultados()
 *   cancelarPeticionesPendientes()
 * })
 *
 * @remarks
 * Internamente:
 * - Usa `useSelector` para obtener `widgetsRuntimeInfo[widgetId].state`
 * - Usa `useRef` para almacenar el estado previo
 * - Usa `useEffect` para comparar transición de estado
 *
 * Estados comunes en Experience Builder:
 * - 'OPENED'
 * - 'CLOSED'
 * - 'ACTIVE'
 *
 * @returns {void} No retorna ningún valor.
 */
export const useOnWidgetClose = (
  widgetId: string,
  jimuMapView: JimuMapView,
  initialExtent: React.MutableRefObject<__esri.Extent>,
  onClose?: () => void,
) => {

  const widgetState = useSelector((state: IMState) =>
    state.widgetsRuntimeInfo?.[widgetId]?.state
  )

  const prevState = React.useRef(widgetState)

  React.useEffect(() => {
    if (
      prevState.current === 'OPENED' &&
      widgetState === 'CLOSED'
    ) {
      goToInitialExtent( jimuMapView, initialExtent, 12 )
      onClose?.()
    }

    prevState.current = widgetState
  }, [widgetState])
}
