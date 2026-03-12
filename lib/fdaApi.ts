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
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${name}"&limit=1`
    )
    const data = await res.json()
    if (!data.results || data.results.length === 0) return null
    const drug = data.results[0]
    return {
      name: drug.openfda?.brand_name?.[0] || name,
      generic: drug.openfda?.generic_name?.[0] || '—',
      purpose: drug.purpose?.[0]?.slice(0, 200) || '—',
      warnings: drug.warnings?.[0]?.slice(0, 200) || '—',
      dosage: drug.dosage_and_administration?.[0]?.slice(0, 200) || '—',
      sideEffects: drug.adverse_reactions?.[0]?.slice(0, 200) || '—',
      manufacturer: drug.openfda?.manufacturer_name?.[0] || '—',
    }
  } catch {
    return null
  }
}