export function exportPrescriptionsPdf(patientName: string, prescriptions: any[]) {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  const rows = prescriptions.map(p => {
    const isRefillSoon = p.refill_on && (() => {
      const today = new Date()
      const refill = new Date(p.refill_on)
      const diff = (refill.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 7
    })()

    return `
      <tr>
        <td>${p.medication || '—'}</td>
        <td>${p.dosage || '—'}</td>
        <td>${p.quantity ?? '—'}</td>
        <td style="${isRefillSoon ? 'color:#D97706;font-weight:bold;' : ''}">${p.refill_on || '—'}${isRefillSoon ? ' ⚠️' : ''}</td>
        <td>${p.refill_schedule || '—'}</td>
      </tr>
    `
  }).join('')

  const html = `
    <html>
      <head>
        <title>Prescriptions — ${patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #FAF7F2; color: #1A3C2E; }
          .header { background: #2D5A3D; padding: 32px; color: white; }
          .header h1 { font-size: 28px; letter-spacing: -0.5px; }
          .header h2 { font-size: 14px; opacity: 0.7; margin-top: 4px; font-weight: normal; }
          .header h3 { font-size: 16px; margin-top: 12px; color: #A8C97F; }
          .meta { background: #EDE8DF; padding: 12px 32px; font-size: 12px; color: #8A8A7A; display: flex; gap: 32px; }
          .content { padding: 32px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; border-radius: 12px; overflow: hidden; }
          th { background: #2D5A3D; color: white; padding: 12px 16px; text-align: left; font-size: 13px; letter-spacing: 0.5px; }
          td { padding: 12px 16px; border-bottom: 1px solid #EDE8DF; font-size: 13px; color: #1A3C2E; }
          tr:nth-child(even) td { background: #E8F0E4; }
          .section-title { font-size: 16px; font-weight: bold; color: #1A3C2E; margin-bottom: 12px; }
          .alert { background: #FEF9C3; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #D97706; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #EDE8DF; color: #8A8A7A; font-size: 11px; display: flex; justify-content: space-between; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: #2D5A3D; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; cursor: pointer; font-family: Arial; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AuraHealth</h1>
          <h2>Electronic Medical Records</h2>
          <h3>Prescriptions — ${patientName}</h3>
        </div>
        <div class="meta">
          <span>Generated: ${date}</span>
          <span>Total Records: ${prescriptions.length}</span>
          <span>CONFIDENTIAL</span>
        </div>
        <div class="content">
          ${prescriptions.some(p => {
            if (!p.refill_on) return false
            const diff = (new Date(p.refill_on).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            return diff >= 0 && diff <= 7
          }) ? `<div class="alert">⚠️ Some prescriptions require refill within 7 days. Please review highlighted entries.</div>` : ''}
          <p class="section-title">Prescription List</p>
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Qty</th>
                <th>Refill Date</th>
                <th>Schedule</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length > 0 ? rows : '<tr><td colspan="5" style="text-align:center;color:#8A8A7A;padding:24px;">No prescriptions on record.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            <span>AuraHealth — Confidential Medical Records</span>
            <span>${patientName}</span>
          </div>
        </div>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
      </body>
    </html>
  `

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Prescriptions_${patientName.replace(/ /g, '_')}.html`
  a.click()
  URL.revokeObjectURL(url)
}