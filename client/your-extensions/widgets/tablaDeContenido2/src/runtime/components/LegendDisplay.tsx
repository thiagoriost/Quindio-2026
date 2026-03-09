import { React} from 'jimu-core'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import '../../styles/legendDisplay.css'

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
                        const fillColor = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]/255})`
                        let outlineStyle = {}
                        if (symbol.outline && symbol.outline.color) {
                          const outlineArr = symbol.outline.color
                          outlineStyle = {
                            border: `${symbol.outline.width || 2}px solid rgba(${outlineArr[0]},${outlineArr[1]},${outlineArr[2]},${outlineArr[3]/255})`
                          }
                        }
                        return {
                          label: info.label || info.value || 'Símbolo',
                          symbol: { color: fillColor, style: symbol.style, outline: symbol.outline, outlineStyle }
                        }
                      })
                      console.log({legendInfo})
                    } else if (renderer.type === 'simple' && renderer.symbol) {
                      const symbol = renderer.symbol
                      // Soporte para PictureFillSymbol (esriPFS)
                      if (symbol.type === 'esriPFS' && symbol.imageData) {
                        // Construir data URL
                        const imageUrl = `data:${symbol.contentType};base64,${symbol.imageData}`
                        // Outline
                        let outlineColor = 'rgba(0,0,0,1)'
                        let outlineWidth = 1
                        if (symbol.outline && symbol.outline.color) {
                          const outlineArr = symbol.outline.color
                          outlineColor = `rgba(${outlineArr[0]},${outlineArr[1]},${outlineArr[2]},${outlineArr[3]/255})`
                          outlineWidth = symbol.outline.width || 1
                        }
                        legendInfo = [{
                          label: dataInfo.name || 'Símbolo',
                          symbol: {
                            svg: (
                              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <pattern id={`patternId-${symbol.url}`} patternUnits="userSpaceOnUse" width="48" height="48">
                                    <image href={imageUrl} x="0" y="0" width="48" height="48" />
                                  </pattern>
                                </defs>
                                <rect x="2" y="2" width="20" height="20" fill={`url(#patternId-${symbol.url})`} stroke={outlineColor} strokeWidth={outlineWidth} rx="4" />
                              </svg>
                            )
                          }
                        }]
                      } else {
                        // Relleno sólido
                        const colorArr = symbol.color || [0,0,0,0]
                        const fillColor = `rgba(${colorArr[0]},${colorArr[1]},${colorArr[2]},${colorArr[3]/255})`
                        let outlineStyle = {}
                        if (symbol.outline && symbol.outline.color) {
                          const outlineArr = symbol.outline.color
                          outlineStyle = {
                            border: `${symbol.outline.width || 2}px solid rgba(${outlineArr[0]},${outlineArr[1]},${outlineArr[2]},${outlineArr[3]/255})`
                          }
                        }
                        legendInfo = [{
                          label: dataInfo.name || 'Símbolo',
                          symbol: { color: fillColor, style: symbol.style, outline: symbol.outline, outlineStyle }
                        }]
                      }
                    }
                  }
                }
              }
            } catch (restLegendError) {
              // No hacer nada, legendInfo quedará vacío

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
    <div
      className="legendDisplay"
      style={{
        maxHeight: '70vh',
        overflowY: 'auto',
        paddingRight: '8px' // espacio para el scrollbar
      }}
    >
      <h3>Leyendas de capas activas</h3>
      {legends.length === 0 && <div>No hay capas activas.</div>}
      {legends.map(({ url, title, legendInfo, error }) => (
        <div key={url} className="legendLayer">
          <strong>{title}</strong>
          {error && <div className="errorMsg">{error}</div>}
          {legendInfo && legendInfo.length > 0 ? (
            <ul>
              {legendInfo.map((item, idx) => (
                <li key={idx} className="legendItem" style={{width:'stretch'}}>
                  {/* SVG para PictureFillSymbol */}
                  {item.symbol && item.symbol.svg && (
                    <span className="legendSymbol" style={{ padding: 0, background: 'none' }}>{item.symbol.svg}</span>
                  )}
                  {/* <span className="legendLabel" style={{width:'stretch'}}>{item.label}</span> */}
                  {/* Relleno sólido */}
                  {item.symbol && item.symbol.color && !item.symbol.svg && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '100%',
                        height: '20px',
                        background: item.symbol.color,
                        ...((item.symbol.outlineStyle) ? item.symbol.outlineStyle : {})
                      }}
                    >
                      {item.label}
                      </span>
                  )}
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
