/**
 * Formulario para ingresar coordenadas y seleccionar el tipo de coordenada.
 * Permite ingresar valores y notifica al componente padre para ubicar el punto.
 *
 * @component
 * @param {Object} props
 * @param {(coords: any, type: CoordinateType) => void} props.onLocate - Callback para ubicar el punto en el mapa con las coordenadas ingresadas
 * @param {boolean} [props.disabled] - Indica si el formulario está deshabilitado (ej. cuando el mapa no está listo)
 * @param {boolean} [props.mapReady] - Indica si el widget de mapa está disponible y listo para operar
 * @param {() => void} [props.onClear] - Callback para limpiar el punto dibujado y reiniciar el formulario
 * @returns {JSX.Element} Formulario de coordenadas
 *
 * @author IGAC - DIP
 * @since 2026
 */
import { React } from "jimu-core"
import type { CoordinateType } from "../types"
import { Select, Option, /* TextInput, Button, */ Label } from "jimu-ui"

import '../styles/styles.css'
import FloatingInput from "../../../shared/components/FloatingInput/FloatingInput"
import { validateDMS, validateGeographic, validatePlanar } from "./coordinateUtils"
import { SearchActionBar } from "../../../../widgets/shared/components/search-action-bar"
import { validaLoggerLocalStorage } from "../../../shared/utils/export.utils"

interface Props {
  onLocate: (coords: any, type: CoordinateType) => void
  disabled?: boolean
  mapReady?: boolean
  onClear?: () => void
}

export default function CoordinateForm({ onLocate, disabled, mapReady, onClear }: Props) {
  // Estado para el tipo de coordenada
  const [type, setType] = React.useState<CoordinateType>("PLANAR")
  // Estado para coordenadas planas
  const [x, setX] = React.useState("")
  const [y, setY] = React.useState("")
  // Estado para coordenadas geográficas decimales
  const [lat, setLat] = React.useState("")
  const [lon, setLon] = React.useState("")


  const [latDeg, setLatDeg] = React.useState("")
  const [latMin, setLatMin] = React.useState("")
  const [latSec, setLatSec] = React.useState("")

  const [lonDeg, setLonDeg] = React.useState("")
  const [lonMin, setLonMin] = React.useState("")
  const [lonSec, setLonSec] = React.useState("")

  const [error, setError] = React.useState("")

  const isValid = React.useMemo(() => {

    if (type === "PLANAR") {

      if (!x || !y) {
        setError("")
        return false
      }

      if (!validatePlanar(x, y)) {
        setError("Las coordenadas planas solo permiten números.")
        return false
      }

      setError("")
      return true
    }

    if (type === "GEOGRAPHIC_DECIMAL") {

      if (!lat || !lon) {
        setError("")
        return false
      }

      if (!validateGeographic(lat, lon)) {
        setError("Latitud debe estar entre -90 y 90, Longitud entre -180 y 180.")
        return false
      }

      setError("")
      return true
    }

    if (type === "GEOGRAPHIC_DMS") {

    if (!latDeg || !latMin || !latSec || !lonDeg || !lonMin || !lonSec) {
      setError("")
      return false
    }

    if (!validateDMS(latDeg, latMin, latSec, lonDeg, lonMin, lonSec)) {
      setError("Formato DMS inválido.")
      return false
    }

    setError("")
    return true
  }

  return false
  }, [type, x, y, lat, lon, latDeg, latMin, latSec, lonDeg, lonMin, lonSec])


  React.useEffect(() => {
    // Solo para depuración
    if (validaLoggerLocalStorage('logger')) console.log("CoordinateForm, mapReady:", mapReady)
  }, [mapReady])

  const onLimpiar = (): void => {
    onClear()
    setX("")
    setY("")
    setLat("")
    setLon("")
    setError("")
    setLatDeg("")
    setLatMin("")
    setLatSec("")
    setLonDeg("")
    setLonMin("")
    setLonSec("")
  }

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
          <Option value="GEOGRAPHIC_DECIMAL">Geográficas (Decimal - 4326)</Option>
          <Option value="GEOGRAPHIC_DMS">Geográficas (DMS - 4326)</Option>
        </Select>
      </div>

      {type === "PLANAR" && (
        <div className="section">
          <Label className="label">Coordenadas Planas</Label>

          <div className="grid-two-columns">
            <FloatingInput
              label="X (Este)"
              // placeholder="X (Este)"
              value={x}
              onChange={(value)=>{
                if (/^-?\d*\.?\d*$/.test(value)) {
                  setX(value) } }
                }
            />

            <FloatingInput
              label="Y (Norte)"
              // placeholder="Y (Norte)"
              value={y}
              onChange={(value)=>{
                if (/^-?\d*\.?\d*$/.test(value)) {
                  setY(value) } }
                }
            />
          </div>
        </div>
      )}

      {type === "GEOGRAPHIC_DECIMAL" && (
        <div className="section">
          <Label className="label">Coordenadas Geográficas</Label>

          <div className="grid-two-columns">
            <FloatingInput
              label="Latitud"
              // placeholder="Latitud"
              value={lat}
              onChange={(value)=>{
                if (/^-?\d*\.?\d*$/.test(value)) {
                  setLat(value) } }
                }
            />

            <FloatingInput
              label="Longitud"
              // placeholder="Longitud"
              value={lon}
              onChange={(value)=>{
                if (/^-?\d*\.?\d*$/.test(value)) { setLon(value) } }
              }
            />
          </div>
        </div>
      )}

      {type === "GEOGRAPHIC_DMS" && (
        <div className="section">

          <Label className="label">Latitud (DMS)</Label>

          <div className="grid">
            <FloatingInput label="Grados" value={latDeg} onChange={setLatDeg}/>
            <FloatingInput label="Minutos" value={latMin} onChange={setLatMin}/>
            <FloatingInput label="Segundos" value={latSec} onChange={setLatSec}/>
          </div>

          <Label className="label">Longitud (DMS)</Label>

          <div className="grid">
            <FloatingInput label="Grados" value={lonDeg} onChange={setLonDeg}/>
            <FloatingInput label="Minutos" value={lonMin} onChange={setLonMin}/>
            <FloatingInput label="Segundos" value={lonSec} onChange={setLonSec}/>
          </div>

        </div>
      )}

      <SearchActionBar
          onSearch={() => {
            onLocate({ x, y, lat, lon, latDeg, latMin, latSec, lonDeg, lonMin, lonSec }, type)
          }}
          onClear={onLimpiar}
          // loading={loading}
          disableSearch={!isValid || disabled}
          helpText="Esta funcionalidad permite ingresar coordenadas en diferentes formatos para ubicar un punto en el mapa. Selecciona el tipo de coordenada, ingresa los valores correspondientes y haz clic en 'Ubicar' para visualizar el punto en el mapa."
          searchLabel="Ubicar"
          error={error}
      />
    </div>
  )
}