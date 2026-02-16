/**
 * @fileoverview Widget principal para impresión de mapas en PDF del lado del cliente.
 * Proporciona un formulario para configurar título y autor del mapa antes de generar el PDF.
 * @module printCliente/widget
 */

import { React } from "jimu-core"
import { JimuMapViewComponent } from "jimu-arcgis"
import { useClientPrint } from "./useClientPrint"

/**
 * Componente principal del widget de impresión de mapas.
 * Permite al usuario:
 * - Configurar el título del mapa (valor por defecto: "MAPA TEMÁTICO")
 * - Configurar el autor del mapa (valor por defecto: "IGAC")
 * - Generar un PDF con el mapa actual, incluyendo leyenda automática
 *
 * @param {object} props - Propiedades del widget de Experience Builder.
 * @param {string[]} [props.useMapWidgetIds] - Array de IDs de widgets de mapa configurados.
 * @returns {JSX.Element} Interfaz del widget con formulario y botón de impresión.
 * @example
 * // El widget se configura automáticamente en Experience Builder
 * <Widget useMapWidgetIds={['map-widget-1']} />
 */
export default function Widget(props: any) {

  const [jimuMapView, setJimuMapView] = React.useState<any>()
  const [title, setTitle] = React.useState("MAPA TEMÁTICO")
  const [author, setAuthor] = React.useState("IGAC")

  const { print, loading } = useClientPrint(jimuMapView, { title, author })

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Título del mapa:
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value) }}
          placeholder="Ingrese el título del mapa"
          style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Autor:
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => { setAuthor(e.target.value) }}
          placeholder="Ingrese el autor"
          style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={print}
        disabled={loading}
        style={{ width: '100%', padding: '8px', cursor: loading ? 'wait' : 'pointer' }}
      >
        {loading ? "Generando..." : "Imprimir PDF"}
      </button>

      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={setJimuMapView}
      />
    </div>
  )
}
