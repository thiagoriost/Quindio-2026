/**
 * @fileoverview Servicio para construcción de leyendas de mapas.
 * Extrae los símbolos y etiquetas de las capas visibles del mapa.
 * Soporta los siguientes tipos de renderer:
 * - ClassBreaksRenderer (rangos de valores)
 * - UniqueValueRenderer (valores únicos)
 * - SimpleRenderer (símbolo único)
 * @module printCliente/legendService
 */

import { loadModules } from "esri-loader"

/**
 * Representa un elemento de la leyenda del mapa.
 * @interface LegendItem
 * @property {string} label - Etiqueta descriptiva del símbolo.
 * @property {string} [imageData] - Imagen del símbolo en formato data URL (PNG).
 */
export interface LegendItem {
  label: string;
  imageData?: string;
}

/**
 * Representa un grupo de leyendas agrupadas por capa.
 * @interface LegendGroup
 * @property {string} layerTitle - Título de la capa.
 * @property {LegendItem[]} items - Items de leyenda pertenecientes a esta capa.
 */
export interface LegendGroup {
  layerTitle: string;
  items: LegendItem[];
}

/**
 * Convierte un elemento SVG a formato PNG usando canvas.
 * Necesario porque jsPDF no soporta imágenes SVG directamente.
 * @param {SVGElement} svgElement - Elemento SVG a convertir.
 * @param {number} [size=32] - Tamaño del canvas en píxeles (cuadrado).
 * @returns {Promise<string>} Data URL de la imagen PNG resultante.
 * @throws {Error} Si no se puede obtener el contexto 2D del canvas.
 */
const svgToPng = (svgElement: SVGElement, size: number = 32): Promise<string> => {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL("image/png"))
      } else {
        reject(new Error("No se pudo obtener contexto 2D"))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Error cargando imagen SVG"))
    }
    img.src = url
  })
}

/**
 * Extrae el data URL de un elemento HTML generado por symbolUtils.renderPreviewHTML.
 * Intenta extraer en el siguiente orden de prioridad:
 * 1. Canvas - usa toDataURL directamente
 * 2. Imagen - usa el src de la imagen
 * 3. SVG - convierte a PNG usando svgToPng
 * @param {HTMLElement} previewElement - Elemento HTML que contiene el preview del símbolo.
 * @returns {Promise<string | undefined>} Data URL de la imagen o undefined si no se puede extraer.
 */
const extractImageData = async (previewElement: HTMLElement): Promise<string | undefined> => {
  // Intentar obtener canvas primero
  const canvas = previewElement.querySelector("canvas")
  if (canvas) {
    try {
      return canvas.toDataURL("image/png")
    } catch (e) {
      console.warn("[extractImageData] Error extrayendo canvas:", e)
    }
  }

  // Intentar obtener img
  const img = previewElement.querySelector("img")
  if (img && img.src) {
    return img.src
  }

  // Intentar obtener SVG y convertirlo a PNG
  const svg = previewElement.querySelector("svg")
  if (svg) {
    try {
      return await svgToPng(svg, 32)
    } catch (e) {
      console.warn("[extractImageData] Error convirtiendo SVG a PNG:", e)
    }
  }

  return undefined
}

/**
 * Construye los grupos de leyenda a partir de las capas visibles del mapa.
 *
 * Proceso de extracción:
 * 1. Filtra solo FeatureLayers visibles
 * 2. Espera a que cada capa esté completamente cargada
 * 3. Extrae los símbolos según el tipo de renderer:
 *    - ClassBreaksRenderer: extrae classBreakInfos
 *    - UniqueValueRenderer: extrae uniqueValueInfos
 *    - SimpleRenderer: extrae el símbolo único
 * 4. Convierte cada símbolo a imagen PNG usando symbolUtils.renderPreviewHTML
 * 5. Agrupa los items por capa para renderizado jerárquico
 *
 * @async
 * @param {__esri.MapView | __esri.SceneView} view - Vista del mapa de la cual extraer las capas.
 * @returns {Promise<LegendGroup[]>} Array de grupos de leyenda organizados por capa.
 * @example
 * const legendGroups = await buildLegendItems(mapView);
 * legendGroups.forEach(group => {
 *   console.log(group.layerTitle);  // "Nombre de la capa"
 *   group.items.forEach(item => {
 *     console.log(item.label);      // "Valor 1 - Valor 2"
 *     console.log(item.imageData);  // "data:image/png;base64,..."
 *   });
 * });
 */
