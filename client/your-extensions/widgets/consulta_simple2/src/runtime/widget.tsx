
 

/**
 * Widget consulta_simple2
 *
 * Este componente principal implementa la lógica y la interfaz del widget de consulta simple para ArcGIS Experience Builder.
 * Permite realizar consultas sobre capas geoespaciales, aplicar filtros, mostrar resultados en una tabla interactiva y dibujar sobre el mapa.
 *
 * Estructura general:
 * - Filtros personalizables para seleccionar capas, temas, subtemas y atributos.
 * - Visualización de resultados en una tabla (DataGrid).
 * - Herramientas de dibujo para delimitar áreas de consulta en el mapa.
 * - Diálogos modales para alertas y mensajes al usuario.
 *
 * Principales props y estados:
 * - props: AllWidgetProps<any> (proporcionados por Experience Builder)
 * - jimuMapView: referencia al mapa activo
 * - rows, columns: datos y columnas para la tabla de resultados
 * - controlForms: alterna entre filtros y tabla de resultados
 * - renderMap: controla la visualización de herramientas de dibujo
 * - mensModal, alertDial: control de diálogos y alertas
 *
 * Componentes utilizados:
 * - DrawMap: herramientas de dibujo sobre el mapa
 * - FiltersCS: filtros de consulta
 * - TablaResultCS: tabla de resultados
 * - DialogsCS: diálogos modales
 *
 * @author IGAC
 * @date 2026-03-05
 */
import { React, type AllWidgetProps } from 'jimu-core'
import { appActions, getAppStore } from 'jimu-core'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'

//Importación componentes personalizados
//Componente DrawMap - 2024-06-24
import DrawMap from './components/drawMap'
//Componente FiltersCS - 2024-06-24
import FiltersCS from './components/filtersCS'
/* //Componente TablaResultCS - 2024-06-25
import TablaResultCS from './components/tablaResultCS' */
//Componente DialogsCS - 2024-06-26
import DialogsCS from './components/dialogsCS'

//Importación estilos
import '../styles/style.css'

//Importación interfaces
import { type InterfaceResponseConsultaSimple, type InterfaceMensajeModal, typeMSM } from '../types/interfaceResponseConsultaSimple' // The map object can be accessed using the JimuMapViewComponent
import { abrirTablaResultados } from "../../../widget-result/src/runtime/widget";

const { useEffect, useState } = React

/**
 * Componente principal del widget de consulta simple.
 * @param props Propiedades del widget proporcionadas por Experience Builder.
 */
