
import jsPDF from 'jspdf'
import { Report } from '@/types'

const getImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } else {
        reject(new Error('No se pudo crear el contexto del canvas'))
      }
    }
    img.onerror = (err) => reject(err)
    img.src = url
  })
}

export const generateReportPDF = async (report: Report, options: { download?: boolean, email?: boolean, recipients?: string[] } = { download: true, email: true }) => {
  // Configuración inicial
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Paleta de Colores
  const COLORS = {
    primary: '#FF0C60',    // Brand Pink
    secondary: '#2D3748',  // Dark Text
    textLight: '#718096',  // Light Text
    background: '#F7FAFC', // Light Gray Background
    border: '#E2E8F0',     // Light Border
    white: '#FFFFFF',
    success: '#48BB78',
    warning: '#ECC94B',
    danger: '#F56565'
  }

  // FUENTES (Simuladas con Helvetica estándar)
  const setFontBold = (size: number) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
  }
  const setFontRegular = (size: number) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
  }

  // --- LOGIC: CÁLCULO DE DOWNTIME ---
  let downtimeString = 'N/A'
  if (report.status === 'resolved' && report.dateStarted && report.dateResolved) {
    const start = new Date(report.dateStarted).getTime()
    const end = new Date(report.dateResolved).getTime()
    const diffMs = end - start

    if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000)
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60

      if (hours > 0) {
        downtimeString = `${hours}h ${mins}min`
      } else {
        downtimeString = `${mins} minutos`
      }
    }
  }

  // --- HEADER ---
  const headerHeight = 40

  // Fondo del header
  doc.setFillColor(COLORS.background)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')

  // Logo
  const logoUrl = 'https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png'
  try {
    const logoBase64 = await getImageAsBase64(logoUrl)
    doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20)
  } catch (err) {
    console.warn('No se pudo cargar el logo:', err)
  }

  // Título Principal
  doc.setTextColor(COLORS.secondary)
  setFontBold(22)
  doc.text('REPORTE DE INCIDENCIA', 45, 23)

  // Subtítulo ID
  doc.setTextColor(COLORS.primary)
  setFontRegular(10)
  doc.text(`ID: ${report.id.toUpperCase()}`, 45, 30)

  // Fecha en esquina derecha
  doc.setTextColor(COLORS.textLight)
  setFontRegular(10)
  const dateStr = new Date(report.dateStarted).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const dateWidth = doc.getTextWidth(dateStr)
  doc.text(dateStr, pageWidth - 20 - dateWidth, 23)

  let yPos = headerHeight + 15

  // --- INFORMACIÓN GENERAL (Estilo Cards) ---

  // Título Sección
  doc.setTextColor(COLORS.primary)
  setFontBold(12)
  doc.text('INFORMACIÓN GENERAL', 15, yPos)

  // Línea decorativa
  doc.setDrawColor(COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(15, yPos + 3, pageWidth - 15, yPos + 3)

  yPos += 15

  // Mapeos de texto
  const priorityMap: { [key: string]: string } = {
    'Enlace': 'Enlace', 'EJTV': 'EJTV', 'EnlaceUSA': 'Enlace USA', 'Todos': 'Todos'
  }
  const categoryMap: { [key: string]: string } = {
    transmision: "Transmisión", audio: "Audio", video: "Video", equipos: "Equipos",
    software: "Software", infraestructura: "Infraestructura", otros: "Otros"
  }
  const statusMap: { [key: string]: string } = {
    'resolved': 'Resuelto', 'pending': 'Pendiente', 'in-progress': 'En Progreso'
  }

  // Helper para dibujar Key-Value
  const drawInfoItem = (label: string, value: string, x: number, y: number) => {
    doc.setTextColor(COLORS.textLight)
    setFontBold(8)
    doc.text(label.toUpperCase(), x, y)

    doc.setTextColor(COLORS.secondary)
    setFontRegular(11)
    doc.text(value, x, y + 6)
  }

  // Grid Layout
  const col1 = 15
  const col2 = pageWidth / 2 + 10

  drawInfoItem('Canal Afectado', priorityMap[report.priority] || report.priority, col1, yPos)
  const catText = categoryMap[report.category] || report.category
  const splitCat = doc.splitTextToSize(catText, 80) // Max width for column
  drawInfoItem('Tipo de Incidencia', splitCat, col2, yPos)

  yPos += 20

  // Badge Status Customizado
  const statusText = statusMap[report.status] || report.status
  let statusColor = COLORS.warning // Default Pending
  if (report.status === 'resolved') statusColor = COLORS.success
  if (report.status === 'in-progress') statusColor = COLORS.primary // Usamos el rosa para progreso activo

  // Dibujar Badge de Estado
  doc.setFillColor(statusColor)
  doc.roundedRect(col1, yPos - 3, 4, 12, 1, 1, 'F') // Indicador lateral

  drawInfoItem('Estado Actual', statusText, col1 + 8, yPos)

  // Fecha resolución si existe
  const resolvedDate = report.dateResolved
    ? new Date(report.dateResolved).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    })
    : '-'
  drawInfoItem('Fecha Resolución', resolvedDate, col2, yPos)

  yPos += 20

  // --- DOWNTIME DURATION (NUEVO) ---
  if (report.status === 'resolved') {
    doc.setFillColor(COLORS.background)
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 20, 2, 2, 'F')

    doc.setTextColor(COLORS.secondary)
    setFontBold(10)
    doc.text('TIEMPO TOTAL DE AVERÍA:', 25, yPos + 8)

    doc.setTextColor(COLORS.primary)
    setFontBold(12)
    doc.text(downtimeString, 85, yPos + 8)
  } else {
    yPos -= 10 // Adjust spacing if not present
  }


  yPos += 30

  // --- DESCRIPCIÓN ---
  // Calcular altura dinámica
  const maxWidth = pageWidth - 40
  const splitDesc = doc.splitTextToSize(report.problemDescription, maxWidth)

  // Calculate max height
  const footerSpace = 80
  const maxDescHeight = pageHeight - yPos - footerSpace

  // Text height approx
  const lineCount = splitDesc.length
  const lineHeight = 7
  const textHeight = lineCount * lineHeight

  // Cap the height
  const descBoxHeight = Math.min(Math.max(60, textHeight + 20), maxDescHeight)

  doc.setTextColor(COLORS.primary)
  setFontBold(12)
  doc.text('DETALLE DEL PROBLEMA', 15, yPos)
  doc.line(15, yPos + 3, pageWidth - 15, yPos + 3)

  yPos += 15

  doc.setFillColor(COLORS.background)
  doc.setDrawColor(COLORS.border)
  doc.roundedRect(15, yPos, pageWidth - 30, descBoxHeight, 2, 2, 'FD')

  // Texto descripción
  doc.setTextColor(COLORS.secondary)
  setFontRegular(10)
  doc.text(splitDesc, 20, yPos + 10)

  yPos += descBoxHeight + 20

  // --- OPERADOR ---

  // --- OPERADOR ---
  // Caja compacta para operador
  const operatorBoxY = pageHeight - 50

  doc.setDrawColor(COLORS.primary)
  doc.setLineWidth(0.2)
  doc.line(15, operatorBoxY, pageWidth - 15, operatorBoxY)

  setFontBold(10)
  doc.setTextColor(COLORS.secondary)
  doc.text('Operador Responsable', 15, operatorBoxY + 10)

  setFontRegular(10)
  doc.text(report.operatorName, 15, operatorBoxY + 16)

  doc.setTextColor(COLORS.textLight)
  doc.text(report.operatorEmail, 15, operatorBoxY + 22)

  // --- FOOTER ---
  const footerY = pageHeight - 15
  doc.setFillColor(COLORS.primary)
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F') // Barra inferior color marca

  setFontRegular(8)
  doc.setTextColor(COLORS.textLight)
  doc.text('Generado automáticamente por Sistema de Control Máster', pageWidth / 2, footerY, { align: 'center' })

  // Guardar y Enviar
  const fileName = `reporte_${report.id.slice(0, 8)}.pdf`
  const pdfBlob = doc.output('blob')

  if (options.download) {
    doc.save(fileName);
  }

  if (options.email) {
    const formData = new FormData()
    formData.append('file', pdfBlob, fileName)
    formData.append('reportId', report.id)
    formData.append('operatorName', report.operatorName)
    formData.append('operatorEmail', report.operatorEmail)
    formData.append('priority', report.priority)
    formData.append('category', report.category)
    formData.append('status', report.status)
    if (options.recipients) {
      formData.append('recipients', JSON.stringify(options.recipients))
    }

    try {
      const res = await fetch('/sendReportEmail', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error del servidor');
      return { success: true };
    } catch (err) {
      console.error('⚠️ Error enviando email:', err);
      return { success: false, message: (err as Error).message };
    }
  }

  return { success: true };
}
