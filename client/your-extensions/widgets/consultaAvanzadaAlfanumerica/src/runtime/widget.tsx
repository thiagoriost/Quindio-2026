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
import { drawFeaturesOnMap } from "../../../shared/utils/export.utils";




const Widget = (props: AllWidgetProps<any>) => {
  /**
   * Estado para almacenar la referencia a la vista del mapa de Jimu.
   * @type {[JimuMapView | undefined, Function]}
   */
  const [varJimuMapView, setJimuMapView] = React.useState<JimuMapView>()
  const [initialExtent, setInitialExtent] = React.useState(null)
  const [initialZoom, setInitialZoom] = React.useState<number | null>(null)

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
   * Restaura la vista del mapa a la extensión y zoom iniciales.
   * @returns {void}
   */
  const goToInitialExtent = () => {

    if (!varJimuMapView || !initialExtent) return

    varJimuMapView.view.goTo({
      target: initialExtent,
      zoom: initialZoom
    })
    
  }

  /**
   * Limpia el punto dibujado en el mapa.
   * @returns {void}
   */
  const handleClear = () => {
    if (!varJimuMapView) return
    clearPoint(varJimuMapView)
  }

  /**
   * Efecto que limpia el punto y restaura la vista inicial cuando el widget se cierra.
   */
  React.useEffect(() => {
    if (props.state === 'CLOSED') {
      handleClear()
      goToInitialExtent()
    }  
    
  }, [props])

  const [layers, setLayers] = React.useState<LayerInfo[]>([])
  const [selectedLayer, setSelectedLayer] = React.useState<number | null>(null)

  const [fields, setFields] = React.useState<string[]>([])
  const [fieldSelected, setFieldSelected] = React.useState("")
  const [values, setValues] = React.useState<string[]>([])
  const [condition, setCondition] = React.useState("")

  const [loading, setLoading] = React.useState(false)
  const [urlLayer, setUrlLayer] = React.useState("")

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
      .filter((f) => f.name !== "OBJECTID" && f.name !== "SHAPE")
      .map((f) => f.name)

    setFields(validFields)
    setUrlLayer(url)

  }

  /*
  ==========================
  EVENT HANDLERS
  ==========================
  */

  const handleLayerChange = (e) => {

    const id = Number(e.target.value)

    setSelectedLayer(id)

    loadFields(id)

  }

  const appendCondition = (text: string) => {
    setFieldSelected(text)
    setCondition(prev => `${prev} ${text}`)

  }

  const obtenerValores = async () => {
    var where = "1=1", returnGeometry = true;
    const features = await consultarCapaCAA({returnGeometry, campos: fieldSelected, url: urlLayer, where})
    console.log({features})
    const uniqueValues = Array.from(new Set(features.map(f => f.attributes[fieldSelected])))
    setValues(uniqueValues)
    console.log({features,uniqueValues})
    mostrarConsultaCAA({ features })
    
    // drawFeaturesOnMap({ features, spatialReference: varJimuMapView.view.spatialReference }, varJimuMapView, 15)
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

    // const state = consultaAvanzadaAlfanumerica;

    // state.featureSet = featureSet;

    // if (!state.valoresObtenidos) {

    //   state.valoresObtenidos = features;

    //   console.log("cargarValoresCAA", features);

    //   return;
    // }

    console.log("dibujarFeaturesCAA",features)
    console.log("mostrarResultadosEnTablaCAA",featureSet)
  }

  

  interface QueryOptions {
    url?: string;
    where?: string;
    campos?: string;
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
        outFields: [campos],
        returnGeometry,
        outSpatialReference: spatialReference,
        spatialRelationship: "intersects"
      });

      const response = await executeQueryJSON(url, query) as __esri.FeatureSet;
      console.log({response})
      console.log(response)
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
    <div style={{height:'100%', backgroundColor: 'antiquewhite', padding: '10px', boxSizing: 'border-box'}}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
      )}      {
      varJimuMapView && (
          
          <div className="consulta-widget">

            <h3>Consulta Avanzada Alfanumérica</h3>

            {/* TEMA */}

            <label>Tema</label>

            <select
              className="select"
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

                <option key={field}>
                  {field}
                </option>

              ))}

            </select>

            {/* VALORES */}

            <label>Valores</label>
            <div className="actions">

              <button
                onClick={obtenerValores}
              >
                Obtener
              </button>

              <button>
                Borrar
              </button>

            </div>
            <textarea className="valuesBox" value={values.join("\n")} readOnly />

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
              readOnly
            />

            {/* BOTONES */}

            <div className="actions">

              <button
                onClick={() => setCondition("")}
              >
                Limpiar
              </button>

              <button>
                Buscar
              </button>

            </div>

          </div>
        )
      }
    </div>
  )
}

export default Widget