import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Select, Option } from 'jimu-ui'
import esriRequest from '@arcgis/core/request'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'

import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { AlertContainer } from '../../../shared/components/alert-container'
import PanelInformativo, { itemsInformacionContacto, type ChipItem, type InformacionAdicionalItem } from '../../../shared/components/PanelInformativo/PanelInformativo'
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import { urls } from '../../../api/serviciosQuindio'
import { drawAndCenterFeatures, ejecutarConsulta, removeDrawAndCenterFeatures, validaLoggerLocalStorage } from '../../../shared/utils/export.utils'
import { alertService } from '../../../shared/services/alert.service'
import { limpiarYCerrarWidgetResultados } from '../../../widget-result/src/runtime/widget'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { MUNICIPIOS_QUINDIO } from '../../../shared/constants/municipiosQuindio'
import tipoServicioIcon from '../../../shared/components/PanelInformativo/assets/tipo-servicio-solid-full.svg'

// @ts-expect-error - No se encuentran los tipos de estas funciones, revisar exportaciones en widget-result
import '../styles/styles.css'

interface LayerOption {
  id: number
  name: string
  parentLayerId: number
  subLayerIds?: number[]
}

interface SelectOption {
  value: string
  label: string
}

interface RawNameItem {
  nombre: string
  municipio: string
  IDMUNICIPIO: string
  categoria: string
}

interface CulturaTurismoAttributes {
  OBJECTID?: number
  IDINFRAINSTITUCIONAL?: number
  NUMEROPREDIAL?: string
  NUMEROCAMAS?: string | number | null
  NUMEROHABITACIONES?: string | number | null
  SALONESEVENTOSCONFERENCIAS?: string | number | null
  IDMUNICIPIO?: string
  MUNICIPIO?: string
  NOMBRE?: string
  DIRECCION?: string
  URL?: string
  NIT?: string
  CIIU?: string
  REGISTROMERCANTIL?: string
  RNT?: string
  IDTIPOINSTITUCION?: number
  CATEGORIA?: string
  IDJERARQUIA?: number
  JERARQUIA?: string
  RESPONSABLE?: string
  IMAGEN?: string
  [key: string]: string | number | null | undefined
}

interface CulturaTurismoFeature {
  attributes: CulturaTurismoAttributes
  geometry?: __esri.Geometry
}

interface QueryFeature extends __esri.Graphic {
  attributes: CulturaTurismoAttributes
}

interface TurismoServicioAttributes {
  TIPO_SERVICIO?: string | null
}

interface TurismoServicioFeature {
  attributes?: TurismoServicioAttributes
}

interface TurismoServicioQueryResponse {
  features?: TurismoServicioFeature[]
}

type CapacidadInstaladaField = 'NUMEROCAMAS' | 'NUMEROHABITACIONES' | 'SALONESEVENTOSCONFERENCIAS'

const NOMBRE_FIELD_CANDIDATES = [
  'NOMBRE',
  'NOMBRESITIO',
  'NOMBRE_SITIO',
  'NOMBREESTABLECIMIENTO',
  'NOMBREATRACTIVO',
  'SITIO',
  'LUGAR',
  'DESCRIPCION'
]

/**
 * Normaliza una lista de textos a opciones de select únicas y ordenadas.
 * @param values - Arreglo de cadenas a normalizar.
 * @returns Arreglo de {@link SelectOption} deduplicado y ordenado alfabéticamente en español.
 */
