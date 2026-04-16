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
import esriRequest from "@arcgis/core/request"

import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from "../../../widget-result/src/runtime/widget";
import { abrirWidgetLeyenda, limpiarYCerrarwidgetLeyenda } from '../../../widget-leyenda/src/runtime/widget';
import {  ejecutarConsulta, restoreInitialExtent, validaLoggerLocalStorage, dibujarFeaturesCoropletico, limpiarFeaturesDibujados} from "../../../shared/utils/export.utils";
import { LayerInfo } from "widgets/shared/types/types_consultaAvanzadaAlfanumerica"
import { SearchActionBar } from "../../../shared/components/search-action-bar";
import { loadLayers } from "../../../shared/services/queryMapServer.service"
import { WIDGET_IDS } from "../../../shared/constants/widget-ids";
import { clearPoint } from "../../../../widgets/utils/module"
import { urls} from "../../../api/serviciosQuindio"
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import '../styles/styles.css'
import { MUNICIPIOS_QUINDIO } from '../../../shared/constants/municipiosQuindio';
import ResultGraphicTest from '../../../widget-result/components/ResultGraphic_Test';


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
  Cobertura: {
    leyenda: [
      {
        colorFondo: "252,3,3,0.4",
        colorLine: "252,3,3,1",
        label: "0 a 1000",
        minimo: 0,
        maximo: 1000,
      },
      {
        colorFondo: "246,254,6,0.4",
        colorLine: "246,254,6,1",
        label: "1001 a 5000",
        minimo: 1001,
        maximo: 5000,
      },
      {
        colorFondo: "81,175,51,0.4",
        colorLine: "81,175,51,1",
        label: "Mayor a 5000",
        minimo: 5001,
        maximo: 50000000,
      },
    ],
    fieldsToFilter: [
      { field: "TOTALESTUDIANTES", label: "Total Estudiantes" }
    ],
  },
  Cupos_ofertados: {
    leyenda: [
      {
        colorFondo: "77,246,22,0.4",
        colorLine: "77,246,22,1",
        label: "0 a 1000",
        minimo: 0,
        maximo: 1000,
      },
      {
        colorFondo: "246,162,60,0.4",
        colorLine: "246,162,60,1",
        label: "1001 a 5000",
        minimo: 1001,
        maximo: 5000,
      },
      {
        colorFondo: "135,240,226,0.4",
        colorLine: "135,240,226,1",
        label: "5001 a 10000",
        minimo: 5001,
        maximo: 10000,
      },
      {
        colorFondo: "77,133,52,0.4",
        colorLine: "77,133,52,1",
        label: "Mayor a 10000",
        minimo: 10001,
        maximo: 50000000,
      },
    ],
    fieldsToFilter: [{ field: "CANTIDADMATRICULADOS", label: "Cantidad Matriculados" }],
  },
  Eficiencia_interna: {
    leyenda: [
      {
        colorFondo: "252,3,3,0.4",
        colorLine: "252,3,3,1",
        label: "0 a 1000",
        minimo: 0,
        maximo: 1000,
      },
      {
        colorFondo: "246,254,6,0.4",
        colorLine: "246,254,6,1",
        label: "1001 a 10000",
        minimo: 1001,
        maximo: 10000,
      },
      {
        colorFondo: "81,175,51,0.4",
        colorLine: "81,175,51,1",
        label: "Mayor a 10000",
        minimo: 10001,
        maximo: 50000000,
      },
    ],
    fieldsToFilter: [
      {
        field:"ESTUDIANTESMATRICULADOS",
        label: 'Matriculados'
      },
      {
        field:"ESTUDIANTESDESERTORES",
        label: 'Desertores'
      },
      {
        field:"ESTUDIANTESAPROBADOS",
        label: 'Aprobados'
      },
      {
        field:"ESTUDIANTESREPROBADOS",
        label: 'Reprobados'
      },
    ],
  },
  Tasa_analfabetismo_departamental: {
    leyenda: [
      {
        colorFondo: "252,3,3,0.4",
        colorLine: "252,3,3,1",
        label: "0 a 1000",
        minimo: 0,
        maximo: 1000,
      },
      {
        colorFondo: "246,254,6,0.4",
        colorLine: "246,254,6,1",
        label: "1001 a 5000",
        minimo: 1001,
        maximo: 5000,
      },
      {
        colorFondo: "81,175,51,0.4",
        colorLine: "81,175,51,1",
        label: "Mayor a 5000",
        minimo: 5001,
        maximo: 50000000,
      },
    ],
    fieldsToFilter: [{ field: "TOTALDEPTO", label: "Total Departamento" }],
  },
  Tasa_analfabetismo_municipal: {
    leyenda: [
      {
        colorFondo: "252,3,3,0.4",
        colorLine: "252,3,3,1",
        label: "0 a 1000",
        minimo: 0,
        maximo: 1000,
      },
      {
        colorFondo: "246,254,6,0.4",
        colorLine: "246,254,6,1",
        label: "1001 a 5000",
        minimo: 1001,
        maximo: 5000,
      },
      {
        colorFondo: "81,175,51,0.4",
        colorLine: "81,175,51,1",
        label: "Mayor a 5000",
        minimo: 5001,
        maximo: 50000000,
      },
    ],
    fieldsToFilter: [{ field: "TOTALMUNICIPIO", label: "Total Municipio" }],
  },


};

