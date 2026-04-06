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
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import Graphic from "@arcgis/core/Graphic"
import { React, type AllWidgetProps } from "jimu-core"
import { Label, Select, Option } from "jimu-ui";

import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from "../../../widget-result/src/runtime/widget";
import { abrirWidgetLeyenda } from '../../../widget-leyenda/src/runtime/widget';
import {  ejecutarConsulta, goToInitialExtent} from "../../../shared/utils/export.utils";
import { LayerInfo } from "widgets/shared/types/types_consultaAvanzadaAlfanumerica"
import { SearchActionBar } from "../../../shared/components/search-action-bar";
import { loadLayers } from "../../../shared/services/queryMapServer.service"
import { WIDGET_IDS } from "../../../shared/constants/widget-ids";
import { clearPoint } from "../../../../widgets/utils/module"
import esriRequest from "@arcgis/core/request"
import { urls} from "../../../api/serviciosQuindio"
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import DetalleEstablecimiento from './components/detalleEstablecimiento'
import FormEducacion from './components/formEducacion'
import FormIndicadores from './components/formIndicadores'
import '../styles/styles.css'
import { MUNICIPIOS_QUINDIO } from '../../../shared/constants/municipiosQuindio';


interface interfaceConsultaPor { id: number, name: string, url: string }
interface interfaceCategories { id: number, name: string }
interface interfaceIndicadores { id: number, name: string }
interface interfaceMunicipio { IDMUNICIPIO: string, MUNICIPIO: string }
interface interfaceEstablecimiento { NOMBREESTABLECIMIENTO: string, CODIGOESTABLECIMIENTO: string,  DIRECCION: string, JORNADA: string, IMAGEN: string, geometry: __esri.Geometry, IDSECTOR: string, IDZONA: string, IDTIPOSEDE: string, IDGRUPO: string }
interface interfaceLeyenda { label: string, colorFondo: string, colorLine: string }

export const INDICADORES = {
  "ConsultaEducacion": "Consulta educación",
  "ConsultaPorIndicadores": "Consulta por indicadores",
}

export const LEYENDA_COROPLETICO_QUINDIO = {
  "Cobertura":[{
        colorFondo: "252,3,3,0.4",
        colorLine: "252,3,3,1",
        label: "0 a 1000",
        minimo: 0,
        maximo: 1000
    }, {
        colorFondo: "246,254,6,0.4",
        colorLine: "246,254,6,1",
        label: "1001 a 5000",
        minimo: 1001,
        maximo: 5000
    }, {
        colorFondo: "81,175,51,0.4",
        colorLine: "81,175,51,1",
        label: "Mayor a 5000",
        minimo: 5001,
        maximo: 50000000
    }],
  "Cupos_ofertados": [{
      colorFondo: "77,246,22,0.4",
      colorLine: "77,246,22,1",
      label: "0 a 1000",
      minimo: 0,
      maximo: 1000
    }, {
      colorFondo: "246,162,60,0.4",
      colorLine: "246,162,60,1",
      label: "1001 a 5000",
      minimo: 1001,
      maximo: 5000
    }, {
      colorFondo: "135,240,226,0.4",
      colorLine: "135,240,226,1",
      label: "5001 a 10000",
      minimo: 5001,
      maximo: 10000
    }, {
      colorFondo: "77,133,52,0.4",
      colorLine: "77,133,52,1",
      label: "Mayor a 10000",
      minimo: 10001,
      maximo: 50000000
    }],
  "Eficiencia_interna":[{
      colorFondo: "252,3,3,0.4",
      colorLine: "252,3,3,1",
      label: "0 a 1000",
      minimo: 0,
      maximo: 1000
  }, {
      colorFondo: "246,254,6,0.4",
      colorLine: "246,254,6,1",
      label: "1001 a 10000",
      minimo: 1001,
      maximo: 10000
  }, {
      colorFondo: "81,175,51,0.4",
      colorLine: "81,175,51,1",
      label: "Mayor a 10000",
      minimo: 10001,
      maximo: 50000000
  }]
      
};

