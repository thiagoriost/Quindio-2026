/**
 * Widget principal para ubicar puntos en el mapa a partir de coordenadas.
 * Permite seleccionar el tipo de coordenada, ingresar valores y visualizar el punto en el mapa.
 *
 * @component
 * @param {AllWidgetProps<any>} props - Propiedades del widget proporcionadas por ArcGIS Experience Builder
 * @returns {JSX.Element} Componente del widget
 *
 * @author IGAC - DIP
 * @since 2026
 */
import { React, type AllWidgetProps } from "jimu-core"
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import Query from "@arcgis/core/rest/support/Query";
import { executeQueryJSON } from "@arcgis/core/rest/query";
import Polygon from "@arcgis/core/geometry/Polygon"
import MapView from "@arcgis/core/views/MapView"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import Graphic from "@arcgis/core/Graphic"
import Polyline from "@arcgis/core/geometry/Polyline"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol"
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol"
import Color from "@arcgis/core/Color"
import Point from "@arcgis/core/geometry/Point"
import SpatialReference from "@arcgis/core/geometry/SpatialReference"
import * as projection from "@arcgis/core/geometry/projection"
import { clearPoint } from "../../../../widgets/utils/module"
import { LayerInfo } from "widgets/shared/types/types_consultaAvanzadaAlfanumerica"
import { urls} from "../../../api/serviciosQuindio"
import { loadLayers } from "../../../shared/services/queryMapServer.service"

import '../styles/styles.css'
import { view } from "motion/dist/react-m";
import { drawFeaturesOnMap, goToInitialExtent} from "../../../shared/utils/export.utils";
import { WIDGET_IDS } from "../../../shared/constants/widget-ids";
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from "../../../widget-result/src/runtime/widget";
import { SearchActionBar } from "../../../shared/components/search-action-bar";




