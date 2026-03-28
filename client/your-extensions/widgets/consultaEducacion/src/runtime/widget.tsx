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
import {  ejecutarConsulta, goToInitialExtent} from "../../../shared/utils/export.utils";
import { LayerInfo } from "widgets/shared/types/types_consultaAvanzadaAlfanumerica"
import { SearchActionBar } from "../../../shared/components/search-action-bar";
import { loadLayers } from "../../../shared/services/queryMapServer.service"
import { WIDGET_IDS } from "../../../shared/constants/widget-ids";
import { clearPoint } from "../../../../widgets/utils/module"
import esriRequest from "@arcgis/core/request"
import { urls} from "../../../api/serviciosQuindio"
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import DetalleEstablecimiento from './detalleEstablecimiento'
import '../styles/styles.css'
import { MUNICIPIOS_QUINDIO } from '../../../shared/constants/municipiosQuindio';


interface interfaceConsultaPor { id: number, name: string, url: string }
interface interfaceCategories { id: number, name: string }
interface interfaceMunicipio { IDMUNICIPIO: string, MUNICIPIO: string }
interface interfaceEstablecimiento { NOMBREESTABLECIMIENTO: string, CODIGOESTABLECIMIENTO: string,  DIRECCION: string, JORNADA: string, IMAGEN: string, geometry: __esri.Geometry, IDSECTOR: string, IDZONA: string, IDTIPOSEDE: string, IDGRUPO: string }

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
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null)
  const [municipios, setMunicipios] = React.useState<interfaceMunicipio[] | null>(null)
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<interfaceMunicipio | null>(null)
  const [urlLayerSelected, setUrlLayerSelected] = React.useState<string | null>(null)
  const [selectedEstablecimiento, setSelectedEstablecimiento] = React.useState<interfaceEstablecimiento | null>(null)
  const [establecimientos, setEstablecimientos] = React.useState<interfaceEstablecimiento[] | null>(null)
  const [verAtributos, setVerAtributos] = React.useState(false)
  const [cloneFeatures, setCloneFeatures] = React.useState<any[]>([])
  const [featuresDibujados, setFeaturesDibujados] = React.useState<__esri.Graphic[]>([])
  const [domainsMap, setDomainsMap] = React.useState<Record<string, Record<number, string>>>({})
  const consultaPor = [{
    id: 0,
    name: "Consulta educación",
    url: urls.SERVICIO_EDUCACION
  }, {
    id: 1,
    name: "Consulta por indicadores",
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
      const categories = response.layers.map((layer: LayerInfo) => ({id: layer.id, name: layer.name}))
      setCategories(categories.length > 0 ? categories : null)
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
    if (!categories) return
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
      const features = await ejecutarConsulta({ returnGeometry: false, campos: ["IDMUNICIPIO", "NOMBREESTABLECIMIENTO ","CODIGOESTABLECIMIENTO", "DIRECCION", "IDNIVELEDUCACION","IDSECTOR", "IDZONA", "IDJORNADA", "IDTIPOSEDE", "IMAGEN", "IDGRUPO"], url: URL_LAYER_SELECTED, where: "1=1" })
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
    if (!selectedEstablecimiento) {
      setError("Por favor seleccione un establecimiento para realizar la búsqueda.")
      return
    }
    // limpiar geometrías previamente dibujadas
    if(featuresDibujados?.length){
      limpiarFeaturesDibujados(varJimuMapView, featuresDibujados)
      setFeaturesDibujados([])
    }
    const urlCapa = urls.SERVICIO_EDUCACION_ALFANUMERICO + "/0";
    const campos = ["NOMBREESTABLECIMIENTO", "NIT", "LABORATORIOS", "SALONESCONFERENCIAS", "NUMEROCOMPUTADORES", "ACCESOINTERNET", "WEBSITE", "PROGRAMASESPECIALES", "NUMEROESTUDIANTES", "NUMERODOCENTES", "ZONASRECREATIVAS", "ICFECS", "PRIMERAPELLIDO", "SEGUNDOAPELLIDO", "NOMBRE", "OBJECTID", "CODIGOESTABLECIMIENTO"
    ];
    const features = await ejecutarConsulta({ returnGeometry: true, campos, url: urlCapa, where: `CODIGOESTABLECIMIENTO='${selectedEstablecimiento.CODIGOESTABLECIMIENTO}' and NOMBREESTABLECIMIENTO='${selectedEstablecimiento.NOMBREESTABLECIMIENTO}'` })
    console.log({ features, selectedMunicipio, selectedEstablecimiento })
    // dibujar los features obtenidos en el mapa
    if (features?.length) {
      const graphics = features
        .filter(f => f?.geometry)
        .map(f => new Graphic({
          geometry: f.geometry,
          symbol: {
            type: "simple-marker",
            style: "circle",
            color: "red",
            size: "12px"
          } as any
        }))
      varJimuMapView.view.graphics.addMany(graphics)
      setFeaturesDibujados(graphics)
      // centrar el mapa en el primer feature obtenido
      varJimuMapView.view.goTo({ target: features[0].geometry, zoom: 15 })
    }
    const URL_ARCHIVOS_QUINDIO = urls.URL_ARCHIVOS_QUINDIO
    // construir la url de la imagen del establecimiento utilizando la propiedad IMAGEN y la constante URL_ARCHIVOS_QUINDIO
    const imagenUrl = selectedEstablecimiento.IMAGEN !== " " ? `${URL_ARCHIVOS_QUINDIO}${selectedEstablecimiento.IMAGEN}` : null

    // ajusta los campos para que cumplan la estructura esperada por el vidget resultados
    const camposResultados = [
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
    const cloneFeatures = features
      .filter(f => f?.geometry)
      .map(f => ({
        attributes: { ...f.attributes, IMAGEN: imagenUrl },
        geometry: f.geometry.toJSON()
      }))
    setCloneFeatures(cloneFeatures)
    console.log({cloneFeatures})
    // abrir el widget de resultados y mostrar la información del establecimiento seleccionado
    abrirTablaResultados(cloneFeatures, camposResultados, props, widgetResultId, varJimuMapView.view.spatialReference)
    // cambiar a la pestaña de vista atributos en donde se debe mostrar la información del establecimiento seleccionado
    setVerAtributos(true)
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

              {/* Categoria */}

              <Label>Categoria</Label>

              <Select
                  value={selectedCategory ?? ""}
                  disabled={loading}
                  onChange={handleCategoriesChange}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {categories?.map(field => (
                      <Option key={field.id} value={field.id}>
                          {field.name}
                      </Option>
                  ))}
              </Select>

              {/* Municipio */}

              <Label>Municipio</Label>
              <Select
                  value={selectedMunicipio?.IDMUNICIPIO ?? ""}
                  disabled={loading}
                  onChange={handleMunicipioChange}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {municipios?.map(mun => (
                      <Option key={mun.IDMUNICIPIO} value={mun.IDMUNICIPIO}>
                          {mun.MUNICIPIO}
                      </Option>
                  ))}
              </Select>

              {/* Atributo */}

              <Label>Atributo</Label>
              <Select
                  value={selectedEstablecimiento?.NOMBREESTABLECIMIENTO ?? ""}
                  disabled={loading}
                  onChange={handleEstablecimientoChange}
              >
                  <Option value="">
                      {loading ? 'Cargando ...' : 'Seleccione...'}
                  </Option>

                  {establecimientos?.map((est, idx) => (
                      <Option key={idx} value={est.NOMBREESTABLECIMIENTO}>
                          {est.NOMBREESTABLECIMIENTO}
                      </Option>
                  ))}
              </Select>
              

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