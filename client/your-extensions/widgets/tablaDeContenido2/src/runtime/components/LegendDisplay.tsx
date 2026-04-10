
import { React } from 'jimu-core'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import '../../styles/LegendDisplay.css'
import { validaLoggerLocalStorage } from '../../../../shared/utils/export.utils'

/**
 * LegendDisplay
 *
 * Componente reutilizable para mostrar las leyendas de las capas activas en el mapa.
 * Puede ser utilizado desde cualquier widget.
 *
 * Props:
 * @param {Object} props - Propiedades del componente
 * @param {Array<string>} props.activeLayerUrls - URLs de las capas activas a consultar
 *
 * Estructura general:
 * - Usa React.useState para almacenar las leyendas obtenidas de los servicios.
 * - Usa React.useEffect para reaccionar a cambios en las capas activas y actualizar la leyenda.
 * - Obtiene la leyenda de cada capa usando la API REST de ArcGIS o, si falla, extrae la simbología desde drawingInfo.
 * - Soporta renderers de tipo uniqueValue y simple, incluyendo símbolos de imagen (PictureFillSymbol).
 * - Renderiza la leyenda en una grilla visual, mostrando símbolos y etiquetas.
 */

/**

 *
 * @param {Object} props
 * @param {Array<string>} props.activeLayerUrls - URLs de las capas activas
 * @returns {JSX.Element}
 */
