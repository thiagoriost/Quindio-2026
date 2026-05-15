import { appActions, getAppStore, type AllWidgetProps, WidgetState } from 'jimu-core'
import React from 'react'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Button, Label, Option, Select, TextInput } from 'jimu-ui'
// import { SelectLineOutlined } from 'jimu-icons/outlined/gis/select-line'
import { DataLineOutlined } from 'jimu-icons/outlined/gis/data-line'
import { SelectPointOutlined } from 'jimu-icons/outlined/gis/select-point'
import esriConfig from '@arcgis/core/config'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import Polyline from '@arcgis/core/geometry/Polyline'
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine'
import * as normalizeUtils from '@arcgis/core/geometry/support/normalizeUtils'
import * as geometryServiceRest from '@arcgis/core/rest/geometryService'
import BufferParameters from '@arcgis/core/rest/support/BufferParameters'
import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { urls } from '../../../api/serviciosQuindio'
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from '../../../widget-result/src/runtime/widget'

// @ts-expect-error - No se encuentran tipos de la API de ArcGIS, se asume que están disponibles globalmente en runtime.
import '../styles/styles.css'
import { goToInitialExtent, validaLoggerLocalStorage } from '../../../shared/utils/export.utils'
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
  /** Nombre del tema o subtema si la fuente lo reutiliza. */
  NOMBRETEMATICA?: string
  /** Nombre de la capa. */
  NOMBRECAPA?: string
  /** Nombre legible alterno. */
  TITULOCAPA?: string
  /** URL del servicio/capa. */
  URL?: string

  capasBisnietos?: BufferCapaNode[]

  capasNietas?: BufferCapaNode[]

}

/**
 * Nodo de grupo cuando un subtema organiza capas en un nivel intermedio.
 */
interface BufferGrupoNode {
  /** Nombre del grupo. */
  NOMBRETEMATICA?: string
  /** Título legible del grupo. */
  TITULOCAPA?: string
  /** Nombre alterno del grupo/capa. */
  NOMBRECAPA?: string
  /** URL opcional cuando el grupo también representa una capa. */
  URL?: string
  /** Capas de tercer nivel (bisnietos) asociadas al grupo. */
  capasBisnietos?: BufferCapaNode[]
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
  capasNietas?: BufferGrupoNode[]

  IDTEMATICAPADRE?: number

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
 * Valor permitido para atributos mostrados en la tabla de resultados.
 */
type ResultCell = string | number | boolean | null

/**
 * Fila normalizada para renderizado de tabla y publicación en widget-result.
 */
interface BufferResultRow {
  /** Identificador local para render estable en React. */
  rowId: number
  /** Atributos limpios para visualización y exportación. */
  attributes: Record<string, ResultCell>
  /** Geometría JSON opcional para navegación y visualización externa. */
  geometry?: __esri.GeometryProperties
}

/**
 * Definición de columna para tabla local de resultados.
 */
interface BufferResultField {
  /** Nombre interno del campo. */
  name: string
  /** Etiqueta visible. */
  alias: string
  /** Tipo de dato ArcGIS para exportación/tabla. */
  type: __esri.FieldProperties['type']
}

/**
 * Adaptador de GeometryService para SDK 4.x basado en API REST.
 *
 * Mantiene la firma esperada por el flujo del widget:
 * - constructor(url)
 * - buffer(BufferParameters)
 */
class GeometryService {
  /** URL base del GeometryServer. */
  url: string

  /**
   * @param url URL del servicio de geometría.
   */
  constructor (url: string) {
    this.url = url
  }

