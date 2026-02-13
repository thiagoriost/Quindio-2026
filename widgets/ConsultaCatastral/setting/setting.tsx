/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'

export default function Setting (props: AllWidgetSettingProps<any>) {
  
  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    })
  }

  return (
    <div className="widget-setting-consulta-catastral p-3">
      <SettingSection
        title="Configuración de Mapa"
      >
        <SettingRow label="Selector de Mapa:">
          <MapWidgetSelector
            useMapWidgetIds={props.useMapWidgetIds}
            onSelect={onMapSelected}
          />
        </SettingRow>
        
        {/* Ayuda visual por si el selector falla */}
        {!props.useMapWidgetIds && (
          <div className="mt-2 text-warning" style={{fontSize: '12px'}}>
            ⚠️ No se ha detectado ningún widget de mapa en esta página. Asegúrese de agregar uno primero.
          </div>
        )}
      </SettingSection>
    </div>
  )
}