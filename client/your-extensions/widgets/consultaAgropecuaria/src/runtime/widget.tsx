/**
 * Widget principal de Consulta Agropecuaria.
 *
 * @component
 * @param {AllWidgetProps<any>} props - Propiedades del widget proporcionadas por ArcGIS Experience Builder
 * @returns {JSX.Element} Componente del widget
 *
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
import { ejecutarConsulta } from "../../../shared/utils/export.utils"
import { WIDGET_IDS } from "../../../shared/constants/widget-ids"
import { abrirTablaResultados, limpiarYCerrarWidgetResultados } from "../../../widget-result/src/runtime/widget"
// @ts-ignore
import '../styles/styles.css'

const consultaAgropecuaria = {
  cultivos: {
    tipo: 'Cultivos'
  },
  especies: {
    tipo: 'Especies'
  }
}

const tiposConsulta = Object.values(consultaAgropecuaria).map(v => v.tipo)
const municipiosOrdenados = [...MUNICIPIOS_QUINDIO].sort((a, b) => a.NOMBRE.localeCompare(b.NOMBRE, "es"))

const Widget = (props: AllWidgetProps<any>) => {
  const widgetResultId = WIDGET_IDS.RESULT
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView | null>(null)
  const [graphicsLayer, setGraphicsLayer] = React.useState<GraphicsLayer | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [selectedTipo, setSelectedTipo] = React.useState<string>("")
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("")
  const [anios, setAnios] = React.useState<string[]>([])
  const [selectedAnio, setSelectedAnio] = React.useState<string>("")

  const handleMunicipioChange = async (e: { target: { value: string } }) => {
    const idMunicipio = e.target.value
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

  const drawAndCenterFeatures = async (features: __esri.Graphic[]) => {
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
  }

  const buildPieData = (features: __esri.Graphic[]) => {
    const grouped = new Map<string, number>()

    features.forEach(feature => {
      const tipo = String(feature.attributes?.TIPO_CULTIVO_PRINCIPAL ?? "Sin dato")
      const produccionRaw = feature.attributes?.PRODUCCION
      const produccion = Number(produccionRaw)
      const value = Number.isFinite(produccion) ? produccion : 0
      grouped.set(tipo, (grouped.get(tipo) ?? 0) + value)
    })

    const totalProduccion = Array.from(grouped.values()).reduce((acc, v) => acc + v, 0)

    return Array.from(grouped.entries())
      .map(([tipo, value]) => {
        const porcentaje = totalProduccion > 0 ? (value / totalProduccion) * 100 : 0
        return {
          name: `${tipo} (${porcentaje.toFixed(2)}%)`,
          value: Number(value.toFixed(2))
        }
      })
      .sort((a, b) => b.value - a.value)
  }

  const handleClear = () => {
    setSelectedTipo("")
    setSelectedMunicipio("")
    setAnios([])
    setSelectedAnio("")
    setError("")

    if (graphicsLayer) {
      graphicsLayer.removeAll()
    }

    limpiarYCerrarWidgetResultados(widgetResultId)
  }

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
      const features = await ejecutarConsulta({
        returnGeometry: true,
        campos: ["*"],
        url: `${urls.SERVICIO_AGROPECUARIO}/0`,
        where: `IDMUNICIPIO = '${selectedMunicipio}' AND ANIO = '${selectedAnio}'`,
        spatialReference: { wkid: 3115 } as __esri.SpatialReference
      })

      if (!features.length) {
        setError("No se encontraron resultados para el municipio y año seleccionados.")
        return
      }

      await drawAndCenterFeatures(features)

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

      abrirTablaResultados(
        false,
        featuresFixed,
        fields,
        props,
        widgetResultId,
        features[0]?.geometry?.spatialReference || jimuMapView.view.spatialReference,
        `Resultados Agropecuarios ${selectedMunicipio} - ${selectedAnio}`,
        {
          showGraphic: true,
          graphicData,
          graphicType: "pie",
          graphicTitle: "Distribución de producción por tipo de cultivo"
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
    }
  }, [props.state])

  return (
    <div className="consulta-agropecuaria-widget">
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds?.[0]}
          onActiveViewChange={(view) => setJimuMapView(view)}
        />
      )}

      <Label>Tipo</Label>
      <Select
        value={selectedTipo}
        disabled={loading}
        onChange={(e) => { setSelectedTipo(e.target.value) }}
      >
        <Option value="">Seleccione...</Option>
        {tiposConsulta.map((tipo) => (
          <Option key={tipo} value={tipo}>
            {tipo}
          </Option>
        ))}
      </Select>

      <Label>Municipio</Label>
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

      <Label>Año</Label>
      <Select
        value={selectedAnio}
        disabled={loading || anios.length === 0}
        onChange={(e) => { setSelectedAnio(e.target.value) }}
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
      />

    </div>
  )
}

export default Widget
