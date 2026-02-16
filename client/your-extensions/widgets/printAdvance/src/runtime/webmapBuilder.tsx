/**
 * @fileoverview Constructor de WebMap JSON para el servicio de impresión.
 * Transforma un MapView de ArcGIS JS API a formato JSON compatible con Print Service.
 * @module advanced-print/webmapBuilder
 */

import type MapView from "@arcgis/core/views/MapView"

/** Dominios de servicios externos que el servidor IGAC no puede acceder */
const EXTERNAL_DOMAINS = [
  "services.arcgisonline.com",
  "server.arcgisonline.com",
  "basemaps.arcgis.com"
]

/**
 * Verifica si una URL es accesible desde el servidor de impresión IGAC.
 * @param {string} url - URL a verificar
 * @returns {boolean} True si la URL es accesible (interna o no bloqueada)
 */
const isAccessibleUrl = (url: string | undefined): boolean => {
  if (!url) return false
  return !EXTERNAL_DOMAINS.some(domain => url.includes(domain))
}

/**
 * Construye el JSON del WebMap a partir de un MapView de ArcGIS.
 * Sigue la especificación ExportWebMap de ArcGIS Print Service.
 * Excluye capas de servicios externos no accesibles desde el servidor IGAC.
 *
 * @function buildWebMapJson
 * @param {MapView} view - Vista del mapa de ArcGIS JS API
 * @returns {Object} Objeto JSON compatible con el servicio de impresión
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/export-web-map-specification/
 */
export const buildWebMapJson = (view: MapView): any => {
  // Construir capas del mapa base (solo las accesibles)
  const baseMapLayers = view.map.basemap.baseLayers
    .toArray()
    .filter(layer => {
      const url = (layer as any).url
      const accessible = layer.visible && isAccessibleUrl(url)
      if (!accessible && url) {
        console.warn(`Capa base excluida (no accesible desde servidor IGAC): ${url}`)
      }
      return accessible
    })
    .map(layer => ({
      id: layer.id,
      layerType: getLayerType(layer),
      url: (layer as any).url,
      title: layer.title,
      opacity: layer.opacity,
      visibility: layer.visible
    }))

  // Construir capas operacionales (solo las con URL válida y accesible)
  const operationalLayers = view.map.layers
    .toArray()
    .filter(layer => {
      const url = (layer as any).url
      return layer.visible && url && isAccessibleUrl(url)
    })
    .map(layer => ({
      id: layer.id,
      layerType: getLayerType(layer),
      url: (layer as any).url,
      title: layer.title,
      opacity: layer.opacity,
      visibility: layer.visible,
      ...((layer as any).definitionExpression && {
        layerDefinition: {
          definitionExpression: (layer as any).definitionExpression
        }
      })
    }))

  const webMap: any = {
    mapOptions: {
      extent: view.extent.toJSON(),
      scale: view.scale,
      spatialReference: view.spatialReference.toJSON()
    },
    operationalLayers,
    exportOptions: {
      outputSize: [view.width, view.height]
    }
  }

  // Solo incluir baseMap si hay capas accesibles
  if (baseMapLayers.length > 0) {
    webMap.baseMap = {
      baseMapLayers,
      title: view.map.basemap.title || "Basemap"
    }
  } else {
    console.warn("No hay capas base accesibles desde el servidor IGAC. El mapa se imprimirá sin mapa base.")
  }

  console.log("WebMap JSON generado:", webMap)
  return webMap
}

/**
 * Determina el tipo de capa para el JSON del Print Service.
 * @param {__esri.Layer} layer - Capa de ArcGIS
 * @returns {string} Tipo de capa compatible con Print Service
 */
const getLayerType = (layer: __esri.Layer): string => {
  const type = layer.type
  switch (type) {
    case "tile":
      return "ArcGISTiledMapServiceLayer"
    case "map-image":
      return "ArcGISMapServiceLayer"
    case "feature":
      return "ArcGISFeatureLayer"
    case "vector-tile":
      return "VectorTileLayer"
    case "imagery":
      return "ArcGISImageServiceLayer"
    case "imagery-tile":
      return "ArcGISImageServiceLayer"
    case "wms":
      return "WMS"
    default:
      return "ArcGISMapServiceLayer"
  }
}
