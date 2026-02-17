/**
 * @fileoverview Servicio para generación de documentos PDF con mapas.
 * Genera un PDF con las siguientes páginas:
 * - Página 1: Mapa con título, escala, sistema de referencia, fecha, autor y flecha de norte
 * - Página 2+ (opcional): Leyenda automática agrupada por capas visibles (solo si existen leyendas)
 * @module printCliente/pdfService
 */

import JsPDF from "jspdf"
import { buildLegendItems } from "./legendService"

/**
 * Opciones de configuración para la generación del PDF.
 * @interface PdfOptions
 * @property {string} title - Título que se mostrará en el encabezado del PDF.
 * @property {number} scale - Escala del mapa (ej: 50000 para 1:50000).
 * @property {string} imageUrl - URL de datos (data URL) de la imagen del mapa en formato PNG.
 * @property {number} imageWidth - Ancho original de la imagen capturada en píxeles.
 * @property {number} imageHeight - Alto original de la imagen capturada en píxeles.
 * @property {string} spatialReference - Sistema de referencia espacial del mapa.
 * @property {string} [author] - Autor del mapa (opcional).
 * @property {__esri.MapView | __esri.SceneView} view - Vista del mapa para extraer la leyenda.
 */
interface PdfOptions {
  title: string;
  scale: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  spatialReference: string;
  author?: string;
  view: __esri.MapView | __esri.SceneView;
}


/**
 * Genera y descarga un documento PDF con el mapa y su leyenda.
 *
 * El PDF generado contiene 2 páginas:
 * - **Página 1**: Mapa con marco, título, imagen del mapa (manteniendo aspect ratio),
 *   y cajetín inferior con escala, sistema de referencia, fecha, autor y flecha de norte.
 * - **Página 2**: Leyenda automática extraída de las capas visibles del mapa,
 *   con soporte para múltiples páginas si la leyenda es extensa.
 *
 * @async
 * @param {PdfOptions} options - Opciones de configuración del PDF.
 * @returns {Promise<void>} Promesa que se resuelve cuando el PDF ha sido generado y descargado.
 * @example
 * await generatePdf({
 *   title: "Mapa de ubicación",
 *   scale: 50000,
 *   imageUrl: "data:image/png;base64,...",
 *   imageWidth: 1920,
 *   imageHeight: 1080,
 *   spatialReference: "WKID 4326",
 *   author: "IGAC",
 *   view: mapView
 * });
 */
