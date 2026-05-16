/** @jsx jsx */
import { React } from 'jimu-core'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'

export default function Setting(props) {

  return (
    <div style={{ padding: 16 }}>
      <MapWidgetSelector
        useMapWidgetIds={props.useMapWidgetIds}
        onSelect={(useMapWidgetIds) => {
          props.onSettingChange({
            id: props.id,
            useMapWidgetIds
          })
        }}
      />
    </div>
  )
}
