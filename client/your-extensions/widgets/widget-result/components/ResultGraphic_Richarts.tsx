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

const PIE_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#6a5acd",
  "#20b2aa", "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0",
  "#9966ff", "#ff9f40", "#e7e9ed", "#b59b00", "#c45850"
]
import "../src/styles/widgetResultFloating.css"

interface Props {
  data: any[];
  type?: string //"bar" | "pie";
  xKey?: string;
  yKey?: string;
  title?: string;
}


const ResultGraphic = ({ data, type = "bar", xKey = "name", yKey = "value", title }: Props) => {

  if (!data || data.length === 0) return null

  return (
    <div className="widget-result-graphic">

    {/* TÍTULO */}
      {title && (
        <div className="widget-result-graphic-title">
          {title}
        </div>
      )}
      {/* GRÁFICO */}
      <div className="widget-result-graphic-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          {type === "bar" ? (
            <BarChart data={data} barSize={Math.max(20, Math.min(50, 300 / data.length))} margin={{ bottom: 40 }}>
              <XAxis dataKey={xKey} angle={-45} textAnchor="end" interval={0} height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={yKey} fill="#b59b00" />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

    </div>
  )
}
export default ResultGraphic
