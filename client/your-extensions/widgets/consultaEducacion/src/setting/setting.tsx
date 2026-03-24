import { React } from "jimu-core"
import type { AllWidgetSettingProps } from "jimu-for-builder"
import { MapWidgetSelector } from "jimu-ui/advanced/setting-components"

/**
 * Componente de configuración del widget "consultaEducacion".
 * Permite seleccionar el widget de mapa con el que trabajará el widget principal.
 *
 * @component
 * @param {AllWidgetSettingProps<any>} props - Propiedades de configuración del widget
 * @returns {JSX.Element} Panel de configuración con selector de mapa
 *
 * @author IGAC - DIP
 * @since 2026
 */
const Setting = (props: AllWidgetSettingProps<any>) => {

    /**
     * Manejador de selección de widget de mapa.
     * Guarda los IDs de los widgets de mapa seleccionados en la configuración.
     *
     * @param {string[]} useMapWidgetIds - Array de IDs de widgets de mapa seleccionados
     * @returns {void}
     */
    const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
        props.onSettingChange({
          id: props.id,
          useMapWidgetIds: useMapWidgetIds
        })
    }

    return (
        <div className="widget-setting-demo">
          <MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={onMapWidgetSelected} />
        </div>
    )

  }

  export default Setting