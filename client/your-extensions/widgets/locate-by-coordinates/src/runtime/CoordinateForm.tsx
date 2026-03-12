/**
 * Formulario para ingresar coordenadas y seleccionar el tipo de coordenada.
 * Permite ingresar valores y notifica al componente padre para ubicar el punto.
 *
 * @component
 * @param {Object} props
 * @param {(coords: any, type: CoordinateType) => void} props.onLocate - Función para ubicar el punto
 * @returns {JSX.Element} Formulario de coordenadas
 *
 * @author IGAC - DIP
 * @since 2026
 */
import { React } from "jimu-core"
import type { CoordinateType } from "../types"
import { Select, Option, /* TextInput, */ Button, Label } from "jimu-ui"

import '../styles/styles.css'
import FloatingInput from "../../../shared/components/FloatingInput/FloatingInput"

interface Props {
  onLocate: (coords: any, type: CoordinateType) => void
  disabled?: boolean
  mapReady?: boolean
}

export default function CoordinateForm({ onLocate, disabled, mapReady }: Props) {
  // Estado para el tipo de coordenada
  const [type, setType] = React.useState<CoordinateType>("PLANAR")
  // Estado para coordenadas planas
  const [x, setX] = React.useState("")
  const [y, setY] = React.useState("")
  // Estado para coordenadas geográficas decimales
  const [lat, setLat] = React.useState("")
  const [lon, setLon] = React.useState("")

  React.useEffect(() => {
    // Solo para depuración
    console.log("CoordinateForm, mapReady:", mapReady)
  }, [mapReady])

  return (
    <div className="coord-widget">
      <div className="section">
        <Label className="label">Tipo de coordenadas</Label>

        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value as CoordinateType)
          }}
        >
          <Option value="PLANAR">Planas MAGNA SIRGAS (9377)</Option>
          <Option value="GEOGRAPHIC_DECIMAL">Geográficas (Decimal)</Option>
        </Select>
      </div>

      {type === "PLANAR" && (
        <div className="section">
          <Label className="label">Coordenadas Planas</Label>

          <div className="grid">
            <FloatingInput
              label="X (Este)"
              // placeholder="X (Este)"
              value={x}
              onChange={(value)=>{ setX(value) }}
            />

            <FloatingInput
              label="Y (Norte)"
              // placeholder="Y (Norte)"
              value={y}
              onChange={(value)=>{ setY(value) }}
            />
          </div>
        </div>
      )}

      {type === "GEOGRAPHIC_DECIMAL" && (
        <div className="section">
          <Label className="label">Coordenadas Geográficas</Label>

          <div className="grid">
            <FloatingInput
              label="Latitud"
              // placeholder="Latitud"
              value={lat}
              onChange={(value)=>{ setLat(value) }}
            />

            <FloatingInput
              label="Longitud"
              // placeholder="Longitud"
              value={lon}
              onChange={(value)=>{ setLon(value) }}
            />
          </div>
        </div>
      )}

      <div className="actions">
        <Button
          type="default"
          onClick={() => {
            setX("")
            setY("")
            setLat("")
            setLon("")
          }}
        >
          Limpiar
        </Button>

        <Button
          type="primary"
          onClick={() => {
            onLocate({ x, y, lat, lon }, type)
          }}
          disabled={disabled}
        >
          Ubicar
        </Button>
      </div>
    </div>
  )
}