const toUniqueOptions = (values: string[]) => {
  if (values.length < 1) return []
  return Array.from(new Set(values.map(v => String(v).trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map(v => ({ value: v, label: v }))
}

/**
 * Escapa comillas simples en una cadena para su uso seguro en cláusulas SQL.
 * @param value - Cadena de entrada a escapar.
 * @returns Cadena con las comillas simples duplicadas (`'` → `''`).
 */
const escapeSqlValue = (value: string) => value.replace(/'/g, "''")

/** Separador usado para construir el valor compuesto de subcategoría con formato `layerId::categoria`. */
const SUBCATEGORIA_SEPARATOR = '::'

/**
 * Extrae el id de layer desde el valor compuesto de subcategoría.
 * @param value - Valor con formato `layerId::categoria` o solo `layerId`.
 * @returns El identificador numérico de la capa, o `null` si el valor es inválido.
 */
const getSubcategoriaLayerId = (value: string): number | null => {
  if (!value) return null
  const rawLayerId = value.includes(SUBCATEGORIA_SEPARATOR)
    ? value.split(SUBCATEGORIA_SEPARATOR)[0]
    : value
  const parsedLayerId = Number(rawLayerId)
  return Number.isFinite(parsedLayerId) ? parsedLayerId : null
}

/**
 * Extrae la categoría textual desde el valor compuesto de subcategoría.
 * @param value - Valor con formato `layerId::categoria`.
 * @returns La parte textual de la categoría, o cadena vacía si el separador no está presente.
 */
const getSubcategoriaCategoria = (value: string): string => {
  if (!value || !value.includes(SUBCATEGORIA_SEPARATOR)) return ''
  return value.split(SUBCATEGORIA_SEPARATOR).slice(1).join(SUBCATEGORIA_SEPARATOR).trim()
}

/**
 * Construye el valor compuesto de subcategoría con formato `layerId::categoria`.
 * @param layerId - Identificador numérico de la capa.
 * @param categoria - Nombre textual de la categoría.
 * @returns Cadena con formato `layerId::categoria`.
 */
const buildSubcategoriaValue = (layerId: number, categoria: string): string => {
  return `${layerId}${SUBCATEGORIA_SEPARATOR}${categoria}`
}

const municipioById = new Map(
  MUNICIPIOS_QUINDIO.map(item => [String(item.IDMUNICIPI).trim(), String(item.NOMBRE).trim()])
)

/**
 * Resuelve el nombre del municipio a partir de los atributos de un feature.
 *
 * Usa primero el atributo `MUNICIPIO` y, si no existe o está vacío,
 * hace fallback mediante `IDMUNICIPIO` contra el catálogo {@link MUNICIPIOS_QUINDIO}.
 * @param attributes - Atributos del feature de Cultura y Turismo.
 * @returns Nombre del municipio resuelto, o cadena vacía si no se puede determinar.
 */
const resolveMunicipioName = (attributes: CulturaTurismoAttributes): string => {
  const fromFeature = String(attributes.MUNICIPIO ?? '').trim()
  if (fromFeature) return fromFeature

  const municipioId = String(attributes.IDMUNICIPIO ?? '').trim()
  if (!municipioId) return ''

  return municipioById.get(municipioId) ?? ''
}

/**
 * Detecta el campo más apropiado para nombre en un conjunto de atributos.
 *
 * Evalúa primero coincidencia exacta (insensible a mayúsculas) y luego
 * coincidencia parcial contra la lista de candidatos proporcionada.
 * @param attributeNames - Nombres de campo disponibles en el feature.
 * @param candidates - Lista ordenada de nombres candidatos a buscar.
 * @returns El nombre real del campo encontrado, o `null` si ninguno coincide.
 */
const guessField = (attributeNames: string[], candidates: string[]): string | null => {
  const upperCandidates = candidates.map(c => c.toUpperCase())
  const upperAttr = attributeNames.map(name => ({ raw: name, upper: name.toUpperCase() }))

  for (const candidate of upperCandidates) {
    const exact = upperAttr.find(attr => attr.upper === candidate)
    if (exact) return exact.raw
  }

  for (const candidate of upperCandidates) {
    const partial = upperAttr.find(attr => attr.upper.includes(candidate))
    if (partial) return partial.raw
  }

  return null
}

interface PanelInformativoData {
  titulo: string
  imagenUrl: string
  telefono: string
  direccion: string
  horario: string
  sitioWeb: string
  email: string
  informacionAdicional: InformacionAdicionalItem[]
}

const PANEL_INFO_BASE_URL = String((urls as Record<string, unknown>).URL_ARCHIVOS_QUINDIO ?? '')
const TURISMO_ALFANUMERICO_SERVICE_URL = `${String((urls as Record<string, unknown>).SERVICIO_CULTURA_TURISMO_ALFANUMERICO ?? '')}/query`

/**
 * Campos de capacidad instalada que se muestran como chips de texto en el panel.
 */
const CAPACIDAD_INSTALADA_FIELDS: Array<{ key: CapacidadInstaladaField, label: string }> = [
  { key: 'NUMEROCAMAS', label: 'camas' },
  { key: 'NUMEROHABITACIONES', label: 'habitaciones' },
  { key: 'SALONESEVENTOSCONFERENCIAS', label: 'salones de eventos y conferencias' }
]

/**
 * Convierte un valor crudo del servicio en texto seguro para visualización.
 * @param value - Valor del servicio que puede llegar nulo, vacío o numérico.
 * @returns Texto amigable para UI, preservando `0` como valor válido.
 */
const toDisplayChipValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return 'No disponible'
  const normalized = String(value).trim()
  return normalized === '' ? 'No disponible' : normalized
}

/**
 * Transforma atributos del feature en chips para la sección de capacidad instalada.
 * @param attributes - Atributos del feature retornado por la consulta principal.
 * @returns Arreglo de chips compatible con `chipsTextoItems` de `PanelInformativo`.
 */
const buildCapacidadInstaladaChips = (attributes: CulturaTurismoAttributes): ChipItem[] => {
  return CAPACIDAD_INSTALADA_FIELDS.map(field => ({
    value: toDisplayChipValue(attributes[field.key]),
    label: field.label
  }))
}
/**
 * Icono usado por `chipsIconoTextoIcono` para representar tipos de servicio en el `PanelInformativo`.
 */
const TURISMO_SERVICE_CHIP_ICON_SRC = tipoServicioIcon

/**
 * Construye un item de información adicional solo cuando el valor existe.
 * @param label - Etiqueta visible del campo.
 * @param value - Valor crudo del atributo del servicio.
 * @returns Item tipado o `null` si el valor está vacío.
 */
const buildInformacionAdicionalItem = (label: string, value: string): InformacionAdicionalItem | null => {
  const normalizedValue = value.trim()
  if (!normalizedValue) return null

  return {
    label,
    value: normalizedValue
  }
}

/**
 * Obtiene el primer valor no vacío de una lista ordenada de posibles campos.
 * @param attributes - Atributos disponibles del feature.
 * @param fieldCandidates - Nombres de campo candidatos en orden de prioridad.
 * @returns Primer valor encontrado no vacío, o cadena vacía si no existe.
 */
const getFirstNonEmptyAttribute = (attributes: CulturaTurismoAttributes, fieldCandidates: string[]): string => {
  const upperCandidates = fieldCandidates.map(field => field.toUpperCase())
  const attributeEntries = Object.entries(attributes).map(([key, value]) => ({ key: key.toUpperCase(), value }))

  for (const candidate of upperCandidates) {
    const entry = attributeEntries.find(item => item.key === candidate)
    const nextValue = String(entry?.value ?? '').trim()
    if (nextValue) return nextValue
  }

  return ''
}

/**
 * Normaliza una ruta de imagen para que pueda renderizarse en el panel.
 * @param rawImageUrl - Valor de imagen proveniente de atributos del servicio.
 * @returns URL absoluta o relativa utilizable por la etiqueta `img`.
 */
const resolvePanelImageUrl = (rawImageUrl: string): string => {
  const normalized = String(rawImageUrl ?? '').trim()
  if (!normalized) return ''

  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  if (normalized.startsWith('//')) {
    return `https:${normalized}`
  }

  if (!PANEL_INFO_BASE_URL) {
    return normalized
  }

  const base = PANEL_INFO_BASE_URL.endsWith('/') ? PANEL_INFO_BASE_URL : `${PANEL_INFO_BASE_URL}/`
  const path = normalized.startsWith('/') ? normalized.slice(1) : normalized
  return `${base}${path}`
}

/**
 * Valida si el texto recibido corresponde exactamente a la temática Cultura.
 * @param value - Etiqueta a validar.
 * @returns `true` cuando la etiqueta es Cultura (ignorando mayúsculas y acentos).
 */
const isCulturaLabel = (value: string): boolean => {
  const ALLOWED = new Set(['turismo', 'cultura']);
  return ALLOWED.has(value.trim().toLowerCase())
}

/**
 * Determina si la temática seleccionada corresponde a Turismo.
 * @param value - Etiqueta de temática seleccionada.
 * @returns `true` cuando la etiqueta es Turismo (ignorando mayúsculas).
 */
const isTurismoLabel = (value: string): boolean => value.trim().toLowerCase() === 'turismo'

const Widget = (props: AllWidgetProps<any>) => {
  const widgetResultId = WIDGET_IDS.RESULT

  /** Estado de carga global del widget (consultas y búsquedas). */
  const [loading, setLoading] = React.useState(false)
  /** Mensaje de error mostrado en la barra de acciones del formulario. */
  const [error, setError] = React.useState('')

  /** Vista activa del mapa para navegación y dibujo de resultados. */
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)
  /** Capa gráfica temporal usada para pintar resultados de la consulta. */
  const [graphicsLayer, setGraphicsLayer] = React.useState<GraphicsLayer | null>(null)

  /** Todas las capas obtenidas del servicio para construir jerarquía de filtros. */
  const [allLayers, setAllLayers] = React.useState<LayerOption[]>([])
  /** Opciones visibles del select Temática. */
  const [tematicas, setTematicas] = React.useState<SelectOption[]>([])
  /** Opciones visibles del select Categoría. */
  const [categorias, setCategorias] = React.useState<SelectOption[]>([])
  /** Opciones visibles del select Subcategoría. */
  const [subcategorias, setSubcategorias] = React.useState<SelectOption[]>([])

  /** Valor seleccionado en Temática. */
  const [selectedTematica, setSelectedTematica] = React.useState('')
  /** Valor seleccionado en Categoría. */
  const [selectedCategoria, setSelectedCategoria] = React.useState('')
  /** Valor compuesto seleccionado en Subcategoría (layerId::categoria). */
  const [selectedSubcategoria, setSelectedSubcategoria] = React.useState('')
  /** Identificador de municipio seleccionado. */
  const [selectedMunicipio, setSelectedMunicipio] = React.useState('')
  /** Nombre seleccionado. */
  const [selectedNombre, setSelectedNombre] = React.useState('')

  /** Dataset base (normalizado) para derivar municipios y nombres. */
  const [rawNames, setRawNames] = React.useState<RawNameItem[]>([])
  /** Campo real de municipio detectado/usado para construir SQL de búsqueda. */
  const [municipioField, setMunicipioField] = React.useState<string | null>(null)
  /** Campo real de nombre detectado dinámicamente en atributos del servicio. */
  const [nombreField, setNombreField] = React.useState<string | null>(null)
  /** Feature seleccionado para mostrar detalle en PanelInformativo. */
  const [panelInfoFeature, setPanelInfoFeature] = React.useState<CulturaTurismoFeature | null>(null)
  /** Controla si la vista de detalle (PanelInformativo) está activa. */
  const [showPanelInformativo, setShowPanelInformativo] = React.useState(false)
  /** Chips derivados de la consulta alfanumérica de Turismo para el panel de detalle. */
  const [turismoServiceChips, setTurismoServiceChips] = React.useState<ChipItem[]>([])
  /** Chips de texto para capacidad instalada mostrados en `PanelInformativo`. */
  const [capacidadInstaladaChips, setCapacidadInstaladaChips] = React.useState<ChipItem[]>([])

  /** Extensión inicial para restablecer la vista al limpiar. */
  const initialExtentRef = React.useRef<__esri.Extent | null>(null)
  /** Zoom inicial para restablecer la vista al limpiar. */
  const initialZoomRef = React.useRef<number | null>(null)
  /** Escala inicial para restablecer la vista al limpiar. */
  const initialScaleRef = React.useRef<number | null>(null)
  /** Último layerId cargado para evitar recargas redundantes. */
  const loadedLayerIdRef = React.useRef<number | null>(null)

  /**
   * Índice de hijos por parentLayerId para evitar filtros repetidos sobre allLayers.
   */
  const childrenByParentId = React.useMemo(() => {
    const acc = new Map<number, LayerOption[]>()
    for (const layer of allLayers) {
      const current = acc.get(layer.parentLayerId) ?? []
      current.push(layer)
      acc.set(layer.parentLayerId, current)
    }
    return acc
  }, [allLayers])

  /**
   * Filtra el dataset base por categoría seleccionada en subcategoría.
   */
  const filteredByCategoria = React.useMemo(() => {
    const categoriaFiltro = getSubcategoriaCategoria(selectedSubcategoria)
    return categoriaFiltro
      ? rawNames.filter(item => item.categoria === categoriaFiltro)
      : rawNames
  }, [rawNames, selectedSubcategoria])

  /**
   * Deriva las opciones de municipio desde el dataset filtrado por categoría.
   */
  const municipios = React.useMemo(() => {
    const municipiosMap = new Map<string, SelectOption>()
    filteredByCategoria.forEach(item => {
      if (item.IDMUNICIPIO && item.municipio && !municipiosMap.has(item.IDMUNICIPIO)) {
        municipiosMap.set(item.IDMUNICIPIO, { value: item.IDMUNICIPIO, label: item.municipio })
      }
    })

    return Array.from(municipiosMap.values())
      .sort((a, b) => a.label.localeCompare(b.label, 'es'))
  }, [filteredByCategoria])

  /**
   * Deriva las opciones de nombre desde el dataset filtrado por categoría y municipio.
   */
  const nombres = React.useMemo(() => {
    const filteredByMunicipio = selectedMunicipio
      ? filteredByCategoria.filter(item => item.IDMUNICIPIO === selectedMunicipio)
      : filteredByCategoria
    return toUniqueOptions(filteredByMunicipio.map(item => item.nombre))
  }, [filteredByCategoria, selectedMunicipio])

  /** Etiqueta actual de temática seleccionada para evaluaciones de flujo. */
  const selectedTematicaLabel = React.useMemo(() => {
    return tematicas.find(option => option.value === selectedTematica)?.label ?? ''
  }, [selectedTematica, tematicas])

  /**
   * Determina si el flujo Cultura tiene todos los filtros necesarios para detalle.
   */
  const isCulturaFlowComplete = React.useMemo(() => {
    return isCulturaLabel(selectedTematicaLabel)
      && Boolean(selectedCategoria)
      && Boolean(selectedMunicipio)
      && Boolean(selectedNombre)
  }, [selectedTematicaLabel, selectedCategoria, selectedMunicipio, selectedNombre])

  /**
   * Define cuándo la acción Buscar está disponible para ejecutar consulta final.
   */
  const canSearch = React.useMemo(() => {
    return !loading && Boolean(selectedMunicipio)
  }, [loading, selectedMunicipio])

  /**
   * Construye la cláusula WHERE actual reutilizable para búsquedas y detalle.
   * @returns Expresión SQL en formato ArcGIS.
   */
  const buildCurrentWhereClause = React.useCallback((): string => {
    const whereParts: string[] = []

    if (selectedMunicipio && municipioField) {
      whereParts.push(`${municipioField} = '${escapeSqlValue(selectedMunicipio)}'`)
    }

    if (selectedNombre && nombreField) {
      whereParts.push(`${nombreField} = '${escapeSqlValue(selectedNombre)}'`)
    }

    const selectedSubcategoriaCategoria = getSubcategoriaCategoria(selectedSubcategoria)
    const isTurismoTematica = isTurismoLabel(selectedTematicaLabel)
    const selectedCategoriaLabel = categorias.find(option => option.value === selectedCategoria)?.label ?? ''

    if (!isTurismoTematica) {
      if (selectedSubcategoriaCategoria) {
        whereParts.push(`CATEGORIA = '${escapeSqlValue(selectedSubcategoriaCategoria)}'`)
      } else if (selectedCategoria && selectedCategoriaLabel) {
        whereParts.push(`CATEGORIA = '${escapeSqlValue(selectedCategoriaLabel)}'`)
      }
    }
    const buildCurrentWhereClause = whereParts.length > 0 ? whereParts.join(' AND ') : '1=1'
    if(validaLoggerLocalStorage('logger')) {
      console.log({
        isTurismoTematica,
        selectedSubcategoriaCategoria,
        selectedCategoriaLabel,
        whereParts,
        selectedMunicipio,
        municipioField,
        selectedNombre,
        nombreField,
        selectedSubcategoria,
        categorias,
        selectedCategoria,
        selectedTematicaLabel,
        buildCurrentWhereClause
      })
    }
    return buildCurrentWhereClause
  }, [selectedMunicipio, municipioField, selectedNombre, nombreField, selectedSubcategoria, categorias, selectedCategoria, selectedTematicaLabel])

  /**
   * Adapta atributos del feature seleccionado al contrato esperado por PanelInformativo.
   */
  const panelInformativoData = React.useMemo<PanelInformativoData | null>(() => {
    const attributes = panelInfoFeature?.attributes
    if (!attributes) return null

    const informacionAdicional = [
      buildInformacionAdicionalItem('NIT', getFirstNonEmptyAttribute(attributes, ['NIT'])),
      buildInformacionAdicionalItem('CIIU', getFirstNonEmptyAttribute(attributes, ['CIIU'])),
      buildInformacionAdicionalItem('Registro mercantil', getFirstNonEmptyAttribute(attributes, ['REGISTROMERCANTIL', 'REGISTRO_MERCANTIL'])),
      buildInformacionAdicionalItem('RNT', getFirstNonEmptyAttribute(attributes, ['RNT']))
    ].filter((item): item is InformacionAdicionalItem => item !== null)

    return {
      titulo: getFirstNonEmptyAttribute(attributes, ['NOMBRE', 'NOMBRESITIO', 'NOMBREESTABLECIMIENTO']) || selectedNombre,
      imagenUrl: resolvePanelImageUrl(getFirstNonEmptyAttribute(attributes, ['IMAGEN', 'FOTO', 'FOTOS'])),
      telefono: getFirstNonEmptyAttribute(attributes, ['TELEFONO', 'TELEFONO1', 'CELULAR', 'MOVIL']),
      direccion: getFirstNonEmptyAttribute(attributes, ['DIRECCION', 'DIR']),
      horario: getFirstNonEmptyAttribute(attributes, ['HORARIO', 'HORARIOS']),
      sitioWeb: getFirstNonEmptyAttribute(attributes, ['SITIOWEB', 'SITIO_WEB', 'URL', 'PAGINAWEB', 'PAGINA_WEB']),
      email: getFirstNonEmptyAttribute(attributes, ['EMAIL', 'CORREO', 'CORREOELECTRONICO']),
      informacionAdicional
    }
  }, [panelInfoFeature, selectedNombre])

  /**
   * Selecciona y persiste el feature que alimenta el PanelInformativo.
   * Solo debe llamarse después de ejecutar una consulta final con botón Buscar.
   * @param features - Resultado de la consulta final (con o sin geometría).
   */
  const loadPanelInfo = React.useCallback((features: QueryFeature[]) => {
    if (!features.length) {
      setPanelInfoFeature(null)
      setShowPanelInformativo(false)
      return
    }

    const byNombre = features.find(feature => {
      const attrNombre = String(feature.attributes?.[nombreField || 'NOMBRE'] ?? feature.attributes?.NOMBRE ?? '').trim()
      return attrNombre === selectedNombre
    })

    const selectedFeature = (byNombre ?? features[0]) as CulturaTurismoFeature
    setPanelInfoFeature(selectedFeature)
    setShowPanelInformativo(true)
  }, [nombreField, selectedNombre])

  /**
   * Consulta servicios alfanuméricos de Turismo por OBJECTID y los transforma en chips.
   * @param objectId - OBJECTID obtenido de la consulta principal.
   * @returns Lista de chips compatibles con `PanelInformativo`.
   */
  const fetchTurismoServiceChips = React.useCallback(async (objectId: number): Promise<ChipItem[]> => {
    const whereClause = `OBJECTID = ${objectId}`
    const response = await esriRequest(TURISMO_ALFANUMERICO_SERVICE_URL, {
      query: {
        f: 'json',
        where: whereClause,
        returnGeometry: false,
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'TIPO_SERVICIO',
        outSR: 3115
      },
      responseType: 'json'
    })

    const data = (response.data ?? {}) as TurismoServicioQueryResponse
    const features = Array.isArray(data.features) ? data.features : []

    const uniqueTipos = Array.from(
      new Set(
        features
          .map(feature => String(feature.attributes?.TIPO_SERVICIO ?? '').trim())
          .filter(Boolean)
      )
    )

    const chips = uniqueTipos.map(tipo => ({
      value: tipo,
      label: ''
    }))

    if(validaLoggerLocalStorage('logger')) {
      console.log({
        objectId,
        requestUrl: TURISMO_ALFANUMERICO_SERVICE_URL,
        whereClause,
        responseData: data,
        features,
        uniqueTipos,
        chips
      })
    }
      

    return chips
  }, [])

  /**
   * Regresa al formulario sin perder filtros principales, ocultando el panel de detalle.
   */
  const onBackToParameters = React.useCallback(() => {
    setShowPanelInformativo(false)
    // setSelectedNombre('')
    setTurismoServiceChips([])
    setCapacidadInstaladaChips([])
    setError('')
  }, [])

  /**
   * Limpia gráficos/resultados de mapa vinculados al widget de resultados.
   */
  const clearMapResults = React.useCallback(() => {
   
    limpiarYCerrarWidgetResultados(widgetResultId)
  }, [widgetResultId])

  /**
   * Remueve del mapa los gráficos creados por la consulta y resetea su referencia local.
   */
  const clearDrawnFeatures = React.useCallback(() => {
    removeDrawAndCenterFeatures(jimuMapView, graphicsLayer, setGraphicsLayer)
  }, [graphicsLayer, jimuMapView])

  /**
   * Restablece la vista de mapa a su extensión, zoom y escala iniciales.
   */
  const resetToDefaultMapView = React.useCallback(async () => {
    const view = jimuMapView?.view
    const initialExtent = initialExtentRef.current

    if (!view || !initialExtent) return

    await view.goTo({ target: initialExtent })

    if (typeof initialZoomRef.current === 'number') {
      view.zoom = initialZoomRef.current
    }

    if (typeof initialScaleRef.current === 'number') {
      view.scale = initialScaleRef.current
    }
  }, [jimuMapView])

  /**
   * Captura la vista activa y conserva el estado inicial de navegación del mapa.
   */
  const activeViewChangeHandler = ((view: JimuMapView) => {
    if (!view) return

    setJimuMapView(view)

    if (!initialExtentRef.current) {
      initialExtentRef.current = view.view.extent?.clone() ?? null
      initialZoomRef.current = typeof view.view.zoom === 'number' ? view.view.zoom : null
      initialScaleRef.current = typeof view.view.scale === 'number' ? view.view.scale : null
    }
  })

  /**
   * Carga la jerarquía de capas del servicio y prepara las opciones iniciales.
   */
  const loadLayerHierarchy = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await esriRequest(`${urls.SERVICIO_CULTURA_TURISMO}/layers`, {
        query: { f: 'json' },
        responseType: 'json'
      })

      const rawLayers = response.data?.layers.filter((layer: { id: number }) => layer.id !== 23) || []
      const layers: LayerOption[] = rawLayers.map((layer: any) => ({
        id: layer.id,
        name: layer.name,
        parentLayerId: typeof layer.parentLayer?.id === 'number' ? layer.parentLayer.id : -1,
        subLayerIds: Array.isArray(layer.subLayers)
          ? layer.subLayers
              .map((subLayer: any) => subLayer?.id)
              .filter((id: any) => typeof id === 'number')
          : []
      }))

      setAllLayers(layers)

      const parentLayers = layers.filter(layer => layer.parentLayerId === -1)
      const childLayers = layers.filter(layer => layer.parentLayerId !== -1)
      const tematicasOptions = parentLayers.filter(layer => (layer.subLayerIds?.length || 0) > 0)

      setTematicas(tematicasOptions.length > 0
        ? tematicasOptions.map(layer => ({ value: String(layer.id), label: layer.name }))
        : []
      )

      if (validaLoggerLocalStorage('logger')) {
        console.log({
          url: `${urls.SERVICIO_CULTURA_TURISMO}/layers`,
          totalLayers: layers.length,
          parentLayers,
          childLayers,
          tematicasOptions
        })
      }
    } catch (err) {
      console.error('Error cargando jerarquía de capas de Cultura y Turismo:', err)
      alertService.error('Error', 'No fue posible cargar las capas de Cultura y Turismo.')
    } finally {
      setLoading(false)
    }
  }, [])

  /** Ejecuta la carga inicial de jerarquía al montar el widget. */
  React.useEffect(() => {
    void loadLayerHierarchy()
  }, [loadLayerHierarchy])

  /**
   * Recalcula categorías al cambiar temática y reinicia filtros dependientes.
   */
  React.useEffect(() => {
    if (!selectedTematica) {
      setCategorias([])
      setSubcategorias([])
      return
    }

    if (selectedTematica === 'all') {
      const fallbackCategories = allLayers
        .filter(layer => layer.parentLayerId === -1)
        .map(layer => ({ value: String(layer.id), label: layer.name }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))
      setCategorias(fallbackCategories)
      setSelectedCategoria('')
      setSubcategorias([])
      setSelectedSubcategoria('')
      return
    }

    const tematicaId = Number(selectedTematica)
    const children = childrenByParentId.get(tematicaId) ?? []

    if (children.length === 0) {
      const ownLayer = allLayers.find(layer => layer.id === tematicaId)
      setCategorias(ownLayer ? [{ value: String(ownLayer.id), label: ownLayer.name }] : [])
      setSelectedCategoria(ownLayer ? String(ownLayer.id) : '')
      return
    }

    const categoriasOptions = children
      .map(layer => ({ value: String(layer.id), label: layer.name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'))
    setCategorias(categoriasOptions)
    setSelectedCategoria('')
    setSubcategorias([])
    setSelectedSubcategoria('')
    if (validaLoggerLocalStorage('logger')) {
      console.log({
        selectedTematica,
        tematicaId,
        children,
        categoriasOptions
      })
    }
  }, [selectedTematica, allLayers, childrenByParentId])

  /**
   * Recalcula subcategorías al cambiar categoría y ajusta selección por defecto.
   */
  React.useEffect(() => {
    if (!selectedCategoria) {
      setSubcategorias([])
      setSelectedSubcategoria('')
      return
    }

    const categoriaId = Number(selectedCategoria)
    const children = childrenByParentId.get(categoriaId) ?? []

    if (children.length === 0) {
      const ownLayer = allLayers.find(layer => layer.id === categoriaId)
      const fallback = ownLayer ? [{ value: String(ownLayer.id), label: ownLayer.name }] : [] // Si la categoría no tiene hijos, se muestra a sí misma como única opción de subcategoría
      setSubcategorias(fallback)
      setSelectedSubcategoria(fallback[0]?.value)
      const updateState = {
        selectedCategoria,
        categoriaId,
        children,
        fallback,
        ownLayer,
      }
      if (validaLoggerLocalStorage('logger')) console.log(updateState)
      return
    }

    setSubcategorias(children.map(layer => ({ value: String(layer.id), label: layer.name })))
    setSelectedSubcategoria('')
     const updateState = {
      selectedCategoria,
      categoriaId,
      children
    }
    if (validaLoggerLocalStorage('logger'))  console.log(updateState)

  }, [selectedCategoria, allLayers, childrenByParentId])

  /**
   * Consulta datos del layer seleccionado y normaliza atributos de trabajo
   * para construir filtros dependientes (subcategoría, municipio, nombre).
   */
  const loadMunicipiosAndNombres = React.useCallback(async (layerId: number) => {
    setLoading(true)
    try {
      const url = `${urls.SERVICIO_CULTURA_TURISMO}/${layerId}`

      // Consulta completa: municipios, categorías y nombres se derivarán de rawNames
      const features = (await ejecutarConsulta({
        url,
        where: '1=1',
        campos: ['*'],
        returnGeometry: false
      })) as CulturaTurismoFeature[]

      if (!features.length) {
        setRawNames([])
        setNombreField(null)
        setMunicipioField(null)
        loadedLayerIdRef.current = layerId
        alertService.info('Sin datos', 'La subcategoría seleccionada no tiene registros disponibles.')
        return
      }

      // Ordena primero por categoría y luego por nombre para mejorar experiencia de usuario en selects dependientes
      const orderedFeatures = [...features].sort((a, b) => {
        const categoriaA = String(a.attributes?.CATEGORIA ?? '').trim()
        const categoriaB = String(b.attributes?.CATEGORIA ?? '').trim()
        const categoriaCompare = categoriaA.localeCompare(categoriaB, 'es')
        if (categoriaCompare !== 0) return categoriaCompare

        const nombreA = String(a.attributes?.NOMBRE ?? '').trim()
        const nombreB = String(b.attributes?.NOMBRE ?? '').trim()
        return nombreA.localeCompare(nombreB, 'es')
      })

      const attributeNames = Object.keys(orderedFeatures[0].attributes || {})
      const detectedNombreField = guessField(attributeNames, NOMBRE_FIELD_CANDIDATES) || attributeNames[0]
      setNombreField(detectedNombreField)
      setMunicipioField('IDMUNICIPIO')

      // Normaliza el dataset base para filtros dependientes a partir de atributos del servicio y lógica de resolución de municipio
      const nextRawNames: RawNameItem[] = orderedFeatures
        .map(feature => {
          const municipio = resolveMunicipioName(feature.attributes)
          const categoria = String(feature.attributes?.CATEGORIA ?? '').trim()
          const nombre = String(feature.attributes?.[detectedNombreField] ?? '').trim()
          const IDMUNICIPIO = String(feature.attributes?.IDMUNICIPIO ?? '').trim()
          return { municipio, nombre, IDMUNICIPIO, categoria }
        })
        .filter(item => item.nombre)

      loadedLayerIdRef.current = layerId
      setRawNames(nextRawNames)
      if (validaLoggerLocalStorage('logger')) {
        console.log({
          url,
          orderedFeatures,
          attributeNames,
          detectedNombreField,
          nextRawNames
        })
      }
    } catch (err) {
      console.error('Error cargando datos para Cultura y Turismo:', err)
      alertService.error('Error', 'No fue posible cargar datos para la subcategoría seleccionada.')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Dispara recarga únicamente cuando cambia el layerId derivado de subcategoría.
   */
  React.useEffect(() => {
    const layerId = getSubcategoriaLayerId(selectedSubcategoria)

    if (!layerId) {
      setShowPanelInformativo(false)
      setPanelInfoFeature(null)
      setSelectedMunicipio('')
      setSelectedNombre('')
      setRawNames([])
      setMunicipioField(null)
      setNombreField(null)
      setSubcategorias([])
      loadedLayerIdRef.current = null
      return
    }

    // Si el layerId no cambió, solo re-filtrar (sin recargar datos)
    if (layerId === loadedLayerIdRef.current) return

    setSelectedMunicipio('')
    setSelectedNombre('')
    setShowPanelInformativo(false)
    setPanelInfoFeature(null)
    setRawNames([])
    setMunicipioField(null)
    setNombreField(null)

    void loadMunicipiosAndNombres(layerId)
  }, [selectedSubcategoria, loadMunicipiosAndNombres])

  /**
   * Deriva el catálogo de subcategorías a partir de categorías presentes en rawNames.
   */
  React.useEffect(() => {
    const layerId = loadedLayerIdRef.current
    if (!rawNames.length || !layerId) {
      return
    }

    // Extrae categorías únicas del dataset base para construir opciones de subcategoría, usando la capa como contexto para evitar mezclas de categorías entre diferentes capas
    const categoriasDistinct = toUniqueOptions(rawNames.map(item => item.categoria).filter(Boolean))
    if (!categoriasDistinct.length) return

    // Construye opciones de subcategoría con formato layerId::categoria para mantener referencia al layerId original en la selección y evitar recargas innecesarias al cambiar entre categorías de la misma capa
    const subcategoriasByCategoria = categoriasDistinct.map(opt => ({
      value: buildSubcategoriaValue(layerId, opt.value),
      label: opt.label
    }))
    setSubcategorias(subcategoriasByCategoria)
    setSelectedSubcategoria(subcategoriasByCategoria[0].value)
  }, [rawNames])

  /**
   * Restablece la vista inicial del mapa, ejecuta la consulta principal y
   * prepara los datos de chips para `PanelInformativo`.
   *
   * Además, cuando la temática es Turismo, realiza una consulta alfanumérica
   * adicional para poblar `chipsIconoTextoItems`.
   */
  const onBuscar = React.useCallback(async () => {
    if (!canSearch) {
      return
    }

    if (!selectedSubcategoria) {
      setError('Debe seleccionar una subcategoría para buscar.')
      alertService.warning('Faltan datos', 'Seleccione una subcategoría antes de realizar la consulta.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await resetToDefaultMapView()

      const where = buildCurrentWhereClause()
      const selectedSubcategoriaLayerId = getSubcategoriaLayerId(selectedSubcategoria)
      if (!selectedSubcategoriaLayerId) {
        setError('Debe seleccionar una subcategoría válida para buscar.')
        alertService.warning('Faltan datos', 'Seleccione una subcategoría válida antes de realizar la consulta.')
        return
      }

      const layerUrl = `${urls.SERVICIO_CULTURA_TURISMO}/${selectedSubcategoriaLayerId}`

      const features = await ejecutarConsulta({
        url: layerUrl,
        where,
        campos: ['*'],
        returnGeometry: true
      }) as QueryFeature[]

      if (!features.length) {
        setShowPanelInformativo(false)
        setPanelInfoFeature(null)
        setCapacidadInstaladaChips([])
        clearMapResults()
        alertService.warning('Sin resultados', 'No se encontraron resultados para los filtros seleccionados.')
        return
      }

      // Dibuja resultados en el mapa usando la función compartida y pasando el layerId para gestionar capas por subcategoría y evitar mezclas de resultados entre diferentes subcategorías
      await drawAndCenterFeatures(undefined, features, jimuMapView, graphicsLayer, setGraphicsLayer, `cultura-turismo-consulta-layer-${selectedSubcategoria}`)

      // Ejecuta consulta alfanumérica adicional solo para Turismo y solo si existe OBJECTID.
      setTurismoServiceChips([])
      const objectIdRaw = features[0]?.attributes?.OBJECTID
      const objectId = typeof objectIdRaw === 'number' ? objectIdRaw : Number(objectIdRaw)
      const isTurismoQuery = isTurismoLabel(selectedTematicaLabel)
      if (isTurismoQuery && Number.isFinite(objectId)) {
        const turismoChips = await fetchTurismoServiceChips(objectId)
        setTurismoServiceChips(turismoChips)
      }

      const featureForPanel = features.find(feature => {
        const attrNombre = String(feature.attributes?.[nombreField || 'NOMBRE'] ?? feature.attributes?.NOMBRE ?? '').trim()
        return attrNombre === selectedNombre
      }) ?? features[0]

      /**
       * Actualiza chips de capacidad instalada solo para la temática Turismo.
       * @remarks Si la temática actual no es Turismo, limpia los chips para evitar datos residuales.
       */
      if (isTurismoQuery) {
        setCapacidadInstaladaChips(buildCapacidadInstaladaChips(featureForPanel.attributes))
      } else {
        setCapacidadInstaladaChips([])
      }

      if (isCulturaFlowComplete) {
        loadPanelInfo(features)
      } else {
        setShowPanelInformativo(false)
        setPanelInfoFeature(null)
      }

      
      if (validaLoggerLocalStorage('logger')) {
        console.log({
          selectedCategoria,
          where,
          layerUrl,
          features,
          attributesSample: features[0].attributes,
        })
      }
      
      /*
      const fields = Object.keys(features[0].attributes || {}).map(name => ({
        name,
        alias: name,
        type: 'string'
      }))

      const featuresFixed = features.map(feature => ({
        attributes: feature.attributes,
        geometry: feature.geometry?.toJSON?.() || feature.geometry
      }))

      const subcategoriaLabel = subcategorias.find(option => option.value === selectedSubcategoria)?.label || 'Subcategoría'
      abrirTablaResultados(
        false,
        featuresFixed,
        fields,
        props,
        widgetResultId,
        features[0].geometry?.spatialReference || jimuMapView?.view?.spatialReference,
        `Consulta Cultura y Turismo - ${subcategoriaLabel}`,
        {
          showGraphic: false
        }
      ) */

      alertService.success('Consulta completada', `Se encontraron ${features.length} registros.`)
    } catch (err) {
      console.error('Error consultando Cultura y Turismo:', err)
      alertService.error('Error', 'Ocurrió un error al consultar Cultura y Turismo.')
    } finally {
      setLoading(false)
    }
  }, [
    buildCurrentWhereClause,
    canSearch,
    clearMapResults,
    drawAndCenterFeatures,
    fetchTurismoServiceChips,
    isCulturaFlowComplete,
    jimuMapView,
    loadPanelInfo,
    nombreField,
    resetToDefaultMapView,
    selectedCategoria,
    selectedNombre,
    selectedSubcategoria,
    selectedTematicaLabel,
    subcategorias
  ])

  /**
    * Limpia todos los filtros del formulario, elimina gráficos dibujados
    * y restablece estado visual del mapa.
   */
  const onLimpiar = React.useCallback(() => {
    setSelectedTematica('')
    setSelectedCategoria('')
    setSelectedSubcategoria('')
    setSelectedMunicipio('')
    setSelectedNombre('')

    setCategorias([])
    setSubcategorias([])
    setRawNames([])

    setMunicipioField(null)
    setNombreField(null)
    setShowPanelInformativo(false)
    setPanelInfoFeature(null)
    setTurismoServiceChips([])
    setCapacidadInstaladaChips([])
    setError('')
    clearDrawnFeatures()
    clearMapResults()
    void resetToDefaultMapView()

    alertService.info('Formulario limpiado', 'Se limpiaron los filtros de Cultura y Turismo.')
  }, [clearDrawnFeatures, clearMapResults, resetToDefaultMapView])

  /** Limpia automáticamente el formulario cuando el widget se cierra. */
  React.useEffect(() => {
    if (props.state === 'CLOSED') {
      onLimpiar()
    }
  }, [props.state, onLimpiar])

  return (
    <div style={{ height: '100%', padding: '5px', boxSizing: 'border-box' }}>
      <AlertContainer />

      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds?.[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}

      {showPanelInformativo
        ? (
          <div className="consulta-widget">
            {panelInformativoData && (
              <PanelInformativo
                imagenUrl={panelInformativoData.imagenUrl}
                titulo={panelInformativoData.titulo || selectedNombre}
                listaIconoTextoItems={itemsInformacionContacto({
                  telefono: panelInformativoData.telefono,
                  direccion: panelInformativoData.direccion,
                  horario: panelInformativoData.horario,
                  sitioWeb: panelInformativoData.sitioWeb,
                  email: panelInformativoData.email,
                  nit: panelInformativoData.informacionAdicional.find(item => item.label === 'NIT')?.value,
                  registroMercantil: panelInformativoData.informacionAdicional.find(item => item.label === 'Registro mercantil')?.value,
                  rnt: panelInformativoData.informacionAdicional.find(item => item.label === 'RNT')?.value,
                  ciiu: panelInformativoData.informacionAdicional.find(item => item.label === 'CIIU')?.value,
                })}
                chipsIconoTextoTitulo="Tipos de servicio"
                chipsIconoTextoItems={turismoServiceChips}
                chipsIconoTextoIcono=""
                chipsTextoTitulo="Capacidad instalada"
                chipsTextoItems={capacidadInstaladaChips}
                informacionAdicionalItems={panelInformativoData.informacionAdicional}
                botonOnClick={onBackToParameters}
                botonLabel="Parámetros"
              />
            )}

            {loading && <OurLoading />}

            {!loading && !panelInformativoData && (
              <SearchActionBar
                onSearch={onBuscar}
                onClear={onBackToParameters}
                loading={false}
                disableSearch={false}
                helpText="No fue posible cargar el detalle del registro seleccionado."
                error=""
              />
            )}
          </div>
          )
        : (
      <div className="consulta-widget consulta-scroll loading-host">
        <div>
          <Label>Temática:</Label>
          <Select
            value={selectedTematica}
            disabled={loading}
            onChange={(e) => {
              clearMapResults()
              setSelectedTematica(e.target.value)
              setSelectedCategoria('')
              setSelectedSubcategoria('')
              setSelectedMunicipio('')
              setSelectedNombre('')
              setError('')
            }}
          >
            <Option value="">Seleccione...</Option>
            {tematicas.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <Label>Categoría:</Label>
          <Select
            value={selectedCategoria}
            disabled={loading || categorias.length === 0}
            onChange={(e) => {
              clearMapResults()
              setSelectedCategoria(e.target.value)
              setSelectedSubcategoria('')
              setSelectedMunicipio('')
              setSelectedNombre('')
              setError('')
            }}
          >
            <Option value="">Seleccione...</Option>
            {categorias.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          {
            subcategorias.length > 1 &&
            <>
              <Label>Subcategoría:</Label>
              <Select
                value={selectedSubcategoria}
                disabled={loading || subcategorias.length === 0}
                onChange={(e) => {
                  clearMapResults()
                  setSelectedSubcategoria(e.target.value)
                  setSelectedMunicipio('')
                  setSelectedNombre('')
                  setError('')
                }}
              >
                <Option value="">Seleccione...</Option>
                {subcategorias.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </>
          }


          <Label>Municipio:</Label>
          <Select
            value={selectedMunicipio}
            disabled={loading || !selectedTematica || !selectedCategoria || !selectedSubcategoria || municipios.length === 0}
            onChange={(e) => {
              clearMapResults()
              setSelectedMunicipio(e.target.value)
              setError('')
            }}
          >
            <Option value="">Seleccione...</Option>
            {municipios.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <Label>Nombre:</Label>
          <Select
            value={selectedNombre}
            disabled={loading || nombres.length === 0}
            onChange={(e) => {
              clearMapResults()
              setSelectedNombre(e.target.value)
              setError('')
            }}
          >
            <Option value="">Seleccione...</Option>
            {nombres.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <SearchActionBar
            onSearch={onBuscar}
            onClear={onLimpiar}
            loading={loading}
            disableSearch={!canSearch}
            helpText="Seleccione temática, categoría y subcategoría. Puede filtrar por municipio y nombre para ubicar geometrías en el mapa."
            error={error}
          />
        </div>

        {loading && <OurLoading />}
      </div>
          )}
    </div>
  )
}

export default Widget
