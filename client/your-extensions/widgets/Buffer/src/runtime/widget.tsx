import { appActions, getAppStore, type AllWidgetProps } from 'jimu-core'
import React from 'react'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Option, Select, TextInput } from 'jimu-ui'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import Polyline from '@arcgis/core/geometry/Polyline'
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine'
import { urls } from '../../../api/serviciosQuindio'
import { getDataTablaContenido } from '../../../tablaDeContenido2/src/runtime/widget'
import type { CapasTematicas } from '../../../tablaDeContenido2/src/types/interfaces'
import { SearchActionBar } from '../../../shared/components/search-action-bar'

// @ts-expect-error - No se encuentran tipos de la API de ArcGIS, se asume que están disponibles globalmente en runtime.
import '../styles/styles.css'
import { validaLoggerLocalStorage } from '../../../shared/utils/export.utils'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { useSelector } from 'react-redux'

/**
 * Opcion renderizada en controles tipo select.
 */
interface SelectOption {
  /** Valor interno de la opcion. */
  value: string
  /** Texto visible de la opcion. */
  label: string
}

/**
 * Item de capa listo para usarse en UI y manejo de mapa.
 */
interface CapaOption extends SelectOption {
  /** URL final de FeatureLayer (MapServer/<layerId>). */
  layerUrl: string
}

/**
 * Diccionario de conversion de unidad UI a unidad ArcGIS.
 */
const UNIT_TO_ARCGIS: { [key: string]: __esri.LinearUnits } = {
  Metros: 'meters',
  Kilometros: 'kilometers'
}

/**
 * Construye una etiqueta para tematicas/subtematicas/capas.
 *
 * @param item Nodo de la tabla de contenido.
 * @param fallback Texto por defecto cuando no exista nombre.
 * @returns Etiqueta normalizada para mostrar en un select.
 */
const getNodeLabel = (item: CapasTematicas, fallback: string) => {
  return String(item.TITULOCAPA || item.NOMBRETEMATICA || item.NOMBRECAPA || fallback)
}

/**
 * Construye la URL final de una capa usando la estructura de tematicas.
 *
 * @param item Nodo de capa proveniente de la tabla de contenido.
 * @returns URL de layer para FeatureLayer o cadena vacia si no se puede construir.
 */
const buildLayerUrl = (item: CapasTematicas) => {
  const baseUrl = String(item.URL || '').trim()
  const serviceLayerId = String(item.NOMBRECAPA || item.IDCAPA || '').trim()

  if (!baseUrl) return ''
  if (!serviceLayerId) return baseUrl

  return `${baseUrl}/${serviceLayerId}`
}

/**
 * Convierte a numero una entrada de distancia con fallback seguro.
 *
 * @param value Valor ingresado por el usuario.
 * @returns Distancia numerica valida, o 0 cuando la entrada no sea valida.
 */
const toPositiveDistance = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/**
 * Widget Buffer.
 *
 * Carga tematicas para poblar controles de Temas/Subtemas/Capas,
 * agrega la capa seleccionada al mapa y permite dibujar geometria
 * de punto o linea para generar su respectivo buffer.
 *
 * @param props Propiedades estandar de Experience Builder.
 * @returns Vista del widget.
 */
