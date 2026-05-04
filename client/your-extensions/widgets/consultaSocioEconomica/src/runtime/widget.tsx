/**
 *
 *
 * @component
 * @param {AllWidgetProps<any>} props - Propiedades del widget proporcionadas por ArcGIS Experience Builder
 * @returns {JSX.Element} Componente del widget
 *
 * @author IGAC - DIP
 * @since 2026
 */
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { React, type AllWidgetProps } from "jimu-core"
import { Label, Select, Option } from "jimu-ui"

import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from "../../../widget-result/src/runtime/widget"
import { limpiarYCerrarwidgetLeyenda } from '../../../widget-leyenda/src/runtime/widget'
import { ejecutarConsulta, restoreInitialExtent, validaLoggerLocalStorage, limpiarFeaturesDibujados, transformToCamelCase} from "../../../shared/utils/export.utils"

import { SearchActionBar } from "../../../shared/components/search-action-bar"
import { AlertContainer } from '../../../shared/components/alert-container'
import { WIDGET_IDS } from "../../../shared/constants/widget-ids"
import { alertService } from '../../../shared/services/alert.service'

import { urls} from "../../../api/serviciosQuindio"
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'

// @ts-ignore
import '../styles/styles.css'


interface interfaceConsultaPor { id: number, name: string, url: string }


export const opcionesConsultaPor = [
  { id: 4, name: "Población" },
  { id: 2, name: "Desplazados" },
  { id: 1, name: "Necesidades Básicas Insatisfechas (NBI)" },
  { id: 0, name: "Indicadores Socioeconómicos" },
  { id: 9, name: "Cobertura de Servicios Públicos" }
]

export const LEYENDA_COROPLETICO_QUINDIO = {
  poblacion: {
    leyenda: [
      {"colorFondo":"255,0,0,0.4","colorLine":"255,0,0,1","minimo":"0","maximo":"10000","label":"0 a 10.000"},
      {"colorFondo":"0,0,255,0.4","colorLine":"0,0,255,1","minimo":"10001","maximo":"20000","label":"10.001 a 20.000"},
      {"colorFondo":"255,255,0,0.4","colorLine":"255,255,0,1","minimo":"20001","maximo":"50000","label":"20.001 a 50.000"},
      {"colorFondo":"51, 153, 51,0.4","colorLine":"51, 153, 51,1","minimo":"50001","maximo":"20000000","label":"Mayor a 50.000"}
    ],
    fieldsToFilter: [
      { field: "TOTAL", label: "Población Total" }
    ],
  },
  desnutricion: {
    leyenda: [
      {"colorFondo":"51, 153, 51,0.4","colorLine":"51, 153, 51,1","minimo":"0","maximo":"8","label":"0 a 7%"},
      {"colorFondo":"0,0,255,0.4","colorLine":"0,0,255,1","minimo":"8","maximo":"14","label":"8 al 14%"},
      {"colorFondo":"255,255,0,0.4","colorLine":"255,255,0,1","minimo":"14","maximo":"20","label":"15 al 20%"},
      {"colorFondo":"255,0,0,0.4","colorLine":"255,0,0,1","minimo":"20","maximo":"100","label":"Mayor a 20%"}
    ],
    fieldsToFilter: [
      { field: "PORCENTAJE", label: "Indice de desnutrición" }
    ],
  },
  desplazados: {
      leyenda: [
        {colorFondo: '255,0,0,0.4', colorLine: '255,0,0,1', minimo: '0', maximo: '50', label: '0 a 50'},
        {colorFondo: '0,0,255,0.4', colorLine: '0,0,255,1', minimo: '51', maximo: '100', label: '51 a 100'},
        {colorFondo: '255,255,0,0.4', colorLine: '255,255,0,1', minimo: '101', maximo: '150', label: '101 a 150'},
        {colorFondo: '51, 153, 51,0.4', colorLine: '51, 153, 51,1', minimo: '151', maximo: '10000000', label: 'Mayor a 150'}
      ],
      fieldsToFilter: [
        { field: "PERSONAS", label: "Personas desplazadas" }
      ],
      valoresSubCampo: [
        { id: 3, value: "Expulsor" },
        { id: 6, value: "Receptor" }
      ]
  },
  necesidadesBasicasInsatisfechasNbi: {
    leyenda: [
      {colorFondo: '51, 153, 51,0.4', colorLine: '51, 153, 51,1', minimo: '0', maximo: '8', label: 'Hasta el 7% Precisa'},
      {colorFondo: '0,0,255,0.4', colorLine: '0,0,255,1', minimo: '8', maximo: '14', label: '8 al 14 % Aceptable'},
      {colorFondo: '255,255,0,0.4', colorLine: '255,255,0,1', minimo: '14', maximo: '20', label: '15 al 20 % Regular'},
      {colorFondo: '255,0,0,0.4', colorLine: '255,0,0,1', minimo: '20', maximo: '100', label: 'Mayor al 20% Poco precisa'}
    ],
    fieldsToFilter: [
      { field: "NOMBRE", label: "NBI - Total Cve" }
    ],
  },
  serviciosPublicos: {
    leyenda: [
      {"colorFondo":"0,0,255,0.4","colorLine":"0,0,255,1","minimo":"0","maximo":"25","label":"0 al 25%"},
      {"colorFondo":"51, 153, 51,0.4","colorLine":"51, 153, 51,1","minimo":"25","maximo":"50","label":"25 al 50%"},
      {"colorFondo":"255,255,0,0.4","colorLine":"255,255,0,1","minimo":"50","maximo":"75","label":"50 al 75%"},
      {"colorFondo":"255,171,0,0.4","colorLine":"255,171,0,1","minimo":"75","maximo":"100","label":"Mayor a 75%"}
    ],
    fieldsToFilter: [
      { field: "COBERTURA", label: "Cobertura del servicio público" }
    ],
    fieldTipoServicio: "SERVICIO_PUBLICO",
    valoresSubCampo: [
      { id: "Acueducto", value: "Acueducto" },
      { id: "Alcantarillado", value: "Alcantarillado" },
      { id: "Aseo", value: "Aseo" },
      { id: "Energía", value: "Energía" },
      { id: "Gas", value: "Gas" }
    ]
  },
}


