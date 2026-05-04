import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Select, Option } from 'jimu-ui'
import esriRequest from '@arcgis/core/request'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'

import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { AlertContainer } from '../../../shared/components/alert-container'
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import { urls } from '../../../api/serviciosQuindio'
import { drawAndCenterFeatures, ejecutarConsulta, validaLoggerLocalStorage } from '../../../shared/utils/export.utils'
import { alertService } from '../../../shared/services/alert.service'
import { limpiarYCerrarWidgetResultados } from '../../../widget-result/src/runtime/widget'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { MUNICIPIOS_QUINDIO } from '../../../shared/constants/municipiosQuindio'

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
  IDMUNICIPIO?: string
  MUNICIPIO?: string
  NOMBRE?: string
  DIRECCION?: string
  URL?: string
  NIT?: string
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
 */
const toUniqueOptions = (values: string[]) => {
  if (values.length < 1) return []
  return Array.from(new Set(values.map(v => String(v).trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map(v => ({ value: v, label: v }))
}

const escapeSqlValue = (value: string) => value.replace(/'/g, "''") // Escapa comillas simples para evitar inyección SQL en consultas

const SUBCATEGORIA_SEPARATOR = '::' // Separador para construir el valor compuesto de subcategoría (layerId::categoria)

/**
 * Extrae el id de layer desde el valor compuesto de subcategoría.
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
 */
const getSubcategoriaCategoria = (value: string): string => {
  if (!value || !value.includes(SUBCATEGORIA_SEPARATOR)) return ''
  return value.split(SUBCATEGORIA_SEPARATOR).slice(1).join(SUBCATEGORIA_SEPARATOR).trim()
}

/**
 * Construye el valor compuesto de subcategoría con formato layerId::categoria.
 */
const buildSubcategoriaValue = (layerId: number, categoria: string): string => {
  return `${layerId}${SUBCATEGORIA_SEPARATOR}${categoria}`
}

const municipioById = new Map(
  MUNICIPIOS_QUINDIO.map(item => [String(item.IDMUNICIPI).trim(), String(item.NOMBRE).trim()])
)

/**
 * Resuelve el nombre del municipio usando primero el atributo MUNICIPIO y,
 * si no existe, hace fallback por IDMUNICIPIO contra la constante local.
 */
const resolveMunicipioName = (attributes: CulturaTurismoAttributes): string => {
  const fromFeature = String(attributes.MUNICIPIO ?? '').trim()
  if (fromFeature) return fromFeature

  const municipioId = String(attributes.IDMUNICIPIO ?? '').trim()
  if (!municipioId) return ''

  return municipioById.get(municipioId) ?? ''
}

/**
 * Intenta detectar el campo más apropiado para nombre usando coincidencia
 * exacta y luego parcial contra una lista de candidatos.
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

  /**
   * Limpia gráficos/resultados de mapa vinculados al widget de resultados.
   */
  const clearMapResults = React.useCallback(() => {
   
    limpiarYCerrarWidgetResultados(widgetResultId)
  }, [widgetResultId])

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
   * Ejecuta la consulta principal con los filtros seleccionados y dibuja resultados.
   */
  const onBuscar = React.useCallback(async () => {
    if (!selectedSubcategoria) {
      setError('Debe seleccionar una subcategoría para buscar.')
      alertService.warning('Faltan datos', 'Seleccione una subcategoría antes de realizar la consulta.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const whereParts: string[] = []

      if (selectedMunicipio && municipioField) {
        whereParts.push(`${municipioField} = '${escapeSqlValue(selectedMunicipio)}'`)
      }

      if (selectedNombre && nombreField) {
        whereParts.push(`${nombreField} = '${escapeSqlValue(selectedNombre)}'`)
      }

      const selectedSubcategoriaCategoria = getSubcategoriaCategoria(selectedSubcategoria)

      if (selectedSubcategoriaCategoria) {
        whereParts.push(`CATEGORIA = '${escapeSqlValue(selectedSubcategoriaCategoria)}'`)
      } else if (categorias && selectedCategoria) {
        whereParts.push(`CATEGORIA = '${escapeSqlValue(categorias.find(option => option.value === selectedCategoria)?.label || '')}'`)
      }

      const where = whereParts.length > 0 ? whereParts.join(' AND ') : '1=1'
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
      })

      if (!features.length) {
        clearMapResults()
        alertService.warning('Sin resultados', 'No se encontraron resultados para los filtros seleccionados.')
        return
      }

      // Dibuja resultados en el mapa usando la función compartida y pasando el layerId para gestionar capas por subcategoría y evitar mezclas de resultados entre diferentes subcategorías
      await drawAndCenterFeatures(features, jimuMapView, graphicsLayer, setGraphicsLayer, `cultura-turismo-consulta-layer-${selectedSubcategoria}`)

      
      if (validaLoggerLocalStorage('logger')) {
        console.log({
          selectedCategoria,
          whereParts,
          where,
          layerUrl,
          features,
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
    clearMapResults,
    drawAndCenterFeatures,
    jimuMapView,
    municipioField,
    nombreField,
    props,
    selectedMunicipio,
    selectedNombre,
    selectedSubcategoria,
    subcategorias,
    widgetResultId
  ])

  /**
   * Limpia todos los filtros del formulario y restablece estado visual del mapa.
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
    setError('')

    clearMapResults()
    void resetToDefaultMapView()

    alertService.info('Formulario limpiado', 'Se limpiaron los filtros de Cultura y Turismo.')
  }, [clearMapResults, resetToDefaultMapView])

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
            disableSearch={loading || !selectedMunicipio}
            helpText="Seleccione temática, categoría y subcategoría. Puede filtrar por municipio y nombre para ubicar geometrías en el mapa."
            error={error}
          />
        </div>

        {loading && <OurLoading />}
      </div>
    </div>
  )
}

export default Widget
