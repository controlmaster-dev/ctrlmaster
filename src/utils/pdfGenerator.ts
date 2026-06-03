import jsPDF from "jspdf";
import { formatDowntime } from "@/lib/formatDowntime";
import { formatReportDisplayId } from "@/lib/reportCode";
import {
  REPORT_PDF_COLORS,
  formatPdfCategory,
  formatPdfPriority,
  formatPdfReportDate,
  formatPdfResolvedDate,
  formatPdfStatus,
} from "@/lib/reportPdfLabels";
import {
  PDF_MAX_DESCRIPTION_PAGES,
  REPORT_DESCRIPTION_MAX_CHARS,
  clampReportDescription,
  sanitizeReportDescription,
} from "@/lib/reportPdfLimits";

interface ReportPDFData {
  id: string;
  code?: string | null;
  status: string;
  dateStarted: string | Date;
  dateResolved?: string | Date | null;
  priority: string;
  category: string;
  problemDescription: string;
  operatorName: string;
  operatorEmail: string;
}

interface PDFOptions {
  download?: boolean;
  email?: boolean;
  recipients?: string[];
}

const COLORS = {
  ...REPORT_PDF_COLORS,
  white: "#FFFFFF",
};

const MARGIN_X = 15;
const DESC_LINE_HEIGHT = 5;
const DESC_FONT_SIZE = 10;
const OPERATOR_BLOCK_H = 32;
const FOOTER_BAR_H = 6;

const getImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("No se pudo crear el contexto del canvas"));
      }
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

type PdfFonts = {
  setBold: (size: number) => void;
  setRegular: (size: number) => void;
};

async function loadGeistFonts(doc: jsPDF): Promise<PdfFonts> {
  const setBold = (size: number) => {
    doc.setFont("Geist", "bold");
    doc.setFontSize(size);
  };
  const setRegular = (size: number) => {
    doc.setFont("Geist", "normal");
    doc.setFontSize(size);
  };

  try {
    const fontFiles = [
      { url: "/fonts/Geist-Regular.ttf", filename: "Geist-Regular.ttf", style: "normal" },
      { url: "/fonts/Geist-Bold.ttf", filename: "Geist-Bold.ttf", style: "bold" },
    ];

    for (const file of fontFiles) {
      const fontBytes = await fetch(file.url).then((res) => {
        if (!res.ok) throw new Error(`Failed to load font ${file.url}`);
        return res.arrayBuffer();
      });
      let binary = "";
      const bytes = new Uint8Array(fontBytes);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Font = window.btoa(binary);
      doc.addFileToVFS(file.filename, base64Font);
      doc.addFont(file.filename, "Geist", file.style);
    }
  } catch (e) {
    console.error("Error cargando fuente Geist", e);
  }

  return { setBold, setRegular };
}

function drawPageFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  pageNum: number,
  totalPages: number,
  fonts: PdfFonts
) {
  doc.setFillColor(COLORS.primary);
  doc.rect(0, pageHeight - FOOTER_BAR_H, pageWidth, FOOTER_BAR_H, "F");

  fonts.setRegular(8);
  doc.setTextColor(COLORS.textLight);
  const center = `Generado automáticamente por Sistema de Control Máster · ${pageNum}/${totalPages}`;
  doc.text(center, pageWidth / 2, pageHeight - 10, { align: "center" });
}

function drawContinuationHeader(
  doc: jsPDF,
  pageWidth: number,
  reportCode: string,
  fonts: PdfFonts
) {
  doc.setFillColor(COLORS.background);
  doc.rect(0, 0, pageWidth, 18, "F");
  fonts.setBold(10);
  doc.setTextColor(COLORS.secondary);
  doc.text("REPORTE DE INCIDENCIA — continuación", MARGIN_X, 11);
  fonts.setRegular(9);
  doc.setTextColor(COLORS.primary);
  doc.text(`Código: ${reportCode}`, MARGIN_X, 16);
}

function drawInfoItem(
  doc: jsPDF,
  fonts: PdfFonts,
  label: string,
  value: string | string[],
  x: number,
  y: number
) {
  fonts.setBold(8);
  doc.setTextColor(COLORS.textLight);
  doc.text(label.toUpperCase(), x, y);

  fonts.setRegular(11);
  doc.setTextColor(COLORS.secondary);
  const lines = Array.isArray(value) ? value : [value];
  doc.text(lines, x, y + 6);
}