export const NAMES_CAPAS_CONSULTA_SOCIOECONOMICA = {
  poblacion: 'Población',
  desnutricion: 'Desnutrición',
  desplazados: 'Desplazados',
  indicadoresSocioeconomicos: 'Indicadores Socioeconómicos',
  necesidadesBasicasInsatisfechasNbi: 'Necesidades Básicas Insatisfechas (NBI)',
  poblacionEdadSimple: 'Población Edad Simple',
  poblacionExpulsor:  'Población Expulsor',
  poblacionGeneral: 'Población General',
  poblacionQuinquenal:  'Población Quinquenal',
  poblacionReceptor:  'Población Receptor',
  poblacionSISBEN:  'Población SISBEN',
  serviciosPublicos:  'Cobertura de Servicios Públicos',
  tasaDesempleo: 'Tasa de Desempleo'
}

export const INDICADORES_SOCIOECONOMICOS = [
  { id: 'desnutricion', value: 'Indice de desnutrición', configName: 'Desnutrición' }
]

const WidgetSocioEconomica = (props: AllWidgetProps<any>) => {
  /**
   * Estado para almacenar la referencia a la vista del mapa de Jimu.
   * @type {[JimuMapView | undefined, Function]}
   */
  const [varJimuMapView, setJimuMapView] = React.useState<JimuMapView>()

  const [loading, setLoading] = React.useState(false)

  const [error, setError] = React.useState("")
  const widgetResultId = WIDGET_IDS.RESULT // ID del widget de resultados en el layout

  const [consultaPorSeleccionada, setConsultaPorSeleccionada] = React.useState< interfaceConsultaPor | null>({name: "", id: null, url: ""})

  const [selectedAnio, setSelectedAnio] = React.useState<string | null>(null)

  const [aniosDisponibles, setAniosDisponibles] = React.useState<string[]>([])

  const [disabledTipoDesplazado, setDisabledTipoDesplazado] = React.useState(true)
  const [disabledTipoIndicador, setDisabledTipoIndicador] = React.useState(true)
  const [disabledTipoServicio, setDisabledTipoServicio] = React.useState(true)
  const [disabledAnio, setDisabledAnio] = React.useState(true)

  const [buscarAble, setBuscarAble] = React.useState(false)

  const [selectedTipoServicio, setSelectedTipoServicio] = React.useState<string | null>(null)
  const [selectedTipoDesplazado, setSelectedTipoDesplazado] = React.useState<string | null>(null)
  const [selectedTipoIndicador, setSelectedTipoIndicador] = React.useState<string | null>(null)

  const disableAllSelects = (disable: boolean) => {
    setDisabledTipoDesplazado(disable)
    setDisabledTipoIndicador(disable)
    setDisabledTipoServicio(disable)
    setDisabledAnio(disable)
    setSelectedTipoServicio(null)
    setSelectedTipoDesplazado(null)
    setSelectedTipoIndicador(null)
    setSelectedAnio(null)
    setAniosDisponibles([])
    setBuscarAble(false)
  }

  /**
     * Extent inicial del mapa.
     * Se guarda al cargar el widget para poder restaurar
     * la vista original posteriormente.
  */
  const initialExtentRef = React.useRef<__esri.Extent | null>(null)

  const handleConsultaPor = (e: { target: { value: string; }; }) => {
    if (e.target.value === "") return
    // handleClear()
    const id = Number(e.target.value)
    const name = opcionesConsultaPor.find(c => c.id === id)?.name ?? ""
    const selected = opcionesConsultaPor.find(c => c.id === id)
    const selectedUrl = `${ urls.SERVICIO_SOCIOECONOMICO }/${selected?.id}`
    if(validaLoggerLocalStorage('logger')) console.log("handleConsultaPor", e.target.value, {id, selected, selectedUrl, opcionesConsultaPor})
    setConsultaPorSeleccionada({ id: selected.id, name: selected.name, url: selectedUrl })
    setLoading(true)
    disableAllSelects(true)


    if (name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacion || name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechasNbi
    ) {
      consultaPorAnio(selectedUrl)
    } else if (name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.indicadoresSocioeconomicos) {
      setDisabledTipoIndicador(false)
      setLoading(false)
    } else if (name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.serviciosPublicos) {
      setDisabledTipoServicio(false)
      setLoading(false)
    } else if (name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desplazados) {
      setDisabledTipoDesplazado(false)
      setLoading(false)
    }
  }

  const consultaPorAnio = async (selectedUrl: string) => {
    const features = await ejecutarConsulta({
      returnGeometry: false,
      campos:['ANIO'],
      url: selectedUrl,
      where: '1=1',
      orderByFields: 'ANIO',
      returnDistinctValues: true
    })

    // obtener los años disponibles para el indicador seleccionado, y poblar el select de año
    const anios = features.map(f => f.attributes.ANIO)
    if(validaLoggerLocalStorage('logger')) console.log({features, aniosDisponibles: anios})
    setAniosDisponibles(anios)
    setSelectedAnio(null)
    setDisabledAnio(false)
    setLoading(false)
  }

  const handleTipoDesplazadoChange = async (e: { target: { value: string } }) => {
    if (e.target.value === "") return
    const tipoDesplazadoId = e.target.value
    setSelectedTipoDesplazado(tipoDesplazadoId)
    setLoading(true)
    setSelectedAnio(null)
    setAniosDisponibles([])
    setDisabledAnio(true)
    setBuscarAble(false)
    const url = `${urls.SERVICIO_SOCIOECONOMICO}/${tipoDesplazadoId}`
    setConsultaPorSeleccionada(prev => ({ ...prev, url }))
    const features = await ejecutarConsulta({
      returnGeometry: false,
      campos: ['ANIO'],
      url,
      where: '1=1',
      orderByFields: 'ANIO',
      returnDistinctValues: true
    })
    const anios = features.map((f: any) => f.attributes.ANIO)
    if(validaLoggerLocalStorage('logger')) console.log({aniosTipoDesplazado: anios})
    setAniosDisponibles(anios)
    setDisabledAnio(false)
    setLoading(false)
  }

  const handleTipoIndicadorChange = async (e: { target: { value: string } }) => {
    if (e.target.value === "") return
    const tipoIndicadorId = e.target.value
    setSelectedTipoIndicador(tipoIndicadorId)
    setLoading(true)
    setSelectedAnio(null)
    setAniosDisponibles([])
    setDisabledAnio(true)
    setBuscarAble(false)
    const indicador = INDICADORES_SOCIOECONOMICOS.find(i => i.id === tipoIndicadorId)
    setConsultaPorSeleccionada(prev => ({ ...prev, name: indicador?.configName ?? prev.name }))
    const features = await ejecutarConsulta({
      returnGeometry: false,
      campos: ['ANIO'],
      url: consultaPorSeleccionada.url,
      where: '1=1',
      orderByFields: 'ANIO',
      returnDistinctValues: true
    })
    const anios = features.map((f: any) => f.attributes.ANIO)
    if(validaLoggerLocalStorage('logger')) console.log({aniosTipoIndicador: anios})
    setAniosDisponibles(anios)
    setDisabledAnio(false)
    setLoading(false)
  }

  const handleTipoServicioChange = async (e: { target: { value: string } }) => {
    if (e.target.value === "") return
    const tipoServicio = e.target.value
    setSelectedTipoServicio(tipoServicio)
    setLoading(true)
    setSelectedAnio(null)
    setAniosDisponibles([])
    setDisabledAnio(true)
    setBuscarAble(false)
    const where = `${LEYENDA_COROPLETICO_QUINDIO.serviciosPublicos.fieldTipoServicio}='${tipoServicio}'`
    const features = await ejecutarConsulta({
      returnGeometry: false,
      campos: ['ANIO'],
      url: consultaPorSeleccionada.url,
      where,
      orderByFields: 'ANIO',
      returnDistinctValues: true
    })
    const anios = features.map((f: any) => f.attributes.ANIO)
    if(validaLoggerLocalStorage('logger')) console.log({aniosTipoServicio: anios})
    setAniosDisponibles(anios)
    setDisabledAnio(false)
    setLoading(false)
  }

  const handleAnioChange = (e: { target: { value: string } }) => {
    if (e.target.value === "") return
    const anio = e.target.value
    setSelectedAnio(anio)
    setBuscarAble(true)
  }

  /**
   * Manejador del cambio de vista activa del mapa.
   * Guarda la referencia al mapa en el estado del componente.
   *
   * @param {JimuMapView} jmv - Vista del mapa de Jimu
   * @returns {void}
   */
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv)
      if (!initialExtentRef.current) {
        initialExtentRef.current = jmv.view.extent.clone()
      }
    }
  }

    /**
   * Limpia el punto dibujado en el mapa.
   * @returns {void}
   */
  const handleClear = () => {
    
    limpiarYCerrarWidgetResultados(widgetResultId)
    limpiarYCerrarwidgetLeyenda(WIDGET_IDS.LEYENDA)
    limpiarFeaturesDibujados(varJimuMapView, [])
    disableAllSelects(true)
    setConsultaPorSeleccionada({name: "", id: null, url: ""})
  }

  /**
   * Efecto que limpia el punto y restaura la vista inicial cuando el widget se cierra.
   */
  React.useEffect(() => {
    if (props.state === 'CLOSED') {
      console.log("Widget cerrado, limpiando estado...")
      handleClear()
    }


  }, [props])

  /**
   * Ejecuta la consulta socioeconómica con los filtros seleccionados, abre la tabla de resultados
   * y muestra una notificación informativa al finalizar para guiar el cambio de municipio desde
   * la opción "View Table".
   *
   * @returns {Promise<void>} Promesa que se resuelve cuando termina el flujo de búsqueda.
   */
  const buscar = async (): Promise<void> => {

    setLoading(true)
    // limpiar geometrías previamente dibujadas
    // varJimuMapView?.view?.graphics?.removeAll()
    limpiarYCerrarWidgetResultados(widgetResultId)
    limpiarYCerrarwidgetLeyenda(WIDGET_IDS.LEYENDA)
    limpiarFeaturesDibujados(varJimuMapView, [])
    let urlCapa, campos, where

    const esServiciosPublicos = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.serviciosPublicos

    if (consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacion || consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desnutricion || consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desplazados || consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechasNbi) {
      urlCapa = consultaPorSeleccionada.url
      campos = ['*']
      where = `ANIO='${selectedAnio}'`
    } else if (esServiciosPublicos) {
      urlCapa = consultaPorSeleccionada.url
      campos = ['*']
      where = `${LEYENDA_COROPLETICO_QUINDIO.serviciosPublicos.fieldTipoServicio}='${selectedTipoServicio}' AND ANIO='${selectedAnio}'`
    }


    const features = await ejecutarConsulta({ returnGeometry: true, campos, url: urlCapa, where })
    if(validaLoggerLocalStorage('logger')) console.log({features})
    // si la longitud de los features obtenidos es menor a 1, mostrar mensaje de error indicando que no se encontraron resultados para la consulta realizada
    if (features.length < 1) {
      setError("No se encontraron resultados para la consulta realizada.")
      setLoading(false)
      return
    }
    // ir al extend inicial del mapa para mostrar todos los resultados obtenidos
    restoreInitialExtent(varJimuMapView, initialExtentRef)

    // obtener los camposResultados apartir de los features.attributes, omitiendo los campos (OBJECTID, SHAPE.AREA y SHAPE.LEN)
    const camposResultados = Object.keys(features[0].attributes)
      .filter(c => !["OBJECTID", "SHAPE.AREA", "SHAPE.LEN"].includes(c))
      .map(field => ({
        name: field,
        alias: field
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/^\w/, c => c.toUpperCase())
      }))
    const titleCoropletico = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacion ? LEYENDA_COROPLETICO_QUINDIO.poblacion.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desnutricion ? LEYENDA_COROPLETICO_QUINDIO.desnutricion.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionExpulsor ? LEYENDA_COROPLETICO_QUINDIO.desplazados.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionReceptor ? LEYENDA_COROPLETICO_QUINDIO.desplazados.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechasNbi ? LEYENDA_COROPLETICO_QUINDIO.necesidadesBasicasInsatisfechasNbi.fieldsToFilter[0].label :
      esServiciosPublicos ? LEYENDA_COROPLETICO_QUINDIO.serviciosPublicos.fieldsToFilter[0].label : ""

    const esNBI = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechasNbi
    const esPoblacion = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacion
    const showGraphic = esNBI || esPoblacion
    let fixDataToRenderGraphic: any[] = []

    if (esNBI) {
      fixDataToRenderGraphic = features.map(f => ({
        name: f.attributes.NOMBRE,
        dataToRenderGraphics:[
          {
            titleLeyendX: `Proposición Porcentual de ${f.attributes.NOMBRE} en el año ${selectedAnio}`,
            titleLeyendY: `Cantidad`,
            dato_1: f.attributes.PROPOSICIONPORCENTUALU,
            dato_2: f.attributes.PROPOSICIONPORCENTUALR,
            barKeys:  [
              { key: 'dato_1', label: 'Urbano', color: '#9b2d6e' },
              { key: 'dato_2', label: 'Rural', color: '#b59b00' }
            ]
          },
          {
            titleLeyendX: `Coeficiente de variación estimado de ${f.attributes.NOMBRE} en el año ${selectedAnio}`,
            titleLeyendY: `Cantidad`,
            dato_1: f.attributes.CVEU,
            dato_2: f.attributes.CVER,
            barKeys:  [
              { key: 'dato_1', label: 'Urbano', color: '#9b2d6e' },
              { key: 'dato_2', label: 'Rural', color: '#b59b00' }
            ]
          }
        ]
      }))
    } else if (esPoblacion) {
      fixDataToRenderGraphic = features.map(f => ({
        name: f.attributes.NOMBRE,
        dataToRenderGraphics: [
          {
            titleLeyendX: `Cantidad de población por zona en ${f.attributes.NOMBRE} - año ${selectedAnio}`,
            titleLeyendY: `Habitantes`,
            dato_1: f.attributes.URBANO,
            dato_2: f.attributes.RURAL,
            barKeys:  [
              { key: 'dato_1', label: 'Urbano', color: '#9b2d6e' },
              { key: 'dato_2', label: 'Rural', color: '#b59b00' }
            ]
          },
          {
            titleLeyendX: `Cantidad de población por sexo en ${f.attributes.NOMBRE} - año ${selectedAnio}`,
            titleLeyendY: `Habitantes`,
            dato_1: f.attributes.POBLACIONHOMBRES,
            dato_2: f.attributes.POBLACIONMUJERES,
            barKeys:  [
              { key: 'dato_1', label: 'Hombres', color: '#9b2d6e' },
              { key: 'dato_2', label: 'Mujeres', color: '#b59b00' }
            ]
          }
        ]
      }))
    }

    const withGraphic = {
      showGraphic,
      graphicData: fixDataToRenderGraphic,
      graphicType: 'bar' as const,
      barKeys: showGraphic ? fixDataToRenderGraphic[0].dataToRenderGraphics[0].barKeys : [],
      titleCoropletico,
      dataCoropletico: esServiciosPublicos
        ? LEYENDA_COROPLETICO_QUINDIO.serviciosPublicos
        : LEYENDA_COROPLETICO_QUINDIO[transformToCamelCase(consultaPorSeleccionada?.name) as keyof typeof LEYENDA_COROPLETICO_QUINDIO],
      fieldToFilter: esServiciosPublicos
        ? LEYENDA_COROPLETICO_QUINDIO.serviciosPublicos.fieldsToFilter[0].field
        : LEYENDA_COROPLETICO_QUINDIO[transformToCamelCase(consultaPorSeleccionada?.name) as keyof typeof LEYENDA_COROPLETICO_QUINDIO].fieldsToFilter[0].field
    }
    const temporalLayer = false
    const _cloneFeatures = features.map(f => ({ attributes: f.attributes, geometry: f.geometry.toJSON() }))
    const titleTable = esServiciosPublicos
      ? `${consultaPorSeleccionada?.name} - ${selectedTipoServicio} - ${selectedAnio}`
      : consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionExpulsor
        ? `${consultaPorSeleccionada?.name} en el año ${selectedAnio}`
        : `${consultaPorSeleccionada?.name} - ${selectedAnio}`
    if(validaLoggerLocalStorage('logger')) console.log({features, camposResultados, titleTable, withGraphic})
    abrirTablaResultados(
      true,
      _cloneFeatures,
      camposResultados,
      props,
      widgetResultId,
      varJimuMapView.view.spatialReference,
      titleTable,
      withGraphic,
      temporalLayer,
      selectedAnio
    )

    if (consultaPorSeleccionada.id !== 2 && consultaPorSeleccionada.id !== 0 && consultaPorSeleccionada.id !== 9) {
      /**
       * Notificación informativa posterior a la consulta exitosa.
       * Indica al usuario que puede cambiar el municipio objetivo desde "Ver Tabla".
       */
      alertService.info('Información', 'Puede cambiar el municipio objetivo desde la opción "Ver Tabla".')      
    }

    setLoading(false)

  }


  return (
    <div style={{height:'100%', padding: '5px', boxSizing: 'border-box'}}>
      <AlertContainer />
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}      {
      varJimuMapView && (

          <div className="consulta-widget consulta-scroll loading-host">

            <div>
              {/* Consultar por */}

              <Label className={"mb0"}>Consulta por</Label>
              <Select
                  value={consultaPorSeleccionada?.id ?? ""}
                  disabled={loading}
                  onChange={handleConsultaPor}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {opcionesConsultaPor.map(layer => (
                      <Option key={layer.id} value={layer.id}>
                          {layer.name}
                      </Option>
                  ))}
              </Select>

              <Label className={"styleLabel"}>Tipo desplazado</Label>
              <Select
                  value={selectedTipoDesplazado ?? ""}
                  disabled={loading || disabledTipoDesplazado}
                  onChange={handleTipoDesplazadoChange}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>
                  {LEYENDA_COROPLETICO_QUINDIO.desplazados.valoresSubCampo.map(item => (
                      <Option key={item.id} value={item.id}>
                          {item.value}
                      </Option>
                  ))}
              </Select>

              <Label className={"styleLabel"}>Tipo indicador</Label>
              <Select
                  value={selectedTipoIndicador ?? ""}
                  disabled={loading || disabledTipoIndicador}
                  onChange={handleTipoIndicadorChange}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {INDICADORES_SOCIOECONOMICOS.map(item => (
                      <Option key={item.id} value={item.id}>
                          {item.value}
                      </Option>
                  ))}
              </Select>

              <Label className={"styleLabel"}>Tipo servicio</Label>
              <Select
                  value={selectedTipoServicio ?? ""}
                  disabled={loading || disabledTipoServicio}
                  onChange={handleTipoServicioChange}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {LEYENDA_COROPLETICO_QUINDIO.serviciosPublicos.valoresSubCampo.map(item => (
                      <Option key={item.id} value={item.id}>
                          {item.value}
                      </Option>
                  ))}
              </Select>

              <Label className={"styleLabel"}>Año</Label>
              <Select
                  value={selectedAnio ?? ""}
                  disabled={loading || disabledAnio}
                  onChange={handleAnioChange}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {aniosDisponibles.map(anio => (
                      <Option key={anio} value={anio}>
                          {anio}
                      </Option>
                  ))}
              </Select>


              {/* BOTONES */}
              <SearchActionBar
                  onSearch={buscar}
                  onClear={handleClear}
                  loading={loading}
                  // disableSearch={!isValid || disabled}
                  helpText="Seleccione los filtros para realizar la consulta socioeconómica. Puede seleccionar un solo municipio como resultado, luego desde la opción 'Ver Tabla' podrá cambiar el municipio objetivo para visualizar su información en el mapa."
                  searchLabel="Buscar"
                  error={error}
                  disableSearch={!buscarAble}
              />
            </div>


            {loading && <OurLoading />}

          </div>
        )
      }
    </div>
  )
}

export default WidgetSocioEconomica