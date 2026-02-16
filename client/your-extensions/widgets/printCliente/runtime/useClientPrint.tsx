import { useState, useCallback } from "react"
import type { JimuMapView } from "jimu-arcgis"
import { captureMap } from "./screenshotService"
import { generatePdf } from "./pdfService"

export const useClientPrint = (jimuMapView?: JimuMapView) => {

  const [loading, setLoading] = useState(false)

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
