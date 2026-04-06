import { React } from "jimu-core"
import { Label, Select, Option } from "jimu-ui"

interface interfaceIndicadores { id: number, name: string }

interface FormIndicadoresProps {
  loading: boolean
  indicadores: interfaceIndicadores[] | null
  selectedIndicador: number | null
  onIndicadorChange: (e: { target: { value: any } }) => void
  niveles: string[] | null
  selectedNivel: string | null
  onNivelChange: (e: { target: { value: any } }) => void
  sectores: string[] | null
  selectedSector: string | null
  onSectorChange: (e: { target: { value: any } }) => void
  anios: string[] | null
  selectedAnio: string | null
  onAnioChange: (e: { target: { value: any } }) => void
}

const FormIndicadores = ({
  loading,
  indicadores,
  selectedIndicador,
  onIndicadorChange,
  niveles,
  selectedNivel,
  onNivelChange,
  sectores,
  selectedSector,
  onSectorChange,
  anios,
  selectedAnio,
  onAnioChange
}: FormIndicadoresProps) => {
  console.log({
    loading,
    indicadores,
    selectedIndicador,
    niveles,
    selectedNivel,
    sectores,
    selectedSector,
    anios,
    selectedAnio,
  })
  return (
    <>
      <Label>Indicador</Label>
      <Select
        value={selectedIndicador ?? ""}
        disabled={loading}
        onChange={onIndicadorChange}
      >
        <Option value="">
          {loading ? 'Cargando ...' : 'Seleccione...'}
        </Option>

        {indicadores?.map(field => (
          <Option key={field.id} value={field.id}>
            {field.name}
          </Option>
        ))}
      </Select>

      {/* Nivel */}
      {
        (niveles?.length > 1 && selectedIndicador === 1) && (
          <>
            <Label>Nivel</Label>
            <Select
              value={selectedNivel ?? ""}
              disabled={loading}
              onChange={onNivelChange}
            >
              <Option value="">
                {loading ? 'Cargando ...' : 'Seleccione...'}
              </Option>
              {niveles?.map(nivel => (
                <Option key={nivel} value={nivel}>
                  {nivel}
                </Option>
              ))}
            </Select>
          </>
        )
      }

      {/* Sector */}
      {
        (sectores?.length > 1 && selectedIndicador === 1) && (
          <>
            <Label>Sector</Label>
            <Select
              value={selectedSector ?? ""}
              disabled={loading}
              onChange={onSectorChange}
            >
              <Option value="">
                {loading ? 'Cargando ...' : 'Seleccione...'}
              </Option>
              {sectores?.map(sector => (
                <Option key={sector} value={sector}>
                  {sector}
                </Option>
              ))}
            </Select>
          </>
        )
      }

      {/* Año */}
      {
        anios?.length > 1 && (
          <>
            <Label>Año</Label>
            <Select
              value={selectedAnio ?? ""}
              disabled={loading}
              onChange={onAnioChange}
            >
              <Option value="">
                {loading ? 'Cargando ...' : 'Seleccione...'}
              </Option>
              {anios?.map(anio => (
                <Option key={anio} value={anio}>
                  {anio}
                </Option>
              ))}
            </Select>
          </>
        )
      }

    </>
  )
}

export default FormIndicadores
