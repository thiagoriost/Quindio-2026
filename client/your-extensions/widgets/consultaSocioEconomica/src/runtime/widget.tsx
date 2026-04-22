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
// import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
// import Graphic from "@arcgis/core/Graphic"
import { React, type AllWidgetProps } from "jimu-core"
import { Label, Select, Option } from "jimu-ui"
// import esriRequest from "@arcgis/core/request"

import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from "../../../widget-result/src/runtime/widget"
import { limpiarYCerrarwidgetLeyenda } from '../../../widget-leyenda/src/runtime/widget'
import { ejecutarConsulta, restoreInitialExtent, validaLoggerLocalStorage, limpiarFeaturesDibujados, /* realizarQuery,  */transformToCamelCase} from "../../../shared/utils/export.utils"
// import type { LayerInfo } from "widgets/shared/types/types_consultaAvanzadaAlfanumerica"
import { SearchActionBar } from "../../../shared/components/search-action-bar"
import { WIDGET_IDS } from "../../../shared/constants/widget-ids"
import { clearPoint } from "../../../../widgets/utils/module"
import { urls} from "../../../api/serviciosQuindio"
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import '../styles/styles.css'
// import { MUNICIPIOS_QUINDIO } from '../../../shared/constants/municipiosQuindio'


interface interfaceConsultaPor { id: number, name: string, url: string }
// interface interfaceCategories { id: number, name: string }
// interface interfaceIndicadores { id: number, name: string }
// interface interfaceMunicipio { IDMUNICIPIO: string, MUNICIPIO: string }
// interface interfaceEstablecimiento { NOMBREESTABLECIMIENTO: string, CODIGOESTABLECIMIENTO: string, DIRECCION: string, JORNADA: string, IMAGEN: string, geometry: __esri.Geometry, IDSECTOR: string, IDZONA: string, IDTIPOSEDE: string, IDGRUPO: string }
// interface interfaceLeyenda { label: string, colorFondo: string, colorLine: string }

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
  /*
  poblacionExpulsor: {
      leyenda: [
        {colorFondo: '255,0,0,0.4', colorLine: '255,0,0,1', minimo: '0', maximo: '50', label: '0 a 50'},
        {colorFondo: '0,0,255,0.4', colorLine: '0,0,255,1', minimo: '51', maximo: '100', label: '51 a 100'},
        {colorFondo: '255,255,0,0.4', colorLine: '255,255,0,1', minimo: '101', maximo: '150', label: '101 a 150'},
        {colorFondo: '51, 153, 51,0.4', colorLine: '51, 153, 51,1', minimo: '151', maximo: '10000000', label: 'Mayor a 150'}
      ],
      fieldsToFilter: [
        { field: "PERSONAS", label: "Personas desplazadas" }
      ],
  },
  poblacionReceptor: {
      leyenda: [
        {colorFondo: '255,0,0,0.4', colorLine: '255,0,0,1', minimo: '0', maximo: '50', label: '0 a 50'},
        {colorFondo: '0,0,255,0.4', colorLine: '0,0,255,1', minimo: '51', maximo: '100', label: '51 a 100'},
        {colorFondo: '255,255,0,0.4', colorLine: '255,255,0,1', minimo: '101', maximo: '150', label: '101 a 150'},
        {colorFondo: '51, 153, 51,0.4', colorLine: '51, 153, 51,1', minimo: '151', maximo: '10000000', label: 'Mayor a 150'}
      ],
      fieldsToFilter: [
        { field: "PERSONAS", label: "Personas desplazadas" }
      ],
  }, */
  necesidadesBasicasInsatisfechas: {
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
  desnutricion: 'Desnutrición',
  desplazados: 'Desplazados',
  necesidadesBasicasInsatisfechas: 'Necesidades Básicas Insatisfechas',
  poblacionEdadSimple: 'Población Edad Simple',
  poblacionExpulsor:  'Población Expulsor',
  poblacionGeneral: 'Población General',
  poblacionQuinquenal:  'Población Quinquenal',
  poblacionReceptor:  'Población Receptor',
  poblacionSISBEN:  'Población SISBEN',
  serviciosPublicos:  'Servicios Públicos',
  tasaDesempleo: 'Tasa de Desempleo'
}

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

  // const [capasDisponibles, setCapasDisponibles] = React.useState<Array<{id: number, name: string}>>([])

  const [aniosDisponibles, setAniosDisponibles] = React.useState<string[]>([])

  const [disabledTipoDesplazado, setDisabledTipoDesplazado] = React.useState(true)
  const [disabledTipoIndicador, setDisabledTipoIndicador] = React.useState(true)
  const [disabledTipoServicio, setDisabledTipoServicio] = React.useState(true)
  const [disabledAnio, setDisabledAnio] = React.useState(true)

  const [buscarAble, setBuscarAble] = React.useState(false)

  const [selectedTipoServicio, setSelectedTipoServicio] = React.useState<string | null>(null)
  const [selectedTipoDesplazado, setSelectedTipoDesplazado] = React.useState<string | null>(null)

  const disableAllSelects = (disable: boolean) => {
    setDisabledTipoDesplazado(disable)
    setDisabledTipoIndicador(disable)
    setDisabledTipoServicio(disable)
    setDisabledAnio(disable)
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

    if (name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desnutricion || opcionesConsultaPor.find(e=>id===e.id) || name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechas
    ) {
      consultaPorAnio(selectedUrl)
    } else if (name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.serviciosPublicos) {
      setDisabledTipoServicio(false)
      setLoading(false)
    } else if (name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desplazados) {
      setDisabledTipoDesplazado(false)
      setLoading(false)
    }
  }

  const consultaPorAnio = async (selectedUrl: string) => {
    const features = await ejecutarConsulta({ returnGeometry: true, campos:['ANIO'], url: selectedUrl, where: '1=1' })

    // obtener los años disponibles para el indicador seleccionado, y poblar el select de año
    const anios = Array.from(new Set(features.map(f => f.attributes.ANIO))).sort() as string[]
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
    const features = await ejecutarConsulta({ returnGeometry: false, campos: ['ANIO'], url, where: '1=1' })
    const anios = Array.from(new Set(features.map((f: any) => f.attributes.ANIO))).sort() as string[]
    if(validaLoggerLocalStorage('logger')) console.log({aniosTipoDesplazado: anios})
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
    const features = await ejecutarConsulta({ returnGeometry: false, campos: ['ANIO'], url: consultaPorSeleccionada.url, where })
    const anios = Array.from(new Set(features.map((f: any) => f.attributes.ANIO))).sort() as string[]
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
    if (varJimuMapView) {
      clearPoint(varJimuMapView, [])
    }

    limpiarYCerrarWidgetResultados(widgetResultId)
    limpiarYCerrarwidgetLeyenda(WIDGET_IDS.LEYENDA)
    limpiarFeaturesDibujados(varJimuMapView, [])
    disableAllSelects(true)

    setConsultaPorSeleccionada({name: "", id: null, url: ""})

    // setSelectedEstablecimiento(null)

    // setSelectedIndicador(null)
    setSelectedAnio(null)
    setAniosDisponibles([])
    setSelectedTipoServicio(null)
    setSelectedTipoDesplazado(null)
  }

  /**
   * Efecto que limpia el punto y restaura la vista inicial cuando el widget se cierra.
   */
  React.useEffect(() => {
    if (props.state === 'CLOSED') {
      console.log("Widget cerrado, limpiando estado...")
      // handleClear()
    }


  }, [props])

  // realizar consulta al servicio consulta socioeconomica para obtener las capas disponibles y poblar el select de consulta por
  /* const cargarCapasIniciales = async () => {
    setLoading(true)
    const response = await realizarQuery(urls.SERVICIO_SOCIOECONOMICO, "Inicial", setError, setLoading)
    if (response && response.layers) {
      const capas = response.layers.map((layer: LayerInfo) => ({ id: layer.id, name: layer.name }))
      capas.sort((a: {name: string}, b: {name: string}) => a.name.localeCompare(b.name))
      setCapasDisponibles(capas)
      if(validaLoggerLocalStorage('logger')) console.log({response})
    }
    setLoading(false)
  }
  React.useEffect(() => {

    cargarCapasIniciales()
  }, []) */


  const buscar = async () => {

    // setLoading(true)
    // limpiar geometrías previamente dibujadas
    varJimuMapView?.view?.graphics?.removeAll()
    let urlCapa, campos, where

    const esServiciosPublicos = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.serviciosPublicos

    if (consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desnutricion || consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desplazados || consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechas || opcionesConsultaPor.find(e=>consultaPorSeleccionada.id===e.id)) {
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
    // dibujar los features obtenidos en el mapa

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
    const titleCoropletico = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.desnutricion ? LEYENDA_COROPLETICO_QUINDIO.desnutricion.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionExpulsor ? LEYENDA_COROPLETICO_QUINDIO.desplazados.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionReceptor ? LEYENDA_COROPLETICO_QUINDIO.desplazados.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechas ? LEYENDA_COROPLETICO_QUINDIO.necesidadesBasicasInsatisfechas.fieldsToFilter[0].label :
      esServiciosPublicos ? LEYENDA_COROPLETICO_QUINDIO.serviciosPublicos.fieldsToFilter[0].label : ""

    const showGraphic = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechas
    let fixDataToRenderGraphic = {}
    if (showGraphic) { // actualmente se muestra gráfica solo para el indicador de necesidades básicas insatisfechas, por lo que se hace un mapeo específico para ese caso, asumiendo que los campos a mostrar en la gráfica son PROPOSICIONPORCENTUALU, PROPOSICIONPORCENTUALR, CVEU y CVER, y que el campo para filtrar en el coroplético es NOMBRE. Para otros indicadores se podría generalizar esta lógica dependiendo de la estructura de los datos devueltos por el servicio

      fixDataToRenderGraphic = features.map(f => ({
        name: f.attributes.NOMBRE,
        dataToRenderGraphics:[
          {
            titleLeyendX: `Proposición Porcentual de ${f.attributes.NOMBRE} en el año ${selectedAnio}`,
            titleLeyendY: `Cantidad`,
            urbano: f.attributes.PROPOSICIONPORCENTUALU,
            rural: f.attributes.PROPOSICIONPORCENTUALR
          },
          {
            titleLeyendX: `Coeficiente de variación estimado de ${f.attributes.NOMBRE} en el año ${selectedAnio}`,
            titleLeyendY: `Cantidad`,
            urbano: f.attributes.CVEU,
            rural: f.attributes.CVER
          }
        ]
      }))
    }

    const withGraphic = {
      showGraphic,
      graphicData: fixDataToRenderGraphic,
      graphicType: 'bar' as const,
      barKeys: [
        { key: 'urbano', label: 'Urbano', color: '#9b2d6e' },
        { key: 'rural', label: 'Rural', color: '#b59b00' }
      ],
      titleCoropletico,
      dataCoropletico: LEYENDA_COROPLETICO_QUINDIO[transformToCamelCase(consultaPorSeleccionada?.name) as keyof typeof LEYENDA_COROPLETICO_QUINDIO],
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
    setLoading(false)

  }


  return (
    <div style={{height:'100%', padding: '5px', boxSizing: 'border-box'}}>
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
                  value={""}
                  disabled={loading || disabledTipoIndicador}
                  onChange={() => { console.log("Seleccionar tipo indicador") }}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {[{id: 1, name: "Tipo 1"}, {id: 2, name: "Tipo 2"}].map(layer => (
                      <Option key={layer.id} value={layer.id}>
                          {layer.name}
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
                  helpText="Seleccione un establecimiento desde consulta educación o un indicador para habilitar la búsqueda"
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