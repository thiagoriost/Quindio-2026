import { React } from "jimu-core"
import { JimuMapViewComponent } from "jimu-arcgis"
import { useClientPrint } from "./useClientPrint"

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
