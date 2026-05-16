import { React, type AllWidgetProps } from 'jimu-core'
import { widgetIdPorNombre } from '../../../shared/utils/env-utils'

const Widget = (props: AllWidgetProps<any>) => {
    const [widgetName, setWidgetName] = React.useState('')
    const [widgetId, setWidgetId] = React.useState<string | undefined>()

    const buscarWidgetId = () => {
        const name = widgetName.trim()
        setWidgetId(name ? widgetIdPorNombre(name) : undefined)
    }

    return (
        <div style={{ background:"lightgray", padding: 12 }}>
            <div style={{fontSize:"30px"}}>Buscar ids por nombre</div>
            <input
                type="text"
                value={widgetName}
                onChange={(event) => setWidgetName(event.target.value)}
                placeholder="Nombre del widget"
                style={{ marginRight: 8 }}
            />
            <button type="button" onClick={buscarWidgetId}>
                Buscar ID
            </button>
            <div style={{ marginTop: 12 }}>
                {widgetId ? `ID encontrado: ${widgetId}` : 'No encontrado'}
            </div>
        </div>
    )
}

export default Widget