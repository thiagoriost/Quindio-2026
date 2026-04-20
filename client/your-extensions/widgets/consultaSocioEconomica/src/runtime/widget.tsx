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
import { ejecutarConsulta, restoreInitialExtent, validaLoggerLocalStorage, limpiarFeaturesDibujados, realizarQuery, transformToCamelCase} from "../../../shared/utils/export.utils"
import type { LayerInfo } from "widgets/shared/types/types_consultaAvanzadaAlfanumerica"
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

export const LEYENDA_COROPLETICO_QUINDIO = {
  Desnutrición: {
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
  },
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
}


export const NAMES_CAPAS_CONSULTA_SOCIOECONOMICA = {
  Desnutricion: 'Desnutrición',
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


  // const [selectedIndicador, setSelectedIndicador] = React.useState<number | null>(null)

  const [selectedAnio, setSelectedAnio] = React.useState<string | null>(null)

  // const [selectedEstablecimiento, setSelectedEstablecimiento] = React.useState<interfaceEstablecimiento | null>(null)

  const [capasDisponibles, setCapasDisponibles] = React.useState<Array<{id: number, name: string}>>([])

  const [aniosDisponibles, setAniosDisponibles] = React.useState<string[]>([])

  const [disabledTipoDesplazado, setDisabledTipoDesplazado] = React.useState(true)
  const [disabledTipoIndicador, setDisabledTipoIndicador] = React.useState(true)
  const [disabledTipoServicio, setDisabledTipoServicio] = React.useState(true)
  const [disabledAnio, setDisabledAnio] = React.useState(true)

  const [buscarAble, setBuscarAble] = React.useState(false)

  const disableAllSelects = (disable: boolean) => {
    setDisabledTipoDesplazado(disable)
    setDisabledTipoIndicador(disable)
    setDisabledTipoServicio(disable)
    setDisabledAnio(disable)
  }

 /*  const NAMES = ["Infraestructura", "Cobertura" , "Cupos ofertados","Eficiencia interna", "Tasa de Analfabetismo Dep", "Tasa de Analfabetismo Mun"]

  const consultaPor = [
    {
      id: 4,
      name: INDICADORES.Poblacion,
      url: urls.SERVICIO_SOCIOECONOMICO
    },
    {
      id:1,
      name: INDICADORES.NBI,
      url: urls.SERVICIO_SOCIOECONOMICO
    },
    {
      id: 2,
      name: INDICADORES.Desplazados,
      url: urls.SERVICIO_SOCIOECONOMICO
    },
    {
      id: 3,
      name: INDICADORES.IndicadoresSocioeconomicos,
      url: urls.SERVICIO_SOCIOECONOMICO
    },
    {
      id: 9,
      name: INDICADORES.CoberturaServiciosPublicos,
      url: urls.SERVICIO_SOCIOECONOMICO
    }
] */

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
    const name = capasDisponibles.find(c => c.id === id)?.name ?? ""
    const selected = capasDisponibles.find(c => c.id === id)
    const selectedUrl = `${ urls.SERVICIO_SOCIOECONOMICO }/${selected?.id}`
    if(validaLoggerLocalStorage('logger')) console.log("handleConsultaPor", e.target.value, {id, selected, selectedUrl, capasDisponibles})
    setConsultaPorSeleccionada({ id: selected.id, name: selected.name, url: selectedUrl })
    setLoading(true)

    if (name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.Desnutricion || name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionExpulsor || name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionReceptor
      || name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechas
    ) {
      consultaPorAnio(selectedUrl)
    }
  }

  const consultaPorAnio = async (selectedUrl: string) => {
    const features = await ejecutarConsulta({ returnGeometry: true, campos:['ANIO'], url: selectedUrl, where: '1=1' })
    if(validaLoggerLocalStorage('logger')) console.log({features})

    // obtener los años disponibles para el indicador seleccionado, y poblar el select de año
    const anios = Array.from(new Set(features.map(f => f.attributes.ANIO))).sort() as string[]
    if(validaLoggerLocalStorage('logger')) console.log({aniosDisponibles: anios})
    setAniosDisponibles(anios)
    setSelectedAnio(null)
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
  const cargarCapasIniciales = async () => {
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
  }, [])


  const buscar = async () => {

    setLoading(true)
    // limpiar geometrías previamente dibujadas
    varJimuMapView?.view?.graphics?.removeAll()
    let urlCapa, campos, where

    if (consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.Desnutricion || consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionExpulsor || consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionReceptor || consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechas) {
      urlCapa = consultaPorSeleccionada.url
      campos = ['*']
      where = `ANIO='${selectedAnio}'`
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
    const titleCoropletico = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.Desnutricion ? LEYENDA_COROPLETICO_QUINDIO.Desnutrición.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionExpulsor ? LEYENDA_COROPLETICO_QUINDIO.poblacionExpulsor.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionReceptor ? LEYENDA_COROPLETICO_QUINDIO.poblacionReceptor.fieldsToFilter[0].label :
      consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechas ? LEYENDA_COROPLETICO_QUINDIO.necesidadesBasicasInsatisfechas.fieldsToFilter[0].label : ""

    const showGraphic = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.necesidadesBasicasInsatisfechas
    const fixDataToRenderGrafic = features.map(f => ({
      name: f.attributes.NOMBRE,
      value: f.attributes.PROPOSICIONPORCENTUALR
    }))
    const withGraphic = {
      showGraphic,
      graphicData: fixDataToRenderGrafic,
      titleCoropletico,
      dataCoropletico: LEYENDA_COROPLETICO_QUINDIO[transformToCamelCase(consultaPorSeleccionada?.name) as keyof typeof LEYENDA_COROPLETICO_QUINDIO],
      fieldToFilter: LEYENDA_COROPLETICO_QUINDIO[transformToCamelCase(consultaPorSeleccionada?.name) as keyof typeof LEYENDA_COROPLETICO_QUINDIO].fieldsToFilter[0].field // campo que se usará para el coroplético, debe venir en la consulta
    }
    const temporalLayer = false
    const _cloneFeatures = features.map(f => ({ attributes: f.attributes, geometry: f.geometry.toJSON() }))
    const titleTable = consultaPorSeleccionada?.name === NAMES_CAPAS_CONSULTA_SOCIOECONOMICA.poblacionExpulsor ? `${consultaPorSeleccionada?.name} en el año ${selectedAnio}` : `${consultaPorSeleccionada?.name} - ${selectedAnio}`
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

                  {capasDisponibles.map(layer => (
                      <Option key={layer.id} value={layer.id}>
                          {layer.name}
                      </Option>
                  ))}
              </Select>

              <Label className={"styleLabel"}>Tipo desplazado</Label>
              <Select
                  value={""}
                  disabled={loading || disabledTipoDesplazado}
                  onChange={() => { console.log("Seleccionar tipo desplazado") }}
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
                  value={""}
                  disabled={loading || disabledTipoServicio}
                  onChange={() => { console.log("Seleccionar tipo servicio") }}
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