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

interface Props {
  onLocate: (coords: any, type: CoordinateType) => void
}

export default function CoordinateForm({ onLocate }: Props) {
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
    console.log("CoordinateForm")
  }, [])

  return (
    <div>
      <select
        value={type}
        onChange={(e)=>{ setType(e.target.value as CoordinateType) }}
      >
        <option value="PLANAR">Planas MAGNA SIRGAS</option>
        <option value="GEOGRAPHIC_DECIMAL">Geográficas Decimal</option>
      </select>
      {type === "PLANAR" && (
        <>
          <input
            placeholder="X"
            value={x}
            onChange={(e)=>{ setX(e.target.value) }}
          />
          <input
            placeholder="Y"
            value={y}
            onChange={(e)=>{ setY(e.target.value) }}
          />
        </>
      )}
      {type === "GEOGRAPHIC_DECIMAL" && (
        <>
          <input
            placeholder="Latitud"
            value={lat}
            onChange={(e)=>{ setLat(e.target.value) }}
          />
          <input
            placeholder="Longitud"
            value={lon}
            onChange={(e)=>{ setLon(e.target.value) }}
          />
        </>
      )}
      <button
        onClick={() =>
          { onLocate({ x, y, lat, lon }, type) }
        }
      >
        Ubicar
      </button>
    </div>
  )
}