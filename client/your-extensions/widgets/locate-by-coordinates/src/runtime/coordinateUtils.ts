/**
 * Convierte coordenadas en formato grados, minutos y segundos (DMS) a decimal.
 * @param {number} deg - Grados
 * @param {number} min - Minutos
 * @param {number} sec - Segundos
 * @returns {number} Valor decimal
 */
export const dmsToDecimal = (
  deg: number,
  min: number,
  sec: number
): number => {
  const sign = deg < 0 ? -1 : 1
  return sign * (Math.abs(deg) + min / 60 + sec / 3600)
}

/**
 * Verifica si una cadena representa un valor numérico válido (entero o decimal, positivo o negativo).
 * @param {string} value - Cadena a evaluar
 * @returns {boolean} `true` si la cadena es un número válido
 */
export const isNumeric = (value: string) => {
  return /^-?\d+(\.\d+)?$/.test(value)
}

/**
 * Valida que las coordenadas planas (X, Y) sean valores numéricos.
 * @param {string} x - Coordenada X (Este)
 * @param {string} y - Coordenada Y (Norte)
 * @returns {boolean} `true` si ambas coordenadas son numéricas
 */
export const validatePlanar = (x: string, y: string) => {
  if (!x || !y) return false

  if (!isNumeric(x) || !isNumeric(y)) return false

  return true
}

/**
 * Valida coordenadas geográficas en formato decimal.
 * Latitud debe estar entre -90 y 90, longitud entre -180 y 180.
 * @param {string} lat - Latitud en formato decimal
 * @param {string} lon - Longitud en formato decimal
 * @returns {boolean} `true` si las coordenadas son válidas
 */
export const validateGeographic = (lat: string, lon: string) => {
  if (!lat || !lon) return false

  if (!isNumeric(lat) || !isNumeric(lon)) return false

  const latNum = Number(lat)
  const lonNum = Number(lon)

  if (latNum < -90 || latNum > 90) return false
  if (lonNum < -180 || lonNum > 180) return false

  return true
}

/**
 * Valida coordenadas geográficas en formato Grados, Minutos y Segundos (DMS).
 * Los grados de latitud deben estar entre -90 y 90, los de longitud entre -180 y 180.
 * Minutos y segundos deben estar entre 0 y 59.999...
 * @param {string} latDeg - Grados de latitud
 * @param {string} latMin - Minutos de latitud
 * @param {string} latSec - Segundos de latitud
 * @param {string} lonDeg - Grados de longitud
 * @param {string} lonMin - Minutos de longitud
 * @param {string} lonSec - Segundos de longitud
 * @returns {boolean} `true` si todas las componentes son válidas
 */
export const validateDMS = (
  latDeg: string,
  latMin: string,
  latSec: string,
  lonDeg: string,
  lonMin: string,
  lonSec: string
) => {

  const numeric = /^-?\d+(\.\d+)?$/

  if (
    !numeric.test(latDeg) ||
    !numeric.test(latMin) ||
    !numeric.test(latSec) ||
    !numeric.test(lonDeg) ||
    !numeric.test(lonMin) ||
    !numeric.test(lonSec)
  ) return false

  const latD = Number(latDeg)
  const latM = Number(latMin)
  const latS = Number(latSec)

  const lonD = Number(lonDeg)
  const lonM = Number(lonMin)
  const lonS = Number(lonSec)

  if (latD < -90 || latD > 90) return false
  if (lonD < -180 || lonD > 180) return false

  if (latM < 0 || latM >= 60) return false
  if (lonM < 0 || lonM >= 60) return false

  if (latS < 0 || latS >= 60) return false
  if (lonS < 0 || lonS >= 60) return false

  return true
}