const LegendDisplay = ({ activeLayerUrls = [] }: { activeLayerUrls: string[] }): JSX.Element => {
  /**
   * legends: Estado local que almacena la información de leyenda de cada capa activa.
   * Estructura: Array de objetos con { url, title, legendInfo, error }
   */
  const [legends, setLegends] = React.useState([])

  /**
   * useEffect principal del componente.
   * Se ejecuta cada vez que cambia el array de URLs de capas activas.
   *
   * - Si no hay capas activas, limpia la leyenda.
   * - Para cada URL, intenta cargar la capa y obtener la leyenda:
   *   1. Intenta obtener la leyenda desde el endpoint REST estándar (/legend?f=json).
   *   2. Si no hay leyenda, consulta el endpoint principal (?f=json) y extrae la simbología desde drawingInfo.renderer.
   *   3. Soporta renderers de tipo uniqueValue y simple, incluyendo símbolos de imagen (PictureFillSymbol).
   *   4. Si todo falla, retorna error para esa capa.
   */
  React.useEffect(() => {
    if (!activeLayerUrls.length) {
      setLegends([])
      return
    }

    Promise.all(
      activeLayerUrls.map(async (url) => {
        try {
          // Crea una instancia de FeatureLayer para obtener metadatos y título
          const layer = new FeatureLayer({ url })
          await layer.load()
          let legendInfo = []

          // 1. Intenta obtener la leyenda desde el endpoint REST estándar
          try {
            const legendUrl = url.replace(/\/?$/, '') + '/legend?f=json'
            const response = await fetch(legendUrl)
            if (response.ok) {
              const data = await response.json()
              if(validaLoggerLocalStorage('logger')) console.log({data})
              if (data && data.layers && Array.isArray(data.layers)) {
                legendInfo = data.layers.flatMap((layerItem: { legend: any }) => // Aplanamos el array de capas para obtener todos los símbolos
                  (layerItem.legend || []).map((legendItem: { label: any; url: any }) => ({ // Para cada símbolo en la leyenda, extraemos la etiqueta y la URL de la imagen
                    label: legendItem.label, // Etiqueta del símbolo
                    symbol: { url: legendItem.url }, // URL de la imagen del símbolo
                  }))
                )
              }
            }
            // 2. Si no hay leyenda, intenta extraer de drawingInfo (renderer)
            if (!legendInfo || legendInfo.length === 0) {
              const layerInfoUrl = url.replace(/\/?$/, '') + '?f=json'
              const responseInfo = await fetch(layerInfoUrl)
              if (responseInfo.ok) {
                const dataInfo = await responseInfo.json() // Verifica que exista drawingInfo y renderer para extraer la simbología
                if (dataInfo && dataInfo.drawingInfo && dataInfo.drawingInfo.renderer) {
                  const renderer = dataInfo.drawingInfo.renderer
                  // 2a. Soporte para uniqueValue: genera un símbolo por valor único
                  if (renderer.type === 'uniqueValue' && Array.isArray(renderer.uniqueValueInfos)) {
                    legendInfo = renderer.uniqueValueInfos.map((info: { symbol: any; label: any; value: any }) => {
                      const symbol = info.symbol
                      // Soporte para PictureMarkerSymbol (esriPMS) dentro de uniqueValueInfos
                      if (symbol.type === 'esriPMS' && symbol.imageData) {
                        const imageUrl = `data:${symbol.contentType};base64,${symbol.imageData}`
                        return {
                          label: info.label || info.value || 'Símbolo',
                          symbol: {
                            svg: (
                              <img src={imageUrl} alt={info.label || info.value || 'Símbolo'} className='imgLeyend' />
                            )
                          }
                        }
                      }
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
                  // 2b. Soporte para renderer simple (un solo símbolo)
                  } else if (renderer.type === 'simple' && renderer.symbol) {
                    const symbol = renderer.symbol
                    // Soporte para PictureMarkerSymbol (esriPMS): muestra la imagen directamente
                    if (symbol.type === 'esriPMS' && symbol.imageData) {
                      const imageUrl = `data:${symbol.contentType};base64,${symbol.imageData}`
                      legendInfo = [{
                        label: dataInfo.name || 'Símbolo',
                        symbol: {
                          svg: (
                            <img src={imageUrl} alt={dataInfo.name || 'Símbolo'} className='imgLeyend' />
                          )
                        }
                      }]
                    // Soporte para PictureFillSymbol (esriPFS): genera SVG con patrón de imagen
                    } else if (symbol.type === 'esriPFS' && symbol.imageData) {
                      const imageUrl = `data:${symbol.contentType};base64,${symbol.imageData}`
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
                      // Relleno sólido: genera color de fondo y borde
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
            // Si falla la consulta REST, legendInfo quedará vacío

          }

          // Si no se obtuvo leyenda, retorna error para esa capa
          if (!legendInfo || legendInfo.length === 0) {
            return {
              url,
              title: layer.title || url,
              legendInfo: [],
              error: 'Esta capa no tiene leyenda definida en el servicio.'
            }
          }
          // Retorna la información de leyenda para la capa
          return {
            url,
            title: layer.title || url,
            legendInfo,
          }
        } catch (error) {
          // Si ocurre un error general, retorna error para esa capa
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

  // Renderizado del componente:
  // - Muestra un título y, si no hay capas activas, un mensaje.
  // - Para cada capa, muestra el título, posibles errores y la leyenda (símbolos y etiquetas).
  // - Los símbolos pueden ser SVG (para imágenes) o bloques de color (para rellenos sólidos).
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
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: 0,
                margin: 0,
                listStyle: 'none'
              }}
            >
              {legendInfo.map((item: { symbol: { svg: string | number | boolean | React.ReactElement<any, string > | Iterable<React.ReactNode> | React.ReactPortal; color: any; outlineStyle: React.CSSProperties }; label: string | number | boolean | React.ReactElement<any, string > | Iterable<React.ReactNode> | React.ReactPortal }, idx: React.Key) => (
                <li key={idx} className="legendItem" style={{ width: '100%', minWidth: 0 }}>
                  {/* Si el símbolo es SVG (PictureFillSymbol), lo muestra como SVG */}
                  {item.symbol && item.symbol.svg && (
                    <div className={legendInfo.length > 1 ? 'divImgLeyendCol' : 'divImgLeyendRow'}>
                      <p>{item.label}</p>
                      <span className="legendSymbol" style={{ padding: 0, background: 'none' }}>{item.symbol.svg}</span>
                    </div>
                  )}
                  {/* Si el símbolo es un color sólido, lo muestra como bloque de color con borde */}
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
