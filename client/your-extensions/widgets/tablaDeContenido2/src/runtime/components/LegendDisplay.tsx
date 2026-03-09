import { React} from 'jimu-core'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'

/**
 * LegendDisplay - Componente reutilizable para mostrar las leyendas de las capas activas en el mapa.
 * Puede ser utilizado desde cualquier widget.
 *
 * @param {Object} props
 * @param {Array<string>} props.activeLayerUrls - URLs de las capas activas
 * @returns {JSX.Element}
 */
const LegendDisplay = ({ activeLayerUrls = [] }) => {
  const [legends, setLegends] = React.useState([])

  React.useEffect(() => {
    if (!activeLayerUrls.length) {
      setLegends([])
      return
    }
    Promise.all(
      activeLayerUrls.map(async (url) => {
        try {
          const layer = new FeatureLayer({ url })
          await layer.load()
          let legendInfo = []
          try {
            legendInfo = await layer.fetchLegendInfos()
          } catch (fetchLegendError) {
            // Si fetchLegendInfos falla, intenta obtener la leyenda desde el endpoint REST
            try {
              const legendUrl = url.replace(/\/?$/, '') + '/legend?f=json'
              const response = await fetch(legendUrl)
              if (response.ok) {
                const data = await response.json()
                if (data && data.layers && Array.isArray(data.layers)) {
                  legendInfo = data.layers.flatMap(layerItem =>
                    (layerItem.legend || []).map(legendItem => ({
                      label: legendItem.label,
                      symbol: { url: legendItem.url },
                    }))
                  )
                }
              }
              // Si no hay leyenda, intenta extraer de drawingInfo
              if (!legendInfo || legendInfo.length === 0) {
                const layerInfoUrl = url.replace(/\/?$/, '') + '?f=json'
                const responseInfo = await fetch(layerInfoUrl)
                if (responseInfo.ok) {
                  const dataInfo = await responseInfo.json()
                  if (dataInfo && dataInfo.drawingInfo && dataInfo.drawingInfo.renderer) {
                    const renderer = dataInfo.drawingInfo.renderer
                    // Soporte para uniqueValue
                    if (renderer.type === 'uniqueValue' && Array.isArray(renderer.uniqueValueInfos)) {
                      legendInfo = renderer.uniqueValueInfos.map(info => {
                        const symbol = info.symbol
                        const colorArr = symbol.color || [0,0,0,0]
                        const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]/255})`
                        return {
                          label: info.label || info.value || 'Símbolo',
                          symbol: { color, style: symbol.style, outline: symbol.outline }
                        }
                      })
                    } else if (renderer.type === 'simple' && renderer.symbol) {
                      const symbol = renderer.symbol
                      const colorArr = symbol.color || [0,0,0,0]
                      const color = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]/255})`
                      legendInfo = [{
                        label: dataInfo.name || 'Símbolo',
                        symbol: { color, style: symbol.style, outline: symbol.outline }
                      }]
                    }
                  }
                }
              }
            } catch (restLegendError) {
              // No hacer nada, legendInfo quedará vacío
            }
          }
          if (!legendInfo || legendInfo.length === 0) {
            return {
              url,
              title: layer.title || url,
              legendInfo: [],
              error: 'Esta capa no tiene leyenda definida en el servicio.'
            }
          }
          return {
            url,
            title: layer.title || url,
            legendInfo,
          }
        } catch (error) {
          return {
            url,
            title: url,
            legendInfo: [],
            error: 'Error al cargar leyenda',
          }
        }
      })
    ).then(setLegends)
  }, [activeLayerUrls])

  return (
    <div className="legend-display">
      <h3>Leyendas de capas activas</h3>
      {legends.length === 0 && <div>No hay capas activas.</div>}
      {legends.map(({ url, title, legendInfo, error }) => (
        <div key={url} className="legend-layer">
          <strong>{title}</strong>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {legendInfo && legendInfo.length > 0 ? (
            <ul>
              {legendInfo.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  {item.symbol && item.symbol.url && (
                    <img src={item.symbol.url} alt={item.label} style={{ width: 24, height: 24, marginRight: 8 }} />
                  )}
                  {item.symbol && item.symbol.color && !item.symbol.url && (
                    <span style={{
                      display: 'inline-block',
                      width: 24,
                      height: 24,
                      marginRight: 8,
                      background: item.symbol.color,
                      border: '1px solid #888',
                      borderRadius: 4
                    }} />
                  )}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div>No hay leyenda disponible.</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default LegendDisplay
