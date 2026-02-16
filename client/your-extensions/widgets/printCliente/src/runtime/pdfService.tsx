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

  // Título
  doc.setFontSize(16)
  doc.text(options.title, 10, 15)

  // Fecha
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, 22)

  // Escala
  doc.text(`Escala aproximada: 1:${Math.round(options.scale)}`, 10, 28)

  // Imagen mapa
  doc.addImage(
    options.imageUrl,
    "PNG",
    10,
    35,
    pageWidth - 20,
    140
  )

  doc.save("mapa_impreso.pdf")
}
