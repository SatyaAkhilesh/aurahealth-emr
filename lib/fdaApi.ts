export type DrugInfo = {
  name: string
  generic: string
  purpose: string
  warnings: string
  dosage: string
  sideEffects: string
  manufacturer: string
}

export async function searchDrug(name: string): Promise<DrugInfo | null> {
  try {
    // Try multiple search strategies
    const strategies = [
      // Strategy 1: brand name exact
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${name}"&limit=1`,
      // Strategy 2: generic name exact
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${name}"&limit=1`,
      // Strategy 3: brand name contains
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${name}&limit=1`,
      // Strategy 4: generic name contains
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${name}&limit=1`,
      // Strategy 5: substance name
      `https://api.fda.gov/drug/label.json?search=openfda.substance_name:${name}&limit=1`,
    ]

    let result = null

    for (const url of strategies) {
      try {
        const res = await fetch(url)
        const data = await res.json()
        if (data.results && data.results.length > 0) {
          result = data.results[0]
          break
        }
      } catch {
        continue
      }
    }

    if (!result) return null

    return {
      name: result.openfda?.brand_name?.[0]
        || result.openfda?.generic_name?.[0]
        || name,
      generic: result.openfda?.generic_name?.[0]
        || result.openfda?.substance_name?.[0]
        || '—',
      purpose: cleanText(
        result.purpose?.[0]
        || result.indications_and_usage?.[0]
        || '—'
      ),
      warnings: cleanText(
        result.warnings?.[0]
        || result.warnings_and_cautions?.[0]
        || result.boxed_warning?.[0]
        || '—'
      ),
      dosage: cleanText(
        result.dosage_and_administration?.[0]
        || '—'
      ),
      sideEffects: cleanText(
        result.adverse_reactions?.[0]
        || result.side_effects?.[0]
        || '—'
      ),
      manufacturer: result.openfda?.manufacturer_name?.[0]
        || result.openfda?.labeler_name?.[0]
        || '—',
    }
  } catch (err) {
    console.log('FDA API error:', err)
    return null
  }
}

// Clean up long FDA text
function cleanText(text: string, maxLength = 250): string {
  if (!text || text === '—') return '—'
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
    .slice(0, maxLength) + (text.length > maxLength ? '...' : '')
}