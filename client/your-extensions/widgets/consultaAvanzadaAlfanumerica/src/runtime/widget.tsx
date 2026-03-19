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
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import { executeQueryJSON } from "@arcgis/core/rest/query";
import { React, type AllWidgetProps } from "jimu-core"
import Query from "@arcgis/core/rest/support/Query";
import { Label, Select, Option } from "jimu-ui";

import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from "../../../widget-result/src/runtime/widget";
import { drawFeaturesOnMap, goToInitialExtent} from "../../../shared/utils/export.utils";
import { LayerInfo } from "widgets/shared/types/types_consultaAvanzadaAlfanumerica"
import { SearchActionBar } from "../../../shared/components/search-action-bar";
import { loadLayers } from "../../../shared/services/queryMapServer.service"
import { WIDGET_IDS } from "../../../shared/constants/widget-ids";
import { clearPoint } from "../../../../widgets/utils/module"
import { urls} from "../../../api/serviciosQuindio"
import '../styles/styles.css'




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

  interface FeatureSet {
    features: __esri.Graphic[]
  }

  interface QueryOptions {
    url?: string;
    where?: string;
    campos?: string[];
    returnGeometry?: boolean;
    spatialReference?: __esri.SpatialReference;
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
    handleClear()
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
      const featuresFixed = features
        .filter(e => e?.geometry)
        .map(e => ({
          attributes: e.attributes,
          geometry: e.geometry.toJSON()
        }))

      const resultSpatialReference = features[0]?.geometry?.spatialReference || varJimuMapView.view.spatialReference
      console.log({fieldsToShow, featuresFixed})
      abrirTablaResultados(featuresFixed, fieldsToShow, props, resultSpatialReference, widgetResultId)
    } catch (err) {
      console.error("Error en búsqueda:", err)
      setError("Ocurrió un error al ejecutar la búsqueda. Verifique la condición ingresada.")
    } finally {
      setLoading(false)
    }
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
    <div style={{height:'100%', padding: '5px', boxSizing: 'border-box'}}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}      {
      varJimuMapView && (
          
          <div className="consulta-widget">            

            {/* TEMA */}

            <Label>Municipio</Label>
            <Select
                value={selectedLayer ?? ""}
                disabled={loading}
                onChange={handleLayerChange}
            >
                <Option value="">
                    {loading ? 'Cargando ...' : 'Seleccione...'}
                </Option>

                {layers.map(layer => (
                    <Option key={layer.id} value={layer.id}>
                        {layer.name}
                    </Option>
                ))}
            </Select>

            {/* CAMPOS */}

            <Label>Campos</Label>

            <Select
                // value={selectedLayer ?? ""}
                disabled={loading}
                onChange={(e) => {
                setCondition("")
                setValues([])
                appendCondition(e.target.value)
              }}
            >
                <Option value="">
                    {loading ? 'Cargando ...' : 'Seleccione...'}
                </Option>

                {fields.map(field => (
                    <Option key={field} value={field}>
                        {field}
                    </Option>
                ))}
            </Select>

            {/* VALORES */}

            <Label>Valores</Label>
            
            <SearchActionBar
                onSearch={obtenerValores}
                onClear={handleClear}
                loading={loading}
                disableSearch={!isValid || disabled}
                helpText="Seleccione un campo y haga clic en 'Obtener' para cargar los valores únicos de ese campo. Luego, seleccione un valor para agregarlo a la condición de búsqueda."
                searchLabel="Obtener"
                error={error}
            />
            <Select
              className="valuesBox"
              size="lg"
              disabled={values.length === 0 || loading}
              onChange={(e) => {
                setCondition(prev => `${prev} '${e.target.value}'`)
              }}
            >
              {values.map((val, i) => (
                <Option key={i} value={val}>{val}</Option>
              ))}
            </Select>

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
                searchLabel="Buscar"
                error={error}
            />

          </div>
        )
      }
    </div>
  )
}

export default Widget