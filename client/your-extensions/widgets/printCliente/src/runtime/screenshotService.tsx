/**
 * @fileoverview Servicio para captura de pantalla de vistas de mapa ArcGIS.
 * @module printCliente/screenshotService
 */

import type MapView from "@arcgis/core/views/MapView"
import type SceneView from "@arcgis/core/views/SceneView"

/**
 * Resultado de la captura de pantalla del mapa.
 * @interface ScreenshotResult
 * @property {string} dataUrl - URL de datos (data URL) de la imagen capturada en formato PNG.
 * @property {number} width - Ancho de la imagen en píxeles.
 * @property {number} height - Alto de la imagen en píxeles.
 */
export interface ScreenshotResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Captura una imagen del mapa actual.
 * Soporta tanto MapView (2D) como SceneView (3D).
 * @async
 * @param {MapView | SceneView} view - Vista del mapa a capturar.
 * @returns {Promise<ScreenshotResult>} Promesa con los datos de la captura.
 * @example
 * const result = await captureMap(mapView);
 * console.log(result.dataUrl); // "data:image/png;base64,..."
 */
export const captureMap = async (
  view: MapView | SceneView
): Promise<ScreenshotResult> => {

  const screenshot = await view.takeScreenshot({
    format: "png",
    quality: 100
  })

  const responseCaptureMap = {
    dataUrl: screenshot.dataUrl,
    width: screenshot.data.width,
    height: screenshot.data.height
  }
  console.log({responseCaptureMap})
  return responseCaptureMap
}
