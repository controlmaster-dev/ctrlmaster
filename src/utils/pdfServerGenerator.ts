import PDFDocument from "pdfkit"
import fs from "fs"
import type { Report } from "@/types"

export async function generateReportPDFServer(report: Report, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument()
      const stream = fs.createWriteStream(outputPath)
      doc.pipe(stream)

      // Encabezado
      doc.fontSize(20).fillColor("#FF0C60").text("Reporte de Incidencia", { align: "center" })
      doc.moveDown()

      doc.fontSize(12).fillColor("black")

      doc.text(`ID: ${report.id}`)
      doc.text(`Fecha: ${new Date(report.dateStarted).toLocaleString("es-ES")}`)
      doc.text(`Prioridad: ${report.priority}`)
      doc.text(`Categoría: ${report.category}`)
      doc.text(`Estado: ${report.status}`)
      doc.moveDown()

      doc.fillColor("#FF0C60").text("Descripción del Problema", { underline: true })
      doc.moveDown(0.5)
      doc.fillColor("black").text(report.problemDescription || "Sin descripción.", { align: "justify" })
      doc.moveDown()

      doc.fillColor("#FF0C60").text("Operador Encargado", { underline: true })
      doc.moveDown(0.5)
      doc.fillColor("black").text(`Nombre: ${report.operatorName}`)
      doc.text(`Correo: ${report.operatorEmail}`)

      doc.moveDown(2)
      doc.fontSize(8).fillColor("gray").text("Reporte generado automáticamente por el sistema Enlace", {
        align: "center",
      })

      doc.end()

      stream.on("finish", () => resolve())
      stream.on("error", (err) => reject(err))
    } catch (error) {
      reject(error)
    }
  })
}
