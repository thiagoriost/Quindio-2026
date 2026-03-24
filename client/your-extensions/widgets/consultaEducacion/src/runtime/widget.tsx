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
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import '../styles/styles.css'




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

  const consultaPor = [{
    id: 0,
    name: "Consulta educaci\u00F3n",
    url: urls.SERVICIO_EDUCACION
  }, {
    id: 1,
    name: "Consulta por indicadores",
    url: urls.SERVICIO_EDUCACION_ALFANUMERICO
  }];

  // const isValid = condition.trim() !== "" && urlLayer !== "" && selectedLayer !== null
 
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

  const handleConsultaPor = (e) => {
    if (e.target.value === "") return
    const id = Number(e.target.value)
    const selected = consultaPor.find(c => c.id === id)
    console.log({selected})
    realizarQuery(selected.url, selected.name)
  }

  const realizarQuery = async (url: string, name: string) => {
    setLoading(true)
    setError("")
    try {   
      var urlCapa = url + "/0";
      const where = "1=1";
      var campos = ["NOMBREESTABLECIMIENTO", "NIT", "LABORATORIOS", "SALONESCONFERENCIAS", "NUMEROCOMPUTADORES", "ACCESOINTERNET", "WEBSITE", "PROGRAMASESPECIALES",
          "NUMEROESTUDIANTES", "NUMERODOCENTES", "ZONASRECREATIVAS", "ICFECS", "PRIMERAPELLIDO", "SEGUNDOAPELLIDO", "NOMBRE", "OBJECTID", "CODIGOESTABLECIMIENTO"
      ];
      // consultaEducacion.contadorQueryTask = 0;
      // consultarQueryTask(campos, urlCapa, true, "1=1");
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

    

  }, [])

  /*
  ==========================
  LOAD FIELDS OF LAYER
  ==========================
  */

  async function loadFields(layerId: number) {
    setLoading(true)
    try {

      const url = `${urls.SERVICIO_CONSULTA_AVANZADA_ALFANUMERICA}/${layerId}`

      const response = await fetch(`${url}?f=json`)
      const data = await response.json()

      const validFields = data.fields
        .filter((f) => f.name !== "ESRI_OID" && f.name !== "SHAPE")
        .map((f) => f.name)

      
      return validFields
    } finally {
      setLoading(false)
    }
  }

  /*
  ==========================
  EVENT HANDLERS
  ==========================
  */

  const handleLayerChange = async (e) => {
    handleClear()
    const id = Number(e.target.value)

    

    const validFields = await loadFields(id)
    
  }

  
  const obtenerValores = async () => {
    setLoading(true)
    try {
      var where = "1=1", returnGeometry = true;
      // const features = await consultarCapaCAA({returnGeometry, campos: fields, url: urlLayer, where})
  
      // const uniqueValues = Array.from(new Set(features.map(f => f.attributes[fieldSelected])))
  
      // console.log({features,uniqueValues})
      // mostrarConsultaCAA({ features })
    } catch (err) {
      console.error("Error obteniendo valores:", err)
      setError("Ocurrio un error al obtener los valores del campo seleccionado.")
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
     console.log({response})
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
          
          <div className="consulta-widget consultaAA-scroll loading-host">            

            {/* Consultar por */}

            <Label>Consulta por</Label>
            <Select
                
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
                // value={selectedLayer ?? ""}
                disabled={loading}
                onChange={(e) => {
                
              }}
            >
                <Option value="">
                    {loading ? 'Cargando ...' : 'Seleccione...'}
                </Option>

                {[].map(field => (
                    <Option key={field} value={field}>
                        {field}
                    </Option>
                ))}
            </Select>

            {/* Municipio */}

            <Label>Municipio</Label>
            <Select
                
                disabled={loading}
                onChange={handleLayerChange}
            >
                <Option value="">
                    {loading ? 'Cargando ...' : 'Seleccione...'}
                </Option>

                {[].map(layer => (
                    <Option key={layer.id} value={layer.id}>
                        {layer.name}
                    </Option>
                ))}
            </Select>

            {/* Atributo */}

            <Label>Atributo</Label>
            <Select
                
                disabled={loading}
                onChange={handleLayerChange}
            >
                <Option value="">
                    {loading ? 'Cargando ...' : 'Seleccione...'}
                </Option>

                {[].map(layer => (
                    <Option key={layer.id} value={layer.id}>
                        {layer.name}
                    </Option>
                ))}
            </Select>
            

            {/* BOTONES */}
            <SearchActionBar
                onSearch={()=>{}}
                onClear={handleClear}
                loading={loading}
                // disableSearch={!isValid || disabled}
                helpText="Ingrese una condición de búsqueda válida para habilitar el botón de busqueda. Utilice los campos, valores y operadores para construir su consulta. Por ejemplo: CAMPO1 = 'Valor' AND CAMPO2 > 100."
                searchLabel="Buscar"
                error={error}
            />
            {loading && <OurLoading />}

          </div>
        )
      }
    </div>
  )
}

export default Widget