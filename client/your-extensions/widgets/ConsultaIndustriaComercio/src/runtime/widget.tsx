import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Checkbox, Label, Option, Select } from 'jimu-ui'
import esriRequest from '@arcgis/core/request'
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'

import { SearchActionBar } from '../../../shared/components/search-action-bar'
import { AlertContainer } from '../../../shared/components/alert-container'
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
import { urls } from '../../../api/serviciosQuindio'
import { drawAndCenterFeatures, ejecutarConsulta, validaLoggerLocalStorage, featuresFixed, adjustFieldsForResultsWidget } from '../../../shared/utils/export.utils'
import { alertService } from '../../../shared/services/alert.service'
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from '../../../widget-result/src/runtime/widget'
import { WIDGET_IDS } from '../../../shared/constants/widget-ids'
import { MUNICIPIOS_QUINDIO } from '../../../shared/constants/municipiosQuindio'

// @ts-expect-error - No se encuentran los tipos de estas funciones, revisar exportaciones del build CSS
import '../styles/styles.css'

/** Opción genérica para controles {@link Select}/{@link Option} de jimu-ui. */
interface SelectOption {
  /** Valor interno de la opción (se envía en la consulta). */
  value: string
  /** Texto visible para el usuario. */
  label: string
}

/** Descriptor de capa devuelto por el endpoint de capas del servicio de Industria y Comercio. */
interface ConsultaLayer {
  /** Identificador numérico de la capa en el servicio. */
  id: number
  /** Nombre legible de la capa. */
  name: string
}

/**
 * Atributos de un feature del servicio de Industria y Comercio.
 * El índice de cadena permite acceder a campos adicionales no enumerados explícitamente.
 */
interface IndustriaComercioAttributes {
  /** Identificador de objeto del feature. */
  OBJECTID?: number
  /** Identificador del municipio al que pertenece el establecimiento. */
  IDMUNICIPIO?: string | number
  /** Nombre del municipio (puede estar ausente en el servicio). */
  MUNICIPIO?: string
  /** Nombre del establecimiento. */
  NOMBRE?: string
  /** Tipo de establecimiento (p. ej. «Restaurante», «Hotel»). */
  TIPOESTABLECIMIENTO?: string
  /** Campos adicionales presentes en el servicio. */
  [key: string]: string | number | null | undefined
}

/** Feature del servicio de Industria y Comercio que combina atributos y geometría opcional. */
interface IndustriaComercioFeature {
  /** Atributos del establecimiento. */
  attributes: IndustriaComercioAttributes
  /** Geometría del feature (ausente cuando se consulta sin geometría). */
  geometry?: __esri.Geometry
}

/**
 * Lista ordenada de campos que se solicitan al servicio y se muestran en la tabla de resultados.
 * Debe coincidir con los campos publicados en el servicio de Industria y Comercio.
 */
const FINAL_OUT_FIELDS = [
  'OBJECTID',
  'SHAPE',
  'CONDICION',
  'ESTRATO',
  'IDVEREDA',
  'IDMANZANA',
  'NUMEROPREDIAL',
  'PREDIO',
  'REPORTE',
  'TIPOAVALUO',
  'IDMUNICIPIO',
  'NOMBRE',
  'NIT',
  'URL',
  'NITREPRESENTANTE',
  'CIIU',
  'RNT',
  'EMAIL',
  'REGISTROMERCANTIL',
  'IMAGEN',
  'IDTIPOESTABLECIMIENTO',
  'TIPOESTABLECIMIENTO',
  'IDTIPOSERVAGENCIA',
  'SERVICIO_AGENCIA',
  'TELEFONO',
  'FAX',
  'UBICACION',
  'CONTADORENERGIA',
  'CONTADORAGUA',
  'CODIGOPOSTAL',
  'CONTADORGAS',
  'CONTADORCABLE',
  'SHAPE.AREA',
  'SHAPE.LEN'
]

/**
 * Normaliza una lista de cadenas a opciones de select únicas y ordenadas alfabéticamente.
 * @param {string[]} values - Arreglo de cadenas a normalizar.
 * @returns {SelectOption[]} Arreglo de {@link SelectOption} deduplicado y ordenado en español.
 */
