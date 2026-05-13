import { appActions, getAppStore, type AllWidgetProps } from 'jimu-core'
import React from 'react'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Option, Select, TextInput } from 'jimu-ui'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import Polyline from '@arcgis/core/geometry/Polyline'
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine'
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
 * Campos de texto usados para construir etiquetas legibles.
 */
interface LabelSource {
  /** Nombre del tema o subtema. */
  NOMBRETEMATICA?: string
  /** Nombre de la capa. */
  NOMBRECAPA?: string
  /** Titulo alterno de la capa. */
  TITULOCAPA?: string
}

/**
 * Nodo de capa final del árbol de contenido.
 */
interface BufferCapaNode {
  /** Nombre de la capa. */
  NOMBRECAPA?: string
  /** Nombre legible alterno. */
  TITULOCAPA?: string
  /** URL del servicio/capa. */
  URL?: string

}

/**
 * Nodo de subtema del árbol de contenido.
 */
interface BufferSubtemaNode {
  /** Nombre del subtema. */
  NOMBRETEMATICA?: string
  /** Nombre legible alterno. */
  TITULOCAPA?: string
  /** Capa hija asociada al subtema. */
  capasNietas?: BufferCapaNode[]

}

/**
 * Nodo de tema del árbol de contenido.
 */
interface BufferTemaNode {
  /** Nombre del tema. */
  NOMBRETEMATICA?: string
  /** Nombre legible alterno. */
  TITULOCAPA?: string
  /** Subtemas asociados al tema. */
  capasHijas?: BufferSubtemaNode[]
}

/**
 * Carga útil recibida desde el widget de tabla de contenido.
 */
interface TablaDeContenidoPayload {
  /** Identifica la acción emitida por el widget origen. */
  task: string
  /** Árbol de temas, subtemas y capas disponible para llenar el formulario. */
  temas?: BufferTemaNode[]
}

/**
 * Opción de select que conserva el nodo original para resolver dependencias.
 */
interface NodeOption<T> extends SelectOption {
  /** Nodo asociado a la opción. */
  node: T
}

/**
 * Item de capa listo para usarse en UI y manejo de mapa.
 */
interface CapaOption extends NodeOption<BufferCapaNode> {
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
const getNodeLabel = (
  item: LabelSource,
  fallback: string
) => {
  return String(item.NOMBRETEMATICA ?? item.TITULOCAPA ?? item.NOMBRECAPA ?? fallback).trim()
}

/**
 * Construye la URL final de una capa usando la estructura de tematicas.
 *
 * @param item Nodo de capa proveniente de la tabla de contenido.
 * @returns URL de layer para FeatureLayer o cadena vacia si no se puede construir.
 */
const buildLayerUrl = (item: BufferCapaNode) => {
  const baseUrl = String(item.URL || '').trim()
  const serviceLayerId = String(item.NOMBRECAPA || '').trim()

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
  const dataFromTablaDeContenido: TablaDeContenidoPayload | null = useSelector(
      (state: {
        widgetsState?: { [key: string]: {
          fromTablaDeContenido2?: TablaDeContenidoPayload | null
        } | undefined }
      }) =>
          state.widgetsState?.[props.id]?.fromTablaDeContenido2 ?? null
  )

  /** Vista activa del mapa seleccionada en el builder. */
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)

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

  /**
   * Registra la carga útil recibida desde tabla de contenido para depuración local.
   * @returns {void}
   */
  React.useEffect(() => {
    if (validaLoggerLocalStorage('logger')) {
      console.log('Data recibida en Buffer:', dataFromTablaDeContenido)
    }
  }, [dataFromTablaDeContenido])

  /**
   * Temas disponibles en el formulario a partir de la carga útil del widget origen.
   */
  const temaOptions = React.useMemo<Array<NodeOption<BufferTemaNode>>>(() => {
    if (!dataFromTablaDeContenido) return []
    const temas = dataFromTablaDeContenido?.temas ?? []
    const TEMA = temas
      .map((item, index) => ({
        value:  item.NOMBRETEMATICA,
        label:  item.NOMBRETEMATICA,
        node: item
      }))
      .filter(option => Boolean(option.label))
    return TEMA
  }, [dataFromTablaDeContenido])

