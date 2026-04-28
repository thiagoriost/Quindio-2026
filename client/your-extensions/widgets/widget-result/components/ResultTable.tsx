/** @jsx jsx */
import { Table } from 'jimu-ui'
import { React } from 'jimu-core'
import { validaLoggerLocalStorage } from '../../shared/utils/export.utils'


/**
 * Propiedades del componente ResultTable.
 *
 * Define la estructura de los datos que el componente necesita
 * para renderizar la tabla de resultados y manejar interacciones
 * del usuario como selección de filas y exportación.
 */
interface Props {
  features: any[]
  fields: any[]
  onExport?: () => void
  onSelectFeature: (feature: __esri.Graphic) => void

  total: number
  page: number
  totalPages: number
  setPage: (page: any) => void
  // cef 20260325
  viewMode?: 'tabla' | 'grafico'
  onChangeView?: (view: 'tabla' | 'grafico') => void
  withGraphic?: boolean
  data?: {
    withGraphic?: {
      showGraphic: boolean
      graphicData: any[]
      graphicType: string
      graphicTitle?: string
    }
  }
  setViewMode?: (view: 'tabla' | 'grafico') => void
}


/**
 * Componente React que renderiza una tabla de resultados
 * basada en un conjunto de entidades (`features`) y una
 * definición de campos (`fields`).
 *
 * Este componente se utiliza típicamente en widgets de
 * consulta dentro de aplicaciones basadas en
 * **ArcGIS Experience Builder**.
 *
 * Funcionalidades principales:
 * - Renderizar dinámicamente las columnas según la
 *   definición de campos.
 * - Mostrar registros provenientes de servicios GIS.
 * - Permitir la selección de filas para interactuar
 *   con el mapa.
 * - Resaltar visualmente la fila seleccionada.
 * - Permitir exportar los resultados mediante un botón.
 *
 * @component
 * @param {Props} props Propiedades del componente.
 * @returns {JSX.Element} Tabla de resultados renderizada.
 *
 * @example
 * <ResultTable
 *   features={features}
 *   fields={fields}
 *   onExport={handleExport}
 *   onSelectFeature={(feature) => {
 *     zoomToFeature(feature)
 *   }}
 * />
 */
export const ResultTable = ({ features, fields, onSelectFeature, data }: Props) => {

  if(validaLoggerLocalStorage('logger')) console.log({data})
  /**
   * Índice de la fila actualmente seleccionada.
   *
   * Se utiliza para aplicar resaltado visual
   * en la tabla.
   */
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)

  /**
   * Validación básica para evitar renderizar la tabla
   * cuando no existen datos o campos definidos.
   */
  if (!features?.length || !fields?.length) {
    return <div>No hay datos para mostrar</div>
  }

  return (
    <div className="widget-result-table-container">


      {/* CONTENEDOR SCROLL */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto", // aquí vuelve el scroll horizontal
        }}
      >
        <Table style={{ minWidth: "max-content" }}>
          <thead>
            <tr>
              {fields.map((field) => (
                <th key={field.name}>{field.alias || field.name}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {features.map((f, index) => (
              <tr
                key={index}
                onClick={() => {
                  setSelectedIndex(index)
                  onSelectFeature(f)
                }}
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedIndex === index ? "#e6f2ff" : "",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (selectedIndex !== index) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedIndex !== index) {
                    e.currentTarget.style.backgroundColor = ""
                  }
                }}
              >
                {fields.map((field) => (
                  <td key={field.name}>{f.attributes?.[field.name]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}