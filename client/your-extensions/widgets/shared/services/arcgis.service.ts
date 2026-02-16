/**
 * @fileoverview Servicio para interactuar con servicios de ArcGIS REST API.
 * Proporciona métodos especializados para consultas a capas de ArcGIS Server.
 *
 * @module shared/services/arcgis-service
 * @requires shared/models/api-response
 * @requires shared/services/http-service
 *
 * @author IGAC - DIP
 * @since 2024
 */

import type { ApiResponse } from '../models/api-response.model'
import { HttpService } from './http.service'

/**
 * Servicio especializado para consultas a ArcGIS REST API.
 * Simplifica las consultas a capas de FeatureServer/MapServer.
 *
 * @class ArcgisService
 *
 * @example
 * const arcgis = new ArcgisService()
 * const response = await arcgis.queryLayer<FeatureSet>(
 *   'https://services.arcgis.com/myserver/MapServer',
 *   0,
 *   { where: "ESTADO = 'Activo'", outFields: 'OBJECTID,NOMBRE' }
 * )
 */
export class ArcgisService {

  /** Instancia del servicio HTTP para realizar peticiones */
  private readonly http = new HttpService()

  /**
   * Realiza una consulta (query) a una capa de ArcGIS Server.
   * Construye automáticamente la URL con los parámetros de consulta.
   *
   * @template T - Tipo de datos esperado en la respuesta (ej: FeatureSet)
   * @param {string} baseUrl - URL base del servicio (MapServer/FeatureServer)
   * @param {number} layerId - ID de la capa a consultar
   * @param {Object} params - Parámetros de la consulta
   * @param {string} [params.where='1=1'] - Cláusula WHERE de SQL
   * @param {string} [params.outFields='*'] - Campos a retornar
   * @param {boolean} [params.returnGeometry=true] - Si incluir geometría
   * @returns {Promise<ApiResponse<T>>} Respuesta con features o error
   *
   * @example
   * // Consultar predios activos
   * const predios = await arcgis.queryLayer<FeatureSet>(
   *   'https://services.arcgis.com/predios/MapServer',
   *   0,
   *   {
   *     where: "ESTADO = 'Activo'",
   *     outFields: 'OBJECTID,CODIGO,PROPIETARIO',
   *     returnGeometry: false
   *   }
   * )
   */
  async queryLayer<T>(baseUrl: string, layerId: number, params: {
    where?: string
    outFields?: string
    returnGeometry?: boolean
  }): Promise<ApiResponse<T>> {

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

    return this.http.get<T>(url)
  }
}
