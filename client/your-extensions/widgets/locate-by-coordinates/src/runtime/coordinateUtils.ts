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

export const isNumeric = (value: string) => {
  return /^-?\d+(\.\d+)?$/.test(value)
}

export const validatePlanar = (x: string, y: string) => {
  if (!x || !y) return false

  if (!isNumeric(x) || !isNumeric(y)) return false

  return true
}

export const validateGeographic = (lat: string, lon: string) => {
  if (!lat || !lon) return false

  if (!isNumeric(lat) || !isNumeric(lon)) return false

  const latNum = Number(lat)
  const lonNum = Number(lon)

  if (latNum < -90 || latNum > 90) return false
  if (lonNum < -180 || lonNum > 180) return false

  return true
}

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