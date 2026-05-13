import { React } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'

/**
 * Panel de configuracion del widget Buffer.
 * Permite seleccionar el Map Widget que se usara en runtime.
 *
 * @param props Propiedades de configuracion del widget en Experience Builder.
 * @returns Vista de configuracion con selector de mapa.
 */
const Setting = (props: AllWidgetSettingProps<any>) => {
  /**
   * Guarda la seleccion del mapa sobre la configuracion del widget.
   *
   * @param useMapWidgetIds Identificadores de widgets de mapa seleccionados.
   */
  const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds
    })
  }

  return (
    <div className='widget-setting-demo'>
      <MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={onMapWidgetSelected} />
    </div>
  )
}

export default Setting