export const generatePdf = async (options: PdfOptions): Promise<void> => {

  console.log({options})
  const doc = new JsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  /* ==========================================
     PÁGINA 1 → MAPA COMPLETO
  ========================================== */
   /* ===============================
     MARCO EXTERNO
  =============================== */
  doc.setLineWidth(1)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

  /* ===============================
     TÍTULO SUPERIOR
  =============================== */
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(options.title.toUpperCase(), pageWidth / 2, 20, { align: "center" })

  // Calcular dimensiones del mapa manteniendo la relación de aspecto
  const mapLeft = 15
  const mapTop = 30
  const maxMapWidth = pageWidth - 30
  const maxMapHeight = pageHeight - 90

  // Relación de aspecto de la imagen original
  const imageAspectRatio = options.imageWidth / options.imageHeight

  // Calcular dimensiones finales respetando el aspect ratio
  let mapWidth: number
  let mapHeight: number

  if (maxMapWidth / maxMapHeight > imageAspectRatio) {
    // El espacio disponible es más ancho que la imagen - ajustar por altura
    mapHeight = maxMapHeight
    mapWidth = mapHeight * imageAspectRatio
  } else {
    // El espacio disponible es más alto que la imagen - ajustar por ancho
    mapWidth = maxMapWidth
    mapHeight = mapWidth / imageAspectRatio
  }

  // Centrar horizontalmente
  const mapLeftCentered = mapLeft + (maxMapWidth - mapWidth) / 2

  doc.rect(mapLeftCentered, mapTop, mapWidth, mapHeight)
  doc.addImage(options.imageUrl, "PNG", mapLeftCentered, mapTop, mapWidth, mapHeight)

   /* ==========================================
     CAJETÍN INFERIOR
  ========================================== */

  // Posicionar el cajetín debajo del mapa con un margen
  const footerTop = mapTop + mapHeight + 5
  const footerHeight = Math.min(35, pageHeight - footerTop - 15)

  doc.rect(15, footerTop, pageWidth - 30, footerHeight)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  doc.text(`Escala: 1:${Math.round(options.scale)}`, 20, footerTop + 10)
  doc.text(`Sistema Ref.: ${options.spatialReference}`, 20, footerTop + 18)
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, footerTop + 26)

  if (options.author) {
    doc.text(`Autor: ${options.author}`, 20, footerTop + 32)
  }

  // Norte
  /* const northX = pageWidth - 40
  const northY = footerTop + 25

  doc.setFontSize(14)
  doc.text("N", northX + 2, northY - 12)
  doc.line(northX, northY, northX, northY - 20)
  doc.triangle(
    northX - 4,
    northY - 15,
    northX + 4,
    northY - 15,
    northX,
    northY - 25,
    "F"
  ) */

  /* ==========================================
     PÁGINA 2 → LEYENDA COMPLETA (solo si hay leyendas)
  ========================================== */

  const legendGroups = await buildLegendItems(options.view)

  // Solo crear página de leyenda si existen elementos
  if (legendGroups.length === 0) {
    doc.save("Mapa_IGAC_A3.pdf")
    return
  }

  doc.addPage()

  doc.setLineWidth(1)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("LEYENDA", pageWidth / 2, 20, { align: "center" })

  let y = 35

  // Ancho máximo para el texto de items (con indentación)
  const maxTextWidth = pageWidth - 50 - 15 // 50 es donde inicia el texto indentado, 15 es el margen derecho
  // Ancho máximo para el título de la capa (sin indentación)
  const maxTitleWidth = pageWidth - 20 - 15 // 20 es donde inicia el título, 15 es el margen derecho
  const lineHeight = 5

  for (let groupIndex = 0; groupIndex < legendGroups.length; groupIndex++) {
    const group = legendGroups[groupIndex]

    // Dividir el título en líneas si es muy largo
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    const titleLines = doc.splitTextToSize(group.layerTitle, maxTitleWidth)
    const titleBlockHeight = titleLines.length * lineHeight + 3

    // Verificar si hay espacio para el título del grupo
    if (y + titleBlockHeight > pageHeight - 20) {
      doc.addPage()
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
      y = 25
    }

    // Renderizar título de la capa (sub-encabezado)
    doc.text(titleLines, 20, y)
    y += titleBlockHeight

    // Renderizar items de la leyenda con indentación
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    for (const item of group.items) {
      // Dividir el texto en líneas si es muy largo
      const textLines = doc.splitTextToSize(item.label, maxTextWidth)
      const blockHeight = textLines.length * lineHeight + 6

      // Salto automático de página si se llena
      if (y + blockHeight > pageHeight - 20) {
        doc.addPage()
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
        y = 25
      }

      // Imagen del símbolo (indentada)
      if (item.imageData) {
        try {
          doc.addImage(item.imageData, "PNG", 25, y - 5, 8, 8)
        } catch (err) {
          console.warn("[generatePdf] Error agregando imagen de leyenda:", err)
        }
      }

      // Texto del item (indentado)
      doc.text(textLines, 38, y)

      y += textLines.length * lineHeight + 4
    }

    // Línea separadora entre grupos de capas
    if (groupIndex < legendGroups.length - 1) {
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.4)
      doc.line(20, y, pageWidth - 20, y)
      y += 8 // Espacio después de la línea
    }
  }

  doc.save("Mapa_IGAC_A3.pdf")
}
