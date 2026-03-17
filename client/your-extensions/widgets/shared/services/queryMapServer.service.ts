import esriRequest from "@arcgis/core/request"
import type { MapServiceResponse } from "../types/types_consultaAvanzadaAlfanumerica"


export async function loadLayers(SERVICE_URL: string): Promise<MapServiceResponse> {

  const response = await esriRequest(SERVICE_URL, {
    query: { f: "json" },
    responseType: "json"
  })

  return response.data
}