  /**
   * Ejecuta el proceso de buffer en el GeometryServer.
   *
   * @param params Parámetros del buffer.
   * @returns Geometrías resultantes del servicio.
   */
  buffer (params: BufferParameters) {
    return geometryServiceRest.buffer(this.url, params)
  }
}

/**
 * Configuración mínima de esriConfig con compatibilidad de defaults.
 */
type EsriConfigWithDefaults = typeof esriConfig & {
  defaults?: {
    geometryService?: GeometryService
  }
  geometryServiceUrl?: string
}

/**
 * Servicio de geometría único reutilizado por todo el ciclo de vida del widget.
 */
let geometryServiceSingleton: GeometryService | null = null

/**
 * Unidades lineales aceptadas por BufferParameters (REST GeometryService).
 */
type BufferLinearUnit = 'meters' | 'feet' | 'kilometers' | 'miles' | 'nautical-miles' | 'yards'

/**
 * Diccionario de conversion de unidad UI a unidad ArcGIS.
 */
const UNIT_TO_ARCGIS: { [key: string]: BufferLinearUnit } = {
  Metros: 'meters',
  Kilometros: 'kilometers'
}

/**
 * URL del GeometryServer oficial usado por el widget Buffer.
 */
const BUFFER_GEOMETRY_SERVICE_URL = urls.SERVICIO_GEOMETRIA

/**
 * Inicializa (una sola vez) y retorna el GeometryService compartido.
 *
 * Además deja configurado esriConfig.defaults.geometryService para compatibilidad
 * con implementaciones existentes y publica geometryServiceUrl para 4.x.
 *
 * @returns Instancia única de GeometryService.
 */
const getOrCreateGeometryService = () => {
  if (!geometryServiceSingleton) {
    geometryServiceSingleton = new GeometryService(BUFFER_GEOMETRY_SERVICE_URL)
  }

  const config = esriConfig as EsriConfigWithDefaults
  config.defaults = config.defaults ?? {}
  config.defaults.geometryService = geometryServiceSingleton
  config.geometryServiceUrl = BUFFER_GEOMETRY_SERVICE_URL

  return geometryServiceSingleton
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
 * Normaliza texto para comparaciones de UI sin sensibilidad a acentos/mayúsculas.
 *
 * @param {string} value Texto de entrada.
 * @returns {string} Texto normalizado en minúsculas y sin diacríticos.
 */
const normalizeUiText = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
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
 * Convierte un atributo crudo a tipo visualizable en tabla.
 *
 * @param value Valor del atributo en el feature original.
 * @returns Valor normalizado para UI/exportación.
 */
const toResultCell = (value: unknown): ResultCell => {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  return String(value)
}

/**
 * Obtiene un subconjunto relevante de atributos para visualización.
 *
 * Se excluyen campos de geometría binaria y metadatos internos no útiles.
 *
 * @param attributes Atributos crudos de un feature.
 * @returns Diccionario limpio de atributos para tabla.
 */
const extractRelevantAttributes = (attributes: Record<string, unknown>) => {
  const excludedPattern = /^(shape|shape_length|shape_area|globalid)$/i
  const entries = Object.entries(attributes)
    .filter(([key]) => !excludedPattern.test(key))
    .map(([key, value]) => [key, toResultCell(value)] as const)

  return Object.fromEntries(entries) as Record<string, ResultCell>
}

/**
 * Deduce tipo de campo ArcGIS para la tabla de resultados.
 *
 * @param value Valor representativo del campo.
 * @returns Tipo de campo compatible con ArcGIS.
 */
const inferFieldType = (value: ResultCell): __esri.FieldProperties['type'] => {
  if (typeof value === 'number') return 'double'
  if (typeof value === 'boolean') return 'small-integer'
  return 'string'
}

/**
 * Construye firma determinística para evitar consultas espaciales duplicadas.
 *
 * @param geometry Geometría base capturada.
 * @param layerUrl URL de capa objetivo.
 * @param distance Distancia usada en el buffer.
 * @param unit Unidad del buffer.
 * @returns Hash de parámetros de consulta.
 */
const buildSpatialRequestKey = (
  geometry: __esri.GeometryUnion,
  layerUrl: string,
  distance: number,
  unit: BufferLinearUnit
) => {
  const geometryJson = typeof geometry.toJSON === 'function' ? geometry.toJSON() : geometry
  return JSON.stringify({ geometry: geometryJson, layerUrl, distance, unit })
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
  /** Identificador del grupo seleccionado (solo para Cuenca Río la Vieja). */
  const [grupoValue, setGrupoValue] = React.useState('')

  /** Distancia del buffer en unidad de usuario. */
  const [distancia, setDistancia] = React.useState('500')
  /** Unidad seleccionada para el buffer. */
  const [unidad, setUnidad] = React.useState('Metros')

  /** Modo de dibujo activo sobre el mapa. */
  const [drawMode, setDrawMode] = React.useState<'point' | 'line' | null>(null)
  /** Mensaje de error para la barra de acciones. */
  const [actionError, setActionError] = React.useState('')
  /** Estado de ejecución de buffer + intersección. */
  const [isProcessing, setIsProcessing] = React.useState(false)

  /** Filas normalizadas para tabla local de resultados. */
  const [resultRows, setResultRows] = React.useState<BufferResultRow[]>([])
  /** Definición de columnas para la tabla local. */
  const [resultFields, setResultFields] = React.useState<BufferResultField[]>([])
  /** Mensaje informativo del resultado espacial. */
  const [resultMessage, setResultMessage] = React.useState('')

  /** Referencia al GraphicsLayer temporal de dibujo y buffer. */
  const graphicsLayerRef = React.useRef<GraphicsLayer | null>(null)
  /** Referencia al FeatureLayer de la capa seleccionada en el formulario. */
  const activeLayerRef = React.useRef<FeatureLayer | null>(null)
  /** Primer punto capturado para dibujo de linea. */
  const lineStartPointRef = React.useRef<__esri.Point | null>(null)
  /** Instancia estable del GeometryService. */
  const geometryServiceRef = React.useRef<GeometryService | null>(null)
  /** Control de concurrencia para descartar respuestas obsoletas. */
  const executionIdRef = React.useRef(0)
  /** Firma de la última consulta espacial para evitar duplicados. */
  const lastSpatialRequestKeyRef = React.useRef('')
  /** Extent inicial de la vista para restaurarlo al cerrar el widget. */
  const initialExtentRef = React.useRef<__esri.Extent | null>(null)
  /** Zoom inicial del mapa para restablecer la vista al limpiar. */
  const initialZoomRef = React.useRef<number | null>(null)
  /** Escala inicial del mapa para restablecer la vista al limpiar. */
  const initialScaleRef = React.useRef<number | null>(null)

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
   * Inicializa una sola vez el GeometryService compartido del widget.
   */
  React.useEffect(() => {
    geometryServiceRef.current = getOrCreateGeometryService()
    if(validaLoggerLocalStorage('logger')) console.log('WidgetBuffer ID:', {id:props.id, props, TABLA_DE_CONTENIDO:WIDGET_IDS.TABLA_DE_CONTENIDO})
  }, [])

  /**
   * Captura una única vez el extent inicial cuando la vista de mapa está disponible.
   *
   * @returns {void}
   */
  React.useEffect(() => {
    const view = jimuMapView?.view
    if (!view || initialExtentRef.current) return

    initialExtentRef.current = view.extent?.clone() ?? null
  }, [jimuMapView])

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
    if(validaLoggerLocalStorage('logger')) console.log({temaValue, TEMAOPTION})
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
        value: item.NOMBRETEMATICA === temaValue ? item.TITULOCAPA : item.NOMBRETEMATICA,
        // label: (selectedTema.NOMBRETEMATICA === 'Educación'|| selectedTema.NOMBRETEMATICA === 'Gestión del riesgo') ? item.TITULOCAPA : item.NOMBRETEMATICA,
        label: item.NOMBRETEMATICA === temaValue ? item.TITULOCAPA : item.NOMBRETEMATICA,
        node: item
      }))
      .filter(option => Boolean(option.label))
    if(validaLoggerLocalStorage('logger')) console.log({selectedTema, subtemas, SUBTEMA})
    return SUBTEMA
  }, [selectedTema, temaValue])

  /**
   * Nodo de subtema seleccionado.
   */
  const selectedSubtema = React.useMemo(() => {
    if (subtemaOptions.length === 0) return null
    const subtemaOption = subtemaOptions.find(option => option.value === subtemaValue)
    if(validaLoggerLocalStorage('logger')) console.log({subtemaValue, subtemaOption})
    return subtemaOption ?? null
  }, [subtemaOptions, subtemaValue])

  /**
   * Indica si el subtema actual requiere mostrar el campo adicional de grupos.
   */
  const shouldShowGrupos = React.useMemo(() => {
    if (!selectedSubtema?.label) return false
    const validacion = selectedSubtema.node.capasNietas?.some(grupo => Array.isArray(grupo.capasBisnietos) && grupo.capasBisnietos.length > 0) ?? false
    if(validaLoggerLocalStorage('logger')) console.log({selectedSubtema: selectedSubtema.label, shouldShowGrupos: validacion})
    return validacion
  }, [selectedSubtema])

  /**
   * Opciones del campo Grupos derivadas del subtema seleccionado.
   */
  const grupoOptions = React.useMemo<Array<NodeOption<BufferGrupoNode>>>(() => {
    if (!selectedSubtema?.node || !shouldShowGrupos) return []

    const grupoNodes = selectedSubtema.node.capasNietas ?? []
    const GRUPO = grupoNodes
      .map((item, index) => ({
        value: item.NOMBRETEMATICA,
        label: item.NOMBRETEMATICA,
        node: item
      }))
      .filter(option => Boolean(option.label))
    if(validaLoggerLocalStorage('logger')) console.log({selectedSubtema: selectedSubtema.label, grupoNodes, GRUPO})
    return GRUPO
  }, [selectedSubtema, shouldShowGrupos, subtemaValue])

  /**
   * Grupo seleccionado en el formulario cuando aplica Cuenca Río la Vieja.
   */
  const selectedGrupo = React.useMemo(() => {
    if (grupoOptions.length === 0 || grupoValue==='') return null
    const GRUPO = grupoOptions.find(option => option.value === grupoValue)?.node ?? null
    if(validaLoggerLocalStorage('logger')) console.log({grupoValue, selectedGrupo: GRUPO})
    return GRUPO
  }, [grupoOptions, grupoValue])

  /**
   * Opciones del campo Capas derivadas del subtema seleccionado.
   */
  const capaOptions = React.useMemo<CapaOption[]>(() => {
    if (!selectedSubtema || (shouldShowGrupos && !selectedGrupo)) return []
    const capaNodes: BufferCapaNode[] = shouldShowGrupos
      ? selectedGrupo?.capasBisnietos ?? []
      : (selectedSubtema.node.capasNietas ?? [])

    const CAPAS = capaNodes
      .map((item, index) => {
        const layerUrl = buildLayerUrl(item)
        return {
          value: item.TITULOCAPA,
          label: item.TITULOCAPA,
          node: item,
          layerUrl
        }
      })
      .filter(option => Boolean(option.layerUrl || option.node.capasBisnietos || option.node.capasNietas))
    if(validaLoggerLocalStorage('logger')) console.log({selectedSubtema, shouldShowGrupos, selectedGrupo, capaNodes, CAPAS,grupoValue,subtemaValue,subtemaOptions,selectedTema})
    return CAPAS
  }, [selectedSubtema, shouldShowGrupos, selectedGrupo, grupoValue, subtemaValue, subtemaOptions, selectedTema])

  /**
   * Opcion de capa seleccionada.
   */
  const selectedCapa = React.useMemo(() => {
    if (capaOptions.length === 0) return null
    const CAPAOPTION = capaOptions.find(option => option.value === capaValue)
    if(validaLoggerLocalStorage('logger')) console.log({capaValue, CAPAOPTION})
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

    // Envia mensaje al widget de tabla de contenido para solicitar datos de la TOC.
    getAppStore().dispatch(
        appActions.widgetStatePropChange(
            WIDGET_IDS.BUFFER, // ID del widget destino, debe ser un widget que esté abierto en el layout para recibir los datos
            'fromBuffer', // Nombre de la propiedad que se va a crear/actualizar en el estado del widget
            {
                task: 'TOC_DATA_REQUEST', // Identificador de la tarea o acción que se va a realizar, para que el widget destino sepa cómo manejar los datos
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
   * Asegura que la capa de gráficos (buffer) siempre esté en la posición superior del mapa.
   * 
   * Esto garantiza que las geometrías de buffer y sus intersecciones se rendericen
   * por encima de todas las demás capas del mapa.
   * 
   * @returns {void}
   * @internal
   */
  const ensureGraphicsLayerOnTop = React.useCallback((): void => {
    const view = jimuMapView?.view
    const graphicsLayer = graphicsLayerRef.current

    if (!view || !graphicsLayer) return

    const isGraphicsLayerInMap = view.map.findLayerById(graphicsLayer.id) !== undefined

    if (isGraphicsLayerInMap) {
      // Reordena la capa de gráficos al final (índice más alto = más arriba en el renderizado)
      const layersCount = view.map.layers.length
      if (layersCount > 1) {
        view.map.reorder(graphicsLayer, layersCount - 1)
      }
    }
  }, [jimuMapView])

  /**
   * Agrega/remueve la capa seleccionada al mapa para gestión visual del usuario.
   * 
   * Después de agregar la capa de características (FeatureLayer), garantiza que
   * la capa de gráficos permanezca en la parte superior para renderizado correcto.
   */
  React.useEffect(() => {
    const view = jimuMapView?.view
    if (!view) return

    if (activeLayerRef.current && view.map.findLayerById(activeLayerRef.current.id)) {
      view.map.remove(activeLayerRef.current)
      activeLayerRef.current = null
    }

    const layerUrl = selectedCapa?.layerUrl/*  || selectedCapa?.node?.capasNietas[0]?.URL */
    if (!layerUrl) return
    // Crea un nuevo FeatureLayer para la capa seleccionada y lo agrega al mapa.
    try {
      const layer = new FeatureLayer({
        id: 'buffer-active-layer',
        title: `Capa activa: ${selectedCapa.label}`,
        url: layerUrl,
        visible: true
      })

      view.map.add(layer)
      activeLayerRef.current = layer

      /**
       * Después de agregar la capa de características, asegura que la capa
       * de gráficos esté en la posición superior del mapa para que el buffer
       * sea visible encima de la capa de características.
       */
      ensureGraphicsLayerOnTop()
    } catch (error) {
      console.error('No fue posible cargar la capa seleccionada en Buffer:', error)
    }

    return () => {
      if (activeLayerRef.current && view.map.findLayerById(activeLayerRef.current.id)) {
        view.map.remove(activeLayerRef.current)
      }
      activeLayerRef.current = null
    }
  }, [jimuMapView, selectedCapa, ensureGraphicsLayerOnTop])

  /**
   * Reinicia los controles dependientes cuando cambia Tema.
   */
  const onTemaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTemaValue(event.target.value)
    setSubtemaValue('')
    setGrupoValue('')
    setCapaValue('')
    setActionError('')
  }

  /**
   * Reinicia el control de capas cuando cambia Subtema.
   */
  const onSubtemaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSubtemaValue(event.target.value)
    setGrupoValue('')
    setCapaValue('')
    setActionError('')
  }

  /**
   * Almacena el grupo seleccionado y reinicia la capa para evitar inconsistencias.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} event Evento de cambio del select de grupos.
   * @returns {void}
   */
  const onGrupoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setGrupoValue(event.target.value)
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
   * Activa/desactiva el modo de dibujo seleccionado desde el formulario.
   */
  const onDrawModeSelect = (nextMode: 'point' | 'line') => {
    setDrawMode(currentMode => currentMode === nextMode ? null : nextMode)
    setActionError('')
  }

  /**
   * Limpia geometrias dibujadas y estado temporal de interaccion.
   */
  const clearDrawings = React.useCallback((): void => {
    lineStartPointRef.current = null
    graphicsLayerRef.current?.removeAll()
    setResultRows([])
    setResultFields([])
    setResultMessage('')
    lastSpatialRequestKeyRef.current = ''
    limpiarYCerrarWidgetResultados(WIDGET_IDS.RESULT)
  }, [])

  /**
   * Restaura el extent inicial del mapa cuando existe una referencia válida.
   *
   * @returns {Promise<void>}
   */
  const restoreInitialExtent = React.useCallback(async (): Promise<void> => {
    const view = jimuMapView?.view
    const initialExtent = initialExtentRef.current

    if (!view || !initialExtent) return

    try {
      goToInitialExtent(jimuMapView, initialExtent)      
    } catch (error: unknown) {
      console.error('No fue posible restaurar el extent inicial de Buffer:', error)
    }
  }, [jimuMapView])

  /**
   * Limpia el estado espacial al cerrar el widget:
   * 1. Elimina geometrías y buffer temporal.
   * 2. Reinicia estados de interacción.
   * 3. Remueve la capa activa temporal del mapa.
   * 4. Restaura el extent inicial.
   *
   * @returns {void}
   */
  React.useEffect(() => {
    if (props.state !== WidgetState.Closed) return
    resetWidget()  
  }, [props.state, jimuMapView, clearDrawings, restoreInitialExtent])

  const resetWidget = () => {
    setDrawMode(null)
    setIsProcessing(false)
    setActionError('')
    clearDrawings()
    setTemaValue('')
    setSubtemaValue('')
    setGrupoValue('')
    setCapaValue('')

     const view = jimuMapView?.view
    if (view && activeLayerRef.current && view.map.findLayerById(activeLayerRef.current.id)) {
      view.map.remove(activeLayerRef.current)
    }
    activeLayerRef.current = null

    void restoreInitialExtent()   
  }

  /**
   * Normaliza y simplifica geometría para construcción de buffer estable.
   *
   * Flujo:
   * 1. Normalización por meridiano central.
   * 2. Simplificación cuando la entrada es polyline no simple.
   *
   * @param geometry Geometría capturada en el mapa.
   * @returns Geometría preparada para GeometryService.buffer.
   */
  const prepareGeometryForBuffer = React.useCallback(async (geometry: __esri.GeometryUnion) => {
    const normalizedList = await normalizeUtils.normalizeCentralMeridian([geometry]) as __esri.GeometryUnion[]
    const normalizedGeometry = normalizedList?.[0] ?? geometry

    if (normalizedGeometry.type !== 'polyline') {
      return normalizedGeometry
    }

    const isSimpleLine = geometryEngine.isSimple(normalizedGeometry)
    if (isSimpleLine) {
      return normalizedGeometry
    }

    const simplifiedLine = geometryEngine.simplify(normalizedGeometry) as __esri.Polyline | null
    return simplifiedLine ?? normalizedGeometry
  }, [])

  /**
   * Construye un buffer geodésico usando GeometryService.buffer + BufferParameters.
   *
   * @param geometry Geometría de entrada normalizada/simplificada.
   * @param distanceValue Distancia positiva del buffer.
   * @param unitCode Unidad lineal ArcGIS.
   * @param outSpatialReference Referencia espacial de salida.
   * @returns Polígono de buffer o null si el servicio no retorna geometría.
   */
  const buildBufferGeometry = React.useCallback(async (
    geometry: __esri.GeometryUnion,
    distanceValue: number,
    unitCode: BufferLinearUnit,
    outSpatialReference: __esri.SpatialReference
  ) => {
    const service = geometryServiceRef.current ?? getOrCreateGeometryService()

    const bufferParams = new BufferParameters({
      geometries: [geometry],
      distances: [distanceValue],
      unit: unitCode,
      geodesic: true,
      unionResults: true,
      bufferSpatialReference: geometry.spatialReference,
      outSpatialReference
    })

    const bufferedGeometries = await service.buffer(bufferParams) as __esri.Geometry[]
    return (bufferedGeometries?.[0] ?? null) as __esri.Polygon | null
  }, [])

  /**
   * Dibuja geometrías intersectadas sobre la capa temporal del widget.
   *
   * @param features Features resultantes de intersección espacial.
   */
  const drawIntersectedGeometries = React.useCallback((features: __esri.Graphic[]) => {
    const graphicsLayer = graphicsLayerRef.current
    if (!graphicsLayer || features.length === 0) return

    const intersectionGraphics = features
      .filter(feature => Boolean(feature.geometry))
      .map(feature => {
        const geometry = feature.geometry as __esri.Geometry
        const symbol: __esri.GraphicProperties['symbol'] = geometry.type === 'polygon'
          ? {
              type: 'simple-fill',
              color: [0, 179, 136, 0.22],
              outline: { type: 'simple-line', color: [0, 128, 96, 1], width: 1.5 }
            }
          : geometry.type === 'polyline'
            ? {
                type: 'simple-line',
                color: [0, 128, 96, 1],
                width: 2.5
              }
            : {
                type: 'simple-marker',
                color: [0, 128, 96, 1],
                size: 7,
                outline: { color: [255, 255, 255, 1], width: 1 }
              }

        return new Graphic({
          geometry,
          attributes: feature.attributes,
          symbol
        })
      })

    if (intersectionGraphics.length > 0) {
      graphicsLayer.addMany(intersectionGraphics)
    }
  }, [])

  /**
   * Mapea features intersectados a estructura tipada para UI y widget-result.
   *
   * @param features Features retornados por query espacial.
   * @returns Paquete normalizado de filas y campos.
   */
  const mapQueryResults = React.useCallback((features: __esri.Graphic[]) => {
    const rows = features.map((feature, index) => ({
      rowId: index + 1,
      attributes: extractRelevantAttributes(feature.attributes as Record<string, unknown>),
      geometry: feature.geometry?.toJSON?.() as __esri.GeometryProperties | undefined
    }))

    const fieldMap = new Map<string, BufferResultField>()
    rows.forEach(row => {
      Object.entries(row.attributes).forEach(([name, value]) => {
        if (!fieldMap.has(name)) {
          fieldMap.set(name, {
            name,
            alias: name,
            type: inferFieldType(value)
          })
        }
      })
    })

    return {
      rows,
      fields: Array.from(fieldMap.values())
    }
  }, [])

  /**
   * Construye y dibuja el graphic de la geometría fuente (punto o línea).
   * 
   * @param geometry Geometría normalizada y simplificada (punto o línea).
   * @returns Graphic del símbolo de origen.
   * @internal
   */
  const createSourceGraphic = (geometry: __esri.GeometryUnion): Graphic => {
    return new Graphic({
      geometry,
      symbol: geometry.type === 'point'
        ? {
            type: 'simple-marker' as const,
            color: [220, 40, 40, 1] as [number, number, number, number],
            size: 9,
            outline: { color: [255, 255, 255, 1] as [number, number, number, number], width: 1 }
          }
        : {
            type: 'simple-line' as const,
            color: [220, 40, 40, 1] as [number, number, number, number],
            width: 2
          }
    })
  }

  /**
   * Construye el graphic del buffer con símbolo de relleno semitransparente.
   * 
   * @param geometry Polígono de buffer generado.
   * @returns Graphic del buffer.
   * @internal
   */
  const createBufferGraphic = (geometry: __esri.Polygon): Graphic => {
    return new Graphic({
      geometry,
      symbol: {
        type: 'simple-fill' as const,
        color: [255, 128, 0, 0.25] as [number, number, number, number],
        outline: {
          type: 'simple-line' as const,
          color: [255, 128, 0, 1] as [number, number, number, number],
          width: 2
        }
      }
    })
  }

  /**
   * Dibuja la geometría base, sus intersecciones y el buffer en el GraphicsLayer temporal.
   * 
   * Orden de renderizado (z-order):
   * 1. Geometría fuente (punto o línea)
   * 2. Geometrías intersectadas desde la capa objetivo
   * 3. Buffer de polígono (dibujado al final para aparecer encima de todo)
   *
   * @param geometry Geometría base (punto o línea) capturada sobre el mapa.
   * @returns {Promise<void>}
   */
  const drawBuffer = React.useCallback(async (geometry: __esri.GeometryUnion): Promise<void> => {
    const view = jimuMapView?.view
    const graphicsLayer = graphicsLayerRef.current
    const targetLayer = activeLayerRef.current
    const distanceValue = toPositiveDistance(distancia)
    const unitCode = UNIT_TO_ARCGIS[unidad] || 'meters'

    if (!view || !graphicsLayer) return
    if (!targetLayer) {
      setActionError('Seleccione una capa objetivo antes de dibujar el buffer.')
      return
    }

    if (distanceValue <= 0) {
      setActionError('Ingrese una distancia mayor a 0 para generar el buffer.')
      return
    }

    const requestKey = buildSpatialRequestKey(geometry, targetLayer.url ?? targetLayer.id, distanceValue, unitCode)
    if (requestKey === lastSpatialRequestKeyRef.current) {
      return
    }
    lastSpatialRequestKeyRef.current = requestKey

    const executionId = ++executionIdRef.current
    setIsProcessing(true)
    setActionError('')
    setResultMessage('Procesando buffer e intersección espacial...')

    try {
      const preparedGeometry = await prepareGeometryForBuffer(geometry)
      const bufferGeometry = await buildBufferGeometry(preparedGeometry, distanceValue, unitCode, view.spatialReference)

      if (!bufferGeometry) {
        setResultMessage('No fue posible construir el buffer con el GeometryService.')
        return
      }

      if (executionId !== executionIdRef.current) return

      if (validaLoggerLocalStorage('logger')) {
        console.log('Geometría base para buffer:', preparedGeometry)
        console.log(`Buffer generado con distancia ${distanceValue} ${unitCode}:`, bufferGeometry)
      }

      // Limpia la capa de gráficos
      graphicsLayer.removeAll()

      // Paso 1: Dibuja el símbolo de la geometría fuente (punto o línea)
      const sourceGraphic = createSourceGraphic(preparedGeometry)
      graphicsLayer.add(sourceGraphic)

      // Paso 2: Consulta y dibuja las geometrías intersectadas
      const query = targetLayer.createQuery()
      query.geometry = bufferGeometry
      query.spatialRelationship = 'intersects'
      query.returnGeometry = true
      query.outFields = ['*']

      const queryResult = await targetLayer.queryFeatures(query)
      if (executionId !== executionIdRef.current) return

      const intersectedFeatures = queryResult.features ?? []
      drawIntersectedGeometries(intersectedFeatures)

      // Paso 3: Dibuja el buffer al final (aparece encima de todo)
      const bufferGraphic = createBufferGraphic(bufferGeometry)
      graphicsLayer.add(bufferGraphic)

      /**
       * Asegura que la capa de gráficos esté renderizada en la posición superior
       * para que el buffer sea visible encima de todas las demás capas del mapa.
       */
      ensureGraphicsLayerOnTop()

      const mappedResults = mapQueryResults(intersectedFeatures)
      setResultRows(mappedResults.rows)
      setResultFields(mappedResults.fields)

      if (mappedResults.rows.length === 0) {
        setResultMessage('No se encontraron entidades intersectadas por el buffer.')
        limpiarYCerrarWidgetResultados(WIDGET_IDS.RESULT)
      } else {
        setResultMessage(`Se encontraron ${mappedResults.rows.length} entidades intersectadas.`)

        const featuresForResultWidget = mappedResults.rows.map(row => ({
          attributes: row.attributes,
          geometry: row.geometry
        }))

        abrirTablaResultados(
          false,
          featuresForResultWidget,
          mappedResults.fields,
          props,
          WIDGET_IDS.RESULT,
          view.spatialReference,
          `Intersección por buffer: ${selectedCapa?.label ?? 'Capa objetivo'}`,
          {
            showGraphic: false
          }
        )
      }

      if (bufferGeometry.extent) {
        await view.goTo(bufferGeometry.extent.expand(1.2))
      }
    } catch (error) {
      console.error('Error en el flujo de buffer/intersección:', error)
      setActionError('Ocurrió un error al generar el buffer o consultar intersecciones.')
      setResultMessage('No fue posible completar el análisis espacial.')
      setResultRows([])
      setResultFields([])
    } finally {
      if (executionId === executionIdRef.current) {
        setIsProcessing(false)
      }
    }
  }, [
    jimuMapView,
    distancia,
    unidad,
    drawIntersectedGeometries,
    mapQueryResults,
    prepareGeometryForBuffer,
    buildBufferGeometry,
    ensureGraphicsLayerOnTop,
    props,
    selectedCapa?.label
  ])

  /**
   * Gestiona capturas de clic sobre el mapa segun el modo de dibujo activo.
   */
  React.useEffect(() => {
    const view = jimuMapView?.view
    if (!view || !drawMode) return

    view.container.style.cursor = 'crosshair'

    const handle = view.on('click', (event: { mapPoint: __esri.Point }) => {
      if (drawMode === 'point') {
        void drawBuffer(event.mapPoint)
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

        void drawBuffer(lineGeometry)
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
    if (!initialExtentRef.current) {
      initialExtentRef.current = view.view.extent?.clone() ?? null
      initialZoomRef.current = typeof view.view.zoom === 'number' ? view.view.zoom : null
      initialScaleRef.current = typeof view.view.scale === 'number' ? view.view.scale : null
    }
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

          {shouldShowGrupos && (
            <>
              <Label>Grupos:</Label>
              <Select value={grupoValue} onChange={onGrupoChange}>
                <Option value=''>Seleccione...</Option>
                {grupoOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
              </Select>
            </>
          )}

          <Label>Capas:</Label>
          <Select value={capaValue} onChange={onCapaChange} disabled={shouldShowGrupos && !grupoValue}>
            <Option value=''>Seleccione...</Option>
            {capaOptions.map(option => (
              <Option key={`${option.value}-${option.layerUrl}`} value={option.value}>{option.label}</Option>
            ))}
          </Select>

          
          {
              capaValue!=="" && (
                <>
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
                  <div
                    role='group'
                    aria-label='Modo de dibujo'
                    style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}
                  >
                    <Button
                      type={drawMode === 'point' ? 'primary' : 'default'}
                      aria-pressed={drawMode === 'point'}
                      title='Punto'
                      onClick={() => { onDrawModeSelect('point') }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <SelectPointOutlined width={16} height={16} />
                      <span>Punto</span>
                    </Button>
                    <Button
                      type={drawMode === 'line' ? 'primary' : 'default'}
                      aria-pressed={drawMode === 'line'}
                      title='Linea'
                      onClick={() => { onDrawModeSelect('line') }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <DataLineOutlined width={16} height={16} />
                      <span>Linea</span>
                    </Button>
                  </div>
                </>
              )
          }

          <SearchActionBar
            onSearch={() => {
              if (!selectedCapa?.layerUrl) {
                setActionError('Seleccione una capa para ejecutar la intersección espacial.')
                return
              }
              if (!drawMode) {
                setActionError('Seleccione un modo de dibujo antes de activar.')
                return
              }
              setActionError('')
            }}
            onClear={resetWidget}
            disableSearch={!drawMode || !selectedCapa?.layerUrl || isProcessing}
            helpText='Seleccione un modo de dibujo para habilitar la captura en el mapa, y haga clic sobre el mapa en donde desea realizar el buffer.'
            error={actionError}
            searchLabel='Buscar'
            clearLabel='Limpiar'
            hideSearch={true}
          />

          {isProcessing && (
            <p className='buffer-widget__hint'>Procesando buffer e intersección espacial...</p>
          )}

          {!isProcessing && resultMessage && (
            <p className='buffer-widget__hint'>{resultMessage}</p>
          )}

          {/* {resultRows.length > 0 && resultFields.length > 0 && (
            <div className='widget-result-table-container' style={{ marginTop: '10px', maxHeight: '220px', overflow: 'auto' }}>
              <table className='table table-sm table-striped' style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {resultFields.map(field => (
                      <th key={field.name} style={{ textAlign: 'left', borderBottom: '1px solid #d9d9d9', padding: '4px' }}>
                        {field.alias}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultRows.map(row => (
                    <tr key={row.rowId}>
                      {resultFields.map(field => (
                        <td key={`${row.rowId}-${field.name}`} style={{ borderBottom: '1px solid #efefef', padding: '4px' }}>
                          {String(row.attributes[field.name] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )} */}

          {drawMode === 'line' && (
            <p className='buffer-widget__hint'>Para linea: haga clic en dos puntos del mapa.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Widget