function drawDescriptionPages(
  doc: jsPDF,
  fonts: PdfFonts,
  startY: number,
  lines: string[],
  reportCode: string,
  pageWidth: number,
  pageHeight: number
): { finalY: number; truncated: boolean } {
  const boxPadX = 5;
  let yPos = startY;
  let lineIndex = 0;
  let truncated = false;
  let sectionTitleDrawn = false;
  let pagesUsed = 0;

  const contentBottom = pageHeight - FOOTER_BAR_H - 16;

  while (lineIndex < lines.length) {
    if (pagesUsed >= PDF_MAX_DESCRIPTION_PAGES) {
      truncated = true;
      break;
    }

    if (pagesUsed > 0) {
      doc.addPage();
      drawContinuationHeader(doc, pageWidth, reportCode, fonts);
      yPos = 26;
    }
    pagesUsed++;

    if (!sectionTitleDrawn) {
      fonts.setBold(12);
      doc.setTextColor(COLORS.primary);
      doc.text("DETALLE DEL PROBLEMA", MARGIN_X, yPos);
      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(MARGIN_X, yPos + 3, pageWidth - MARGIN_X, yPos + 3);
      yPos += 14;
      sectionTitleDrawn = true;
    }

    const available = contentBottom - yPos - 8;
    const maxLines = Math.max(1, Math.floor(available / DESC_LINE_HEIGHT));
    const chunk = lines.slice(lineIndex, lineIndex + maxLines);

    if (chunk.length === 0) {
      truncated = true;
      break;
    }

    const boxHeight = chunk.length * DESC_LINE_HEIGHT + 12;
    doc.setFillColor(COLORS.background);
    doc.setDrawColor(COLORS.border);
    doc.roundedRect(MARGIN_X, yPos, pageWidth - MARGIN_X * 2, boxHeight, 2, 2, "FD");

    fonts.setRegular(DESC_FONT_SIZE);
    doc.setTextColor(COLORS.secondary);
    doc.text(chunk, MARGIN_X + boxPadX, yPos + 8);

    lineIndex += chunk.length;
    yPos += boxHeight + 8;
  }

  return { finalY: yPos, truncated };
}

