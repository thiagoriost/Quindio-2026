/**
 * Componente para renderizar gráficos de resultados usando Recharts.
 *
 * Soporta dos tipos de visualización:
 * - "bar": gráfico de barras
 * - "pie": gráfico de pastel
 *
 * @component
 *
 * @param {Object} props - Propiedades del componente.
 * @param {any[]} props.data - Datos a graficar (arreglo de objetos).
 * @param {"bar" | "pie"} [props.type="bar"] - Tipo de gráfico a mostrar.
 * @param {string} [props.xKey="name"] - Clave para el eje X o etiquetas.
 * @param {string} [props.yKey="value"] - Clave para los valores numéricos.
 * @param {string} [props.title] - Título opcional mostrado debajo del gráfico.
 *
 * @returns {JSX.Element | null} Renderiza el gráfico o null si no hay datos.
 *
 * @example
 * <ResultGraphic
 *   data={[{ name: "A", value: 10 }, { name: "B", value: 20 }]}
 *   type="bar"
 *   xKey="name"
 *   yKey="value"
 *   title="Ejemplo de gráfico"
 * />
 *
 * @remarks
 * - Usa `ResponsiveContainer` para adaptarse al tamaño del contenedor.
 * - Si `data` está vacío o es null, no renderiza nada.
 * - El gráfico ocupa todo el alto disponible y el título se muestra en la parte inferior.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import React, { useState, useEffect } from "react"
// @ts-ignore
import "../src/styles/widgetResultFloating.css"
import { validaLoggerLocalStorage } from "../../shared/utils/export.utils"

const PIE_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#6a5acd",
  "#20b2aa", "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0",
  "#9966ff", "#ff9f40", "#e7e9ed", "#b59b00", "#c45850"
]

interface BarKeyDef {
  key: string;
  label: string;
  color: string;
}

interface GraphDataItem {
  titleLeyendX?: string;
  titleLeyendY?: string;
  barKeys?: BarKeyDef[];
  [key: string]: any;
}

interface MultiChartDataItem {
  name: string;
  dataToRenderGraphics: GraphDataItem[];
}

interface Props {
  data: any[];
  type?: "bar" | "pie";
  xKey?: string;
  yKey?: string;
  barKeys?: BarKeyDef[];
  title?: string;
}

const formatNumber = (value: any) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value ?? "-")
  return numeric.toLocaleString("es-CO", { maximumFractionDigits: 2 })
}


const ResultGraphic = ({ data, type = "bar", xKey = "name", yKey = "value", barKeys, title }: Props) => {

  const [currentIndex, setCurrentIndex] = useState(0)

  // reset index whenever a new data set arrives
  useEffect(() => {
    setCurrentIndex(0)
  }, [data])

  if(validaLoggerLocalStorage('logger')) console.log('ResultGraphic:', { data, type, xKey, yKey, barKeys, title })

  if (!data || data.length === 0) return null

  const isMultiChart = data[0]?.dataToRenderGraphics !== undefined

  let chartData: any[]
  let chartTitle: string
  let totalCharts: number
  let activeBarKeys: BarKeyDef[] | undefined = barKeys

  if (isMultiChart) {
    const multiData = data as MultiChartDataItem[]
    if (multiData.length > 1) {
      
      totalCharts = multiData[0]?.dataToRenderGraphics?.length ?? 1
      const safeIndex = Math.min(currentIndex, totalCharts - 1)

      // Derive barKeys from current slide; fall back to prop
      activeBarKeys = multiData[0]?.dataToRenderGraphics[safeIndex]?.barKeys ?? barKeys
  
      chartData = multiData.map(item => {
        const slide = item.dataToRenderGraphics[safeIndex]
        const point: any = { name: item.name }
        if (activeBarKeys && activeBarKeys.length > 0) {
          activeBarKeys.forEach(bk => { point[bk.key] = slide[bk.key] })
        }
        return point
      })
  
      // deja en chartData solo el primer elemento con la información de las barras, para que el gráfico pueda renderizar correctamente la leyenda y los colores, asumiendo que la estructura de datos es la misma para cada "slide" del gráfico
      chartData = chartData.slice(0, 1)
      chartTitle = multiData[0]?.dataToRenderGraphics[safeIndex]?.titleLeyendX ?? title ?? ''
    }else{
      // Derive barKeys from first slide for single-feature case
      activeBarKeys = multiData[0]?.dataToRenderGraphics[0]?.barKeys ?? barKeys
      chartData = multiData[0].dataToRenderGraphics
      chartTitle = multiData[0].dataToRenderGraphics[0]?.titleLeyendX ?? title ?? ''
    }

  } else {
    chartData = data
    chartTitle = title ?? ''
    totalCharts = 1
  }

  useEffect(() => {
    if(validaLoggerLocalStorage('logger')) console.log('Chart data updated:', { chartData, chartTitle })
      // setCurrentIndex(prev => (prev + 1) % totalCharts)
  }, [chartData, chartTitle])

  const isMultiBar = activeBarKeys && activeBarKeys.length > 0  
  const isAgropecuariaPie = type === "pie" && chartData.some((item) => item?.produccion != null && item?.porcentaje != null)// si al menos un item tiene las propiedades "produccion" y "porcentaje", se asume que es un gráfico de pastel agropecuario que requiere tooltip personalizado

  const renderPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const item = payload[0]?.payload || {}
    const nombre = item?.[xKey] ?? payload[0]?.name ?? "Sin dato"
    const produccion = item?.produccion ?? item?.[yKey] ?? payload[0]?.value ?? 0
    const porcentaje = item?.porcentaje ?? ((payload[0]?.percent ?? 0) * 100)

    return (
      <div style={{ background: "#fff", border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>
        <div><strong>{String(nombre)}</strong></div>
        <div>Produccion: {formatNumber(produccion)}</div>
        <div>Porcentaje: {Number(porcentaje).toFixed(2)}%</div>
      </div>
    )
  }

  return (
    <div className="widget-result-graphic">

    {/* TÍTULO */}
      {chartTitle && (
        <div className="widget-result-graphic-title">
          {chartTitle}
        </div>
      )}
      {/* GRÁFICO */}
      <div className="widget-result-graphic-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>

            {type === "bar" ? (
              <BarChart data={chartData} barSize={Math.max(20, Math.min(50, 300 / chartData.length))} margin={{ bottom: 40 }}>
                <XAxis dataKey={xKey} angle={-45} textAnchor="end" interval={0} height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                {isMultiBar
                  ? activeBarKeys.map(bk => (
                      <Bar key={bk.key} dataKey={bk.key} name={bk.label} fill={bk.color} />
                    ))
                  : <Bar dataKey={yKey} name={yKey === "value" ? "Municipio" : yKey} fill="#b59b00" />
                }
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey={yKey} 
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  label={isAgropecuariaPie ? false : true}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={isAgropecuariaPie ? renderPieTooltip : undefined} />
                {!isAgropecuariaPie && <Legend />}
              </PieChart>
            )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default ResultGraphic
