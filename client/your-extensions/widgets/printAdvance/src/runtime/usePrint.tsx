/**
 * @fileoverview Hook personalizado para gestionar la impresión de mapas.
 * Encapsula la lógica de estado y ejecución de impresiones.
 * @module advanced-print/usePrint
 */

import { useState, useCallback } from "react"
import type { JimuMapView } from "jimu-arcgis"
import type MapView from "esri/views/MapView"
import { executePrint } from "./printService"
import { buildWebMapJson } from "./webmapBuilder"
import type { PrintConfiguration } from "./types"

/**
 * Hook de React para gestionar la impresión de mapas en Experience Builder.
 * Proporciona una función de impresión y estados de carga/error.
 *
 * @function usePrint
 * @param {JimuMapView} [jimuMapView] - Vista del mapa de Jimu (puede ser undefined inicialmente)
 * @returns {Object} Objeto con funciones y estados de impresión
 * @returns {Function} returns.print - Función async para ejecutar impresión
 * @returns {boolean} returns.loading - True mientras se procesa la impresión
 * @returns {string|null} returns.error - Mensaje de error o null si no hay error
 * @example
 * const { print, loading, error } = usePrint(jimuMapView);
 *
 * // Al hacer clic en botón:
 * await print({ layout: "A4 Portrait", format: "pdf", dpi: 300 });
 */
export const usePrint = (jimuMapView?: JimuMapView) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const print = useCallback(async (config: PrintConfiguration) => {
    if (!jimuMapView?.view) {
      setError("No hay mapa disponible")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const webMapJson = buildWebMapJson(jimuMapView.view as MapView)
      console.log("Iniciando impresión con config:", config)

      const result = await executePrint({
        webMapJson,
        config
      })

      window.open(result.url, "_blank")
    } catch (err: any) {
      console.error("Error en impresión:", err)
      setError(err?.message || "Error generando impresión")
    } finally {
      setLoading(false)
    }
  }, [jimuMapView])

  return { print, loading, error }
}
