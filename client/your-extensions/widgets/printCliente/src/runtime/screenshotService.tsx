/**
 * @fileoverview Servicio para captura de pantalla de vistas de mapa ArcGIS.
 * Utiliza la API nativa de ArcGIS JS para capturar el estado actual del mapa.
 * @module printCliente/screenshotService
 */

import type MapView from "@arcgis/core/views/MapView"
import type SceneView from "@arcgis/core/views/SceneView"

/**
 * Resultado de la captura de pantalla del mapa.
 * Contiene la imagen en formato data URL y sus dimensiones originales.
 * @interface ScreenshotResult
 * @property {string} dataUrl - URL de datos (data URL) de la imagen capturada en formato PNG.
 * @property {number} width - Ancho original de la imagen capturada en píxeles.
 * @property {number} height - Alto original de la imagen capturada en píxeles.
 */
export interface ScreenshotResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Captura una imagen del estado actual del mapa.
 * Soporta tanto MapView (2D) como SceneView (3D).
 * La captura se realiza en formato PNG con calidad 100%.
 *
 * @async
 * @param {MapView | SceneView} view - Vista del mapa a capturar.
 * @returns {Promise<ScreenshotResult>} Promesa con los datos de la captura incluyendo
 *          la imagen en data URL y sus dimensiones originales.
 * @example
 * const result = await captureMap(mapView);
 * console.log(result.dataUrl);   // "data:image/png;base64,..."
 * console.log(result.width);     // 1920
 * console.log(result.height);    // 1080
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