const Widget = (props: AllWidgetProps<any>) => {
  /**
   * Estado para almacenar la referencia a la vista del mapa de Jimu.
   * @type {[JimuMapView | undefined, Function]}
   */
  const [varJimuMapView, setJimuMapView] = React.useState<JimuMapView>()
  const [initialExtent, setInitialExtent] = React.useState(null)
  const [initialZoom, setInitialZoom] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [graphicsLayer, setGraphicsLayer] = React.useState<GraphicsLayer | null>(null)
  const [error, setError] = React.useState("")
  const widgetResultId = WIDGET_IDS.RESULT // ID del widget de resultados en el layout

  const [consultaPorSeleccionada, setConsultaPorSeleccionada] = React.useState< interfaceConsultaPor | null>({name: "", id: null, url: ""})
  const [categories, setCategories] = React.useState<interfaceCategories[] | null>(null)
  const [indicadores, setIndicadores] = React.useState<interfaceIndicadores[] | null>(null)
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [selectedIndicador, setSelectedIndicador] = React.useState<number | null>(null)
  const [niveles, setNiveles] = React.useState<string[] | null>(null)
  const [selectedNivel, setSelectedNivel] = React.useState<string | null>(null)
  const [sectores, setSectores] = React.useState<string[] | null>(null)
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null)
  const [anios, setAnios] = React.useState<string[] | null>(null)
  const [selectedAnio, setSelectedAnio] = React.useState<string | null>(null)
  const [municipios, setMunicipios] = React.useState<interfaceMunicipio[] | null>(null)
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<interfaceMunicipio | null>(null)
  const [urlLayerSelected, setUrlLayerSelected] = React.useState<string | null>(null)
  const [selectedEstablecimiento, setSelectedEstablecimiento] = React.useState<interfaceEstablecimiento | null>(null)
  const [establecimientos, setEstablecimientos] = React.useState<interfaceEstablecimiento[] | null>(null)
  const [verAtributos, setVerAtributos] = React.useState(false)
  const [cloneFeatures, setCloneFeatures] = React.useState<any[]>([])
  const [featuresDibujados, setFeaturesDibujados] = React.useState<__esri.Graphic[]>([])
  const [domainsMap, setDomainsMap] = React.useState<Record<string, Record<number, string>>>({})
  const [camposIndicador, setCamposIndicador] = React.useState<string[] | null>(null)
  const NAMES = ["Infraestructura", "Cobertura" ,   "Cupos ofertados","Eficiencia interna", "Tasa de Analfabetismo Dep", "Tasa de Analfabetismo Mun"];

  const consultaPor = [{
    id: 0,
    name: INDICADORES.ConsultaEducacion,
    url: urls.SERVICIO_EDUCACION
  }, {
    id: 1,
    name: INDICADORES.ConsultaPorIndicadores,
    url: urls.SERVICIO_EDUCACION_ALFANUMERICO
  }];

  const handleConsultaPor = async(e: { target: { value: string; }; }) => {
    if (e.target.value === "") return
    
    const id = Number(e.target.value)
    const selected = consultaPor.find(c => c.id === id)
    console.log({selected})
    setConsultaPorSeleccionada(selected)
    setLoading(true)
    const response = await realizarQuery(selected.url, selected.name)
    //  poblar el campo categoria con la información presente en response.layers 
    if (response && response.layers) {
      if(selected.name === INDICADORES.ConsultaEducacion){
        const categories = response.layers.map((layer: LayerInfo) => ({ id: layer.id, name: layer.name }))
        //categories ordenadas por name alfabeticamente
        categories.sort((a: interfaceCategories, b: interfaceCategories) => a.name.localeCompare(b.name))
        console.log({categories})
        setCategories(categories.length > 0 ? categories : null)
      }else if(selected.name === INDICADORES.ConsultaPorIndicadores){
        response.layers.forEach((layer: LayerInfo, index: number) => {
          layer.nameOriginal = layer.name
          if (index < NAMES.length) {
            layer.name = NAMES[index]
          }
        })
        const indicadoresList = response.layers.map((layer: LayerInfo) => ({ id: layer.id, name: layer.name  || layer.nameOriginal }))
        setIndicadores(indicadoresList.length > 0 ? indicadoresList : null)
        console.log({indicadoresList})
      }
    }
  }

  const limpiarFeaturesDibujados = (jimuMapView: JimuMapView, features: __esri.Graphic[]) => {
    if (jimuMapView && features?.length) {
      jimuMapView.view.graphics.removeMany(features)
    }
  }


  const realizarQuery = async (url: string, name: string) => {
    setError("")
    try {
      const response = await loadLayers(url)
      console.log({ response, url, name })
      return response
    }
    catch (err) {
      console.error("Error realizando consulta:", err)
      setError("Ocurrio un error al realizar la consulta. Por favor intente nuevamente.")
    }
    finally {
      setLoading(false)
    }
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
      if (!initialExtent) {
        setInitialExtent(jmv.view.extent.clone())
        setInitialZoom(jmv.view.zoom)
      }
    }
  }

    /**
   * Limpia el punto dibujado en el mapa.
   * @returns {void}
   */
  const handleClear = () => {
    if (varJimuMapView) {
      clearPoint(varJimuMapView, graphicsLayer)
    }

    setGraphicsLayer(null)
    setFeaturesDibujados([])
    setLoading(false)
    setError("")
  }

  /**
   * Efecto que limpia el punto y restaura la vista inicial cuando el widget se cierra.
   */
  React.useEffect(() => {
    if (props.state === 'CLOSED') {
      handleClear()
      goToInitialExtent(varJimuMapView, initialExtent, initialZoom)
      limpiarYCerrarWidgetResultados(widgetResultId)
      limpiarFeaturesDibujados(varJimuMapView, featuresDibujados)
      setVerAtributos(false)
      setConsultaPorSeleccionada({name: "", id: null, url: ""})
      setSelectedCategory(null)
      setCategories(null)
      setMunicipios(null)
      setSelectedMunicipio(null)
      setSelectedEstablecimiento(null)
      setEstablecimientos(null)
    } 
    
    
  }, [props])

  /*
  ==========================
  EVENT HANDLERS
  ==========================
  */
  const handleCategoriesChange = async (e: { target: { value: any; }; }) => {
    if (!categories || e.target.value === "") return
    const id = Number(e.target.value)
    const selected = categories?.find(c => c.id === id)
    console.log({ selected })
    setSelectedCategory(id)
    setMunicipios(null)
    setSelectedMunicipio(null)
    // obtener los municipios asociados a la categoria seleccionada y poblar el select de municipios
    const { url } = consultaPorSeleccionada
    const URL_LAYER_SELECTED = `${url}/${id}`
    setUrlLayerSelected(URL_LAYER_SELECTED) // almacenar la url de la capa seleccionada para usarla luego en la consulta de los municipios    
    console.log({ URL_LAYER_SELECTED })
    setLoading(true)
    try {
      // Cargar los domains de la capa seleccionada para resolver códigos a nombres
      const layerMeta = await esriRequest(URL_LAYER_SELECTED, { query: { f: "json" }, responseType: "json" })
      const fields = layerMeta.data?.fields as any[] ?? []
      const domains: Record<string, Record<number, string>> = {}
      fields.forEach(field => {
        if (field.domain?.type === "codedValue" && field.domain.codedValues) {
          domains[field.name] = {}
          field.domain.codedValues.forEach((cv: { code: number, name: string }) => {
            domains[field.name][cv.code] = cv.name
          })
        }
      })
      console.log({layerMeta,fields, domains})
      setDomainsMap(domains)
      let campos = ["IDMUNICIPIO", "NOMBREESTABLECIMIENTO ","CODIGOESTABLECIMIENTO", "DIRECCION", "IDNIVELEDUCACION","IDSECTOR", "IDZONA", "IDJORNADA", "IDTIPOSEDE", "IMAGEN", "IDGRUPO"]
      if(URL_LAYER_SELECTED === 'https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/EducacionAlfanumerico/MapServer/1'){
        campos = fields.map(f => f.name)
      }
      const features = await ejecutarConsulta({ returnGeometry: false, campos, url: URL_LAYER_SELECTED, where: "1=1" })
      console.log({ features })
      // eliminar duplicados por IDMUNICIPIO y ordenar alfabeticamente por MUNICIPIO
      const uniqueMap = new Map<string, string>()
      features.forEach(f => {
        const idMun = f.attributes.IDMUNICIPIO as string
        if (!uniqueMap.has(idMun)) {
          const municipio = MUNICIPIOS_QUINDIO.find(m => m.IDMUNICIPI === idMun)
          uniqueMap.set(idMun, municipio?.NOMBRE ?? idMun)
        }
      })
      const municipiosList: interfaceMunicipio[] = Array.from(uniqueMap, ([IDMUNICIPIO, MUNICIPIO]) => ({ IDMUNICIPIO, MUNICIPIO }))
        .sort((a, b) => a.MUNICIPIO.localeCompare(b.MUNICIPIO))
      setMunicipios(municipiosList.length > 0 ? municipiosList : null)
    } catch (err) {
      console.error("Error obteniendo municipios:", err)
      setError("Ocurrió un error al obtener los municipios.")
    } finally {
      setLoading(false)
    }
  }

  const handleIndicadorChange = async (e: { target: { value: any; }; }) => {
    const id = e.target.value
    if (id === "") {
      setSelectedIndicador(null)
      setNiveles(null)
      setSectores(null)
      setAnios(null)
      setSelectedNivel(null)
      setSelectedSector(null)
      setSelectedAnio(null)
      limpiarYCerrarWidgetResultados(widgetResultId)
      return
     }
    setLoading(true)
    try {
      const features = await ejecutarConsulta({ returnGeometry: false, campos: ["*"], url: `${consultaPorSeleccionada.url}/${id}`, where: "1=1" })
      console.log({features})
      if (features.length > 0) {
        const attrs = Object.keys(features[0].attributes)
        console.log({camposIndicador:attrs})
        setCamposIndicador(attrs)
      }
      if (id === 1) { // si el indicador seleccionado es "cobertura", poblar los selects de niveles, sectores y años con la información presente en los features obtenidos
        const uniqueNiveles = [...new Set(features.map(f => f.attributes.NIVEL as string).filter(Boolean))].sort()
        const uniqueSectores = [...new Set(features.map(f => f.attributes.SECTOR as string).filter(Boolean))].sort()
        setNiveles(uniqueNiveles.length > 0 ? uniqueNiveles : null)
        setSectores(uniqueSectores.length > 0 ? uniqueSectores : null)
        setSelectedNivel(null)
        setSelectedSector(null)
      }else if(id === 2){ // si el indicador seleccionado es "cupos ofertados", poblar los selects de niveles y sectores con la información presente en los features obtenidos

      }
      const uniqueAnios = [...new Set(features.map(f => f.attributes.ANIO as string).filter(Boolean))].sort()
      setAnios(uniqueAnios.length > 0 ? uniqueAnios : null)
      setSelectedAnio(null)
      setSelectedIndicador(id ? Number(id) : null)
    } catch (err) {
      console.error("Error obteniendo datos del indicador:", err)
      setError("Ocurrió un error al obtener los datos del indicador.")
    } finally {
      setLoading(false)
    }
  }


  const handleMunicipioChange = async(e: { target: { value: any; }; }) => {
    if (!municipios) return
    const id = e.target.value
    const selected = municipios?.find(m => m.IDMUNICIPIO === id)
    
    console.log({ selected })
    setSelectedMunicipio(selected)
    setEstablecimientos(null)
    setSelectedEstablecimiento(null)
    setLoading(true)
    try {
      const features = await ejecutarConsulta({ returnGeometry: true, campos: ["IDSECTOR","IDZONA","IDTIPOSEDE","IDGRUPO","NOMBREESTABLECIMIENTO","CODIGOESTABLECIMIENTO","DIRECCION","IDJORNADA","IMAGEN"], url: urlLayerSelected, where: `IDMUNICIPIO='${id}'` })
      const lista: interfaceEstablecimiento[] = features.map(f => ({
        NOMBREESTABLECIMIENTO: f.attributes.NOMBREESTABLECIMIENTO as string,
        CODIGOESTABLECIMIENTO: f.attributes.CODIGOESTABLECIMIENTO as string,
        DIRECCION: f.attributes.DIRECCION as string,
        IMAGEN: f.attributes.IMAGEN as string,
        JORNADA: domainsMap?.IDJORNADA?.[f.attributes.IDJORNADA] ?? String(f.attributes.IDJORNADA),
        IDSECTOR: domainsMap?.IDSECTOR?.[f.attributes.IDSECTOR] ?? String(f.attributes.IDSECTOR),
        IDZONA: domainsMap?.IDZONA?.[f.attributes.IDZONA] ?? String(f.attributes.IDZONA),
        IDTIPOSEDE: domainsMap?.IDTIPOSEDE?.[f.attributes.IDTIPOSEDE] ?? String(f.attributes.IDTIPOSEDE),
        IDGRUPO: domainsMap?.IDGRUPO?.[f.attributes.IDGRUPO] ?? String(f.attributes.IDGRUPO),
        
        geometry: f.geometry.clone() as __esri.Geometry
      })).sort((a, b) => a.NOMBREESTABLECIMIENTO.localeCompare(b.NOMBREESTABLECIMIENTO))
      console.log({ features, lista })
      setEstablecimientos(lista.length > 0 ? lista : null)
    } catch (err) {
      console.error("Error obteniendo datos del municipio seleccionado:", err)
      setError("Ocurrió un error al obtener los datos del municipio seleccionado.")
    } finally {
      setLoading(false)
    }
  }

  const handleEstablecimientoChange = (e: { target: { value: any; }; }) => {
    if (!establecimientos) return
    const nombre = e.target.value
    const selected = establecimientos?.find(est => est.NOMBREESTABLECIMIENTO === nombre)
    console.log({selected})
    setSelectedEstablecimiento(selected || null)
    setVerAtributos(false)

  }

  const buscar = async () => {
    if (!selectedEstablecimiento && !selectedIndicador) {
      setError("Por favor seleccione un establecimiento o un indicador para realizar la búsqueda.")
      return
    }
    // limpiar geometrías previamente dibujadas
    if(featuresDibujados?.length){
      limpiarFeaturesDibujados(varJimuMapView, featuresDibujados)
      setFeaturesDibujados([])
    }
    let urlCapa, campos, where
    if(consultaPorSeleccionada?.name === INDICADORES.ConsultaEducacion){
      urlCapa = urls.SERVICIO_EDUCACION_ALFANUMERICO + `/0`
      campos = ["NOMBREESTABLECIMIENTO", "NIT", "LABORATORIOS", "SALONESCONFERENCIAS", "NUMEROCOMPUTADORES", "ACCESOINTERNET", "WEBSITE", "PROGRAMASESPECIALES", "NUMEROESTUDIANTES", "NUMERODOCENTES", "ZONASRECREATIVAS", "ICFECS", "PRIMERAPELLIDO", "SEGUNDOAPELLIDO", "NOMBRE", "OBJECTID", "CODIGOESTABLECIMIENTO"
      ]
      where = `CODIGOESTABLECIMIENTO='${selectedEstablecimiento.CODIGOESTABLECIMIENTO}' and NOMBREESTABLECIMIENTO='${selectedEstablecimiento.NOMBREESTABLECIMIENTO}'`
    }else if(consultaPorSeleccionada?.name === INDICADORES.ConsultaPorIndicadores){
       urlCapa = urls.SERVICIO_EDUCACION_ALFANUMERICO + `/${selectedIndicador}`
       campos = camposIndicador ? camposIndicador.filter(c => c !== "geometry") : ["*"]
       console.log({indicadores, selectedIndicador})
       if (selectedIndicador === 1) { // para la consulta por indicador "cobertura"
        where = `NIVEL='${selectedNivel ?? ""}' and SECTOR='${selectedSector ?? ""}' and ANIO='${selectedAnio ?? ""}'`        
       }else if (selectedIndicador === 2) { // para la consulta por indicador "cupos ofertados"
        where = `ANIO='${selectedAnio ?? ""}'`       
       }
    }
    // const urlCapa = urls.SERVICIO_EDUCACION_ALFANUMERICO + "/0";

    const features = await ejecutarConsulta({ returnGeometry: true, campos, url: urlCapa, where })
    console.log({ features, selectedMunicipio, selectedEstablecimiento })
    // si la longitud de los features obtenidos es menor a 1, mostrar mensaje de error indicando que no se encontraron resultados para la consulta realizada
    if (features.length < 1) {
      setError("No se encontraron resultados para la consulta realizada.")
      return
    }
    // dibujar los features obtenidos en el mapa
    const esCoropletico = consultaPorSeleccionada?.name === INDICADORES.ConsultaPorIndicadores && (selectedIndicador === 1 || selectedIndicador === 2) // el indicador "cobertura" y "cupos ofertados" se representan con coropletico
    if (features?.length) {
      const graphics = features
        .filter(f => f?.geometry)
        .map(f => {
          let symbol: any
          if (f.geometry.type === "polygon") {
            if (esCoropletico) {
              let rango, valor: number
              if (selectedIndicador === 1) { // para el indicador "cobertura", el color del símbolo se determina según el valor del campo TOTALESTUDIANTES y la leyenda definida en LEYENDA_COROPLETICO_QUINDIO
                valor = Number(f.attributes.TOTALESTUDIANTES) || 0
                rango = LEYENDA_COROPLETICO_QUINDIO.Cobertura.find(l => valor >= l.minimo && valor <= l.maximo) ?? LEYENDA_COROPLETICO_QUINDIO.Cobertura[0]                
                
              }else if (selectedIndicador === 2) { // para el indicador "cupos ofertados", el color del símbolo se determina según el valor del campo CUPOSOFERTADOS y la leyenda definida en LEYENDA_COROPLETICO_QUINDIO
                valor = Number(f.attributes.CUPOSOFERTADOS) || 0
                rango = LEYENDA_COROPLETICO_QUINDIO.Cupos_ofertados.find(l => valor >= l.minimo && valor <= l.maximo) ?? LEYENDA_COROPLETICO_QUINDIO.Cupos_ofertados[0]                
              }
              const colorFondo = rango.colorFondo.split(",").map(Number)
              const colorLine = rango.colorLine.split(",").map(Number)
              symbol = {
                type: "simple-fill",
                color: colorFondo,
                outline: { color: colorLine, width: 2 }
              }
            } else {
              symbol = {
                type: "simple-fill",
                color: [255, 0, 0, 0.25],
                outline: { color: "red", width: 2 }
              }
            }
          } else {
            symbol = {
              type: "simple-marker",
              style: "circle",
              color: "red",
              size: "12px"
            }
          }
          return new Graphic({ geometry: f.geometry, symbol })
        })
      varJimuMapView.view.graphics.addMany(graphics)
      setFeaturesDibujados(graphics)
      // centrar el mapa en el primer feature obtenido
      esCoropletico !?? varJimuMapView.view.goTo({ target: features[0].geometry, zoom: 15 })
    }

    let camposResultados,_cloneFeatures, withGraphic={
        showGraphic: false,
        graphicData: [
            { name: "ejemplo_1", value: 65 },
            { name: "ejemplo_2", value: 80 },
            { name: "ejemplo_3", value: features.length }
        ],
        graphicType: "bar",
        graphicTitle: 'Gráfico de ejemplo'
    }
    if(consultaPorSeleccionada?.name === INDICADORES.ConsultaEducacion){
      const URL_ARCHIVOS_QUINDIO = urls.URL_ARCHIVOS_QUINDIO
      // construir la url de la imagen del establecimiento utilizando la propiedad IMAGEN y la constante URL_ARCHIVOS_QUINDIO
      const imagenUrl = selectedEstablecimiento.IMAGEN !== " " ? `${URL_ARCHIVOS_QUINDIO}${selectedEstablecimiento.IMAGEN}` : null
      // ajusta los campos para que cumplan la estructura esperada por el vidget resultados
      camposResultados = [
        { name: "NOMBREESTABLECIMIENTO", alias: "Nombre establecimiento" },
        { name: "CODIGOESTABLECIMIENTO", alias: "Código" },
        { name: "NIT", alias: "NIT" },
        { name: "DIRECCION", alias: "Dirección" },
        { name: "JORNADA", alias: "Jornada" },
        { name: "LABORATORIOS", alias: "Laboratorios" },
        { name: "SALONESCONFERENCIAS", alias: "Salones conferencias" },
        { name: "NUMEROCOMPUTADORES", alias: "Computadores" },
        { name: "ACCESOINTERNET", alias: "Acceso internet" },
        { name: "WEBSITE", alias: "Sitio web" },
        { name: "PROGRAMASESPECIALES", alias: "Programas especiales" },
        { name: "NUMEROESTUDIANTES", alias: "Número estudiantes" },
        { name: "NUMERODOCENTES", alias: "Número docentes" },
        { name: "ZONASRECREATIVAS", alias: "Zonas recreativas" },
        { name: "ICFECS", alias: "ICFES" },
        { name: "NOMBRE", alias: "Nombre contacto" },
        { name: "PRIMERAPELLIDO", alias: "Primer apellido" },
        { name: "SEGUNDOAPELLIDO", alias: "Segundo apellido" },
        // { name: "IMAGEN", alias: "Imagen" },
      ]
      _cloneFeatures = features
        .filter(f => f?.geometry)
        .map(f => ({
          attributes: { ...f.attributes, IMAGEN: imagenUrl },
          geometry: f.geometry.toJSON()
        }))
      setCloneFeatures(_cloneFeatures)
      console.log({_cloneFeatures})
      // cambiar a la pestaña de vista atributos en donde se debe mostrar la información del establecimiento seleccionado
      setVerAtributos(true)
    }else if(esCoropletico){
      camposResultados = camposIndicador ? camposIndicador.map(c => ({ name: c, alias: c })) : [{ name: "OBJECTID", alias: "OBJECTID" }]
      _cloneFeatures = features.map(f => ({ attributes: f.attributes, geometry: f.geometry.toJSON() }))
      let fixDataToRenderGrafic = [], fieldToFilter =  "", titleGrahic = "", dataLeyenda: interfaceLeyenda[] = []
      if (selectedIndicador === 1) { // para el indicador "cobertura", el gráfico mostrará la cobertura de estudiantes por municipio
        fieldToFilter = "TOTALESTUDIANTES"
        titleGrahic = `Cobertura de educación en el año ${selectedAnio ?? ""} por ${selectedNivel ? "nivel educativo" : "sector"}`
        dataLeyenda = LEYENDA_COROPLETICO_QUINDIO.Cobertura.map(l => ({ label: l.label, colorFondo: l.colorFondo, colorLine: l.colorLine }))
      }else if(selectedIndicador === 2){ // para el indicador "cupos ofertados", el gráfico mostrará la cantidad de cupos ofertados por municipio
        fieldToFilter = "CANTIDADMATRICULADOS"
        titleGrahic = `Cupos ofertados y matriculados en el año ${selectedAnio ?? ""} `
        dataLeyenda = LEYENDA_COROPLETICO_QUINDIO.Cupos_ofertados.map(l => ({ label: l.label, colorFondo: l.colorFondo, colorLine: l.colorLine }))
      }
      fixDataToRenderGrafic = features.map(f => ({ name: MUNICIPIOS_QUINDIO.find(m => m.IDMUNICIPI === f.attributes.IDMUNICIPIO)?.NOMBRE, value: Number(f.attributes[fieldToFilter]) || 0 }))
      withGraphic = {
        showGraphic: true,
        graphicData: fixDataToRenderGrafic,
        graphicType: "bar",
        graphicTitle: titleGrahic
      }
      
      abrirWidgetLeyenda({
        widgetleyendaId: WIDGET_IDS.LEYENDA,
        props,
        title: "Cobertura de estudiantes", // título que se mostrará en el widget de resultados
        data: dataLeyenda
      })
    }
    // abrir el widget de resultados y mostrar la información del establecimiento seleccionado
    abrirTablaResultados(
      _cloneFeatures,
      camposResultados,
      props,
      widgetResultId,
      varJimuMapView.view.spatialReference,      
      withGraphic
    )

  }  
  

  return (
    <div style={{height:'100%', padding: '5px', boxSizing: 'border-box'}}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}      {
      varJimuMapView && (
          
          <div className="consulta-widget consulta-scroll loading-host">            
            {verAtributos ? (
              <DetalleEstablecimiento
                cloneFeatures={cloneFeatures}
                selectedEstablecimiento={selectedEstablecimiento}
                onVolver={() => setVerAtributos(false)}
              />
            ) 
            : <div>
              {/* Consultar por */}

              <Label>Consulta por</Label>
              <Select
                  value={consultaPorSeleccionada?.id ?? ""}
                  disabled={loading}
                  onChange={handleConsultaPor}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {consultaPor.map(layer => (
                      <Option key={layer.id} value={layer.id}>
                          {layer.name}
                      </Option>
                  ))}
              </Select>

              {/* Indicador */}
              {
                consultaPorSeleccionada?.name === INDICADORES.ConsultaEducacion && (
                  <FormEducacion
                    loading={loading}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoriesChange={handleCategoriesChange}
                    municipios={municipios}
                    selectedMunicipio={selectedMunicipio}
                    onMunicipioChange={handleMunicipioChange}
                    establecimientos={establecimientos}
                    selectedEstablecimiento={selectedEstablecimiento}
                    onEstablecimientoChange={handleEstablecimientoChange}
                  />
                )
              }

              {
                consultaPorSeleccionada?.name === INDICADORES.ConsultaPorIndicadores && (
                  <FormIndicadores
                    loading={loading}
                    indicadores={indicadores}
                    selectedIndicador={selectedIndicador}
                    onIndicadorChange={handleIndicadorChange}
                    niveles={niveles}
                    selectedNivel={selectedNivel}
                    onNivelChange={(e) => setSelectedNivel(e.target.value || null)}
                    sectores={sectores}
                    selectedSector={selectedSector}
                    onSectorChange={(e) => setSelectedSector(e.target.value || null)}
                    anios={anios}
                    selectedAnio={selectedAnio}
                    onAnioChange={(e) => setSelectedAnio(e.target.value || null)}
                  />
                )
              }
              

              {/* BOTONES */}
              <SearchActionBar
                  onSearch={buscar}
                  onClear={handleClear}
                  loading={loading}
                  // disableSearch={!isValid || disabled}
                  helpText="Ingrese una condición de búsqueda válida para habilitar el botón de busqueda. Utilice los campos, valores y operadores para construir su consulta. Por ejemplo: CAMPO1 = 'Valor' AND CAMPO2 > 100."
                  searchLabel="Buscar"
                  error={error}
              />
            </div>
            }
            

            {loading && <OurLoading />}

          </div>
        )
      }
    </div>
  )
}

export default Widget