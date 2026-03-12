export type DrugInfo = {
  name: string
  generic: string
  purpose: string
  warnings: string
  dosage: string
  sideEffects: string
  manufacturer: string
}

export type DrugSuggestion = {
  brand: string
  generic: string
  rxcui: string
}

// ── RxNorm Autocomplete — US National Library of Medicine ──
// No API key, no CORS issues, completely free
export async function searchDrugSuggestions(query: string): Promise<DrugSuggestion[]> {
  if (!query || query.length < 2) return []
  try {
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query)}`
    )
    if (!res.ok) return []
    const data = await res.json()

    const groups = data.drugGroup?.conceptGroup || []
    const suggestions: DrugSuggestion[] = []
    const seen = new Set<string>()

    for (const group of groups) {
      if (!group.conceptProperties) continue
      for (const concept of group.conceptProperties) {
        const name = concept.name || ''
        const key = name.toLowerCase()
        if (!seen.has(key) && name) {
          seen.add(key)
          suggestions.push({
            brand: toTitleCase(name),
            generic: toTitleCase(concept.synonym || '—'),
            rxcui: concept.rxcui || '',
          })
        }
        if (suggestions.length >= 8) break
      }
      if (suggestions.length >= 8) break
    }

    return suggestions
  } catch {
    return []
  }
}

// ── Get full drug info from RxNorm + OpenFDA ──
export async function searchDrug(name: string): Promise<DrugInfo | null> {
  if (!name) return null
  try {
    // Step 1: Get rxcui from RxNorm
    const rxRes = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=1`
    )
    if (!rxRes.ok) return null
    const rxData = await rxRes.json()
    const rxcui = rxData.idGroup?.rxnormId?.[0]

    // Step 2: Get drug info from OpenFDA using name
    const fdaRes = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(name)}"&limit=1`
    )

    let fdaResult: any = null
    if (fdaRes.ok) {
      const fdaData = await fdaRes.json()
      if (fdaData.results?.length > 0) {
        fdaResult = fdaData.results[0]
      }
    }

    // Step 3: If FDA failed try generic name
    if (!fdaResult) {
      const fdaRes2 = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(name)}"&limit=1`
      )
      if (fdaRes2.ok) {
        const fdaData2 = await fdaRes2.json()
        if (fdaData2.results?.length > 0) {
          fdaResult = fdaData2.results[0]
        }
      }
    }

    // Step 4: Build result from whatever we have
    if (fdaResult) {
      return {
        name: toTitleCase(fdaResult.openfda?.brand_name?.[0] || name),
        generic: toTitleCase(fdaResult.openfda?.generic_name?.[0] || fdaResult.openfda?.substance_name?.[0] || '—'),
        purpose: clean(fdaResult.purpose?.[0] || fdaResult.indications_and_usage?.[0] || '—'),
        warnings: clean(fdaResult.warnings?.[0] || fdaResult.boxed_warning?.[0] || '—'),
        dosage: clean(fdaResult.dosage_and_administration?.[0] || '—'),
        sideEffects: clean(fdaResult.adverse_reactions?.[0] || '—'),
        manufacturer: toTitleCase(fdaResult.openfda?.manufacturer_name?.[0] || '—'),
      }
    }

    // Step 5: Fallback — return basic RxNorm info
    if (rxcui) {
      const propRes = await fetch(
        `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`
      )
      if (propRes.ok) {
        const propData = await propRes.json()
        const props = propData.properties
        return {
          name: toTitleCase(props?.name || name),
          generic: toTitleCase(props?.synonym || '—'),
          purpose: 'See prescribing information for full details.',
          warnings: 'Consult FDA label for complete warnings.',
          dosage: 'Follow prescriber instructions.',
          sideEffects: 'See full prescribing information.',
          manufacturer: '—',
        }
      }
    }

    return null
  } catch {
    return null
  }
}

function clean(text: string, max = 300): string {
  if (!text || text === '—') return '—'
  return text.replace(/\s+/g, ' ').trim().slice(0, max) + (text.length > max ? '...' : '')
}

function toTitleCase(str: string): string {
  if (!str || str === '—') return '—'
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}