  /**
   * Tema actualmente seleccionado.
   */
  const selectedTema = React.useMemo(() => {
    const TEMAOPTION = temaOptions.find(option => option.value === temaValue)?.node
    return TEMAOPTION ?? null
  }, [temaOptions, temaValue])

  /**
   * Subtemas del tema seleccionado para poblar el control Subtemas.
   */
  const subtemaOptions = React.useMemo<Array<NodeOption<BufferSubtemaNode>>>(() => {
    if (!selectedTema) return []
    const subtemas = selectedTema?.capasHijas ?? []
    const SUBTEMA = subtemas
      .map((item, index) => ({
        value: item.NOMBRETEMATICA,
        label: item.NOMBRETEMATICA,
        node: item
      }))
      .filter(option => Boolean(option.label))
    return SUBTEMA
  }, [selectedTema, temaValue])

  /**
   * Nodo de subtema seleccionado.
   */
  const selectedSubtema = React.useMemo(() => {
    if (subtemaOptions.length === 0) return null
    const SUBTEMAOPTION = subtemaOptions.find(option => option.value === subtemaValue)
    return SUBTEMAOPTION
  }, [subtemaOptions, subtemaValue])

  /**
   * Opciones del campo Capas derivadas del subtema seleccionado.
   */
  const capaOptions = React.useMemo<CapaOption[]>(() => {
    if (!selectedSubtema) return []
    const capaNodes: BufferCapaNode[] = selectedSubtema.node.capasNietas ?? []

    return capaNodes
      .map((item, index) => {
        const layerUrl = buildLayerUrl(item)
        return {
          value: item.TITULOCAPA,
          label: item.TITULOCAPA,
          node: item,
          layerUrl
        }
      })
      .filter(option => Boolean(option.layerUrl))
  }, [selectedSubtema, subtemaValue])

  /**
   * Opcion de capa seleccionada.
   */
  const selectedCapa = React.useMemo(() => {
    if (capaOptions.length === 0) return null
    const CAPAOPTION = capaOptions.find(option => option.value === capaValue)
    return CAPAOPTION ?? null
  }, [capaValue, capaOptions])

  /**
   * Crea (si es necesario) la capa temporal donde se dibujan geometria y buffer.
   */
  React.useEffect(() => {
    const view = jimuMapView?.view
    if (!view) return

    const existing = view.map.findLayerById('buffer-graphics-layer') as GraphicsLayer | null
    if (existing) {
      graphicsLayerRef.current = existing
      return
    }

    getAppStore().dispatch(
        appActions.widgetStatePropChange(
            WIDGET_IDS.BUFFER, // ID del widget destino, debe ser un widget que esté abierto en el layout para recibir los datos
            'fromBuffer', // Nombre de la propiedad que se va a crear/actualizar en el estado del widget
            {
                task: 'backToTemas',
            }
        )
    )

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
    setActionError('')
  }

  /**
   * Reinicia el control de capas cuando cambia Subtema.
   */
  const onSubtemaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSubtemaValue(event.target.value)
    setCapaValue('')
    setActionError('')
  }

  /**
   * Almacena la capa seleccionada.
   */
  const onCapaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCapaValue(event.target.value)
    setActionError('')
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
  const drawBuffer = React.useCallback((geometry: __esri.GeometryUnion) => {
    const view = jimuMapView?.view
    const graphicsLayer = graphicsLayerRef.current
    const distanceValue = toPositiveDistance(distancia)
    const unitCode = UNIT_TO_ARCGIS[unidad] || 'meters'

    if (!view || !graphicsLayer || distanceValue <= 0) return

    const bufferGeometry = geometryEngine.buffer(geometry, distanceValue, unitCode) as __esri.Polygon | null

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

    const handle = view.on('click', (event: { mapPoint: __esri.Point }) => {
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
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => { setDistancia(event.target.value) }}
          />

          <Label>Unidad:</Label>
          <Select value={unidad} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => { setUnidad(event.target.value) }}>
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
