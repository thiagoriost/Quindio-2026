/**
 * @fileoverview Servicio para generación de documentos PDF con mapas.
 * @module printCliente/pdfService
 */

import JsPDF from "jspdf"

/**
 * Opciones de configuración para la generación del PDF.
 * @interface PdfOptions
 * @property {string} title - Título que se mostrará en el encabezado del PDF.
 * @property {number} scale - Escala del mapa (ej: 50000 para 1:50000).
 * @property {string} imageUrl - URL de datos (data URL) de la imagen del mapa en formato PNG.
 */
interface PdfOptions {
  title: string;
  scale: number;
  imageUrl: string;
  spatialReference: string;
  author?: string;
}

/**
 * Genera y descarga un documento PDF con la imagen del mapa.
 * El PDF incluye título, fecha actual, escala aproximada e imagen del mapa.
 * @param {PdfOptions} options - Opciones de configuración del PDF.
 * @returns {void}
 * @example
 * generatePdf({
 *   title: "Mapa de ubicación",
 *   scale: 50000,
 *   imageUrl: "data:image/png;base64,..."
 * });
 */
export const generatePdf = (options: PdfOptions): void => {

  console.log({options})
  const doc = new JsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

   /* ===============================
     MARCO EXTERNO
  =============================== */
  doc.setLineWidth(0.8)
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

  /* ===============================
     TÍTULO
  =============================== */
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(options.title.toUpperCase(), pageWidth / 2, 15, {
    align: "center"
  })

  // Fecha
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, 22)

  // Escala
  doc.text(`Escala aproximada: 1:${Math.round(options.scale)}`, 10, 28)

   /* ===============================
     IMAGEN MAPA
  =============================== */
  const mapTop = 25
  const mapHeight = 150

  doc.setLineWidth(0.5)
  doc.rect(10, mapTop, pageWidth - 20, mapHeight)

  doc.addImage(
    options.imageUrl,
    "PNG",
    10,
    mapTop,
    pageWidth - 20,
    mapHeight
  )

  /* ===============================
     CAJETÍN TÉCNICO
  =============================== */
  const footerTop = mapTop + mapHeight + 5

  doc.setLineWidth(0.5)
  doc.rect(10, footerTop, pageWidth - 20, 30)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  doc.text(`Escala: 1:${Math.round(options.scale)}`, 15, footerTop + 8)
  doc.text(`Sistema Ref.: ${options.spatialReference}`, 15, footerTop + 14)
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, footerTop + 20)

  if (options.author) {
    doc.text(`Autor: ${options.author}`, 15, footerTop + 26)
  }

  /* ===============================
     NORTE (vector simple)
  =============================== */
  const northX = pageWidth - 30
  const northY = footerTop + 10

  doc.setFontSize(12)
  doc.text("N", northX + 2, northY - 8)

  doc.setLineWidth(1)
  doc.line(northX, northY, northX, northY - 15)
  doc.triangle(
    northX - 3,
    northY - 12,
    northX + 3,
    northY - 12,
    northX,
    northY - 18,
    "F"
  )

  /* ===============================
     PIE INSTITUCIONAL
  =============================== */
  doc.setFontSize(8)
  doc.text(
    "Instituto Geográfico Agustín Codazzi - IGAC",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  )

  doc.save("mapa_IGAC.pdf")
}
