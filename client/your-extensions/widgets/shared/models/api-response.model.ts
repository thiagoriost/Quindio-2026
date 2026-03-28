/**
 * Representa la estructura estándar de respuesta de una petición HTTP.
 *
 * @template T Tipo de dato que se espera recibir en la respuesta cuando la operación es exitosa.
 */
export interface ApiResponse<T> {

  /**
   * Indica si la operación fue exitosa.
   * - `true`: la petición se completó correctamente.
   * - `false`: ocurrió un error durante la ejecución.
   */
  success: boolean

  /**
   * Datos retornados por la operación cuando `success` es `true`.
   * Puede ser cualquier tipo definido por el genérico `T`.
   */
  data?: T

  /**
   * Mensaje de error descriptivo cuando `success` es `false`.
   * Puede contener un mensaje técnico o amigable para el usuario.
   */
  error?: string
}