import PDFDocument from "pdfkit";
import fs from "fs";
export async function generateReportPDFServer(report: { id: string | number; dateStarted: Date | string; priority: string; category: string; status: string; problemDescription?: string; operatorName: string; operatorEmail: string }, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      doc.fontSize(20).fillColor("#FF0C60").text("Reporte de Incidencia", { align: "center" });
      doc.moveDown();

      doc.fontSize(12).fillColor("black");

      doc.text(`ID: ${report.id}`);
      doc.text(`Fecha: ${new Date(report.dateStarted).toLocaleString("es-ES")}`);
      doc.text(`Prioridad: ${report.priority}`);
      doc.text(`Categoría: ${report.category}`);
      doc.text(`Estado: ${report.status}`);
      doc.moveDown();

      doc.fillColor("#FF0C60").text("Descripción del Problema", { underline: true });
      doc.moveDown(0.5);
      doc.fillColor("black").text(report.problemDescription || "Sin descripción.", { align: "justify" });
      doc.moveDown();

      doc.fillColor("#FF0C60").text("Operador Encargado", { underline: true });
      doc.moveDown(0.5);
      doc.fillColor("black").text(`Nombre: ${report.operatorName}`);
      doc.text(`Correo: ${report.operatorEmail}`);

      doc.moveDown(2);
      doc.fontSize(8).fillColor("gray").text("Reporte generado automáticamente por el sistema Enlace", {
        align: "center"
      });

      doc.end();

      stream.on("finish", () => resolve());
      stream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}