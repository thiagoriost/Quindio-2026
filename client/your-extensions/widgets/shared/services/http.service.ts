/**
 * @fileoverview Servicio HTTP genérico para peticiones REST.
 * Proporciona métodos para realizar peticiones HTTP con manejo de errores estandarizado.
 *
 * @module shared/services/http-service
 * @requires shared/models/api-response
 *
 * @author IGAC - DIP
 * @since 2024
 */

import type { ApiResponse } from '../models/api-response.model'

/**
 * Servicio HTTP para realizar peticiones REST.
 * Encapsula la lógica de fetch con manejo de errores y respuestas tipadas.
 *
 * @class HttpService
 *
 * @example
 * const http = new HttpService()
 * const response = await http.get<User[]>('https://api.example.com/users')
 * if (response.success) {
 *   console.log(response.data)
 * }
 */
export class HttpService {

    /**
     * Realiza una petición GET a la URL especificada.
     * Maneja automáticamente errores de red y respuestas de error del servidor.
     *
     * @template T - Tipo de datos esperado en la respuesta
     * @param {string} url - URL completa del endpoint
     * @returns {Promise<ApiResponse<T>>} Respuesta tipada con datos o error
     *
     * @example
     * const response = await http.get<Feature[]>('https://services.arcgis.com/layer/query?f=json')
     */
    async get<T>(url: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(url)

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` }
            }

            const json = await response.json()

            if (json.error) {
                return { success: false, error: json.error.message }
            }

            return { success: true, data: json }

        } catch (err) {
            return { success: false, error: 'Error de conexión al servidor' }
        }
    }
}
