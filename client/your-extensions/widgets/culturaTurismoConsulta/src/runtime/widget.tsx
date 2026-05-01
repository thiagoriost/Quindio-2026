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
import { drawAndCenterFeatures, ejecutarConsulta, validaLoggerLocalStorage } from '../../../shared/utils/export.utils'
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
  IDMUNICIPIO: string
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

const toUniqueOptions = (values: string[]) => {
  if (values.length < 1) return []
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

  const [stado, setStado] = React.useState<Record<string, any>>({})

  const initialExtentRef = React.useRef<__esri.Extent | null>(null)
  const initialZoomRef = React.useRef<number | null>(null)
  const initialScaleRef = React.useRef<number | null>(null)

  const clearMapResults = React.useCallback(() => {
   
    limpiarYCerrarWidgetResultados(widgetResultId)
  }, [widgetResultId])

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

  const activeViewChangeHandler = ((view: JimuMapView) => {
    if (!view) return

    setJimuMapView(view)

    if (!initialExtentRef.current) {
      initialExtentRef.current = view.view.extent?.clone() ?? null
      initialZoomRef.current = typeof view.view.zoom === 'number' ? view.view.zoom : null
      initialScaleRef.current = typeof view.view.scale === 'number' ? view.view.scale : null
    }
  })

  const loadLayerHierarchy = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await esriRequest(`${urls.SERVICIO_CULTURA_TURISMO}/layers`, {
        query: { f: 'json' },
        responseType: 'json'
      })

      const rawLayers = response.data?.layers || []
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

    const categoriasOptions = children.map(layer => ({ value: String(layer.id), label: layer.name }))    
    setCategorias(categoriasOptions)
    setSelectedCategoria('')
    setSubcategorias([])
    setSelectedSubcategoria('')
    setStado({ ...stado, categoriasOptions, children, tematicaId, selectedTematica })
    if (validaLoggerLocalStorage('logger')) {
      console.log({
        selectedTematica,
        tematicaId,
        children,
        categoriasOptions
      })
    }
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
      setStado({ ...stado, ...updateState })
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
   
    setStado({ ...stado, ...updateState })

  }, [selectedCategoria, allLayers])

  const loadMunicipiosAndNombres = React.useCallback(async (layerId: number) => {
    setLoading(true)
    try {
      const url = `${urls.SERVICIO_CULTURA_TURISMO}/${layerId}`

      // Consulta para traer solo municipios sin repetidos (como la consulta de años en socioeconomica)
      const municipioFeatures = await ejecutarConsulta({
        url,
        where: '1=1',
        campos: ['MUNICIPIO', 'IDMUNICIPIO'],
        returnGeometry: false,
        orderByFields: 'MUNICIPIO',
        returnDistinctValues: true
      })

      if (!municipioFeatures.length) {
        setMunicipios([])
        setNombres([])
        setRawNames([])
        setMunicipioField(null)
        setNombreField(null)
        alertService.info('Sin datos', 'La subcategoría seleccionada no tiene registros disponibles.')
        return
      }

      setMunicipioField('IDMUNICIPIO') // Asumimos que el campo de municipio es IDMUNICIPIO para facilitar la consulta de nombres luego, si no se encuentra el campo se limpia todo igual
      const municipiosOptions = municipioFeatures
        .map(f => {
          const val = String(f.attributes?.MUNICIPIO ?? '').trim()
          const IDMUNICIPIO = String(f.attributes?.IDMUNICIPIO).trim()
          return { value: IDMUNICIPIO, label: val }
        })
        .filter(o => o.value)
      setMunicipios(municipiosOptions)

      // Consulta completa para poblar nombres
      const features = await ejecutarConsulta({
        url,
        where: '1=1',
        campos: ['*'],
        returnGeometry: false
      })

      if (!features.length) {
        setNombres([])
        setRawNames([])
        setNombreField(null)
        return
      }

      const attributeNames = Object.keys(features[0].attributes || {})
      const detectedNombreField = guessField(attributeNames, NOMBRE_FIELD_CANDIDATES) || attributeNames[0]
      setNombreField(detectedNombreField)

      const nextRawNames: RawNameItem[] = features
        .map(feature => {
          const municipio = String(feature.attributes?.MUNICIPIO ?? '').trim()
          const nombre = String(feature.attributes?.[detectedNombreField] ?? '').trim()
          const IDMUNICIPIO = String(feature.attributes?.IDMUNICIPIO).trim()
          return { municipio, nombre, IDMUNICIPIO }
        })
        .filter(item => item.nombre)

      setRawNames(nextRawNames)
      setNombres(toUniqueOptions(nextRawNames.map(item => item.nombre)))
      const state = {
        url,
        municipioFeatures,
        municipiosOptions,
        features,
        attributeNames,
        detectedNombreField,
        nextRawNames
      }        
      setStado({ ...stado, ...state })
    if (validaLoggerLocalStorage('logger')) console.log(state)
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
      .filter(item => item.IDMUNICIPIO === selectedMunicipio)
      .map(item => item.nombre)
    if (validaLoggerLocalStorage('logger')) {
        console.log({
          selectedMunicipio,
          rawNames,
          filtered
        })
    }
    setNombres(toUniqueOptions(filtered))
    setSelectedNombre('')
  }, [selectedMunicipio, rawNames])

  

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

      if (categorias && selectedCategoria) {
        whereParts.push(`CATEGORIA = '${escapeSqlValue(categorias.find(option => option.value === selectedCategoria)?.label || '')}'`)
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
        </div>

        <SearchActionBar
          onSearch={onBuscar}
          onClear={onLimpiar}
          loading={loading}
          disableSearch={loading || !selectedMunicipio}
          helpText="Seleccione temática, categoría y subcategoría. Puede filtrar por municipio y nombre para ubicar geometrías en el mapa."
          error={error}
        />

        {loading && <OurLoading />}
      </div>
    </div>
  )
}

export default Widget
