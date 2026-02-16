/**
 * @fileoverview Panel de configuración del widget de impresión de mapas.
 * @module printCliente/setting
 */

import { React } from "jimu-core"
import type { AllWidgetSettingProps } from "jimu-for-builder"
import { MapWidgetSelector } from "jimu-ui/advanced/setting-components"

/**
 * Componente de configuración del widget printCliente.
 * Permite al autor de la experiencia seleccionar qué widget de mapa
 * se utilizará para la captura e impresión.
 *
 * En ArcGIS Experience Builder puede haber múltiples widgets de mapa
 * en una misma página, por lo que es necesario especificar cuál usar.
 * @param {AllWidgetSettingProps<any>} props - Propiedades del panel de configuración.
 * @param {string} props.id - Identificador único del widget.
 * @param {string[]} [props.useMapWidgetIds] - IDs de widgets de mapa actualmente seleccionados.
 * @param {Function} props.onSettingChange - Callback para guardar cambios de configuración.
 * @returns {JSX.Element} Panel con selector de widget de mapa.
 */
const Setting = (props: AllWidgetSettingProps<any>) => {

    /**
     * Manejador de selección de widget de mapa.
     * Actualiza la configuración del widget con los IDs seleccionados.
     * @param {string[]} useMapWidgetIds - Array de IDs de widgets de mapa seleccionados.
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