import { React, type AllWidgetProps } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis' // The map object can be accessed using the JimuMapViewComponent
import { useEffect, useState } from "react"
// import "../styles/styles.css"
import "../styles/style.css"

const Widget = (props: AllWidgetProps<any>) => {
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>()
  // const [initialExtent, setInitialExtent] = useState(null)
  const [widgetModules, setWidgetModules] = useState(null)
  const [servicios, setServicios] = useState<InterfaceServicios>(undefined)
  const [utilsModule, setUtilsModule] = useState(null)
  const [departamentos, setDepartamentos] = useState([])


  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
      // setInitialExtent(jmv.view.extent) // Guarda el extent inicial
    }
  }

  const getDepartamentos = async (url: string) => {
    const dataResponse = await utilsModule.queryAttributesLayer({url:url+"/query", definitionExpression:"1=1", returnGeometry:false,outFields:"*"})
    const departAjustadosToRender = utilsModule.ajustarDataToRender(dataResponse,"decodigo","denombre")
    if (utilsModule.logger()) console.log({departAjustadosToRender})
    departAjustadosToRender.unshift({value:0, label:"Seleccione ..."})
    setDepartamentos(departAjustadosToRender)
  }


  useEffect(() => {
    if (!jimuMapView) return
    setTimeout(() => {
      if (servicios.urls) {
        getDepartamentos(servicios.urls.Departamentos)
      }
    }, 2000)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jimuMapView])

  useEffect(() => {
      import('../../../commonWidgets/widgetsModule').then(modulo => { setWidgetModules(modulo) })
      import('../../../utils/module').then(modulo => { setUtilsModule(modulo) })
      import('../../../api/servicios').then(modulo => { setServicios(modulo.default) })

  }, [])

    return (
      <div className="w-100 p-3  contendorTabFiltroIndicadores"
      style={{backgroundColor:'var(--sys-color-primary)'}}>
        {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
        )}
        {
          widgetModules && widgetModules.FILTROS_INDICADORES(props.dispatch, departamentos, jimuMapView)
        }
      </div>
    )
  }

  export default Widget


  export interface InterfaceServicios {
    urls: Urls;
}

export interface Urls {
    tablaContenido: string;
    Municipios: string;
    Departamentos: string;
    indicadores: Indicadores;
    indicadoresNaci: IndicadoresNaci;
}

export interface Indicadores {
    v_predios_fondo_tierras_mun: string;
    v_predios_inventario_baldios_mun: string;
    v_predios_adjudicados_mun: string;
    v_predios_adj_baldios_mun: string;
    v_bienes_fiscales_adj_mun: string;
    v_predios_sub_integrales_mun: string;
    v_predios_entregados_ft_mun: string;
    v_predios_formalizados_mun: string;
    v_predios_formal_mujeres_mun: string;
}

export interface IndicadoresNaci {
    v_predios_fondo_tierras_nacmun: string;
    v_predios_inv_baldios_nacmun: string;
    v_predios_adjudicados_macmun: string;
    v_predios_adj_baldios_nacmun: string;
    v_bienes_fiscales_adj_nacmun: string;
    v_predios_sub_integrales_nacmun: string;
    v_predios_entregados_ft_nacmun: string;
    v_predios_formalizados_nacmun: string;
    v_predios_for_mujeres_nacmun: string;
    v_predios_uaf_nacmun: string;
    v_predios_restierras_nacmun: string;
}