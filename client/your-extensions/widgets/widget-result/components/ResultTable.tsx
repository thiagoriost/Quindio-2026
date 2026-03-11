/** @jsx jsx */
import { Table, Button } from 'jimu-ui'
import { React } from 'jimu-core'

/**
 * Propiedades del componente ResultTable.
 *
 * Define la estructura de los datos que el componente necesita
 * para renderizar la tabla de resultados y manejar interacciones
 * del usuario como selección de filas y exportación.
 */
interface Props {

  /**
   * Lista de entidades a mostrar en la tabla.
   *
   * Cada elemento normalmente corresponde a un `Graphic`
   * retornado por una consulta de ArcGIS (por ejemplo un
   * resultado de QueryTask o FeatureLayer).
   */
  features: any[]

  /**
   * Definición de los campos que se mostrarán como columnas
   * en la tabla.
   *
   * Cada objeto de campo debe contener al menos la propiedad
   * `name` y opcionalmente `alias`.
   */
  fields: any[]

  /**
   * Función opcional que se ejecuta cuando el usuario presiona
   * el botón **Exportar**.
   *
   * Generalmente se utiliza para exportar los resultados
   * de la tabla a formatos como CSV o Excel.
   */
  onExport?: () => void

  /**
   * Función que se ejecuta cuando el usuario selecciona
   * una fila de la tabla.
   *
   * Recibe como parámetro el `Graphic` correspondiente
   * a la fila seleccionada.
   *
   * Usualmente se utiliza para:
   * - Resaltar la geometría en el mapa.
   * - Hacer zoom a la entidad seleccionada.
   */
  onSelectFeature: (feature: __esri.Graphic) => void
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
export const ResultTable = ({ features, fields, onExport, onSelectFeature }: Props) => {

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
    <div>

      {/* Barra superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 8
        }}
      >
        <Button
          size="sm"
          type="primary"
          onClick={onExport}
        >
          Exportar
        </Button>
      </div>

      <Table>
        <thead>
          <tr>
            {fields.map(field => (
              <th key={field.name}>
                {field.alias || field.name}
              </th>
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
                cursor: 'pointer',
                backgroundColor: selectedIndex === index ? '#e6f2ff' : '',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedIndex !== index) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedIndex !== index) {
                  e.currentTarget.style.backgroundColor = ''
                }
              }}
            >
              {fields.map(field => (
                <td key={field.name}>
                  {f.attributes?.[field.name]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}