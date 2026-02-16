/**
 * @fileoverview Hook para cargar plantillas de layout del servidor de impresión.
 * Gestiona la obtención asíncrona de plantillas disponibles.
 * @module advanced-print/useLayoutTemplates
 */

import { React } from "jimu-core"
import { getLayoutTemplates } from "./printService"
import type { LayoutTemplate } from "./types"

const { useState, useEffect } = React

/**
 * Hook de React para cargar las plantillas de layout disponibles.
 * Ejecuta la consulta al montar el componente y gestiona estados de carga/error.
 *
 * @function useLayoutTemplates
 * @returns {Object} Objeto con plantillas y estados
 * @returns {LayoutTemplate[]} returns.templates - Array de plantillas disponibles
 * @returns {boolean} returns.loading - True mientras se cargan las plantillas
 * @returns {string|null} returns.error - Mensaje de error o null
 * @example
 * const { templates, loading, error } = useLayoutTemplates();
 *
 * // templates = [
 * //   { layoutTemplate: "A4 Portrait", pageSize: [595, 842] },
 * //   { layoutTemplate: "Letter Landscape", pageSize: [792, 612] }
 * // ]
 */
export const useLayoutTemplates = () => {
  const [templates, setTemplates] = useState<LayoutTemplate[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Iniciando carga de plantillas...")
        const result = await getLayoutTemplates()
        console.log("Plantillas cargadas:", result)
        setTemplates(result)
      } catch (err: any) {
        console.error("Error en useLayoutTemplates:", err)
        setError(err?.message || "Error cargando plantillas")
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])
  return { templates, loading, error }
}