const Widget_SocioEconomica = (props: AllWidgetProps<any>) => {
  /**
   * Estado para almacenar la referencia a la vista del mapa de Jimu.
   * @type {[JimuMapView | undefined, Function]}
   */
  const [varJimuMapView, setJimuMapView] = React.useState<JimuMapView>()
  
  const [loading, setLoading] = React.useState(false)
  
  const [error, setError] = React.useState("")
  const widgetResultId = WIDGET_IDS.RESULT // ID del widget de resultados en el layout

  const [consultaPorSeleccionada, setConsultaPorSeleccionada] = React.useState< interfaceConsultaPor | null>({name: "", id: null, url: ""})
  
  
  const [selectedIndicador, setSelectedIndicador] = React.useState<number | null>(null)
  
  const [selectedAnio, setSelectedAnio] = React.useState<string | null>(null)
  
  const [selectedEstablecimiento, setSelectedEstablecimiento] = React.useState<interfaceEstablecimiento | null>(null)
  
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

  /**
     * Extent inicial del mapa.
     * Se guarda al cargar el widget para poder restaurar
     * la vista original posteriormente.
  */
  const initialExtentRef = React.useRef<__esri.Extent | null>(null)

  const handleConsultaPor = async(e: { target: { value: string; }; }) => {
    if (e.target.value === "") return
    handleClear()
    const id = Number(e.target.value)
    const selected = consultaPor.find(c => c.id === id)
    if(validaLoggerLocalStorage('logger'))  console.log({selected})
    setConsultaPorSeleccionada(selected)
    setLoading(true)
    const response = await realizarQuery(selected.url, selected.name)
    //  poblar el campo categoria con la información presente en response.layers 
    if (response && response.layers) {
      if(selected.name === INDICADORES.ConsultaEducacion){
        const categories = response.layers.map((layer: LayerInfo) => ({ id: layer.id, name: layer.name }))
        //categories ordenadas por name alfabeticamente
        categories.sort((a: interfaceCategories, b: interfaceCategories) => a.name.localeCompare(b.name))
        if(validaLoggerLocalStorage('logger'))  console.log({categories})
        
      }else if(selected.name === INDICADORES.ConsultaPorIndicadores){
        response.layers.forEach((layer: LayerInfo, index: number) => {
          layer.nameOriginal = layer.name
          if (index < NAMES.length) {
            layer.name = NAMES[index]
          }
        })
        // ordena los layer y los filtra para mostrar solo los que están definidos en NAMES, y poblar el campo indicadores con esta información
        const filteredIndicadoresList = response.layers.reduce<{ id: number, name: string }[]>((acc, layer: LayerInfo) => {
          const name = layer.name || layer.nameOriginal
          if (name !== NAMES[0] && name !== NAMES[4] && name !== NAMES[5]) acc.push({ id: layer.id, name })
          return acc
        }, [])
        
        if(validaLoggerLocalStorage('logger'))  console.log({filteredIndicadoresList})
      }
    }
  }
  
  const realizarQuery = async (url: string, name: string) => {
    setError("")
    try {
      const response = await loadLayers(url)
      if(validaLoggerLocalStorage('logger')) console.log({ response, url, name })
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
    
    setConsultaPorSeleccionada({name: "", id: null, url: ""})
    
    setSelectedEstablecimiento(null)
    
    setSelectedIndicador(null)
    setSelectedAnio(null)
  }

  /**
   * Efecto que limpia el punto y restaura la vista inicial cuando el widget se cierra.
   */
  React.useEffect(() => {
    if (props.state === 'CLOSED') {
      handleClear()
    } 
    
    
  }, [props])


  const buscar = async () => {
    if (!selectedEstablecimiento && !selectedIndicador) {
      setError("Por favor seleccione un establecimiento o un indicador para realizar la búsqueda.")
      return
    }
    setLoading(true)
    // limpiar geometrías previamente dibujadas
    varJimuMapView?.view?.graphics?.removeAll()
    let urlCapa, campos, where
    

    const features = await ejecutarConsulta({ returnGeometry: true, campos, url: urlCapa, where })
    
    // si la longitud de los features obtenidos es menor a 1, mostrar mensaje de error indicando que no se encontraron resultados para la consulta realizada
    if (features.length < 1) {
      setError("No se encontraron resultados para la consulta realizada.")
      setLoading(false)
      return
    }
    // ir al extend inicial del mapa para mostrar todos los resultados obtenidos
    restoreInitialExtent(varJimuMapView, initialExtentRef)
    // dibujar los features obtenidos en el mapa
    const esCoropletico = consultaPorSeleccionada?.name === INDICADORES.ConsultaPorIndicadores && (selectedIndicador === 1 || selectedIndicador === 2 || selectedIndicador === 3 || selectedIndicador === 4 || selectedIndicador === 5) // el indicador "cobertura", "cupos ofertados", "eficiencia interna", "tasa de analfabetismo departamental" y "tasa de analfabetismo municipal" se representan con coropletico    

    let camposResultados,_cloneFeatures, withGraphic={
        showGraphic: false,
        graphicData: [
            { name: "ejemplo_1", value: 65 },
            { name: "ejemplo_2", value: 80 },
            { name: "ejemplo_3", value: features.length }
        ],
        graphicType: "bar",
        graphicTitle: 'Gráfico de ejemplo',
        selectedIndicador,
        dataCoropletico: {},
        fieldToFilter:''
    }
    
    // abrir el widget de resultados y mostrar la información del establecimiento seleccionado
    abrirTablaResultados(
      _cloneFeatures,
      camposResultados,
      props,
      widgetResultId,
      varJimuMapView.view.spatialReference,      
      withGraphic,
      false,
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


              
              {/* BOTONES */}
              <SearchActionBar
                  onSearch={buscar}
                  onClear={handleClear}
                  loading={loading}
                  // disableSearch={!isValid || disabled}
                  helpText="Seleccione un establecimiento desde consulta educación o un indicador para habilitar la búsqueda"
                  searchLabel="Buscar"
                  error={error}
              />
            </div>
            

            {loading && <OurLoading />}

          </div>
        )
      }
    </div>
  )
}

export default Widget_SocioEconomica