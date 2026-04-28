/** @jsx jsx */

import { MapWidgetSelector } from "jimu-ui/advanced/setting-components" //  allows the author to choose which map widget to use

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