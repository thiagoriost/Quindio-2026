import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Label, Select, Option } from 'jimu-ui'
import esriRequest from '@arcgis/core/request'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'

import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { AlertContainer } from '../../../shared/components/alert-container'
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import { urls } from '../../../api/serviciosQuindio'
import { ejecutarConsulta } from '../../../shared/utils/export.utils'
import { alertService } from '../../../shared/services/alert.service'
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from '../../../widget-result/src/runtime/widget'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'

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
}

const MUNICIPIO_FIELD_CANDIDATES = [
  'IDMUNICIPIO',
  'MUNICIPIO',
  'NOMBREMUNICIPIO',
  'NOM_MPIO',
  'NOM_MUNI',
  'MPIO'
]

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

const toUniqueOptions = (values: string[]) => {
  return Array.from(new Set(values.map(v => String(v).trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map(v => ({ value: v, label: v }))
}

const escapeSqlValue = (value: string) => value.replace(/'/g, "''")

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

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)
  const [graphicsLayer, setGraphicsLayer] = React.useState<GraphicsLayer | null>(null)

  const [allLayers, setAllLayers] = React.useState<LayerOption[]>([])
  const [tematicas, setTematicas] = React.useState<SelectOption[]>([])
  const [categorias, setCategorias] = React.useState<SelectOption[]>([])
  const [subcategorias, setSubcategorias] = React.useState<SelectOption[]>([])
  const [municipios, setMunicipios] = React.useState<SelectOption[]>([])
  const [nombres, setNombres] = React.useState<SelectOption[]>([])

  const [selectedTematica, setSelectedTematica] = React.useState('')
  const [selectedCategoria, setSelectedCategoria] = React.useState('')
  const [selectedSubcategoria, setSelectedSubcategoria] = React.useState('')
  const [selectedMunicipio, setSelectedMunicipio] = React.useState('')
  const [selectedNombre, setSelectedNombre] = React.useState('')

  const [rawNames, setRawNames] = React.useState<RawNameItem[]>([])
  const [municipioField, setMunicipioField] = React.useState<string | null>(null)
  const [nombreField, setNombreField] = React.useState<string | null>(null)

  const initialExtentRef = React.useRef<__esri.Extent | null>(null)
  const initialZoomRef = React.useRef<number | null>(null)
  const initialScaleRef = React.useRef<number | null>(null)

  const clearMapResults = React.useCallback(() => {
    if (graphicsLayer) {
      graphicsLayer.removeAll()
    }
    limpiarYCerrarWidgetResultados(widgetResultId)
  }, [graphicsLayer, widgetResultId])

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

  const activeViewChangeHandler = React.useCallback((view: JimuMapView) => {
    if (!view) return

    setJimuMapView(view)

    if (!initialExtentRef.current) {
      initialExtentRef.current = view.view.extent?.clone() ?? null
      initialZoomRef.current = typeof view.view.zoom === 'number' ? view.view.zoom : null
      initialScaleRef.current = typeof view.view.scale === 'number' ? view.view.scale : null
    }
  }, [])

  const loadLayerHierarchy = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await esriRequest(`${urls.SERVICIO_CULTURA_TURISMO}/layers`, {
        query: { f: 'json' },
        responseType: 'json'
      })

      const layers: LayerOption[] = (response.data?.layers || []).map((layer: any) => ({
        id: layer.id,
        name: layer.name,
        parentLayerId: layer.parentLayerId,
        subLayerIds: layer.subLayerIds || []
      }))

      setAllLayers(layers)

      const roots = layers.filter(layer => layer.parentLayerId === -1)
      const tematicasOptions = roots.length > 0
        ? roots.map(layer => ({ value: String(layer.id), label: layer.name }))
        : [{ value: 'all', label: 'General' }]

      setTematicas(tematicasOptions)
    } catch (err) {
      console.error('Error cargando jerarquía de capas de Cultura y Turismo:', err)
      alertService.error('Error', 'No fue posible cargar las capas de Cultura y Turismo.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadLayerHierarchy()
  }, [loadLayerHierarchy])

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
      setCategorias(fallbackCategories)
      setSelectedCategoria('')
      setSubcategorias([])
      setSelectedSubcategoria('')
      return
    }

    const tematicaId = Number(selectedTematica)
    const children = allLayers.filter(layer => layer.parentLayerId === tematicaId)

    if (children.length === 0) {
      const ownLayer = allLayers.find(layer => layer.id === tematicaId)
      setCategorias(ownLayer ? [{ value: String(ownLayer.id), label: ownLayer.name }] : [])
      setSelectedCategoria(ownLayer ? String(ownLayer.id) : '')
      return
    }

    setCategorias(children.map(layer => ({ value: String(layer.id), label: layer.name })))
    setSelectedCategoria('')
    setSubcategorias([])
    setSelectedSubcategoria('')
  }, [selectedTematica, allLayers])

  React.useEffect(() => {
    if (!selectedCategoria) {
      setSubcategorias([])
      setSelectedSubcategoria('')
      return
    }

    const categoriaId = Number(selectedCategoria)
    const children = allLayers.filter(layer => layer.parentLayerId === categoriaId)

    if (children.length === 0) {
      const ownLayer = allLayers.find(layer => layer.id === categoriaId)
      const fallback = ownLayer ? [{ value: String(ownLayer.id), label: ownLayer.name }] : []
      setSubcategorias(fallback)
      setSelectedSubcategoria(fallback[0]?.value ?? '')
      return
    }

    setSubcategorias(children.map(layer => ({ value: String(layer.id), label: layer.name })))
    setSelectedSubcategoria('')
  }, [selectedCategoria, allLayers])

  const loadMunicipiosAndNombres = React.useCallback(async (layerId: number) => {
    setLoading(true)
    try {
      const url = `${urls.SERVICIO_CULTURA_TURISMO}/${layerId}`
      const features = await ejecutarConsulta({
        url,
        where: '1=1',
        campos: ['*'],
        returnGeometry: false
      })

      if (!features.length) {
        setMunicipios([])
        setNombres([])
        setRawNames([])
        setMunicipioField(null)
        setNombreField(null)
        alertService.info('Sin datos', 'La subcategoría seleccionada no tiene registros disponibles.')
        return
      }

      const attributeNames = Object.keys(features[0].attributes || {})
      const detectedMunicipioField = guessField(attributeNames, MUNICIPIO_FIELD_CANDIDATES)
      const detectedNombreField = guessField(attributeNames, NOMBRE_FIELD_CANDIDATES) || attributeNames[0]

      setMunicipioField(detectedMunicipioField)
      setNombreField(detectedNombreField)

      const nextRawNames: RawNameItem[] = features
        .map(feature => {
          const municipio = detectedMunicipioField ? String(feature.attributes?.[detectedMunicipioField] ?? '') : ''
          const nombre = String(feature.attributes?.[detectedNombreField] ?? '')
          return { municipio: municipio.trim(), nombre: nombre.trim() }
        })
        .filter(item => item.nombre)

      setRawNames(nextRawNames)
      setNombres(toUniqueOptions(nextRawNames.map(item => item.nombre)))

      if (detectedMunicipioField) {
        setMunicipios(toUniqueOptions(nextRawNames.map(item => item.municipio).filter(Boolean)))
      } else {
        setMunicipios([])
      }
    } catch (err) {
      console.error('Error cargando municipios y nombres para Cultura y Turismo:', err)
      alertService.error('Error', 'No fue posible cargar municipios y nombres para la subcategoría seleccionada.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    setSelectedMunicipio('')
    setSelectedNombre('')
    setMunicipios([])
    setNombres([])
    setRawNames([])
    setMunicipioField(null)
    setNombreField(null)

    if (!selectedSubcategoria) return

    void loadMunicipiosAndNombres(Number(selectedSubcategoria))
  }, [selectedSubcategoria, loadMunicipiosAndNombres])

  React.useEffect(() => {
    if (!selectedMunicipio) {
      setNombres(toUniqueOptions(rawNames.map(item => item.nombre)))
      setSelectedNombre('')
      return
    }

    const filtered = rawNames
      .filter(item => item.municipio === selectedMunicipio)
      .map(item => item.nombre)

    setNombres(toUniqueOptions(filtered))
    setSelectedNombre('')
  }, [selectedMunicipio, rawNames])

  const drawAndCenterFeatures = React.useCallback(async (features: __esri.Graphic[]) => {
    if (!jimuMapView || !features?.length) return

    const view = jimuMapView.view
    let layer = graphicsLayer

    if (!layer) {
      layer = new GraphicsLayer({ id: 'cultura-turismo-consulta-layer' })
      view.map.add(layer)
      setGraphicsLayer(layer)
    }

    layer.removeAll()

    const graphics = features
      .filter(feature => !!feature.geometry)
      .map(feature => {
        const geometryType = feature.geometry.type

        const symbol = geometryType === 'polygon'
          ? {
              type: 'simple-fill',
              color: [255, 165, 0, 0.2],
              outline: { color: [255, 69, 0], width: 2 }
            }
          : geometryType === 'polyline'
            ? {
                type: 'simple-line',
                color: [255, 69, 0, 0.9],
                width: 2
              }
            : {
                type: 'simple-marker',
                style: 'circle',
                size: '8px',
                color: [255, 69, 0, 0.9],
                outline: { color: [255, 255, 255, 0.9], width: 1 }
              }

        return new Graphic({
          geometry: feature.geometry,
          attributes: feature.attributes,
          // @ts-expect-error - El tipo de symbol no se reconoce correctamente, revisar tipos de Graphic
          symbol
        })
      })

    if (!graphics.length) {
      alertService.warning('Sin geometrías', 'Los registros encontrados no tienen geometría para ubicar en el mapa.')
      return
    }

    layer.addMany(graphics)
    await view.goTo(graphics.map(graphic => graphic.geometry))
  }, [graphicsLayer, jimuMapView])

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

      const where = whereParts.length > 0 ? whereParts.join(' AND ') : '1=1'
      const layerUrl = `${urls.SERVICIO_CULTURA_TURISMO}/${selectedSubcategoria}`

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

      await drawAndCenterFeatures(features)

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
        `Consulta Cultura y Turismo - ${subcategoriaLabel}`
      )

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

  const onLimpiar = React.useCallback(() => {
    setSelectedTematica('')
    setSelectedCategoria('')
    setSelectedSubcategoria('')
    setSelectedMunicipio('')
    setSelectedNombre('')

    setCategorias([])
    setSubcategorias([])
    setMunicipios([])
    setNombres([])
    setRawNames([])

    setMunicipioField(null)
    setNombreField(null)
    setError('')

    clearMapResults()
    void resetToDefaultMapView()

    alertService.info('Formulario limpiado', 'Se limpiaron los filtros de Cultura y Turismo.')
  }, [clearMapResults, resetToDefaultMapView])

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
        <div className="cultura-form-grid">
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

          <Label>Municipio:</Label>
          <Select
            value={selectedMunicipio}
            disabled={loading || municipios.length === 0}
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
        </div>

        <SearchActionBar
          onSearch={onBuscar}
          onClear={onLimpiar}
          loading={loading}
          disableSearch={loading || !selectedSubcategoria}
          helpText="Seleccione temática, categoría y subcategoría. Puede filtrar por municipio y nombre para ubicar geometrías en el mapa."
          error={error}
        />

        {loading && <OurLoading />}
      </div>
    </div>
  )
}

export default Widget
