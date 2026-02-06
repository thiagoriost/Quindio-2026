/** @jsx jsx */
import { React, jsx, Immutable, AllDataSourceTypes } from 'jimu-core'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'

export default function Setting(props: any) {
  return (
    <div style={{ padding: 8 }}>
      <h4>Municipios</h4>

      <DataSourceSelector
        types={Immutable([AllDataSourceTypes.FeatureLayer])}
        useDataSources={props.useDataSources}
        onChange={props.onSettingChange}
        widgetId={props.id}
        mustUseDataSource
      />
    </div>
  )
}
