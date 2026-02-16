/**
 * @fileoverview Servicio de impresión para comunicación con ArcGIS Print Service.
 * Proporciona funciones para ejecutar impresiones y obtener plantillas disponibles.
 * @module advanced-print/printService
 */

import esriRequest from "@arcgis/core/request"
import type { ExecutePrintParams, PrintResult, LayoutTemplate } from "./types"

/** URL base del servicio de impresión de IGAC */
const PRINT_SERVICE_BASE = "https://pruebassig.igac.gov.co/server/rest/services/Utilities/PrintingTools/GPServer"

/**
 * Ejecuta una tarea de impresión en el servidor de ArcGIS.
 * Envía el WebMap JSON al servicio "Export Web Map Task" y retorna la URL del documento generado.
 *
 * @async
 * @function executePrint
 * @param {ExecutePrintParams} params - Parámetros de impresión
 * @param {PrintWebMap} params.webMapJson - JSON del WebMap a imprimir
 * @param {PrintConfiguration} params.config - Configuración (layout, formato, DPI)
 * @returns {Promise<PrintResult>} Objeto con la URL del documento generado
 * @throws {Error} Si el servicio no retorna una URL válida
 * @example
 * const result = await executePrint({
 *   webMapJson: buildWebMapJson(mapView),
 *   config: { layout: "A4 Portrait", format: "pdf", dpi: 300 }
 * });
 * window.open(result.url, "_blank");
 */
export const executePrint = async (
  params: ExecutePrintParams
): Promise<PrintResult> => {

  const url = `${PRINT_SERVICE_BASE}/Export%20Web%20Map%20Task/execute`

  // Preparar los parámetros de impresión
  const webMapAsJson = JSON.stringify(params.webMapJson)

  console.log("Print Service URL:", url)
  console.log("WebMap JSON:", webMapAsJson)
  console.log("Layout:", params.config.layout)
  console.log("Format:", params.config.format.toUpperCase())

  const response = await esriRequest(url, {
    method: "post",
    query: {
      f: "json",
      Web_Map_as_JSON: webMapAsJson,
      Format: params.config.format.toUpperCase(),
      Layout_Template: params.config.layout
    },
    responseType: "json"
  })

  const json = response.data
  console.log("Print Service Response:", json)

  // Verificar si hubo error en el servicio
  if (json.error) {
    console.error("Print Service Error:", json.error)
    throw new Error(json.error.message || "Error en servicio de impresión")
  }

  if (!json?.results?.[0]?.value?.url) {
    throw new Error("Print service error: No URL returned")
  }

  return { url: json.results[0].value.url }
}

/**
 * Obtiene las plantillas de layout disponibles en el servidor de impresión.
 * Consulta la tarea "Get Layout Templates Info Task" del Print Service.
 *
 * @async
 * @function getLayoutTemplates
 * @returns {Promise<LayoutTemplate[]>} Array de plantillas disponibles
 * @throws {Error} Si no se pueden obtener las plantillas del servidor
 * @example
 * const templates = await getLayoutTemplates();
 * // templates = [{ layoutTemplate: "A4 Portrait", pageSize: [595, 842] }, ...]
 */
export const getLayoutTemplates = async (): Promise<LayoutTemplate[]> => {
  const url = `${PRINT_SERVICE_BASE}/Get%20Layout%20Templates%20Info%20Task/execute`

  console.log("Fetching layout templates from:", url)

  try {
    const response = await esriRequest(url, {
      method: "post",
      query: {
        f: "json"
      },
      responseType: "json"
    })

    const json = response.data
    console.log("Layout Templates Response:", json)

    if (json.error) {
      console.error("Layout Templates Error:", json.error)
      throw new Error(json.error.message || "Error del servicio")
    }

    if (!json?.results?.[0]?.value) {
      console.error("No results in response:", json)
      throw new Error("Error obteniendo plantillas")
    }

    // El valor ya viene como array, no como string JSON
    const templates = json.results[0].value
    console.log("Parsed Templates:", templates)
    return templates
  } catch (err) {
    console.error("Error fetching templates:", err)
    throw err
  }
}
