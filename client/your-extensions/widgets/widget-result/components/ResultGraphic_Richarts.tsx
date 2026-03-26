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
  Legend
} from "recharts"

interface Props {
  data: any[];
  type?: "bar" | "pie";
  xKey?: string;
  yKey?: string;
  title?: string;
}


const ResultGraphic = ({ data, type = "bar", xKey = "name", yKey = "value", title }: Props) => {

  if (!data || data.length === 0) return null

  return (
    <div

      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0
      }}
    >

      {/* GRÁFICO */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data}>
              <XAxis dataKey={xKey} />
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
              />
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* TÍTULO */}
      {title && (
        <div
          style={{
            flex: '0 0 auto',
            textAlign: 'center',
            fontSize: 13,
            marginTop: 8, //  separa del gráfico
            marginBottom: 10, //  separa del borde inferior
            color: '#444',
            paddingTop: 4,
            borderTop: '1px solid #eee', // línea sutil
            fontWeight: 500,
            letterSpacing: 0.3
          }}
        >
          {title}
        </div>
      )}
    </div>
  )
}
export default ResultGraphic
