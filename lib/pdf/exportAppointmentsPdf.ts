import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportAppointmentsPdf(patientName: string, appointments: any[]) {
  const doc = new jsPDF()
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  // Header background
  doc.setFillColor(45, 90, 61) // moss green
  doc.rect(0, 0, 210, 40, 'F')

  // Brand
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('AuraHealth', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(168, 201, 127) // leaf green
  doc.text('Electronic Medical Records', 14, 26)

  // Document title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(`Appointments — ${patientName}`, 14, 35)

  // Meta info
  doc.setFillColor(248, 247, 242) // cream
  doc.rect(0, 40, 210, 18, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(138, 138, 122) // stone
  doc.text(`Generated: ${date}`, 14, 50)
  doc.text(`Total Records: ${appointments.length}`, 80, 50)
  doc.text('CONFIDENTIAL', 160, 50)

  // Table
  autoTable(doc, {
    startY: 62,
    head: [['Provider', 'Date & Time', 'Repeat']],
    body: appointments.map(a => [
      a.provider || '—',
      a.datetime ? new Date(a.datetime).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      }) : '—',
      a.repeat || '—',
    ]),
    headStyles: {
      fillColor: [45, 90, 61],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [26, 60, 46],
    },
    alternateRowStyles: {
      fillColor: [232, 240, 228],
    },
    styles: {
      cellPadding: 6,
      lineColor: [237, 232, 223],
      lineWidth: 0.3,
    },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(138, 138, 122)
    doc.text(
      `AuraHealth — Confidential — Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    )
  }

  doc.save(`Appointments_${patientName.replace(/ /g, '_')}.pdf`)
}