/**
 * @fileoverview Modelos de respuesta para servicios HTTP.
 * Define interfaces genéricas para estandarizar las respuestas de API.
 *
 * @module shared/models/api-response
 *
 * @author IGAC - DIP
 * @since 2024
 */

/**
 * Interfaz genérica para respuestas de API.
 * Encapsula el resultado de una petición HTTP con estado de éxito/error.
 *
 * @interface ApiResponse
 * @template T - Tipo de datos esperado en la respuesta exitosa
 *
 * @example
 * // Respuesta exitosa
 * const response: ApiResponse<User[]> = {
 *   success: true,
 *   data: [{ id: 1, name: 'John' }]
 * }
 *
 * @example
 * // Respuesta con error
 * const errorResponse: ApiResponse<User[]> = {
 *   success: false,
 *   error: 'Usuario no encontrado'
 * }
 */
export interface ApiResponse<T> {
    /** Indica si la petición fue exitosa */
    success: boolean
    /** Datos de la respuesta (solo presente si success es true) */
    data?: T
    /** Mensaje de error (solo presente si success es false) */
    error?: string
}
