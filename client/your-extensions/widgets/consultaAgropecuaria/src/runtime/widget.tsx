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
import { MUNICIPIOS_QUINDIO } from "../../../shared/constants/municipiosQuindio"
import { SearchActionBar } from "../../../shared/components/search-action-bar"
import { urls } from "../../../api/serviciosQuindio"
import { ejecutarConsulta } from "../../../shared/utils/export.utils"
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

const Widget = (props: AllWidgetProps<any>) => {
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

  const handleClear = () => {
    setSelectedTipo("")
    setSelectedMunicipio("")
    setAnios([])
    setSelectedAnio("")
    setError("")
  }

  const handleBuscar = () => {
    if (!selectedMunicipio) {
      setError("Por favor seleccione un municipio para realizar la búsqueda.")
      return
    }
    setError("")
    // lógica de búsqueda principal aquí
  }

  return (
    <div className="consulta-agropecuaria-widget">

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
        {MUNICIPIOS_QUINDIO.map((mun) => (
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
        onSearch={handleBuscar}
        onClear={handleClear}
        error={error}
      />

    </div>
  )
}

export default Widget
