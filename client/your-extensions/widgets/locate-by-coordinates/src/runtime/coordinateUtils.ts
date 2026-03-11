export const dmsToDecimal = (
  deg: number,
  min: number,
  sec: number
): number => {
  return deg + min / 60 + sec / 3600
}