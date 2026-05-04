/**
 * @fileoverview Widget principal de Consulta Agropecuaria.
 * Permite consultar información agropecuaria (Cultivos o Especies) del departamento del Quindío
 * filtrando por municipio y año. Dibuja los resultados en el mapa y envía datos al widget de resultados
 * para visualización en tabla y gráfico de torta.
 *
 * @module consultaAgropecuaria
 * @author IGAC - DIP
 * @since 2026
 */
import { React, type AllWidgetProps } from "jimu-core"
import { Label, Select, Option } from "jimu-ui"
import Graphic from "@arcgis/core/Graphic"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis"
import { MUNICIPIOS_QUINDIO } from "../../../shared/constants/municipiosQuindio"
import { SearchActionBar } from "../../../shared/components/search-action-bar"
import { urls } from "../../../api/serviciosQuindio"
import { drawAndCenterFeatures, ejecutarConsulta, validaLoggerLocalStorage } from "../../../shared/utils/export.utils"
import { WIDGET_IDS } from "../../../shared/constants/widget-ids"
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from "../../../widget-result/src/runtime/widget"
import OurLoading from '../../../commonWidgets/our_loading/OurLoading'
// @ts-ignore
import '../styles/styles.css'

/**
 * Definición de los tipos de consulta agropecuaria disponibles.
 * Cada clave representa una categoría (cultivos o especies) con su etiqueta de visualización.
 *
 * @constant
 * @type {{ cultivos: { tipo: string }, especies: { tipo: string } }}
 */
const consultaAgropecuaria = {
  cultivos: {
    tipo: 'Cultivos'
  },
  especies: {
    tipo: 'Especies'
  }
}

/**
 * Lista de etiquetas de tipos de consulta derivada de {@link consultaAgropecuaria}.
 * @constant {string[]}
 */
const tiposConsulta = Object.values(consultaAgropecuaria).map(v => v.tipo)

/**
 * Lista de municipios del Quindío ordenada alfabéticamente (A-Z) por nombre.
 * @constant {typeof MUNICIPIOS_QUINDIO}
 */
const municipiosOrdenados = [...MUNICIPIOS_QUINDIO].sort((a, b) => a.NOMBRE.localeCompare(b.NOMBRE, "es"))

/**
 * Widget principal de Consulta Agropecuaria.
 *
 * @component
 * @param {AllWidgetProps<any>} props - Propiedades del widget proporcionadas por ArcGIS Experience Builder
 * @returns {JSX.Element} Componente del widget
 */