const toUniqueOptions = (values: string[]) => {
  if (values.length < 1) return []

  return Array.from(new Set(values.map(value => String(value).trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map(value => ({ value, label: value }))
}

/**
 * Escapa comillas simples en una cadena para su uso seguro en cláusulas SQL.
 * @param {string} value - Cadena de entrada a escapar.
 * @returns {string} Cadena con comillas simples duplicadas (`'` → `''`).
 */
const escapeSqlValue = (value: string) => value.replace(/'/g, "''")

/**
 * Mapa de lookup que relaciona `IDMUNICIPI` con el nombre del municipio,
 * construido a partir del catálogo {@link MUNICIPIOS_QUINDIO}.
 */
const municipioById = new Map(
  MUNICIPIOS_QUINDIO.map(item => [String(item.IDMUNICIPI).trim(), String(item.NOMBRE).trim()])
)

/**
 * Resuelve el nombre de un municipio a partir de su identificador.
 * @param {string} municipioId - Identificador del municipio (`IDMUNICIPIO`).
 * @returns {string} Nombre del municipio según {@link MUNICIPIOS_QUINDIO}, o cadena vacía si no se encuentra.
 */
const resolveMunicipioName = (municipioId: string) => municipioById.get(municipioId.trim()) ?? ''

/**
 * Widget de consulta de Industria y Comercio para ArcGIS Experience Builder.
 *
 * Permite filtrar establecimientos por capa de servicio, municipio, tipo de establecimiento
 * y opcionalmente por nombre. Los resultados se dibujan en el mapa y se abren en la tabla
 * de resultados del widget vinculado.
 *
 * @param {AllWidgetProps<any>} props - Propiedades estándar inyectadas por Experience Builder.
 * @returns {JSX.Element} Panel de formulario con filtros encadenados y barra de acciones.
 */
const Widget = (props: AllWidgetProps<any>) => {
  const widgetResultId = WIDGET_IDS.RESULT

  /** Estado de carga global del widget (consultas al servicio). */
  const [loading, setLoading] = React.useState(false)
  /** Mensaje de error visible en la barra de acciones del formulario. */
  const [error, setError] = React.useState('')

  /** Vista activa del mapa para navegación y dibujo de resultados. */
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)
  /** Capa gráfica temporal usada para renderizar los resultados de la consulta. */
  const [graphicsLayer, setGraphicsLayer] = React.useState<GraphicsLayer | null>(null)

  /** Opciones disponibles en el select «Consulta por» (capas del servicio). */
  const [consultaOptions, setConsultaOptions] = React.useState<SelectOption[]>([])
  /** Opciones disponibles en el select «Municipio». */
  const [municipioOptions, setMunicipioOptions] = React.useState<SelectOption[]>([])
  /** Opciones disponibles en el select «Tipo establecimiento». */
  const [tipoEstablecimientoOptions, setTipoEstablecimientoOptions] = React.useState<SelectOption[]>([])
  /** Opciones disponibles en el select «Nombre establecimiento». */
  const [nombreOptions, setNombreOptions] = React.useState<SelectOption[]>([])

  /** Identificador de la capa seleccionada en «Consulta por». */
  const [selectedConsultaPor, setSelectedConsultaPor] = React.useState('')
  /** Identificador del municipio seleccionado (`IDMUNICIPIO`). */
  const [selectedMunicipio, setSelectedMunicipio] = React.useState('')
  /** Nombre del tipo de establecimiento seleccionado. */
  const [selectedTipoEstablecimiento, setSelectedTipoEstablecimiento] = React.useState('')
  /** Nombre del establecimiento seleccionado (activo solo cuando {@link consultarPorNombre} es `true`). */
  const [selectedNombre, setSelectedNombre] = React.useState('')
  /** Indica si el filtro por nombre de establecimiento está habilitado. */
  const [consultarPorNombre, setConsultarPorNombre] = React.useState(false)

  /** Extensión inicial del mapa para restablecer la vista al limpiar. */
  const initialExtentRef = React.useRef<__esri.Extent | null>(null)
  /** Zoom inicial del mapa para restablecer la vista al limpiar. */
  const initialZoomRef = React.useRef<number | null>(null)
  /** Escala inicial del mapa para restablecer la vista al limpiar. */
  const initialScaleRef = React.useRef<number | null>(null)

  /**
   * URL completa de la capa seleccionada en «Consulta por».
   * Devuelve cadena vacía cuando no hay capa seleccionada.
   * @type {string}
   */
  const selectedLayerUrl = React.useMemo(() => {
    if (!selectedConsultaPor) return ''
    return `${urls.SERVICIO_INDUSTRIA_COMERCIO}/${selectedConsultaPor}`
  }, [selectedConsultaPor])

  /**
   * Elimina todos los gráficos de la capa temporal del mapa.
   * @returns {void}
   */
  const clearGraphics = React.useCallback(() => {
    graphicsLayer?.removeAll()
  }, [graphicsLayer])

  /**
   * Limpia gráficos del mapa y cierra la tabla de resultados del widget vinculado.
   * @returns {void}
   */
  const clearResults = React.useCallback(() => {
    clearGraphics()
    limpiarYCerrarWidgetResultados(widgetResultId)
  }, [clearGraphics, widgetResultId])

  /**
   * Restablece la vista del mapa a la extensión, zoom y escala capturados al montar el widget.
   * @returns {void}
   */
  const resetToDefaultMapView = React.useCallback(() => {
    const view = jimuMapView?.view
    const initialExtent = initialExtentRef.current

    if (!view || !initialExtent) return

    setTimeout(async () => {
      await view.goTo({ target: initialExtent })
    }, 2000)

    if (typeof initialZoomRef.current === 'number') {
      view.zoom = initialZoomRef.current
    }

    if (typeof initialScaleRef.current === 'number') {
      view.scale = initialScaleRef.current
    }
  }, [jimuMapView])

  /**
   * Captura la vista activa del mapa al activarse el componente {@link JimuMapViewComponent}.
   * Persiste la extensión, zoom y escala iniciales para poder restablecerlos al limpiar.
   * @param {JimuMapView} view - Vista del mapa recién activada.
   * @returns {void}
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

  /**
   * Carga las capas disponibles en el servicio de Industria y Comercio y las expone
   * como opciones del select «Consulta por».
   *
   * **Efecto secundario:** actualiza {@link consultaOptions} y el estado de carga.
   * @returns {Promise<void>}
   */
  const loadConsultaPorOptions = React.useCallback(async () => {
    setLoading(true)

    try {
      const response = await esriRequest(`${urls.SERVICIO_INDUSTRIA_COMERCIO}?f=json`, {
        responseType: 'json'
      })

      const layers = (response.data?.layers ?? []) as ConsultaLayer[]
      const nextOptions = layers
        .map(layer => ({ value: String(layer.id), label: String(layer.name).trim() }))
        .filter(option => option.label)
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))

      setConsultaOptions(nextOptions)

      if (validaLoggerLocalStorage('logger')) {
        console.log({
          url: urls.SERVICIO_INDUSTRIA_COMERCIO,
          layers,
          nextOptions
        })
      }
    } catch (err) {
      console.error('Error cargando opciones de Consulta por en Industria y Comercio:', err)
      alertService.error('Error', 'No fue posible cargar las opciones de consulta de Industria y Comercio.')
    } finally {
      setLoading(false)
    }
  }, [])

  /** Carga las opciones de «Consulta por» al montar el widget. */
  React.useEffect(() => {
    void loadConsultaPorOptions()
  }, [loadConsultaPorOptions])

  /**
   * Reinicia todos los filtros y opciones que dependen del municipio
   * (municipio, tipo de establecimiento, nombre y sus respectivas listas).
   * @returns {void}
   */
  const resetMunicipioDependencies = React.useCallback(() => {
    setSelectedMunicipio('')
    setSelectedTipoEstablecimiento('')
    setSelectedNombre('')
    setConsultarPorNombre(false)
    setMunicipioOptions([])
    setTipoEstablecimientoOptions([])
    setNombreOptions([])
  }, [])

  /**
   * Consulta los municipios disponibles en la capa seleccionada y los expone
   * como opciones del select «Municipio».
   *
   * **Efecto secundario:** actualiza {@link municipioOptions} y el estado de carga.
   * **Dependencias:** {@link selectedLayerUrl}.
   * @returns {Promise<void>}
   */
  const loadMunicipios = React.useCallback(async () => {
    if (!selectedLayerUrl) {
      setMunicipioOptions([])
      return
    }

    setLoading(true)

    try {
      const features = (await ejecutarConsulta({
        url: selectedLayerUrl,
        where: '1=1',
        campos: ['IDMUNICIPIO'],
        returnGeometry: false
      })) as IndustriaComercioFeature[]

      const nextMunicipios = Array.from(new Set(
        features
          .map(feature => String(feature.attributes?.IDMUNICIPIO ?? '').trim())
          .filter(Boolean)
      ))
        .map(municipioId => ({ value: municipioId, label: resolveMunicipioName(municipioId) }))
        .filter(option => option.label)
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))

      setMunicipioOptions(nextMunicipios)

      if (validaLoggerLocalStorage('logger')) {
        console.log({
          selectedLayerUrl,
          totalFeatures: features.length,
          nextMunicipios
        })
      }
    } catch (err) {
      console.error('Error cargando municipios de Industria y Comercio:', err)
      alertService.error('Error', 'No fue posible cargar los municipios de Industria y Comercio.')
    } finally {
      setLoading(false)
    }
  }, [selectedLayerUrl])

  /**
   * Reinicia dependencias y recarga municipios cada vez que cambia «Consulta por».
   * Si no hay capa seleccionada, solo reinicia sin disparar la carga.
   */
  React.useEffect(() => {
    resetMunicipioDependencies()

    if (!selectedConsultaPor) return

    void loadMunicipios()
  }, [selectedConsultaPor, loadMunicipios, resetMunicipioDependencies])

  /**
   * Consulta los tipos de establecimiento disponibles para el municipio seleccionado
   * y los expone como opciones del select «Tipo establecimiento».
   *
   * **Efecto secundario:** actualiza {@link tipoEstablecimientoOptions} y el estado de carga.
   * **Dependencias:** {@link selectedLayerUrl}, {@link selectedMunicipio}.
   * @returns {Promise<void>}
   */
  const loadTiposEstablecimiento = React.useCallback(async () => {
    if (!selectedLayerUrl || !selectedMunicipio) {
      setTipoEstablecimientoOptions([])
      return
    }

    setLoading(true)

    try {
      const features = (await ejecutarConsulta({
        url: selectedLayerUrl,
        where: `IDMUNICIPIO = '${escapeSqlValue(selectedMunicipio)}'`,
        campos: ['TIPOESTABLECIMIENTO'],
        returnGeometry: false,
        orderByFields: 'TIPOESTABLECIMIENTO'
      })) as IndustriaComercioFeature[]

      const nextTipos = toUniqueOptions(
        features.map(feature => String(feature.attributes?.TIPOESTABLECIMIENTO ?? '').trim())
      )

      setTipoEstablecimientoOptions(nextTipos)

      if (validaLoggerLocalStorage('logger')) {
        console.log({
          selectedLayerUrl,
          selectedMunicipio,
          nextTipos
        })
      }
    } catch (err) {
      console.error('Error cargando tipos de establecimiento:', err)
      alertService.error('Error', 'No fue posible cargar los tipos de establecimiento.')
    } finally {
      setLoading(false)
    }
  }, [selectedLayerUrl, selectedMunicipio])

  /**
   * Reinicia los filtros de tipo y nombre, y recarga tipos de establecimiento
   * cada vez que cambia el municipio seleccionado.
   */
  React.useEffect(() => {
    setSelectedTipoEstablecimiento('')
    setSelectedNombre('')
    setConsultarPorNombre(false)
    setTipoEstablecimientoOptions([])
    setNombreOptions([])

    if (!selectedMunicipio) return

    void loadTiposEstablecimiento()
  }, [selectedMunicipio, loadTiposEstablecimiento])

  /**
   * Consulta los nombres de establecimiento disponibles para el municipio y tipo seleccionados,
   * y los expone como opciones del select «Nombre establecimiento».
   *
   * **Efecto secundario:** actualiza {@link nombreOptions} y el estado de carga.
   * **Dependencias:** {@link selectedLayerUrl}, {@link selectedMunicipio}, {@link selectedTipoEstablecimiento}.
   * @returns {Promise<void>}
   */
  const loadNombresEstablecimiento = React.useCallback(async () => {
    if (!selectedLayerUrl || !selectedMunicipio || !selectedTipoEstablecimiento) {
      setNombreOptions([])
      return
    }

    setLoading(true)

    try {
      const features = (await ejecutarConsulta({
        url: selectedLayerUrl,
        where: `IDMUNICIPIO = '${escapeSqlValue(selectedMunicipio)}' AND TIPOESTABLECIMIENTO = '${escapeSqlValue(selectedTipoEstablecimiento)}'`,
        campos: ['NOMBRE'],
        returnGeometry: false,
        orderByFields: 'NOMBRE'
      })) as IndustriaComercioFeature[]

      const nextNombres = toUniqueOptions(
        features.map(feature => String(feature.attributes?.NOMBRE ?? '').trim())
      )

      setNombreOptions(nextNombres)

      if (validaLoggerLocalStorage('logger')) {
        console.log({
          selectedLayerUrl,
          selectedMunicipio,
          selectedTipoEstablecimiento,
          nextNombres
        })
      }
    } catch (err) {
      console.error('Error cargando nombres de establecimientos:', err)
      alertService.error('Error', 'No fue posible cargar los nombres de los establecimientos.')
    } finally {
      setLoading(false)
    }
  }, [selectedLayerUrl, selectedMunicipio, selectedTipoEstablecimiento])

  /**
   * Reinicia el filtro de nombre y recarga nombres de establecimiento
   * cada vez que cambia el tipo de establecimiento seleccionado.
   */
  React.useEffect(() => {
    setSelectedNombre('')
    setConsultarPorNombre(false)
    setNombreOptions([])

    if (!selectedTipoEstablecimiento) return

    void loadNombresEstablecimiento()
  }, [selectedTipoEstablecimiento, loadNombresEstablecimiento])

  /**
   * Indica si el formulario tiene los filtros mínimos necesarios para ejecutar una consulta.
   * Requiere capa, municipio y tipo de establecimiento; si {@link consultarPorNombre} está activo,
   * también exige un nombre seleccionado.
   */
  const canSearch = !!selectedConsultaPor
    && !!selectedMunicipio
    && !!selectedTipoEstablecimiento
    && (!consultarPorNombre || !!selectedNombre)

  /**
   * Ejecuta la consulta principal con los filtros seleccionados, dibuja los resultados en el mapa
   * y los muestra en la tabla de resultados del widget vinculado.
   *
   * Valida que los filtros obligatorios estén completos antes de consultar.
   * **Dependencias:** {@link selectedLayerUrl}, {@link selectedMunicipio}, {@link selectedTipoEstablecimiento},
   * {@link consultarPorNombre}, {@link selectedNombre}.
   * @returns {Promise<void>}
   */
  const onBuscar = React.useCallback(async () => {
    if (!selectedLayerUrl) {
      setError('Debe seleccionar un valor en Consulta por.')
      return
    }

    if (!selectedMunicipio || !selectedTipoEstablecimiento) {
      setError('Debe seleccionar municipio y tipo de establecimiento para buscar.')
      alertService.warning('Faltan datos', 'Seleccione municipio y tipo de establecimiento antes de buscar.')
      return
    }

    if (consultarPorNombre && !selectedNombre) {
      setError('Debe seleccionar un nombre de establecimiento para buscar.')
      alertService.warning('Faltan datos', 'Seleccione el nombre del establecimiento antes de buscar.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const whereParts = [
        `IDMUNICIPIO = '${escapeSqlValue(selectedMunicipio)}'`,
        `TIPOESTABLECIMIENTO = '${escapeSqlValue(selectedTipoEstablecimiento)}'`
      ]

      if (consultarPorNombre && selectedNombre) {
        whereParts.push(`NOMBRE = '${escapeSqlValue(selectedNombre)}'`)
      }

      const where = whereParts.join(' AND ')
      const features = await ejecutarConsulta({
        url: selectedLayerUrl,
        where,
        campos: FINAL_OUT_FIELDS,
        returnGeometry: true
      })

      if (!features.length) {
        clearResults()
        alertService.warning('Sin resultados', 'No se encontraron resultados para los filtros seleccionados.')
        return
      }

      if (selectedNombre !== "") { // Solo dibuja en el mapa cuando se consulta por un establecimiento específico, para evitar saturar la vista con muchos resultados
        const scale = {modifyScale: true, scale:5, modifyZoom: false, zoom:20}
        await drawAndCenterFeatures(
          scale,
          features,
          jimuMapView,
          graphicsLayer,
          setGraphicsLayer,
          `industria-comercio-layer-${selectedConsultaPor}`
        )
      }

      const fields = adjustFieldsForResultsWidget(features)
      const fixedFeatures = featuresFixed(features)

      abrirTablaResultados(
        false,
        fixedFeatures,
        fields,
        props,
        widgetResultId,
        features[0]?.geometry?.spatialReference || jimuMapView?.view?.spatialReference,
        `Consulta Industria y Comercio - ${selectedTipoEstablecimiento}`,
        { showGraphic: false }
      )

      if (validaLoggerLocalStorage('logger')) {
        console.log({
          fields,
          selectedLayerUrl,
          where,
          totalResults: features.length,
          features
        })
      }

      alertService.success('Consulta completada', `Se encontraron ${features.length} registros.`)
    } catch (err) {
      console.error('Error consultando Industria y Comercio:', err)
      alertService.error('Error', 'Ocurrio un error al consultar Industria y Comercio.')
    } finally {
      setLoading(false)
    }
  }, [
    clearResults,
    consultarPorNombre,
    graphicsLayer,
    jimuMapView,
    props,
    selectedConsultaPor,
    selectedLayerUrl,
    selectedMunicipio,
    selectedNombre,
    selectedTipoEstablecimiento,
    widgetResultId
  ])

  /**
   * Reinicia todos los filtros del formulario, limpia gráficos y resultados del mapa,
   * y restablece la vista del mapa a su estado inicial.
   * @returns {void}
   */
  const onLimpiar = React.useCallback(() => {
    setSelectedConsultaPor('')
    setSelectedMunicipio('')
    setSelectedTipoEstablecimiento('')
    setSelectedNombre('')
    setConsultarPorNombre(false)

    setMunicipioOptions([])
    setTipoEstablecimientoOptions([])
    setNombreOptions([])

    setError('')

    clearResults()
    resetToDefaultMapView()
  }, [clearResults, resetToDefaultMapView])

  /** Limpia automáticamente el formulario y el mapa cuando el widget es cerrado por el usuario. */
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
          <Label>Consulta por:</Label>
          <Select
            value={selectedConsultaPor}
            disabled={loading || consultaOptions.length === 0}
            onChange={(e) => {
              clearResults()
              setSelectedConsultaPor(e.target.value)
              setError('')
            }}
          >
            <Option value="">Seleccione...</Option>
            {consultaOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <Label>Municipio:</Label>
          <Select
            value={selectedMunicipio}
            disabled={loading || !selectedConsultaPor || municipioOptions.length === 0}
            onChange={(e) => {
              clearResults()
              setSelectedMunicipio(e.target.value)
              setError('')
            }}
          >
            <Option value="">Seleccione...</Option>
            {municipioOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <Label>Tipo establecimiento:</Label>
          <Select
            value={selectedTipoEstablecimiento}
            disabled={loading || !selectedMunicipio || tipoEstablecimientoOptions.length === 0}
            onChange={(e) => {
              clearResults()
              setSelectedTipoEstablecimiento(e.target.value)
              setError('')
            }}
          >
            <Option value="">Seleccione...</Option>
            {tipoEstablecimientoOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <div className="consulta-widget__checkbox-row">
            <Label style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
              <Checkbox
                checked={consultarPorNombre}
                disabled={loading || !selectedTipoEstablecimiento || nombreOptions.length === 0}
                onChange={(e, checked) => {
                  clearResults()
                  setConsultarPorNombre(checked)
                  if (!checked) {
                    setSelectedNombre('')
                  }
                  setError('')
                }}
              />
              <span>Consultar por nombre establecimiento</span>
            </Label>
          </div>

          {consultarPorNombre && (
            <>
              <Label>
                <span className="consulta-widget__inline-label">Nombre establecimiento:</span>
              </Label>
              <Select
                value={selectedNombre}
                disabled={loading || nombreOptions.length === 0}
                onChange={(e) => {
                  clearResults()
                  setSelectedNombre(e.target.value)
                  setError('')
                }}
              >
                <Option value="">Seleccione...</Option>
                {nombreOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </>
          )}

          <SearchActionBar
            onSearch={onBuscar}
            onClear={onLimpiar}
            loading={loading}
            disableSearch={loading || !canSearch}
            helpText="Seleccione consulta, municipio y tipo de establecimiento. Active la consulta por nombre para filtrar un establecimiento puntual."
            error={error}
          />
        </div>

        {loading && <OurLoading />}
      </div>
    </div>
  )
}

export default Widget