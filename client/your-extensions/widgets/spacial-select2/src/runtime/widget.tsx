import { React, type AllWidgetProps } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis' // The map object can be accessed using the JimuMapViewComponent
import { useState } from "react"
// import SelectWidget from "./components/SelectWidget";
import SelectWidget from "./components/SelectWidget"
import "./styles/style.css"

const Widget = (props: AllWidgetProps<any>) => {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>()
  const [initialExtent, setInitialExtent] = useState(null)


  const activeViewChangeHandler = (jmv: JimuMapView) => {
    // console.log(props)
    // console.log(11111111111)
    if (jmv) {
      setJimuMapView(jmv)
      setInitialExtent(jmv.view.extent) // Guarda el extent inicial
    }
  }

    return (
      <div className="w-100 p-3 bg-primary text-white">
        {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
        )}

        <div className="widget-styles">
          {jimuMapView && <SelectWidget props={{...props, jimuMapView}} />}
        </div>

      </div>
    )
  }

  export default Widget