const Widget = (props: AllWidgetProps<any>) => {
  /** ID del widget de resultados donde se envía la tabla y el gráfico. */
  const widgetResultId = WIDGET_IDS.RESULT

  /**
   * Referencia a la vista de mapa activa de Jimu.
   * @type {[JimuMapView | null, Function]}
   */
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)

  /**
   * Capa de gráficos utilizada para dibujar los polígonos/puntos de los resultados.
   * @type {[GraphicsLayer | null, Function]}
   */
  const [graphicsLayer, setGraphicsLayer] = React.useState<GraphicsLayer | null>(null)

  /**
   * Extent inicial del mapa capturado al primer cambio de vista.
   * Se restaura cuando el usuario cambia de tipo de consulta.
   * @type {React.MutableRefObject<__esri.Extent | null>}
   */
  const initialExtentRef = React.useRef<__esri.Extent | null>(null)

  /**
   * Nivel de zoom inicial del mapa.
   * @type {React.MutableRefObject<number | null>}
   */
  const initialZoomRef = React.useRef<number | null>(null)

  /**
   * Escala inicial del mapa.
   * @type {React.MutableRefObject<number | null>}
   */
  const initialScaleRef = React.useRef<number | null>(null)

  /** Indica si hay una operación asíncrona en curso. */
  const [loading, setLoading] = React.useState(false)

  /** Mensaje de error a mostrar al usuario. Vacío cuando no hay error. */
  const [error, setError] = React.useState("")

  /** Tipo de consulta seleccionado: "Cultivos" o "Especies". */
  const [selectedTipo, setSelectedTipo] = React.useState<string>("")

  /** ID del municipio seleccionado (campo IDMUNICIPI de {@link MUNICIPIOS_QUINDIO}). */
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("")

  /** Lista de años disponibles para el municipio seleccionado, obtenida desde el servicio agropecuario. */
  const [anios, setAnios] = React.useState<string[]>([])

  /** Año seleccionado para la consulta. */
  const [selectedAnio, setSelectedAnio] = React.useState<string>("")

  /**
   * Captura el estado inicial del mapa (extent, zoom, escala) la primera vez que la vista se activa.
   * Registra la vista de Jimu en el estado del componente.
   *
   * @param {JimuMapView} view - Vista de mapa activa proporcionada por {@link JimuMapViewComponent}
   * @returns {void}
   */
  const handleActiveViewChange = (view: JimuMapView) => {
    if (!view) return

    setJimuMapView(view)

    if (!initialExtentRef.current) {
      initialExtentRef.current = view.view.extent?.clone() ?? null
      initialZoomRef.current = typeof view.view.zoom === "number" ? view.view.zoom : null
      initialScaleRef.current = typeof view.view.scale === "number" ? view.view.scale : null
    }
  }

  /**
   * Restaura la vista del mapa al extent, zoom y escala capturados inicialmente.
   * Se llama cuando el usuario cambia el tipo de consulta para regresar al encuadre original.
   *
   * @async
   * @returns {Promise<void>}
   */
  const resetToDefaultMapView = async () => {
    const view = jimuMapView?.view
    const initialExtent = initialExtentRef.current
    if (!view || !initialExtent) return

    await view.goTo({ target: initialExtent })

    if (typeof initialZoomRef.current === "number") {
      view.zoom = initialZoomRef.current
    }

    if (typeof initialScaleRef.current === "number") {
      view.scale = initialScaleRef.current
    }
  }

  /**
   * Limpia todos los gráficos de la capa de selección y cierra el widget de resultados.
   * Se invoca al cambiar cualquier filtro (tipo, municipio, año) o al limpiar la búsqueda.
   *
   * @returns {void}
   */
  const resetResultsView = () => {
    if (graphicsLayer) {
      graphicsLayer.removeAll()
    }
    limpiarYCerrarWidgetResultados(widgetResultId)
  }

  /**
   * Maneja el cambio de municipio seleccionado.
   * Cierra los resultados actuales, reinicia el año y consulta los años disponibles
   * en la capa 0 del servicio agropecuario para el municipio elegido.
   *
   * @async
   * @param {{ target: { value: string } }} e - Evento de cambio del Select de municipio
   * @returns {Promise<void>}
   */
  const handleMunicipioChange = async (e: { target: { value: string } }) => {
    const idMunicipio = e.target.value
    resetResultsView()
    setSelectedMunicipio(idMunicipio)
    setAnios([])
    setSelectedAnio("")
    setError("")

    if (!idMunicipio) return

    setLoading(true)
    try {
      const url = `${urls.SERVICIO_AGROPECUARIO}/0`
      const features = await ejecutarConsulta({
        returnGeometry: false,
        campos: ["ANIO"],
        url,
        where: `IDMUNICIPIO = ${idMunicipio}`
      })
      const uniqueAnios = [...new Set(features.map(f => f.attributes.ANIO as string).filter(Boolean))].sort()
      setAnios(uniqueAnios)
    } catch (err) {
      console.error("Error obteniendo años:", err)
      setError("Ocurrió un error al consultar el servicio agropecuario.")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Dibuja los features resultantes en la capa de gráficos del mapa y centra la vista sobre ellos.
   * Soporta geometrías de tipo polígono (relleno naranja) y punto (marcador rojo).
   * Crea la capa de gráficos si aún no existe.
   *
   * @async
   * @param {__esri.Graphic[]} features - Lista de features con geometría a dibujar
   * @returns {Promise<void>}
   */
  /* const drawAndCenterFeatures = async (features: __esri.Graphic[]) => {
    if (!jimuMapView || !features?.length) return

    const view = jimuMapView.view
    let layer = graphicsLayer

    if (!layer) {
      layer = new GraphicsLayer({ id: "consulta-agropecuaria-selection-layer" })
      view.map.add(layer)
      setGraphicsLayer(layer)
    }

    layer.removeAll()

    const graphics = features
      .filter(f => !!f.geometry)
      .map(f => {
        const geometry = f.geometry
        const isPolygon = geometry?.type === "polygon"
        return new Graphic({
          geometry,
          attributes: f.attributes,
          symbol: isPolygon
            ? {
                type: "simple-fill",
                color: [255, 165, 0, 0.2],
                outline: { color: [255, 0, 0], width: 2 }
              }
            : {
                type: "simple-marker",
                style: "circle",
                size: "8px",
                color: [255, 0, 0, 0.9]
              }
        })
      })

    if (!graphics.length) return

    layer.addMany(graphics)
    await view.goTo(graphics.map(g => g.geometry))
  } */

  /**
   * Construye el arreglo de datos para el gráfico de torta a partir de los features consultados.
   * El comportamiento varía según el tipo de consulta seleccionado:
   * - **Cultivos**: agrupa por `TIPO_CULTIVO_PRINCIPAL` y suma `PRODUCCION`.
   * - **Especies**: agrupa por `TIPO_ESPECIE` y suma `TOTALESPECIE` (con validación de nulos).
   *
   * Cada entrada del arreglo incluye `name`, `value`, `porcentaje` y `produccion`.
   *
   * @param {__esri.Graphic[]} features - Lista de features con atributos de producción agropecuaria
   * @returns {{ name: string, value: number, porcentaje: number, produccion: number }[]}
   *   Datos ordenados de mayor a menor producción para el gráfico de torta
   */
  const buildPieData = (features: __esri.Graphic[]) => {
    const grouped = new Map<string, number>()
    const isEspecies = selectedTipo === consultaAgropecuaria.especies.tipo

    const parseNumericValue = (rawValue: any): number => {
      if (rawValue === null || rawValue === undefined || rawValue === "") return 0
      const numeric = Number(String(rawValue).replace(/,/g, ""))
      return Number.isFinite(numeric) ? numeric : 0
    }

    features.forEach(feature => {
      const tipo = isEspecies
        ? String(feature.attributes?.TIPO_ESPECIE ?? "Sin dato")
        : String(feature.attributes?.TIPO_CULTIVO_PRINCIPAL ?? "Sin dato")

      const produccionRaw = isEspecies
        ? feature.attributes?.TOTALESPECIE
        : feature.attributes?.PRODUCCION

      const value = parseNumericValue(produccionRaw)
      grouped.set(tipo, (grouped.get(tipo) ?? 0) + value)
    })

    const totalProduccion = Array.from(grouped.values()).reduce((acc, v) => acc + v, 0)
    const dataResponse = Array.from(grouped.entries())
      .map(([tipo, value]) => {
        const porcentaje = totalProduccion > 0 ? (value / totalProduccion) * 100 : 0
        return {
          name: tipo,
          value: Number(value.toFixed(2)),
          porcentaje: Number(porcentaje.toFixed(2)),
          produccion: Number(value.toFixed(2))
        }
      })
      .sort((a, b) => b.value - a.value)
    if(validaLoggerLocalStorage('logger'))  console.log({grouped, isEspecies, totalProduccion, dataResponse})
    return dataResponse
  }

  /**
   * Restablece todos los filtros del formulario a su estado inicial,
   * limpia los gráficos del mapa y cierra el widget de resultados.
   *
   * @returns {void}
   */
  const handleClear = () => {
    setSelectedTipo("")
    setSelectedMunicipio("")
    setAnios([])
    setSelectedAnio("")
    setError("")
    resetResultsView()
  }

  /**
   * Ejecuta la búsqueda agropecuaria con los filtros seleccionados (municipio y año).
   * Determina la capa del servicio según el tipo:
   * - Capa `/0` para Cultivos.
   * - Capa `/1` para Especies.
   *
   * Dibuja los features resultantes en el mapa, construye el gráfico de torta con {@link buildPieData}
   * y envía los datos al widget de resultados mediante {@link abrirTablaResultados}.
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleBuscar = async () => {
    if (!selectedMunicipio || !selectedAnio) {
      setError("Por favor seleccione municipio y año para realizar la búsqueda.")
      return
    }

    if (!jimuMapView) {
      setError("No se encontró una vista de mapa activa para dibujar resultados.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const layerSuffix = selectedTipo === consultaAgropecuaria.especies.tipo ? "/1" : "/0"
      const features = await ejecutarConsulta({
        returnGeometry: true,
        campos: ["*"],
        url: `${urls.SERVICIO_AGROPECUARIO}${layerSuffix}`,
        where: `IDMUNICIPIO = '${selectedMunicipio}' AND ANIO = '${selectedAnio}'`,
        spatialReference: { wkid: 3115 } as __esri.SpatialReference
      })

      if (!features.length) {
        setError("No se encontraron resultados para el municipio y año seleccionados.")
        return
      }

      const DrawJustOneGeometries = [features[0]]
      const scale = {
        modifyScale: false,
        scale: 0.1
      }
      await drawAndCenterFeatures(scale, DrawJustOneGeometries, jimuMapView, graphicsLayer, setGraphicsLayer, `consulta-agropecuaria-layer-${selectedTipo.toLowerCase()}`)

      const fields = Object.keys(features[0].attributes || {}).map((name) => ({
        name,
        alias: name,
        type: "string"
      }))

      const featuresFixed = features
        .filter(f => !!f.geometry)
        .map(f => ({
          attributes: f.attributes,
          geometry: f.geometry.toJSON()
        }))

      const graphicData = buildPieData(features)
      const municipioNombre = municipiosOrdenados.find(m => m.IDMUNICIPI === selectedMunicipio)?.NOMBRE ?? selectedMunicipio
      const tipoTitulo = selectedTipo || "Consulta"
      if(validaLoggerLocalStorage('logger')) console.log("Resultados procesados para tabla y gráfico:", { layerSuffix, features, featuresFixed, fields, graphicData, municipioNombre, tipoTitulo })
      abrirTablaResultados(
        false,
        featuresFixed,
        fields,
        props,
        widgetResultId,
        features[0]?.geometry?.spatialReference || jimuMapView.view.spatialReference,
        `Resultados Agropecuarios ${municipioNombre} - ${selectedAnio}`,
        {
          showGraphic: true,
          graphicData,
          graphicType: "pie",
          graphicTitle: `${tipoTitulo} en el municipio de ${municipioNombre} año ${selectedAnio}`
        }
      )
    } catch (err) {
      console.error("Error en búsqueda agropecuaria:", err)
      setError("Ocurrió un error al consultar el servicio agropecuario.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (props.state === "CLOSED") {
      handleClear()
      resetToDefaultMapView()
    }
  }, [props.state])

  return (
    <div style={{ height: '100%', padding: '5px', boxSizing: 'border-box' }}>
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds?.[0]}
          onActiveViewChange={handleActiveViewChange}
        />
      )}

      <div className="consulta-widget consulta-scroll loading-host">
        <div>
          <Label className="mb0">Tipo</Label>
          <Select
            value={selectedTipo}
            disabled={loading}
            onChange={(e) => {
              resetResultsView()
              void resetToDefaultMapView()
              setSelectedTipo(e.target.value)
              setSelectedMunicipio("")
              setAnios([])
              setSelectedAnio("")
              setError("")
            }}
          >
            <Option value="">Seleccione...</Option>
            {tiposConsulta.map((tipo) => (
              <Option key={tipo} value={tipo}>
                {tipo}
              </Option>
            ))}
          </Select>

          <Label className="styleLabel">Municipio</Label>
          <Select
            value={selectedMunicipio}
            disabled={loading}
            onChange={handleMunicipioChange}
          >
            <Option value="">{loading ? 'Cargando...' : 'Seleccione...'}</Option>
            {municipiosOrdenados.map((mun) => (
              <Option key={mun.IDMUNICIPI} value={mun.IDMUNICIPI}>
                {mun.NOMBRE}
              </Option>
            ))}
          </Select>

          <Label className="styleLabel">Año</Label>
          <Select
            value={selectedAnio}
            disabled={loading || anios.length === 0}
            onChange={(e) => {
              resetResultsView()
              setSelectedAnio(e.target.value)
              setError("")
            }}
          >
            <Option value="">{loading ? 'Cargando...' : 'Seleccione...'}</Option>
            {anios.map((anio) => (
              <Option key={anio} value={anio}>
                {anio}
              </Option>
            ))}
          </Select>

          <SearchActionBar
            loading={loading}
            disableSearch={loading || !selectedMunicipio || !selectedAnio}
            onSearch={handleBuscar}
            onClear={handleClear}
            error={error}
            helpText="Seleccione el tipo de consulta, municipio y año para visualizar los resultados agropecuarios. Luego haga clic en Buscar."
          />
        </div>

        {loading && <OurLoading />}
      </div>
    </div>
  )
}

export default Widget
