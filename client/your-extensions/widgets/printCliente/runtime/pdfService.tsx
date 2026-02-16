import jsPDF from "jspdf"

interface PdfOptions {
  title: string;
  scale: number;
  imageUrl: string;
}

export const generatePdf = (options: PdfOptions): void => {

  const doc = new jsPDF({
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
