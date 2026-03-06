import { ApiResponse } from '../models/api-response.model'
import { alertService } from './alert.service'
import { ArcGisErrorMapper } from '../mappers/arcgis-error-mapper'

/**
 * Servicio HTTP centralizado para el Sistema de Información Geográfica (SIG).
 *
 * ### Responsabilidades
 * - Ejecutar peticiones HTTP utilizando `fetch`.
 * - Normalizar todas las respuestas al formato {@link ApiResponse}.
 * - Traducir errores técnicos (HTTP o ArcGIS) mediante {@link ArcGisErrorMapper}.
 * - Detectar errores lógicos devueltos por el backend (`json.error`).
 * - Soportar cancelación de peticiones mediante `AbortSignal`.
 *
 * ### Principios
 * - NO contiene lógica de UI.
 * - NO contiene lógica específica de negocio.
 * - Solo transforma respuestas técnicas en estructuras controladas.
 *
 * Este servicio está diseñado para ser reutilizable en cualquier módulo
 * o widget del sistema.
 */
export class HttpService {

  /**
   * Ejecuta una petición HTTP GET.
   *
   * Maneja automáticamente:
   * - Errores HTTP (404, 500, 502, etc.).
   * - Errores propios de servicios ArcGIS (`json.error`).
   * - Errores de red.
   * - Cancelación mediante `AbortSignal`.
   *
   * @template T Tipo de dato esperado en la respuesta exitosa.
   *
   * @param {string} url
   * URL completa del endpoint a consumir.
   *
   * @param {boolean} [showAlert=true]
   * Indica si se debe mostrar una alerta visual en caso de error.
   * Permite reutilizar el servicio en contextos donde no se desea UI.
   *
   * @param {AbortSignal} [signal]
   * Señal opcional para permitir cancelación de la petición.
   * Normalmente proviene de un `AbortController`.
   *
   * @returns {Promise<ApiResponse<T>>}
   * Objeto normalizado con:
   * - `success: true` y `data` en caso exitoso.
   * - `success: false` y `error` en caso de fallo.
   *
   * @example
   * ```ts
   * const response = await httpService.get<User[]>('/api/users')
   *
   * if (response.success) {
   *   console.log(response.data)
   * } else {
   *   console.error(response.error)
   * }
   * ```
   */
  async get<T>(
    url: string,
    showAlert: boolean = true,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {

    try {
      const response = await fetch(url, { signal })

      // Error HTTP (404, 500, 502, etc.)
      if (!response.ok) {

        /**
         * Estructura mínima del error HTTP para ser interpretado
         * por el ArcGisErrorMapper.
         */
        const httpError = {
          code: response.status,
          message: response.statusText
        }

        const translatedMessage = ArcGisErrorMapper.map(httpError)

        if (showAlert) {
          alertService.error('Error de comunicación', translatedMessage)
        }

        return {
          success: false,
          error: translatedMessage
        }
      }

      const json = await response.json()

      // Error lógico devuelto por servicio ArcGIS
      if (json?.error) {

        const translatedMessage = ArcGisErrorMapper.map(json.error)

        if (showAlert) {
          alertService.error('Error del servicio', translatedMessage)
        }

        return {
          success: false,
          error: translatedMessage
        }
      }

      return { success: true, data: json }

    } catch (err: any) {

      /**
       * Cancelación intencional de la petición.
       * No se considera un error técnico real.
       */
      if (err?.name === 'AbortError') {
        return {
          success: false,
          error: 'Petición cancelada'
        }
      }

      const title = 'Error de conexión'
      const text = 'No fue posible comunicarse con el servidor.'

      if (showAlert) {
        alertService.error(title, text)
      }

      return { success: false, error: text }
    }
  }
}