const Widget = (props: AllWidgetProps<any>) => {
  /**
   * Estado para almacenar la referencia a la vista del mapa de Jimu.
   * @type {[JimuMapView | undefined, Function]}
   */
  const [varJimuMapView, setJimuMapView] = React.useState<JimuMapView>()
  const [initialExtent, setInitialExtent] = React.useState(null)
  const [initialZoom, setInitialZoom] = React.useState<number | null>(null)

  const [layers, setLayers] = React.useState<LayerInfo[]>([])
  const [selectedLayer, setSelectedLayer] = React.useState<number | null>(null)

  const [fields, setFields] = React.useState<string[]>([])
  const [fieldSelected, setFieldSelected] = React.useState("")
  const [values, setValues] = React.useState<string[]>([])
  const [condition, setCondition] = React.useState("")

  const [loading, setLoading] = React.useState(false)
  const [urlLayer, setUrlLayer] = React.useState("")
  const [graphicsLayer, setGraphicsLayer] = React.useState<GraphicsLayer | null>(null)
  const [error, setError] = React.useState("")

  const widgetResultId = WIDGET_IDS.RESULT // ID del widget de resultados en el layout
 
  const [selectedValue, setSelectedValue] = React.useState("")

  const isValid = condition.trim() !== "" && urlLayer !== "" && selectedLayer !== null
  const disabled = loading
  
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
    setSelectedLayer(null)
    setFields([])
    setFieldSelected("")
    setValues([])
    setSelectedValue("")
    setCondition("")
    setUrlLayer("")
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
    }  
    
  }, [props])

 

  /*
  ==========================
  LOAD LAYERS ON WIDGET OPEN
  ==========================
  */

  React.useEffect(() => {

    async function fetchLayers() {

      setLoading(true)

      try {

        const response = await loadLayers(urls.SERVICIO_CONSULTA_AVANZADA_ALFANUMERICA)
        console.log({response})

        const nameTemas = ["Trámites", "Predios reserva", "Infraestructura educativa", "Clasificación del suelo",
          "Servicios Salud", "Capacidad instalada", "Servicios hospedajes"]

        const mappedLayers = response.layers.map((layer, i) => ({
          ...layer,
          nameServicio: layer.name,
          name: nameTemas[i] ?? layer.name
        }))

        setLayers(mappedLayers)

      } catch (error) {

        console.error("Error cargando servicio", error)

      } finally {

        setLoading(false)

      }

    }

    fetchLayers()

  }, [])

  /*
  ==========================
  LOAD FIELDS OF LAYER
  ==========================
  */

  async function loadFields(layerId: number) {

    const url = `${urls.SERVICIO_CONSULTA_AVANZADA_ALFANUMERICA}/${layerId}`

    const response = await fetch(`${url}?f=json`)
    const data = await response.json()

    const validFields = data.fields
      .filter((f) => f.name !== "ESRI_OID" && f.name !== "SHAPE")
      .map((f) => f.name)

    setFields(validFields)
    setUrlLayer(url)
    return validFields
  }

  /*
  ==========================
  EVENT HANDLERS
  ==========================
  */

  const handleLayerChange = async (e) => {

    const id = Number(e.target.value)

    setSelectedLayer(id)

    const validFields = await loadFields(id)
    setFields(validFields)
  }

  const appendCondition = (text: string) => {
    if (!text) return
    setFieldSelected(text)
    setCondition(prev => `${prev} ${text}`.trim())

  }

  const obtenerValores = async () => {
    var where = "1=1", returnGeometry = true;
    const features = await consultarCapaCAA({returnGeometry, campos: fields, url: urlLayer, where})
    console.log({features, fields})
    const uniqueValues = Array.from(new Set(features.map(f => f.attributes[fieldSelected])))
    setValues(uniqueValues)
    console.log({features,uniqueValues})
    mostrarConsultaCAA({ features })
    
    // drawFeaturesOnMap({ features, spatialReference: varJimuMapView.view.spatialReference }, varJimuMapView, 15)
  }

  const buscar = async () => {
    if (!condition || !urlLayer) return
    setLoading(true)
    setError("")
    try {
      const features = await consultarCapaCAA({ returnGeometry: true, campos: fields, url: urlLayer, where: condition.trim() })
      console.log("Resultados búsqueda:", features)
      const graphicsLayer = await drawFeaturesOnMap({ features, spatialReference: varJimuMapView.view.spatialReference }, varJimuMapView, 16)
      setGraphicsLayer(graphicsLayer)
      const fieldsToShow = fields.map(f => ({ name: f, alias: f }))
      const featuresFixed = []
      features.forEach(e=>{
        let geometry
        if(e.geometry.type === "point"){
          geometry = e.geometry as Point
        } else if(e.geometry.type === "polyline"){
          geometry = e.geometry as Polyline
        } else if(e.geometry.type === "polygon"){
          geometry = e.geometry as Polygon
        }
        // featuresFixed.push({ attributes: e.attributes, geometry: geometry })
        featuresFixed.push({ attributes: e.attributes, geometry: e.geometry.type === "polygon" 
          ? { rings: geometry.rings, type: geometry.type, extent: geometry.extent }
          : e.geometry.type === "point"
            ? { x: geometry.x, y: geometry.y, type: geometry.type }
            : { paths: geometry.paths, type: geometry.type }
        })
        // featuresFixed.push({ attributes: e.attributes, geometry})
      })      
      console.log({fieldsToShow, featuresFixed})
      abrirTablaResultados(featuresFixed, fieldsToShow, props, varJimuMapView.view.spatialReference, widgetResultId)
    } catch (err) {
      console.error("Error en búsqueda:", err)
      setError("Ocurrió un error al ejecutar la búsqueda. Verifique la condición ingresada.")
    } finally {
      setLoading(false)
    }
  }

  interface FeatureSet {
    features: __esri.Graphic[]
  }

  function mostrarConsultaCAA(featureSet: FeatureSet) {

    const { features } = featureSet;

    if (!features?.length) {
      console.log(
        "<B> Info </B>",
        "El campo seleccionado no contiene datos"
      );
      setLoading(false);
      return;
    }

  }

  

  interface QueryOptions {
    url?: string;
    where?: string;
    campos?: string[];
    returnGeometry?: boolean;
    spatialReference?: __esri.SpatialReference;
  }

  const consultarCapaCAA = async ({    
    url,
    where,
    campos,
    returnGeometry = true,
    spatialReference = varJimuMapView.view.spatialReference
  }: QueryOptions): Promise<__esri.Graphic[]> => {

    if (!url || !where) {
      throw new Error("URL o condición WHERE inválida");
    }

    try {

      const query = new Query({
        where,
        outFields: campos?.length ? campos : ["*"],
        returnGeometry,
        outSpatialReference: spatialReference,
        spatialRelationship: "intersects"
      });

      const response = await executeQueryJSON(url, query) as __esri.FeatureSet;
      /* const nameAliasByField = []
      response.fields.forEach( e => {
          nameAliasByField.push({name: e.name, alias: e.alias})    
      })
      console.log({nameAliasByField})
      console.log({response})
      console.log(response) */
      return response.features;

    } catch (error) {

      console.error("Error ejecutando consulta:", error);

      console.log(
        "<B> Info </B>",
        "No se logró completar la operación"
      );

      setLoading(false);

      throw error;
    }
  }

  

  return (
    <div style={{height:'100%', padding: '10px', boxSizing: 'border-box'}}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}      {
      varJimuMapView && (
          
          <div className="consulta-widget">            

            {/* TEMA */}

            <label>Tema</label>

            <select
              className="select"
              value={selectedLayer ?? ""}
              onChange={handleLayerChange}
            >

              <option>Seleccione...</option>

              {layers.map(layer => (

                <option key={layer.id} value={layer.id}>
                  {layer.name}
                </option>

              ))}

            </select>

            {/* CAMPOS */}

            <label>Campos</label>

            <select
              className="select"
              onChange={(e) => appendCondition(e.target.value)}
            >

              <option>Seleccione...</option>

              {fields.map(field => (

                <option key={field} value={field}>
                  {field}
                </option>

              ))}

            </select>

            {/* VALORES */}

            <label>Valores</label>
            {/* <div className="actions">

              <button
                onClick={obtenerValores}
              >
                Obtener
              </button>

              <button
                onClick={handleClear}
              >
                Borrar
              </button>

            </div> */}
            <SearchActionBar
                onSearch={obtenerValores}
                onClear={handleClear}
                loading={loading}
                disableSearch={!isValid || disabled}
                helpText="Seleccione un campo y haga clic en 'Obtener' para cargar los valores únicos de ese campo. Luego, seleccione un valor para agregarlo a la condición de búsqueda."
                searchLabel="Obtener"
                error={error}
            />
            <select
              className="valuesBox"
              size={6}
              onChange={(e) => {
                setCondition(prev => `${prev} '${e.target.value}'`)
              }}
            >
              {values.map((val, i) => (
                <option key={i} value={val}>{val}</option>
              ))}
            </select>

            {/* OPERADORES */}

            <div className="operators">

              {["LIKE","AND","OR","NOT","IS","NULL","=","<>",">","<",">=","<="].map(op => (

                <button
                  key={op}
                  onClick={() => appendCondition(op)}
                >
                  {op}
                </button>

              ))}

            </div>

            {/* CONDICION */}

            <label>Condición de Búsqueda</label>

            <textarea
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />

            {/* BOTONES */}

            {/* <div className="actions">

              <button
                onClick={handleClear}
              >
                Limpiar
              </button>

              <button
                onClick={buscar}
              >
                Buscar
              </button>

            </div> */}
            <SearchActionBar
                onSearch={buscar}
                onClear={handleClear}
                loading={loading}
                disableSearch={!isValid || disabled}
                helpText="Ingrese una condición de búsqueda válida para habilitar el botón de busqueda. Utilice los campos, valores y operadores para construir su consulta. Por ejemplo: CAMPO1 = 'Valor' AND CAMPO2 > 100."
                searchLabel="Ubicar"
                error={error}
            />

          </div>
        )
      }
    </div>
  )
}

export default Widget