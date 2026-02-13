/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'

export default function Setting(props: AllWidgetSettingProps<any>) {
  
  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    })
  }

  return (
    <div className="widget-setting-consulta-catastral">
      {/* SettingSection crea el bloque visual con título en el panel lateral */}
      <SettingSection
        title="Configuración de Mapa"
      >
        <SettingRow label="Seleccionar Mapa">
          <MapWidgetSelector
            useMapWidgetIds={props.useMapWidgetIds}
            onSelect={onMapSelected}
          />
        </SettingRow>
      </SettingSection>
    </div>
  )
}