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