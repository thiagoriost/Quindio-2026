import * as XLSX from 'xlsx'

/**
 * Genera un archivo CSV a partir de un arreglo de entidades ArcGIS.
 *
 * Convierte los atributos de cada {@link __esri.Graphic} en una estructura
 * tabular (matriz de filas y columnas) y utiliza `xlsx` para transformarlo
 * en formato CSV.
 *
 * @param {__esri.Graphic[]} features
 * Lista de entidades gráficas provenientes de una consulta ArcGIS.
 *
 * @param {string[]} [fields]
 * Lista opcional de campos a exportar.
 * - Si se proporciona, solo se exportarán esos campos y en ese orden.
 * - Si no se proporciona, se tomarán automáticamente las claves del
 *   primer `feature.attributes`.
 *
 * @returns {string}
 * Contenido del archivo en formato CSV como texto plano.
 * Devuelve cadena vacía si no hay datos.
 *
 * @example
 * ```ts
 * const csv = generateCSV(features, ['NUMERO', 'PROPIETARIO'])
 * downloadBlob(csv, 'predios.csv', 'text/csv;charset=utf-8;')
 * ```
 */
export const generateCSV = (
  features: __esri.Graphic[],
  fields?: string[]
): string => {

  if (!features || features.length === 0) return ''

  const headers = fields?.length
    ? fields
    : Object.keys(features[0].attributes)

  const rows = features.map(feature =>
    headers.map(field => feature.attributes[field] ?? '')
  )

  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    ...rows
  ])

  return XLSX.utils.sheet_to_csv(worksheet)
}


/**
 * Genera un archivo Excel (.xlsx) en memoria a partir de entidades ArcGIS.
 *
 * Construye un `Workbook` utilizando la librería `xlsx`,
 * agregando una hoja llamada **"Datos"**.
 *
 * @param {__esri.Graphic[]} features
 * Lista de entidades gráficas provenientes de una consulta ArcGIS.
 *
 * @param {string[]} [fields]
 * Lista opcional de campos a exportar.
 * - Si se proporciona, solo se exportarán esos campos.
 * - Si no se proporciona, se usarán automáticamente los atributos
 *   del primer elemento.
 *
 * @throws {Error}
 * Lanza error si el arreglo está vacío.
 *
 * @returns {ArrayBuffer}
 * Buffer binario listo para ser descargado como archivo `.xlsx`.
 *
 * @example
 * ```ts
 * const buffer = generateExcelBuffer(features)
 * downloadBlob(
 *   buffer,
 *   'predios.xlsx',
 *   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
 * )
 * ```
 */
export const generateExcelBuffer = (
  features: __esri.Graphic[],
  fields?: string[]
): ArrayBuffer => {

  if (!features || features.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  const headers = fields?.length
    ? fields
    : Object.keys(features[0].attributes)

  const data = features.map(feature => {
    const row: any = {}
    headers.forEach(field => {
      row[field] = feature.attributes[field] ?? ''
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  })
}


/**
 * Descarga contenido en el navegador creando dinámicamente
 * un objeto `Blob` y un enlace temporal.
 *
 * Esta función es genérica y puede utilizarse para:
 * - CSV
 * - Excel
 * - JSON
 * - TXT
 * - PDF (si se pasa el mimeType correcto)
 *
 * @param {BlobPart} content
 * Contenido del archivo (string, ArrayBuffer, etc.).
 *
 * @param {string} fileName
 * Nombre del archivo que verá el usuario al descargar.
 *
 * @param {string} mimeType
 * Tipo MIME del archivo (ej: `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).
 *
 * @example
 * ```ts
 * downloadBlob(
 *   csvContent,
 *   'reporte.csv',
 *   'text/csv;charset=utf-8;'
 * )
 * ```
 */
export const downloadBlob = (
  content: BlobPart,
  fileName: string,
  mimeType: string
) => {

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()

  URL.revokeObjectURL(url)
}