const Widget = (props: AllWidgetProps<any>) => {

  // ========================
  // Estados principales
  // ========================
  // Filtros y selección de capas
  const [jsonSERV, setJsonSERV] = useState([]) // Servicios JSON disponibles
  const [temas, setTemas] = useState([]) // Temas disponibles
  const [subtemas, setSubtemas] = useState([]) // Subtemas disponibles
  const [capas, setCapas] = useState([]) // Capas disponibles
  const [grupos, setGrupos] = useState([]) // Grupos disponibles
  const [capasAttr, setCapasAttr] = useState([]) // Atributos de capas
  const [txtValorState, setValorState] = useState(true) // Estado del campo valor
  const [txtValor, setValor] = useState('') // Valor del filtro
  const [selTema, setselTema] = useState(undefined) // Tema seleccionado
  const [selSubtema, setselSubtema] = useState<number | string>() // Subtema seleccionado
  const [selGrupo, setselGrupo] = useState(undefined) // Grupo seleccionado
  const [selCapas, setselCapas] = useState(undefined) // Capa seleccionada
  const [selAttr, setselAttr] = useState(undefined) // Atributo seleccionado
  const [urlCapa, setUrlCapa] = useState('') // URL de la capa seleccionada
  const [widgetModules, setWidgetModules] = useState(null) // Módulos utilitarios del widget

  // Resultados de la consulta
  // const [rows, setRows] = useState([]) // Filas de la tabla de resultados
  // const [columns, setColumns] = useState([]) // Columnas de la tabla de resultados
  const [utilsModule, setUtilsModule] = useState(null) // Módulo de utilidades

  // Estado de carga
  const [isLoading, setIsLoading] = useState(false)

  // Mapa y vista
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>() // Referencia al mapa activo
  const [renderMap, setRenderMap] = useState<boolean>(false) // Controla la visualización de herramientas de dibujo
  const [view, setView] = useState(null) // Vista del mapa

  // Geometría y referencia espacial
  const [spatialRefer, setSpatialRefer] = useState<any>() // Referencia espacial
  // const [lastGeometriDeployed, setLastGeometriDeployed] = useState() // Última geometría desplegada

  // Respuesta de la consulta
  const [ResponseConsultaSimple, setResponseConsultaSimple] = useState<InterfaceResponseConsultaSimple>()

  // Control de visualización de formularios y resultados
  const [controlForms, setControlForms] = useState(false)

  // Tipo de gráfico en el mapa
  const [typeGraphMap, setTypeGraphMap] = useState<string>()

  // Condición de consulta
  const [cond, setCond] = useState('')

  // Alertas y modales
  const [alertDial, setAlertDial] = useState(false) // Control de alerta
  const [mensModal, setMensModal] = useState<InterfaceMensajeModal>({
    deployed: false,
    type: typeMSM.info,
    tittle: '',
    body: '',
    subBody: ''
  }) // Estado del modal

  const widgetResultId = WIDGET_IDS.RESULT // ID del widget de resultados en el layout

  /**
   * Cuando se actualiza la respuesta de la consulta, procesa los datos para la tabla de resultados.
   */
  useEffect(() => {
    if (!ResponseConsultaSimple || !jimuMapView?.view) return
    const { features } = ResponseConsultaSimple
    // Construye columnas y filas para el DataGrid
    const DgridCol = Object.keys(features[0].attributes).map(key => ({ key: key, name: key }))
    const DgridRows = features.map(({ attributes, geometry }) => ({ ...attributes, geometry }))

    // Depuración
    if (utilsModule?.logger()) console.log('Data Grid Cols =>', DgridCol)
    if (utilsModule?.logger()) console.log('Data Grid Rows =>', DgridRows)

    // Actualiza el estado de la tabla de resultados
    const firstFeatureArray = features.length ? [features[0]] : []
    const spatialReference = ResponseConsultaSimple.spatialReference ?? jimuMapView.view.spatialReference

    /* const fields = [
        { name: 'DEPARTAMEN', alias: 'Departamento' },
        { name: 'MUNICIPIO', alias: 'Municipio' },
        { name: 'VEREDA', alias: 'Vereda' },
        { name: 'PCC', alias: 'PCC' },
        { name: 'SHAPE.AREA', alias: 'Área (m²)', type: 'number' },        
        { name: 'AREA_HA', alias: 'Área (HA)', type: 'number' }        
    ] */

    const fields = ResponseConsultaSimple.fields

    abrirTablaResultados(firstFeatureArray, fields, props, widgetResultId, spatialReference )
    // setColumns(DgridCol)
    setControlForms(true)
    // setRows(DgridRows)
    setTimeout(() => {
      setControlForms(true)
      setIsLoading(false)
    }, 10)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ResponseConsultaSimple])

  // Reinicia la condición cuando cambia el control de formularios
  useEffect(() => {
    setCond(undefined) // Permite ejecutar la lógica aunque no cambie el valor
  }, [controlForms])
  // Efecto de depuración para cambios en renderMap y otros controles
  useEffect(() => {
    if (utilsModule?.logger()) console.log('Control asociado al Alert =>', alertDial)
    if (utilsModule?.logger()) console.log('controlForms (Filter y DG) =>', controlForms)
    if (utilsModule?.logger()) console.log('Control renderMap =>', renderMap)
    if (utilsModule?.logger()) console.log('Asigna cond desde state =>', cond)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderMap])

  /**
   * Handler para el cambio de vista activa del mapa.
   * @param jmv Instancia de JimuMapView activa.
   */
  // https://developers.arcgis.com/experience-builder/guide/add-layers-to-a-map/
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (utilsModule?.logger()) console.log('Ingresando al evento objeto JimuMapView...')
    if (jmv) {
      setJimuMapView(jmv)
    }
  }


  // Limpia la data del widget de resultados y lo cierra
  const limpiarYCerrarWidgetResultados = () => {
    // Limpia la data enviada al widget de resultados
    getAppStore().dispatch(
      appActions.widgetStatePropChange(
        widgetResultId,
        'results',
        null
      )
    )
    // Cierra el widget de resultados
    getAppStore().dispatch(appActions.closeWidget(widgetResultId))
  }

  // Detecta el cierre del widget y limpia el widget de resultados
  // Requiere: widgetState y limpiarYCerrarWidgetResultados definidos
  // Usa el estado global de Experience Builder para saber si el widget está cerrado
  // const widgetState = window.jimuConfig?.store?.getState()?.widgetsRuntimeInfo?.[props.id]?.state
  React.useEffect(() => {   
   //console.log({props})
   if (props.state === 'CLOSED') {
    limpiarYCerrarWidgetResultados()
   }
  }, [props])

  // Carga módulos utilitarios al montar el componente
  useEffect(() => {
    console.log("consulta Simple")
    import('../../../commonWidgets/widgetsModule').then(modulo => { setWidgetModules(modulo) })
    import('../../../utils/module').then(modulo => { setUtilsModule(modulo) })
  }, [])

  /**
   * Renderiza la interfaz del widget:
   * - Muestra el mapa si está configurado.
   * - Muestra diálogos de alerta/modales.
   * - Alterna entre filtros y tabla de resultados.
   * - Muestra herramientas de dibujo si corresponde.
   * - Muestra indicador de carga si está activo.
   */
  return (
    <div className='consulta-simple-widget' style={{  }}>
      {/* Mapa principal */}
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}
      {/* Diálogo de alerta/modal */}
      {alertDial
        ? <DialogsCS
            setAlertDial={setAlertDial}
            mensModal={mensModal}
            setMensModal={setMensModal}
          />
        : null
      }
      {/* filtros de consulta */}
      
      <FiltersCS
        props={props}
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
        lastGeometriDeployed={{}}
        condic={cond}
        setCond={setCond}
        setRenderMap={setRenderMap}
        setAlertDial={setAlertDial}
        mensModal={mensModal}
        setMensModal={setMensModal}
        setIsLoading={setIsLoading}
      />
      {/* Herramientas de dibujo en el mapa */}
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
        />
      }
      {/* Indicador de carga */}
      {isLoading && widgetModules?.OUR_LOADING()}
    </div>
  )
}
export default Widget
