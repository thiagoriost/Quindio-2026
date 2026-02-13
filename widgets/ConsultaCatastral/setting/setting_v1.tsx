/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'

export default function Setting(props: any) {
  return (
    <div style={{ padding: 8 }}>
      <MapWidgetSelector
        useMapWidgetIds={props.useMapWidgetIds}
        onSelect={props.onSettingChange}
      />
    </div>
  )
}
