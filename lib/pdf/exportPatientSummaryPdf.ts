import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportPatientSummaryPdf(
  patient: any,
  appointments: any[],
  prescriptions: any[]
) {
  const doc = new jsPDF()
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  // Header
  doc.setFillColor(45, 90, 61)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('AuraHealth', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(168, 201, 127)
  doc.text('Electronic Medical Records', 14, 26)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(`Patient Summary — ${patient.name}`, 14, 35)

  // Meta
  doc.setFillColor(248, 247, 242)
  doc.rect(0, 40, 210, 18, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(138, 138, 122)
  doc.text(`Generated: ${date}`, 14, 50)
  doc.text('CONFIDENTIAL', 160, 50)

  // Patient Info Section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 60, 46)
  doc.text('Patient Information', 14, 70)

  doc.setDrawColor(232, 240, 228)
  doc.setLineWidth(0.5)
  doc.line(14, 73, 196, 73)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(45, 90, 61)
  doc.text('Name:', 14, 82)
  doc.setTextColor(26, 60, 46)
  doc.text(patient.name || '—', 50, 82)

  doc.setTextColor(45, 90, 61)
  doc.text('Email:', 14, 90)
  doc.setTextColor(26, 60, 46)
  doc.text(patient.email || '—', 50, 90)

  doc.setTextColor(45, 90, 61)
  doc.text('Member Since:', 14, 98)
  doc.setTextColor(26, 60, 46)
  doc.text(
    patient.created_at
      ? new Date(patient.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '—',
    50, 98
  )

  // Appointments
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 60, 46)
  doc.text(`Appointments (${appointments.length})`, 14, 114)
  doc.line(14, 117, 196, 117)

  if (appointments.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(138, 138, 122)
    doc.text('No appointments on record.', 14, 126)
  } else {
    autoTable(doc, {
      startY: 120,
      head: [['Provider', 'Date & Time', 'Repeat']],
      body: appointments.map(a => [
        a.provider || '—',
        a.datetime ? new Date(a.datetime).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true
        }) : '—',
        a.repeat || '—',
      ]),
      headStyles: { fillColor: [45, 90, 61], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [26, 60, 46] },
      alternateRowStyles: { fillColor: [232, 240, 228] },
      styles: { cellPadding: 5, lineColor: [237, 232, 223], lineWidth: 0.3 },
      margin: { left: 14, right: 14 },
    })
  }

  // Prescriptions
  const presY = (doc as any).lastAutoTable?.finalY + 14 || 180
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 60, 46)
  doc.text(`Prescriptions (${prescriptions.length})`, 14, presY)
  doc.line(14, presY + 3, 196, presY + 3)

  if (prescriptions.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(138, 138, 122)
    doc.text('No prescriptions on record.', 14, presY + 12)
  } else {
    autoTable(doc, {
      startY: presY + 6,
      head: [['Medication', 'Dosage', 'Qty', 'Refill Date', 'Schedule']],
      body: prescriptions.map(p => [
        p.medication || '—',
        p.dosage || '—',
        String(p.quantity ?? '—'),
        p.refill_on || '—',
        p.refill_schedule || '—',
      ]),
      headStyles: { fillColor: [45, 90, 61], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [26, 60, 46] },
      alternateRowStyles: { fillColor: [232, 240, 228] },
      styles: { cellPadding: 5, lineColor: [237, 232, 223], lineWidth: 0.3 },
      margin: { left: 14, right: 14 },
    })
  }

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

  doc.save(`Patient_Summary_${patient.name.replace(/ /g, '_')}.pdf`)
}