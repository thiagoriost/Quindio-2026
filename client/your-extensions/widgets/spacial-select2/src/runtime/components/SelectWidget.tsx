import React, { useEffect, useRef, useState } from 'react'
import { loadModules } from 'esri-loader'
import { Point, Polygon, Polyline } from '@arcgis/core/geometry'

let idLastGraphicDeployedTest = ''
let clickHandler = null

/**
 * Componente SelectWidget
 * @param {Object} props - Propiedades del componente
 */
const SelectWidget = ({ props }) => {
  const [drawing, setDrawing] = useState(false)
  const [mostrarResultadoFeaturesConsulta, setMostrarResultadoFeaturesConsulta] = useState(false)
  const [widgetModules, setWidgetModules] = useState(null)
  const [rows, setRows] = useState<Row[]>([])
  const [columns, setColumns] = useState<InterfaceColumns[]>([])
  const [lastGeometriDeployed, setLastGeometriDeployed] = useState()
  const [LayerSelectedDeployed, setLayerSelectedDeployed] = useState(null)
  // const [graphicsLayerDeployed, setGraphicsLayerDeployed] = useState(null)
  const [selectedLayerId, setSelectedLayerId] = useState(null)
  const [layers, setLayers] = useState([])
  const [mensajeModal, setMensajeModal] = useState<interfaceMensajeModal>({
    deployed: false,
    type: typeMSM.info,
    tittle: '',
    body: '',
    subBody: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const startPointRef = useRef(null)
  const endPointRef = useRef(null)
  const graphicsLayerRef = useRef(null)

  /**
   * Maneja el clic en el mapa
   * @param {Object} Graphic - Módulo Graphic de ArcGIS
   * @param {Object} event - Evento de clic en el mapa
   * @param {Object} Extent - Módulo Extent de ArcGIS
   */
  const handleMapClick = (Graphic, event, Extent) => {
    if (!drawing || !selectedLayerId) return
    console.log('click to start')
    if (!startPointRef.current) {
      startPointRef.current = event.mapPoint
    } else {
      setIsLoading(true)
      endPointRef.current = event.mapPoint
      drawRectangle(Graphic)
      queryFeatures(Extent)
      clickHandler.remove()
      startPointRef.current = null
      props.jimuMapView.view.container.style.cursor = 'default'
    }
  }

  /**
   * Dibuja un rectángulo en el mapa
   * @param {Object} Graphic - Módulo Graphic de ArcGIS
   */
  const drawRectangle = (Graphic) => {
    const startPoint = startPointRef.current
    const endPoint = endPointRef.current
    const extent = {
      xmin: Math.min(startPoint.x, endPoint.x),
      ymin: Math.min(startPoint.y, endPoint.y),
      xmax: Math.max(startPoint.x, endPoint.x),
      ymax: Math.max(startPoint.y, endPoint.y),
      spatialReference: startPoint.spatialReference
    }

    const rectangleGraphic = new Graphic({
      geometry: { type: 'extent', ...extent },
      symbol: {
        type: 'simple-fill',
        color: [51, 51, 204, 0.5],
        style: 'solid',
        outline: { color: 'white', width: 1 }
      }
    })

    graphicsLayerRef.current.add(rectangleGraphic)

    setTimeout(() => {
      graphicsLayerRef.current.remove(rectangleGraphic)
    }, 1000)
  }

  /**
   * Consulta las características dentro del rectángulo dibujado
   * @param {Object} Extent - Módulo Extent de ArcGIS
   */
  const queryFeatures = async (Extent) => {
    console.log('queryFeatures')
    const startPoint = startPointRef.current
    const endPoint = endPointRef.current
    const extent = new Extent({
      xmin: Math.min(startPoint.x, endPoint.x),
      ymin: Math.min(startPoint.y, endPoint.y),
      xmax: Math.max(startPoint.x, endPoint.x),
      ymax: Math.max(startPoint.y, endPoint.y),
      spatialReference: startPoint.spatialReference
    })

    /* const layersMaps = props.jimuMapView.view.layerViews.items.filter(
      (e: { layer: { parsedUrl: string; }; }) => e.layer.parsedUrl && e.layer.parsedUrl !== 'https://sigquindio.gov.co/arcgis/rest/services/QUINDIO_III/CartografiaBasica/MapServer/74'
    ); */

    // const lastLayer = layersMaps[layersMaps.length - 1];
    // const layer = props.jimuMapView.view.map.findLayerById(lastLayer.layer.id);
    const layer = props.jimuMapView.view.map.findLayerById(selectedLayerId)

    const query = layer.createQuery()
    query.geometry = extent
    query.spatialRelationship = 'intersects'
    query.returnGeometry = true
    query.outFields = ['*']

    const resp = await layer.queryFeatures(query)
    if (resp.features.length < 1) return
    const DataOrderToRows = ordenarDataRows(resp)
    setRows(DataOrderToRows.filas)
    setColumns(DataOrderToRows.dataGridColumns)
    setTimeout(() => {
      setMostrarResultadoFeaturesConsulta(true)
    }, 10)
    drawFeaturesOnMap(resp)
  }

  /**
   * Dibuja las características en el mapa
   * @param {Object} response - Respuesta de la consulta de características
   */
  const drawFeaturesOnMap = async (response) => {
    const { features, spatialReference } = response
    if (!props.jimuMapView || features.length === 0) return
    if (idLastGraphicDeployedTest) {
      props.jimuMapView.view.map.remove(props.jimuMapView.view.map.findLayerById(idLastGraphicDeployedTest))
    }

    const [GraphicsLayer, PopupTemplate, SimpleFillSymbol, SimpleLineSymbol, Graphic, SimpleMarkerSymbol] = await loadModules(
      ['esri/layers/GraphicsLayer', 'esri/PopupTemplate', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Graphic', 'esri/symbols/SimpleMarkerSymbol'],
      { url: 'https://js.arcgis.com/4.29/' }
    )

    const graphicsLayer = new GraphicsLayer()
    let geometryType = null

    features.forEach((feature) => {
      geometryType = feature.geometry.type
      const popupTemplate = new PopupTemplate({
        title: 'Feature Info',
        content: `
          <ul>
            ${Object.keys(feature.attributes).map(key => `<li><strong>${key}:</strong> ${feature.attributes[key]}</li>`).join('')}
          </ul>
        `
      })

      let symbol = null; let geometry = null

      if (feature.geometry.type === 'point') {
        geometry = new Point({ x: feature.geometry.x, y: feature.geometry.y, spatialReference })
        const outline = new SimpleLineSymbol({ color: [255, 255, 0], width: 1 })
        symbol = new SimpleMarkerSymbol({ color: [255, 0, 0], outline, size: '8px' })
      } else if (feature.geometry.type === 'polyline') {
        geometry = new Polyline({ paths: feature.geometry.paths, spatialReference })
        symbol = { type: 'simple-fill', color: 'orange', outline: { color: 'magenta', width: 0.5 } }
      } else if (feature.geometry.type === 'polygon') {
        geometry = new Polygon({ rings: feature.geometry.rings, spatialReference })
        symbol = new SimpleFillSymbol({ color: 'blue', outline: new SimpleLineSymbol({ color: 'darkblue', width: 0.5 }) })
      }

      const graphic = new Graphic({ geometry, symbol, attributes: feature.attributes, popupTemplate })
      graphicsLayer.add(graphic)
    })

    props.jimuMapView.view.map.add(graphicsLayer)
    setLayerSelectedDeployed(graphicsLayer)
    // setLastGeometriDeployed(graphicsLayer);
    idLastGraphicDeployedTest = graphicsLayer.id
    props.jimuMapView.view.goTo({
      target: graphicsLayer.graphics.items[0].geometry,
      zoom: geometryType === 'polygon' ? 10 : geometryType === 'polyline' ? 10 : 15
    })

    setDrawing(false)
    setTimeout(() => {
      console.log('out loading')
      setIsLoading(false)
    }, 3000)
  }

  /**
   * Limpia la capa de gráficos
   */
  const clearGraphicsLayer = () => {
    console.log('5555')
    setSelectedLayerId(null)
    if (idLastGraphicDeployedTest) {
      const layer = props.jimuMapView.view.map.findLayerById(idLastGraphicDeployedTest)
      props.jimuMapView.view.map.remove(layer)
      props.jimuMapView.view.goTo(props.jimuMapView.view.extent)
      idLastGraphicDeployedTest = ''
      props.jimuMapView.view.container.style.cursor = 'default'
    }
  }

  /**
   * Alterna el estado de dibujo
   */
  const toggleDrawing = () => {
    if (selectedLayerId) {
      setDrawing(!drawing)
    } else {
      setMensajeModal({
        deployed: true,
        type: typeMSM.info,
        tittle: 'Recuerda',
        body: 'Primero seleccionar la capa sobre la que vas operar'
      }
      )
    }
  }

  /**
   * capturas las capas que tienen title para ser desplegadas en el select de capas
   */
  const seeLayers = () => {
    console.log(props.jimuMapView.view.layerViews.items)
    const layerWitTitle = props.jimuMapView.view.map.layers.items.filter(l => l.title)
    setLayers(layerWitTitle)
  }

  /**
   * captura la capa en la cual se va arealizar el select de geometrías
   * @param event
   */
  const handleLayerChange = (event) => {
    setSelectedLayerId(event.target.value)
  }

  /**
   * Se encarga de activar la función de select iniciando el dibujado del rectangulo,
   * cambia el tipo del cursor
   */
  useEffect(() => {
    if (!props.jimuMapView || !drawing) return

    loadModules(['esri/Graphic', 'esri/layers/GraphicsLayer', 'esri/geometry/Extent'], { url: 'https://js.arcgis.com/4.29/' })
      .then(([Graphic, GraphicsLayer, Extent]) => {
        const graphicsLayer = new GraphicsLayer()
        props.jimuMapView.view.map.add(graphicsLayer)
        graphicsLayerRef.current = graphicsLayer

        const handleClick = (event) => {
          if (drawing) {
            handleMapClick(Graphic, event, Extent)
          }
        }
        props.jimuMapView.view.container.style.cursor = 'crosshair'
        clickHandler = props.jimuMapView.view.on('click', handleClick)
      })
      .catch(err => { console.error('Error loading ArcGIS modules:', err) })

    return () => {
      if (clickHandler) {
        clickHandler.remove()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing])

  /**
   * captura cambios en el mapa para actualizar el listado de capas
   */
  useEffect(() => {
    if (props.jimuMapView) {
      const updateLayers = () => {
        console.log('updateLayers', props.jimuMapView.view.map.layers.items)
        const layerWitTitle = props.jimuMapView.view.map.layers.items.filter(l => l.title)
        setLayers(layerWitTitle)
      }
      updateLayers()
      const layerWatcher = props.jimuMapView.view.map.layers.watch('change', updateLayers)
      return () => {
        layerWatcher.remove()
      }
    }

  }, [props.jimuMapView])

  /**
   * carga el modulo de widgets y refresca las capas a ser desplegadas en el select
   */
  useEffect(() => {
    import('../../../../commonWidgets/widgetsModule').then(modulo => { setWidgetModules(modulo) })
    seeLayers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-100 p-3" style={{ backgroundColor: 'var(--sys-color-primary)' }}>

      {
        mostrarResultadoFeaturesConsulta
          ? widgetModules.TABLARESULTADOS({
            rows,
            columns,
            jimuMapView: props.jimuMapView,
            lastGeometriDeployed,
            LayerSelectedDeployed,
            // graphicsLayerDeployed,
            setLastGeometriDeployed,
            setMostrarResultadoFeaturesConsulta
          })
          : <>

              <select onChange={handleLayerChange} value={selectedLayerId || ''} className='w-100'>
                <option value='' disabled>Seleccione una capa</option>
                {layers.map(layer => (
                  <option key={layer.id} value={layer.id}>{layer.title || layer.id}</option>
                ))}
              </select>
              <div className='fila mt-1 mb-1'>
                {
                  selectedLayerId &&
                  <>
                    <button onClick={toggleDrawing}>
                      {drawing ? 'Detener selección' : 'Iniciar selección'}
                    </button>
                    <button onClick={clearGraphicsLayer}>
                      Limpiar selección
                    </button>
                  </>
                }
                {
                  rows.length > 0 &&
                    <button onClick={() => { setMostrarResultadoFeaturesConsulta(true) }}>
                      Mostrar Resultados
                    </button>
                }
                <button onClick={seeLayers}>
                 Actualizar Capas
                </button>
              </div>
              {
                drawing &&
                <p style={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }} >Haga clic en el mapa para capturar el primer punto y luego haga clic nuevamente para capturar el segundo punto.</p>
              }
            </>
      }
      {
        widgetModules?.MODAL(mensajeModal, setMensajeModal)
      }
      {
        isLoading && widgetModules?.OUR_LOADING()
      }
    </div>
  )
}

export default SelectWidget

/**
 * segun los features obtenidos de la consulta, ordena la data para obtener las filas y las columnas del
 * data grid
 * @param {features}
 * @returns {filas, dataGridColumns}
 */
const ordenarDataRows = ({ features }) => {
  const dataGridColumns = Object.keys(features[0].attributes).map(key => ({ key: key, name: key }))
  const filas = features.map(({ attributes, geometry }) => ({ ...attributes, geometry }))
  console.log(dataGridColumns)
  console.log(filas)
  return { filas, dataGridColumns }
}

export interface Row {
  id: number
  title: string
  geometry?: InterfaceGeometry
}

export interface InterfaceGeometry {
  rings: number[][][]
}

export interface InterfaceColumns {
  key: string
  name: string
}

export interface interfaceMensajeModal {
  deployed: boolean
  type: typeMSM
  tittle: string
  body: string
  subBody?: string
}

export enum typeMSM {
  success = 'success',
  info = 'info',
  error = 'error',
  warning = 'warning',
}
