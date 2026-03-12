export function exportPatientSummaryPdf(patient: any, appointments: any[], prescriptions: any[]) {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  const apptRows = appointments.map(a => `
    <tr>
      <td>${a.provider || '—'}</td>
      <td>${a.datetime ? new Date(a.datetime).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      }) : '—'}</td>
      <td>${a.repeat || '—'}</td>
    </tr>
  `).join('')

  const presRows = prescriptions.map(p => {
    const isRefillSoon = p.refill_on && (() => {
      const diff = (new Date(p.refill_on).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
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
        <title>Patient Summary — ${patient?.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #FAF7F2; color: #1A3C2E; }
          .header { background: #2D5A3D; padding: 32px; color: white; }
          .header h1 { font-size: 28px; letter-spacing: -0.5px; }
          .header h2 { font-size: 14px; opacity: 0.7; margin-top: 4px; font-weight: normal; }
          .header h3 { font-size: 16px; margin-top: 12px; color: #A8C97F; }
          .meta { background: #EDE8DF; padding: 12px 32px; font-size: 12px; color: #8A8A7A; display: flex; gap: 32px; }
          .content { padding: 32px; }
          .info-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #EDE8DF; margin-bottom: 32px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #EDE8DF; font-size: 13px; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #8A8A7A; font-weight: bold; }
          .info-value { color: #1A3C2E; }
          .section-title { font-size: 16px; font-weight: bold; color: #1A3C2E; margin-bottom: 12px; margin-top: 28px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; overflow: hidden; border-radius: 12px; }
          th { background: #2D5A3D; color: white; padding: 12px 16px; text-align: left; font-size: 13px; }
          td { padding: 12px 16px; border-bottom: 1px solid #EDE8DF; font-size: 13px; }
          tr:nth-child(even) td { background: #E8F0E4; }
          .stats { display: flex; gap: 16px; margin-bottom: 24px; }
          .stat { flex: 1; background: white; border-radius: 12px; padding: 16px; border: 1px solid #EDE8DF; border-left: 3px solid #2D5A3D; }
          .stat-val { font-size: 28px; font-weight: bold; color: #1A3C2E; }
          .stat-lbl { font-size: 12px; color: #8A8A7A; margin-top: 4px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #EDE8DF; color: #8A8A7A; font-size: 11px; display: flex; justify-content: space-between; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: #2D5A3D; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; cursor: pointer; font-family: Arial; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AuraHealth</h1>
          <h2>Electronic Medical Records</h2>
          <h3>Patient Summary — ${patient?.name}</h3>
        </div>
        <div class="meta">
          <span>Generated: ${date}</span>
          <span>CONFIDENTIAL</span>
        </div>
        <div class="content">

          <!-- Stats -->
          <div class="stats">
            <div class="stat">
              <div class="stat-val">${appointments.length}</div>
              <div class="stat-lbl">Total Appointments</div>
            </div>
            <div class="stat">
              <div class="stat-val">${prescriptions.length}</div>
              <div class="stat-lbl">Total Prescriptions</div>
            </div>
          </div>

          <!-- Patient Info -->
          <p class="section-title">Patient Information</p>
          <div class="info-card">
            <div class="info-row"><span class="info-label">Full Name</span><span class="info-value">${patient?.name || '—'}</span></div>
            <div class="info-row"><span class="info-label">Email</span><span class="info-value">${patient?.email || '—'}</span></div>
            <div class="info-row"><span class="info-label">Member Since</span><span class="info-value">${patient?.created_at ? new Date(patient.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span></div>
            <div class="info-row"><span class="info-label">Patient ID</span><span class="info-value">#${patient?.id?.slice(0, 8).toUpperCase() || '—'}</span></div>
          </div>

          <!-- Appointments -->
          <p class="section-title">Appointments (${appointments.length})</p>
          <table>
            <thead><tr><th>Provider</th><th>Date &amp; Time</th><th>Repeat</th></tr></thead>
            <tbody>${apptRows || '<tr><td colspan="3" style="text-align:center;color:#8A8A7A;padding:24px;">No appointments on record.</td></tr>'}</tbody>
          </table>

          <!-- Prescriptions -->
          <p class="section-title">Prescriptions (${prescriptions.length})</p>
          <table>
            <thead><tr><th>Medication</th><th>Dosage</th><th>Qty</th><th>Refill Date</th><th>Schedule</th></tr></thead>
            <tbody>${presRows || '<tr><td colspan="5" style="text-align:center;color:#8A8A7A;padding:24px;">No prescriptions on record.</td></tr>'}</tbody>
          </table>

          <div class="footer">
            <span>AuraHealth — Confidential Medical Records</span>
            <span>${patient?.name}</span>
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
  a.download = `Patient_Summary_${patient?.name?.replace(/ /g, '_') || 'export'}.html`
  a.click()
  URL.revokeObjectURL(url)
}