import {
  generateCSV,
  generateExcelBuffer,
  downloadBlob
} from '../utils/export.utils'

import { alertService } from './alert.service'

/**
 * Servicio encargado de exportar resultados (features de ArcGIS)
 * a formatos descargables como CSV y Excel.
 *
 * Responsabilidades:
 * - Validar que existan datos para exportar.
 * - Delegar la transformación de datos a utilidades (generateCSV / generateExcelBuffer).
 * - Gestionar la descarga del archivo en el navegador.
 * - Notificar al usuario el estado del proceso mediante alertService.
 *
 * Este servicio está desacoplado de los widgets,
 * permitiendo su reutilización en cualquier componente.
 */
class ExportService {

  /**
   * Exporta un arreglo de features a un archivo CSV.
   *
   * Flujo:
   * 1. Valida que existan datos.
   * 2. Genera el contenido CSV.
   * 3. Verifica que el resultado no esté vacío.
   * 4. Dispara la descarga.
   * 5. Notifica el resultado al usuario.
   *
   * @param features - Lista de gráficos (__esri.Graphic) a exportar.
   * @param fileName - Nombre del archivo de salida. Por defecto: 'export.csv'.
   * @param fields - Lista opcional de campos a incluir. 
   *                 Si no se envía, se exportan todos los atributos disponibles.
   */
  exportCSV(
    features: __esri.Graphic[],
    fileName: string = 'export.csv',
    fields?: string[]
  ) {
    try {
      // Validación: no hay datos
      if (!features || features.length === 0) {
        alertService.warning('No hay datos para exportar.')
        return
      }
      // Generación del contenido CSV
      const csv = generateCSV(features, fields)

      // Validación: CSV vacío
      if (!csv.trim()) {
        alertService.warning('El archivo CSV está vacío.')
        return
      }

      // Descarga del archivo
      downloadBlob(csv, fileName, 'text/csv;charset=utf-8;')

      alertService.success('Archivo CSV descargado correctamente.')

    } catch (error) {
      console.error('Error exportando CSV:', error)
      alertService.error('Error al exportar CSV.')
    }
  }

  /**
   * Exporta un arreglo de features a un archivo Excel (.xlsx).
   *
   * Flujo:
   * 1. Valida que existan datos.
   * 2. Genera un ArrayBuffer compatible con Excel.
   * 3. Dispara la descarga del archivo.
   * 4. Notifica el resultado al usuario.
   *
   * @param features - Lista de gráficos (__esri.Graphic) a exportar.
   * @param fileName - Nombre del archivo de salida. Por defecto: 'export.xlsx'.
   * @param fields - Lista opcional de campos a incluir.
   */
  exportExcel(
    features: __esri.Graphic[],
    fileName: string = 'export.xlsx',
    fields?: string[]
  ) {
    try {

      // Validación: no hay datos
      if (!features || features.length === 0) {
        alertService.warning('No hay datos para exportar.')
        return
      }
 
      // Generación del buffer Excel
      const buffer = generateExcelBuffer(features, fields)
 
      // Descarga del archivo
      downloadBlob(
        buffer,
        fileName,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )

      alertService.success('Archivo Excel descargado correctamente.')

    } catch (error) {
      console.error('Error exportando Excel:', error)
      alertService.error('Error al exportar archivo Excel.')
    }
  }
}
/**
 * Instancia singleton del servicio de exportación.
 *
 * Se exporta una única instancia para:
 * - Evitar múltiples instanciaciones innecesarias.
 * - Mantener consistencia en el uso del servicio.
 */
export const exportService = new ExportService()