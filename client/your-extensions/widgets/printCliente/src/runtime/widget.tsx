/**
 * @fileoverview Widget principal para impresión de mapas en PDF del lado del cliente.
 * @module printCliente/widget
 */

import { React } from "jimu-core"
import { JimuMapViewComponent } from "jimu-arcgis"
import { useClientPrint } from "./useClientPrint"

/**
 * Componente principal del widget de impresión de mapas.
 * Permite al usuario generar un PDF del mapa activo con un solo clic.
 * @param {object} props - Propiedades del widget de Experience Builder.
 * @param {string[]} [props.useMapWidgetIds] - Array de IDs de widgets de mapa configurados.
 * @returns {JSX.Element} Interfaz del widget con botón de impresión.
 * @example
 * El widget se configura automáticamente en Experience Builder
 * <Widget useMapWidgetIds={['map-widget-1']} />
 */
export default function Widget(props: any) {

  const [jimuMapView, setJimuMapView] = React.useState<any>()

  const { print, loading } = useClientPrint(jimuMapView)

  return (
    <div>
      <button onClick={print} disabled={loading}>
        {loading ? "Generando..." : "Imprimir PDF"}
      </button>

      <JimuMapViewComponent
        useMapWidgetId={props.useMapWidgetIds?.[0]}
        onActiveViewChange={setJimuMapView}
      />
    </div>
  )
}
