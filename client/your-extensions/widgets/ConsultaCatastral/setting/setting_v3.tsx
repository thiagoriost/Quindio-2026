/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'

export default function Setting(props: AllWidgetSettingProps<any>) {
  
  // Función para manejar la selección de mapa de forma segura
  const onMapSelected = (useMapWidgetIds: string[]) => {
    // Validamos que realmente haya una selección
    if (!useMapWidgetIds) return;

    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    });
  };

  return (
    <div className="widget-setting-consulta-catastral">
      <SettingSection title="Vincular con Mapa">
        <SettingRow>
          <div className="text-muted mb-2">Seleccione el mapa para realizar las consultas:</div>
        </SettingRow>
        <SettingRow>
          <MapWidgetSelector
            useMapWidgetIds={props.useMapWidgetIds}
            onSelect={onMapSelected}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}