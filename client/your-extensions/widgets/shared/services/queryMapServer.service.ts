import esriRequest from "@arcgis/core/request"
import type { MapServiceResponse } from "../types/types_consultaAvanzadaAlfanumerica"

/**
 * Carga la información de las capas disponibles en un servicio de mapas de ArcGIS.
 *
 * @param SERVICE_URL URL del servicio de mapas (MapServer) de ArcGIS.
 * @returns {Promise<MapServiceResponse>} Promesa que resuelve con la información de las capas.

 */
export async function loadLayers(SERVICE_URL: string): Promise<MapServiceResponse> {

  const response = await esriRequest(SERVICE_URL, {
    query: { f: "json" },
    responseType: "json"
  })

  return response.data
}