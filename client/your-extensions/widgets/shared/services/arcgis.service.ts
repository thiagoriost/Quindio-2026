import { ApiResponse } from '../models/api-response.model'
import { HttpService } from './http.service'

/**
 * Servicio especializado para interactuar con capas ArcGIS REST.
 * Encapsula la construcción de URLs para consultas tipo `query`
 * y delega la ejecución HTTP al {@link HttpService}.
 */
export class ArcgisService {

  /**
   * Instancia interna del servicio HTTP.
   * @private
   */
  private http = new HttpService()

  /**
   * Ejecuta una consulta (`query`) sobre una capa ArcGIS REST.
   *
   * Construye automáticamente la URL con los parámetros necesarios
   * y realiza una petición GET al endpoint:
   * `{baseUrl}/{layerId}/query`
   *
   * @template T Tipo esperado en la respuesta (generalmente
   * `ArcGisQueryResponse` u otro modelo personalizado).
   *
   * @param {string} baseUrl URL base del servicio ArcGIS
   * (ej: https://servidor/arcgis/rest/services/MiServicio/MapServer).
   *
   * @param {number} layerId ID numérico de la capa dentro del servicio.
   *
   * @param {Object} params Parámetros opcionales de la consulta.
   * @param {string} [params.where='1=1'] Expresión SQL para filtrar registros.
   * @param {string} [params.outFields='*'] Campos a retornar separados por coma.
   * @param {boolean} [params.returnGeometry=true] Indica si se debe incluir la geometría.
   *
   * @param {boolean} [showAlert=true] Indica si el {@link HttpService}
   * debe mostrar alertas automáticas ante errores.
   *
   * @param {AbortSignal} [signal] Señal opcional para cancelar la petición.
   * Permite abortar la consulta desde el componente o hook que la invoque.
   *
   * @returns {Promise<ApiResponse<T>>}
   * Promesa con la respuesta tipada del servidor envuelta en `ApiResponse`.
   *
   * @example
   * ```ts
   * const response = await arcgisService.queryLayer<ArcGisQueryResponse>(
   *   urls.MiServicio.BASE,
   *   0,
   *   { where: "CODIGO='123'", returnGeometry: true },
   *   true,
   *   signal
   * )
   * ```
   */
  async queryLayer<T>(
    baseUrl: string,
    layerId: number,
    params: {
      where?: string
      outFields?: string
      returnGeometry?: boolean
    },
    showAlert: boolean = true,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {

    const {
      where = '1=1',
      outFields = '*',
      returnGeometry = true
    } = params

    const url = `
      ${baseUrl}/${layerId}/query
      ?where=${encodeURIComponent(where)}
      &outFields=${outFields}
      &returnGeometry=${returnGeometry}
      &f=json
    `.replace(/\s/g, '')

    return this.http.get<T>(url, showAlert, signal)
  }
}