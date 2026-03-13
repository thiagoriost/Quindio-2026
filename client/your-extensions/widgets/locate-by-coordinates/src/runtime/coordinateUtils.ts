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
  return deg + min / 60 + sec / 3600
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