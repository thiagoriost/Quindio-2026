import { React } from 'jimu-core'
import type { ApiResponse } from '../models/api-response.model'
import { validaLoggerLocalStorage } from '../utils/export.utils'
/**
 * Hook personalizado para ejecutar peticiones HTTP cancelables.
 *
 * Permite:
 *  - Ejecutar múltiples peticiones controladas mediante AbortController.
 *  - Cancelar todas las peticiones activas (por ejemplo, al cerrar un widget).
 *  - Manejar de forma controlada el error por cancelación.
 *
 * Ideal para widgets en Experience Builder donde:
 *  - El usuario puede lanzar múltiples búsquedas consecutivas.
 *  - El widget puede cerrarse antes de que finalicen las peticiones.
 *
 * @returns {Object}
 *  - execute: Ejecuta una petición cancelable.
 *  - cancelAll: Cancela todas las peticiones activas.
 */
export const useCancelableHttp = () => {

  /**
   * Referencia que almacena todos los AbortController activos.
   * Cada vez que se ejecuta una petición, se crea un nuevo AbortController y se agrega a esta lista.
   */
  const controllersRef = React.useRef<AbortController[]>([])

  /**
   * Ejecuta una petición HTTP cancelable.
   *
   * @template T Tipo de dato esperado en la respuesta.
   *
   * @param requestFn Función que recibe un AbortSignal y retorna una Promise<ApiResponse<T>>.
   *                  Esta función normalmente será el HttpService o fetch personalizado.
   *
   * @returns Promise<ApiResponse<T>>
   *
   * Comportamiento:
   *  - Crea un AbortController nuevo.
   *  - Pasa el signal a la función requestFn.
   *  - Si la petición es cancelada, retorna un ApiResponse controlado.
   *  - Elimina el controller de la lista al finalizar.
   *  - El signal: Es un objeto especial del navegador que mantiene un canal de comunicación entre: AbortController ↔ fetch
   */
  const execute = async <T>(
    requestFn: (signal: AbortSignal) => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> => {

    // Se guarda el controller para poder cancelarlo luego
    const controller = new AbortController()
    controllersRef.current.push(controller)

    try {
      const response = await requestFn(controller.signal)
      return response

    } catch (err: any) {

      // Manejo explícito cuando la petición fue abortada 'AbortError'
      if (err?.name === 'AbortError') {
        return { success: false, error: 'Petición cancelada' }
      }
      // Si es otro error, se propaga para que el widget lo maneje (ej: mostrar alerta)
      throw err

    } finally {
      // Se limpia el controller finalizado para evitar fugas de memoria
      controllersRef.current =
        controllersRef.current.filter(c => c !== controller)
    }
  }

  /**
     * Cancela todas las peticiones activas.
     *
     * Uso típico:
     *  - Cuando el widget se desmonta. "Cerrar"
     */
  const cancelAll = () => {
    if (validaLoggerLocalStorage('logger')) console.log('Cancelando todas las peticiones activas del widget...')
    controllersRef.current.forEach(c => { c.abort() })
    controllersRef.current = []
  }

  return { execute, cancelAll }
}