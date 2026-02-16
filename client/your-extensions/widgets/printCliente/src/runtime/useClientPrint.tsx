/**
 * @fileoverview Hook personalizado para impresión de mapas en PDF.
 * @module printCliente/useClientPrint
 */

import { useState, useCallback } from "react"
import type { JimuMapView } from "jimu-arcgis"
import { captureMap } from "./screenshotService"
import { generatePdf } from "./pdfService"

/**
 * Hook personalizado que proporciona funcionalidad de impresión de mapas a PDF.
 * Captura el estado actual del mapa y genera un documento PDF descargable.
 * @param {JimuMapView} [jimuMapView] - Instancia de JimuMapView del mapa a imprimir.
 * @returns {object} Objeto con la función de impresión y estado de carga.
 * @returns {Function} returns.print - Función asíncrona para ejecutar la impresión.
 * @returns {boolean} returns.loading - Indica si hay una impresión en progreso.
 * @example
 * const { print, loading } = useClientPrint(jimuMapView);
 *  Luego en el render:
 * <button onClick={print} disabled={loading}>Imprimir</button>
 */
export const useClientPrint = (jimuMapView?: JimuMapView) => {

  const [loading, setLoading] = useState(false)

  /**
   * Ejecuta el proceso de impresión del mapa.
   * Captura la vista actual y genera un PDF con título, fecha, escala e imagen.
   * @async
   * @returns {Promise<void>}
   */
  const print = useCallback(async () => {

    if (!jimuMapView?.view) return

    try {
      setLoading(true)

      const screenshot = await captureMap(jimuMapView.view)

      generatePdf({
        title: "Mapa generado",
        scale: jimuMapView.view.scale,
        imageUrl: screenshot.dataUrl
      })

    } finally {
      setLoading(false)
    }

  }, [jimuMapView])

  return { print, loading }
}