export const generateReportPDF = async (
  report: ReportPDFData,
  options: PDFOptions = { download: true, email: true }
): Promise<{ success: boolean; message?: string }> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fonts = await loadGeistFonts(doc);

  const description = clampReportDescription(report.problemDescription);
  const reportCode = formatReportDisplayId(report.id, report.code);

  let downtimeString = "N/A";
  if (report.status === "resolved" && report.dateStarted && report.dateResolved) {
    downtimeString = formatDowntime(report.dateStarted, report.dateResolved);
  }

  const headerHeight = 40;
  doc.setFillColor(COLORS.background);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  const logoUrl =
    "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png";
  try {
    const logoBase64 = await getImageAsBase64(logoUrl);
    doc.addImage(logoBase64, "PNG", MARGIN_X, 10, 20, 20);
  } catch (err) {
    console.warn("No se pudo cargar el logo:", err);
  }

  doc.setTextColor(COLORS.secondary);
  fonts.setBold(22);
  doc.text("REPORTE DE INCIDENCIA", 45, 23);

  doc.setTextColor(COLORS.primary);
  fonts.setRegular(10);
  doc.text(`Código: ${reportCode}`, 45, 30);

  fonts.setRegular(10);
  doc.setTextColor(COLORS.textLight);
  const dateStr = formatPdfReportDate(report.dateStarted);
  doc.text(dateStr, pageWidth - MARGIN_X - doc.getTextWidth(dateStr), 23);

  let yPos = headerHeight + 15;

  fonts.setBold(12);
  doc.setTextColor(COLORS.primary);
  doc.text("INFORMACIÓN GENERAL", MARGIN_X, yPos);
  doc.setDrawColor(COLORS.border);
  doc.line(MARGIN_X, yPos + 3, pageWidth - MARGIN_X, yPos + 3);
  yPos += 15;

  const col1 = MARGIN_X;
  const col2 = pageWidth / 2 + 10;

  drawInfoItem(
    doc,
    fonts,
    "Canal Afectado",
    formatPdfPriority(report.priority),
    col1,
    yPos
  );
  const catLines = doc.splitTextToSize(formatPdfCategory(report.category), 80);
  drawInfoItem(doc, fonts, "Tipo de Incidencia", catLines, col2, yPos);

  yPos += Math.max(20, 6 + catLines.length * 5);

  const statusText = formatPdfStatus(report.status);
  let statusColor: string = COLORS.warning;
  if (report.status === "resolved") statusColor = COLORS.success;
  if (report.status === "in-progress") statusColor = COLORS.primary;

  doc.setFillColor(statusColor);
  doc.roundedRect(col1, yPos - 3, 4, 12, 1, 1, "F");
  drawInfoItem(doc, fonts, "Estado Actual", statusText, col1 + 8, yPos);

  const resolvedDate = report.dateResolved
    ? formatPdfResolvedDate(report.dateResolved)
    : "—";
  drawInfoItem(doc, fonts, "Fecha Resolución", resolvedDate, col2, yPos);

  yPos += 22;

  if (report.status === "resolved") {
    doc.setFillColor(COLORS.background);
    doc.roundedRect(MARGIN_X, yPos - 5, pageWidth - MARGIN_X * 2, 20, 2, 2, "F");
    fonts.setBold(10);
    doc.setTextColor(COLORS.secondary);
    doc.text("TIEMPO TOTAL DE AVERÍA:", MARGIN_X + 10, yPos + 8);
    fonts.setBold(12);
    doc.setTextColor(COLORS.primary);
    doc.text(downtimeString, 80, yPos + 8);
    yPos += 28;
  }

  fonts.setRegular(DESC_FONT_SIZE);
  const splitDesc = doc.splitTextToSize(description, pageWidth - 40);

  const { finalY, truncated } = drawDescriptionPages(
    doc,
    fonts,
    yPos,
    splitDesc,
    reportCode,
    pageWidth,
    pageHeight
  );

  let yAfterDesc = finalY;
  if (truncated) {
    if (yAfterDesc > pageHeight - OPERATOR_BLOCK_H - 25) {
      doc.addPage();
      drawContinuationHeader(doc, pageWidth, reportCode, fonts);
      yAfterDesc = 26;
    }
    fonts.setRegular(9);
    doc.setTextColor(COLORS.textLight);
    doc.text(
      "(Descripción recortada por límite de páginas del PDF. Resume el incidente en menos texto.)",
      MARGIN_X,
      yAfterDesc + 4,
      { maxWidth: pageWidth - MARGIN_X * 2 }
    );
    yAfterDesc += 12;
  }

  if (yAfterDesc > pageHeight - OPERATOR_BLOCK_H - 15) {
    doc.addPage();
    drawContinuationHeader(doc, pageWidth, reportCode, fonts);
    yAfterDesc = 30;
  }

  const operatorY = Math.min(yAfterDesc + 12, pageHeight - OPERATOR_BLOCK_H - 8);
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, operatorY, pageWidth - MARGIN_X, operatorY);

  fonts.setBold(10);
  doc.setTextColor(COLORS.secondary);
  doc.text("Operador Responsable", MARGIN_X, operatorY + 9);
  fonts.setRegular(10);
  doc.text(report.operatorName, MARGIN_X, operatorY + 15);
  doc.setTextColor(COLORS.textLight);
  doc.text(report.operatorEmail, MARGIN_X, operatorY + 21);

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, pageWidth, pageHeight, p, totalPages, fonts);
  }

  const fileName = `reporte_${reportCode.replace(/[^A-Z0-9]/gi, "").slice(0, 12) || report.id.slice(0, 8)}.pdf`;
  const pdfBlob = doc.output("blob");

  if (options.download) {
    doc.save(fileName);
  }

  if (options.email) {
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("reportId", report.id);
    formData.append("operatorName", report.operatorName);
    formData.append("operatorEmail", report.operatorEmail);
    formData.append("priority", report.priority);
    formData.append("category", report.category);
    formData.append("status", report.status);
    if (options.recipients) {
      formData.append("recipients", JSON.stringify(options.recipients));
    }

    try {
      const res = await fetch("/api/sendReportEmail", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        return {
          success: false,
          message: data.error || "Error del servidor",
        };
      }
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : "No se pudo contactar al servidor",
      };
    }
  }

  return { success: true };
};

/** Texto listo para splitTextToSize en cliente (preview / validación). */
export function splitDescriptionForPdfPreview(
  text: string,
  maxWidthMm = 170
): { lines: string[]; truncated: boolean; sanitized: string } {
  const sanitized = sanitizeReportDescription(text);
  const clamped = clampReportDescription(sanitized);
  const previewDoc = new jsPDF();
  previewDoc.setFontSize(DESC_FONT_SIZE);
  const lines = previewDoc.splitTextToSize(clamped, maxWidthMm);
  return {
    lines,
    truncated: sanitized.length > REPORT_DESCRIPTION_MAX_CHARS,
    sanitized: clamped,
  };
}