const Widget = (props: AllWidgetProps<any>) => {

  if(validaLoggerLocalStorage('logger')) console.log('WidgetBuffer ID:', {id:props.id, props, TABLA_DE_CONTENIDO:WIDGET_IDS.TABLA_DE_CONTENIDO})

  const dataFromTablaDeContenido: { task: string, temas?: CapasTematicas[] } | null = useSelector(
      (state: any) =>
          state.widgetsState?.[props.id]?.fromTablaDeContenido2 ?? null
  )

  /** Vista activa del mapa seleccionada en el builder. */
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)
  /** Estructura completa de tematicas obtenida desde tabla de contenido. */
  const [tematicas, setTematicas] = React.useState<CapasTematicas[]>([])

  /** Identificador de tema seleccionado. */
  const [temaValue, setTemaValue] = React.useState('')
  /** Identificador de subtema seleccionado. */
  const [subtemaValue, setSubtemaValue] = React.useState('')
  /** Identificador de capa seleccionada. */
  const [capaValue, setCapaValue] = React.useState('')

  /** Distancia del buffer en unidad de usuario. */
  const [distancia, setDistancia] = React.useState('500')
  /** Unidad seleccionada para el buffer. */
  const [unidad, setUnidad] = React.useState('Metros')

  /** Modo de dibujo activo sobre el mapa. */
  const [drawMode, setDrawMode] = React.useState<'point' | 'line' | null>(null)
  /** Mensaje de error para la barra de acciones. */
  const [actionError, setActionError] = React.useState('')

  /** Referencia al GraphicsLayer temporal de dibujo y buffer. */
  const graphicsLayerRef = React.useRef<GraphicsLayer | null>(null)
  /** Referencia al FeatureLayer de la capa seleccionada en el formulario. */
  const activeLayerRef = React.useRef<FeatureLayer | null>(null)
  /** Primer punto capturado para dibujo de linea. */
  const lineStartPointRef = React.useRef<__esri.Point | null>(null)

  React.useEffect(() => {
    if (dataFromTablaDeContenido?.task === 'returnToTemas') {
      if(validaLoggerLocalStorage('logger')) console.log('Data recibida en Buffer:', {dataFromTablaDeContenido, TABLA_DE_CONTENIDO_WIDGET_ID: WIDGET_IDS.TABLA_DE_CONTENIDO})
      console.log(dataFromTablaDeContenido.temas)

    }
  }, [dataFromTablaDeContenido])

  /**
   * Carga tematicas usando el mismo mecanismo del widget tablaDeContenido2.
   */
  React.useEffect(() => {

    getAppStore().dispatch(
        appActions.widgetStatePropChange(
            WIDGET_IDS.BUFFER, // ID del widget destino, debe ser un widget que esté abierto en el layout para recibir los datos
            'fromBuffer', // Nombre de la propiedad que se va a crear/actualizar en el estado del widget
            {
                task: 'backToTemas',
            }
        )
    )

    /* const loadTematicas = async () => {
      const result = await getDataTablaContenido({
        urls: {
          SERVICIO_TABLA_CONTENIDO: urls.SERVICIO_TABLA_CONTENIDO
        }
      })

      if (Array.isArray(result)) {
        setTematicas(result)
      }
    }

    void loadTematicas() */
  }, [])

  /**
   * Crea (si es necesario) la capa temporal donde se dibujan geometria y buffer.
   */
  React.useEffect(() => {
    const view = jimuMapView?.view
    if (!view) return

    const existing = view.map.findLayerById('buffer-graphics-layer') as GraphicsLayer
    if (existing) {
      graphicsLayerRef.current = existing
      return
    }

    const graphicsLayer = new GraphicsLayer({
      id: 'buffer-graphics-layer',
      title: 'Buffer temporal'
    })

    view.map.add(graphicsLayer)
    graphicsLayerRef.current = graphicsLayer

    return () => {
      if (view.map.findLayerById(graphicsLayer.id)) {
        view.map.remove(graphicsLayer)
      }
      graphicsLayerRef.current = null
    }
  }, [jimuMapView])

  /**
   * Opciones del campo Temas construidas desde la data de tematicas.
   */
  const temaOptions = React.useMemo<SelectOption[]>(() => {
    return tematicas.map((item, index) => ({
      value: String(item.IDTEMATICA ?? index),
      label: getNodeLabel(item, `Tema ${index + 1}`)
    }))
  }, [tematicas])

  /**
   * Nodo de tema actualmente seleccionado.
   */
  const selectedTema = React.useMemo(() => {
    const index = temaOptions.findIndex(option => option.value === temaValue)
    return index > -1 ? tematicas[index] : null
  }, [temaOptions, temaValue, tematicas])

  /**
   * Subtemas del tema seleccionado para poblar el control Subtemas.
   */
  const subtemaNodes = React.useMemo<CapasTematicas[]>(() => {
    return Array.isArray(selectedTema?.capasHijas) ? selectedTema.capasHijas : []
  }, [selectedTema])

  /**
   * Opciones del campo Subtemas.
   */
  const subtemaOptions = React.useMemo<SelectOption[]>(() => {
    return subtemaNodes.map((item, index) => ({
      value: String(item.IDTEMATICA ?? index),
      label: getNodeLabel(item, `Subtema ${index + 1}`)
    }))
  }, [subtemaNodes])

  /**
   * Nodo de subtema seleccionado.
   */
  const selectedSubtema = React.useMemo(() => {
    const index = subtemaOptions.findIndex(option => option.value === subtemaValue)
    return index > -1 ? subtemaNodes[index] : null
  }, [subtemaOptions, subtemaValue, subtemaNodes])

  /**
   * Opciones del campo Capas derivadas del subtema seleccionado.
   */
  const capaOptions = React.useMemo<CapaOption[]>(() => {
    const capaNodes = Array.isArray(selectedSubtema?.capasNietas) ? selectedSubtema.capasNietas : []

    return capaNodes
      .map((item: CapasTematicas, index: number) => {
        const layerUrl = buildLayerUrl(item)
        return {
          value: String(item.IDCAPA ?? item.NOMBRECAPA ?? index),
          label: getNodeLabel(item, `Capa ${index + 1}`),
          layerUrl
        }
      })
      .filter((item: { layerUrl: any }) => Boolean(item.layerUrl))
  }, [selectedSubtema])

  /**
   * Opcion de capa seleccionada.
   */
  const selectedCapa = React.useMemo(() => {
    return capaOptions.find(item => item.value === capaValue) ?? null
  }, [capaValue, capaOptions])

  /**
   * Agrega/remueve la capa seleccionada al mapa para gestion visual del usuario.
   */
  React.useEffect(() => {
    const view = jimuMapView?.view
    if (!view) return

    if (activeLayerRef.current && view.map.findLayerById(activeLayerRef.current.id)) {
      view.map.remove(activeLayerRef.current)
      activeLayerRef.current = null
    }

    if (!selectedCapa?.layerUrl) return

    try {
      const layer = new FeatureLayer({
        id: 'buffer-active-layer',
        title: `Capa activa: ${selectedCapa.label}`,
        url: selectedCapa.layerUrl,
        visible: true
      })

      view.map.add(layer)
      activeLayerRef.current = layer
    } catch (error) {
      console.error('No fue posible cargar la capa seleccionada en Buffer:', error)
    }

    return () => {
      if (activeLayerRef.current && view.map.findLayerById(activeLayerRef.current.id)) {
        view.map.remove(activeLayerRef.current)
      }
      activeLayerRef.current = null
    }
  }, [jimuMapView, selectedCapa])

  /**
   * Reinicia los controles dependientes cuando cambia Tema.
   */
  const onTemaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTemaValue(event.target.value)
    setSubtemaValue('')
    setCapaValue('')
  }

  /**
   * Reinicia el control de capas cuando cambia Subtema.
   */
  const onSubtemaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSubtemaValue(event.target.value)
    setCapaValue('')
  }

  /**
   * Almacena la capa seleccionada.
   */
  const onCapaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCapaValue(event.target.value)
  }

  /**
   * Cambia el modo de dibujo seleccionado desde el formulario.
   */
  const onDrawModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as 'point' | 'line' | ''
    setDrawMode(nextMode || null)
    setActionError('')
  }

  /**
   * Limpia geometrias dibujadas y estado temporal de interaccion.
   */
  const clearDrawings = React.useCallback(() => {
    lineStartPointRef.current = null
    graphicsLayerRef.current?.removeAll()
  }, [])

  /**
   * Dibuja la geometria base y su buffer en el GraphicsLayer temporal.
   *
   * @param geometry Geometria base (punto o linea) capturada sobre el mapa.
   */
  const drawBuffer = React.useCallback((geometry: __esri.Geometry) => {
    const view = jimuMapView?.view
    const graphicsLayer = graphicsLayerRef.current
    const distanceValue = toPositiveDistance(distancia)
    const unitCode = UNIT_TO_ARCGIS[unidad] || 'meters'

    if (!view || !graphicsLayer || distanceValue <= 0) return

    const bufferGeometry = geometryEngine.buffer(geometry, distanceValue, unitCode) as __esri.Geometry

    if (!bufferGeometry) return

    graphicsLayer.removeAll()

    const sourceGraphic = new Graphic({
      geometry,
      symbol: geometry.type === 'point'
        ? {
            type: 'simple-marker',
            color: [220, 40, 40, 1],
            size: 9,
            outline: { color: [255, 255, 255, 1], width: 1 }
          }
        : {
            type: 'simple-line',
            color: [220, 40, 40, 1],
            width: 2
          }
    })

    const bufferGraphic = new Graphic({
      geometry: bufferGeometry,
      symbol: {
        type: 'simple-fill',
        color: [255, 128, 0, 0.25],
        outline: {
          type: 'simple-line',
          color: [255, 128, 0, 1],
          width: 2
        }
      }
    })

    graphicsLayer.addMany([bufferGraphic, sourceGraphic])

    if (bufferGeometry.extent) {
      void view.goTo(bufferGeometry.extent.expand(1.2))
    }
  }, [distancia, unidad, jimuMapView])

  /**
   * Gestiona capturas de clic sobre el mapa segun el modo de dibujo activo.
   */
  React.useEffect(() => {
    const view = jimuMapView?.view
    if (!view || !drawMode) return

    view.container.style.cursor = 'crosshair'

    const handle = view.on('click', (event: { mapPoint: __esri.Geometry }) => {
      if (drawMode === 'point') {
        drawBuffer(event.mapPoint)
        return
      }

      if (drawMode === 'line') {
        if (!lineStartPointRef.current) {
          lineStartPointRef.current = event.mapPoint
          return
        }

        const lineGeometry = new Polyline({
          paths: [[
            [lineStartPointRef.current.x, lineStartPointRef.current.y],
            [event.mapPoint.x, event.mapPoint.y]
          ]],
          spatialReference: lineStartPointRef.current.spatialReference
        })

        drawBuffer(lineGeometry)
        lineStartPointRef.current = null
      }
    })

    return () => {
      handle.remove()
      lineStartPointRef.current = null
      view.container.style.cursor = 'default'
    }
  }, [drawMode, drawBuffer, jimuMapView])

  /**
   * Captura la vista activa del mapa.
   *
   * @param view Vista de mapa activa proveniente de JimuMapViewComponent.
   */
  const activeViewChangeHandler = (view: JimuMapView) => {
    if (!view) return
    setJimuMapView(view)
  }

  return (
    <div style={{ height: '100%', padding: '5px', boxSizing: 'border-box' }}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds?.[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}

      <div className='consulta-widget loading-host'>
        <div>
          <Label>Temas:</Label>
          <Select value={temaValue} onChange={onTemaChange}>
            <Option value=''>Seleccione...</Option>
            {temaOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>

          <Label>Subtemas:</Label>
          <Select value={subtemaValue} onChange={onSubtemaChange}>
            <Option value=''>Seleccione...</Option>
            {subtemaOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>

          <Label>Capas:</Label>
          <Select value={capaValue} onChange={onCapaChange}>
            <Option value=''>Seleccione...</Option>
            {capaOptions.map(option => (
              <Option key={`${option.value}-${option.layerUrl}`} value={option.value}>{option.label}</Option>
            ))}
          </Select>

          <Label>Distancia:</Label>
          <TextInput
            type='text'
            min='1'
            value={distancia}
            onChange={event => { setDistancia(event.target.value) }}
          />

          <Label>Unidad:</Label>
          <Select value={unidad} onChange={event => { setUnidad(event.target.value) }}>
            <Option value='Metros'>Metros</Option>
            <Option value='Kilometros'>Kilometros</Option>
          </Select>

          <Label>Modo de dibujo:</Label>
          <Select value={drawMode ?? ''} onChange={onDrawModeChange}>
            <Option value=''>Seleccione...</Option>
            <Option value='point'>Punto</Option>
            <Option value='line'>Linea</Option>
          </Select>

          <SearchActionBar
            onSearch={() => {
              if (!drawMode) {
                setActionError('Seleccione un modo de dibujo antes de activar.')
                return
              }
              setActionError('')
            }}
            onClear={() => {
              setDrawMode(null)
              setActionError('')
              clearDrawings()
            }}
            disableSearch={!drawMode}
            helpText='Seleccione modo de dibujo y haga clic en Buscar para habilitar la captura en el mapa.'
            error={actionError}
            searchLabel='Buscar'
            clearLabel='Limpiar'
          />

          {drawMode === 'line' && (
            <p className='buffer-widget__hint'>Para linea: haga clic en dos puntos del mapa.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Widget