export const buildLegendItems = async (
  view: __esri.MapView | __esri.SceneView
): Promise<LegendGroup[]> => {

  const groups: LegendGroup[] = []

  // Cargar symbolUtils para renderizar símbolos a imagen
  const [symbolUtils] = await loadModules(["esri/symbols/support/symbolUtils"])

  const layers = view.map.layers.toArray().filter(l => l.visible)
  console.log("[buildLegendItems] Capas visibles:", layers.length)

  for (const layer of layers) {
    console.log("[buildLegendItems] Procesando capa:", layer.title, "- tipo:", layer.type)

    // Solo procesar FeatureLayers
    if (layer.type !== "feature") continue

    const featureLayer = layer as __esri.FeatureLayer

    // Esperar a que la capa esté cargada
    if (!featureLayer.loaded) {
      await featureLayer.load()
    }

    const renderer = featureLayer.renderer
    if (!renderer) continue

    console.log("[buildLegendItems] Renderer tipo:", renderer.type)

    // Manejar ClassBreaksRenderer
    if (renderer.type === "class-breaks") {
      const cbRenderer = renderer
      console.log("[buildLegendItems] ClassBreakInfos encontrados:", cbRenderer.classBreakInfos?.length)

      const layerItems: LegendItem[] = []

      for (const info of cbRenderer.classBreakInfos || []) {
        const symbol = info.symbol
        let imageData: string | undefined

        if (symbol) {
          try {
            const preview = await symbolUtils.renderPreviewHTML(symbol, {
              node: document.createElement("div"),
              size: 24
            })
            console.log("[buildLegendItems] Preview generado:", preview.innerHTML)
            imageData = await extractImageData(preview)
            console.log("[buildLegendItems] ImageData extraído:", imageData ? "OK" : "null")
          } catch (err) {
            console.warn("[buildLegendItems] Error renderizando símbolo:", err)
          }
        }

        layerItems.push({
          label: info.label || `${info.minValue} - ${info.maxValue}`,
          imageData
        })
      }

      if (layerItems.length > 0) {
        groups.push({
          layerTitle: layer.title || "Capa",
          items: layerItems
        })
      }
    }

    // Manejar UniqueValueRenderer
    if (renderer.type === "unique-value") {
      const uvRenderer = renderer
      console.log("[buildLegendItems] UniqueValueInfos encontrados:", uvRenderer.uniqueValueInfos?.length)

      const layerItems: LegendItem[] = []

      for (const info of uvRenderer.uniqueValueInfos || []) {
        const symbol = info.symbol
        let imageData: string | undefined

        if (symbol) {
          try {
            const preview = await symbolUtils.renderPreviewHTML(symbol, {
              node: document.createElement("div"),
              size: 24
            })
            imageData = await extractImageData(preview)
          } catch (err) {
            console.warn("[buildLegendItems] Error renderizando símbolo:", err)
          }
        }

        layerItems.push({
          label: info.label || String(info.value),
          imageData
        })
      }

      if (layerItems.length > 0) {
        groups.push({
          layerTitle: layer.title || "Capa",
          items: layerItems
        })
      }
    }

    // Manejar SimpleRenderer
    if (renderer.type === "simple") {
      const simpleRenderer = renderer
      const symbol = simpleRenderer.symbol
      let imageData: string | undefined

      if (symbol) {
        try {
          const preview = await symbolUtils.renderPreviewHTML(symbol, {
            node: document.createElement("div"),
            size: 24
          })
          imageData = await extractImageData(preview)
        } catch (err) {
          console.warn("[buildLegendItems] Error renderizando símbolo:", err)
        }
      }

      groups.push({
        layerTitle: layer.title || "Capa",
        items: [{
          label: "Símbolo único",
          imageData
        }]
      })
    }
  }

  console.log("[buildLegendItems] Total grupos generados:", groups.length)
  return groups
}
