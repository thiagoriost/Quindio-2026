import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis' // The map object can be accessed using the JimuMapViewComponent
import { useEffect, useRef } from 'react'

//Importación componentes personalizados
//Componente DrawMap - 2024-06-24
import DrawMap from './components/drawMap'
//Componente FiltersCS - 2024-06-24
import FiltersCS from './components/filtersCS'
//Componente TablaResultCS - 2024-06-25
import TablaResultCS from './components/tablaResultCS'
//Componente DialogsCS - 2024-06-26
import DialogsCS from './components/dialogsCS'

//Importación estilos
import '../styles/style.css'

//Importación interfaces
import { type InterfaceResponseConsultaSimple, type InterfaceMensajeModal, typeMSM } from '../types/interfaceResponseConsultaSimple'

//Definición objetos
const { useState } = React

const Widget = (props: AllWidgetProps<any>) => {
  //Para componente FiltersCS
  const [jsonSERV, setJsonSERV] = useState([])
  const [temas, setTemas] = useState([])
  const [subtemas, setSubtemas] = useState([])
  const [capas, setCapas] = useState([])
  const [grupos, setGrupos] = useState([])
  const [capasAttr, setCapasAttr] = useState([])
  const [txtValorState, setValorState] = useState(true)
  const [txtValor, setValor] = useState('')
  const [selTema, setselTema] = useState(undefined)
  const [selSubtema, setselSubtema] = useState<number | string>()
  const [selGrupo, setselGrupo] = useState(undefined)
  const [selCapas, setselCapas] = useState(undefined)
  const [selAttr, setselAttr] = useState(undefined)
  const [urlCapa, setUrlCapa] = useState('')
  const [widgetModules, setWidgetModules] = useState(null)

  //2024-06-13 - DataGrid
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [utilsModule, setUtilsModule] = useState(null)

  const [isLoading, setIsLoading] = useState(false)
  //To add the layer to the Map, a reference to the Map must be saved into the component state.
  //Mapa
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>()
  //2024-06-25
  const [renderMap, setRenderMap] = useState<boolean>(false)
  //Extent Map
  const [view, setView] = useState(null)

  //Layer Extent - 2023-06-20
  const [spatialRefer, setSpatialRefer] = useState<any>()
  const [lastGeometriDeployed, setLastGeometriDeployed] = useState()

  const [ResponseConsultaSimple, setResponseConsultaSimple] = useState<InterfaceResponseConsultaSimple>()

  const [controlForms, setControlForms] = useState(false)

  //Tipo de gráfico en mapa - 2024-06-18
  const [typeGraphMap, setTypeGraphMap] = useState<string>()

  //Objeto condición que toma el campo valor del widget - 2024-06-25
  const [cond, setCond] = useState('')

  //Alert - 2024-06-19
  const [alertDial, setAlertDial] = useState(false)

  //Modal - 2024-06-20
  const [mensModal, setMensModal] = useState<InterfaceMensajeModal>({
    deployed: false,
    type: typeMSM.info,
    tittle: '',
    body: '',
    subBody: ''
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mapDiv = useRef(null)

  useEffect(() => {
    if (!ResponseConsultaSimple) return
    const { features } = ResponseConsultaSimple
    //Data Grid
    const DgridCol = Object.keys(features[0].attributes).map(key => ({ key: key, name: key }))
    const DgridRows = features.map(({ attributes, geometry }) => ({ ...attributes, geometry }))

    //Depuración
    if (utilsModule?.logger()) console.log('Data Grid Cols =>', DgridCol)
    if (utilsModule?.logger()) console.log('Data Grid Rows =>', DgridRows)

    //Seteo de los resultados al DataGrid
    setColumns(DgridCol)
    //Seteo del atributo controlForms, para visualizar el componente DataGrid
    setControlForms(true)
    setRows(DgridRows)
    setTimeout(() => {
      setControlForms(true)
      setIsLoading(false)
    }, 10)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ResponseConsultaSimple])

  useEffect(() => {
    setCond(undefined)// esto para que aun cuado no se cambie el valor del value, al oprimir el btn consultar, ejecute la lógica
    return () => {}
  }, [controlForms])
  useEffect(() => {
    if (utilsModule?.logger()) console.log('Control asociado al Alert =>', alertDial)
    // if (utilsModule?.logger()) console.log('Control asociado al Modal =>', mensModal.deployed)
    if (utilsModule?.logger()) console.log('controlForms (Filter y DG) =>', controlForms)
    if (utilsModule?.logger()) console.log('Control renderMap =>', renderMap)
    if (utilsModule?.logger()) console.log('Asigna cond desde state =>', cond)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderMap])

  //https://developers.arcgis.com/experience-builder/guide/add-layers-to-a-map/
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (utilsModule?.logger()) console.log('Ingresando al evento objeto JimuMapView...')
    if (jmv) {
      setJimuMapView(jmv)
    }
  }

  useEffect(() => {
    import('../../../commonWidgets/widgetsModule').then(modulo => { setWidgetModules(modulo) })
    import('../../../utils/module').then(modulo => { setUtilsModule(modulo) })
  }, [])
  return (
      <div className='w-100 p-3 bg-primary text-white'>
        {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
        )}
        {/*Sección diálogo cuando no se cumplan los criterios del widget*/ }
        {alertDial
          //? showDialog('No se cumplen los criterios!')
          ? <DialogsCS
          setAlertDial={setAlertDial}
          mensModal={mensModal}
          setMensModal={setMensModal}
          ></DialogsCS>
          : null
        }
        {/*Si el estado dado en la constante es verdadero (true), invoca método tablaResultCons(), el cual renderiza el componente DataGrid. De lo contrario, invoca método filtrosCons(), el cual renderiza el componente con los filtros del widget */ }
        {controlForms && <TablaResultCS
          rows={rows}
          columns={columns}
          view={view}
          setControlForms={setControlForms}
          jimuMapView={jimuMapView}
          setResponseConsultaSimple={setResponseConsultaSimple}
          lastGeometriDeployed={lastGeometriDeployed}
          setLastGeometriDeployed={setLastGeometriDeployed}
          typeGraphMap={typeGraphMap}
          spatialRefer={spatialRefer}
          setAlertDial={setAlertDial}
          setMensModal={setMensModal}
          ></TablaResultCS>
        }
        {!controlForms && <FiltersCS
          temas={temas}
          selTema={selTema}
          setselTema={setselTema}
          subtemas={subtemas}
          selSubtema={selSubtema}
          setselSubtema={setselSubtema}
          capas={capas}
          setCapas={setCapas}
          urlCapa={urlCapa}
          setUrlCapa={setUrlCapa}
          grupos={grupos}
          setGrupos={setGrupos}
          jsonSERV={jsonSERV}
          setJsonSERV={setJsonSERV}
          setTemas={setTemas}
          setSubtemas={setSubtemas}
          capasAttr={capasAttr}
          setCapasAttr={setCapasAttr}
          txtValorState={txtValorState}
          setValorState={setValorState}
          txtValor={txtValor}
          setValor={setValor}
          selGrupo={selGrupo}
          setselGrupo={setselGrupo}
          selCapas={selCapas}
          setselCapas={setselCapas}
          selAttr={selAttr}
          setselAttr={setselAttr}
          ResponseConsultaSimple={ResponseConsultaSimple}
          setResponseConsultaSimple={setResponseConsultaSimple}
          view={view}
          setView={setView}
          jimuMapView={jimuMapView}
          lastGeometriDeployed={lastGeometriDeployed}
          condic={cond}
          setCond={setCond}
          setRenderMap={setRenderMap}
          setAlertDial={setAlertDial}
          mensModal={mensModal}
          setMensModal={setMensModal}
          setIsLoading={setIsLoading}
          ></FiltersCS>
        }
        {renderMap &&
        <DrawMap jimuMapView={jimuMapView}
          setJimuMapView={setJimuMapView}
          setAlertDial={setAlertDial}
          ResponseConsultaSimple={ResponseConsultaSimple}
          setResponseConsultaSimple={setResponseConsultaSimple}
          mensModal={mensModal}
          setMensModal={setMensModal}
          typeGraphMap={typeGraphMap}
          setTypeGraphMap={setTypeGraphMap}
          view={view}
          setView={setView}
          spatialRefer={spatialRefer}
          setSpatialRefer={setSpatialRefer}
          txtValor={txtValor}
          txtValorState={txtValorState}
          setValor={setValor}
          urlCapa={urlCapa}
          setUrlCapa={setUrlCapa}
          cond={cond}
          setCond={setCond}
          props={props}
          setIsLoading={setIsLoading}
          ></DrawMap>
        }
        {
          isLoading && widgetModules?.OUR_LOADING()
        }
      </div>
  )
}
export default Widget
