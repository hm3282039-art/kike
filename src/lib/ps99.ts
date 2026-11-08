export const PS99_API = 'https://ps99.biggamesapi.io'
export const PS99_API_DOCS = 'https://github.com/BIG-Games-LLC/ps99-public-api-docs'

export type PetTier = 'Huge' | 'Titanic' | 'Gargantuan' | 'Other'
export type PetVariant = 'Regular' | 'Golden' | 'Rainbow' | 'Shiny' | 'Shiny Golden' | 'Shiny Rainbow'

export type PetIndexEntry = {
  key: string
  id: string
  name: string
  tier: PetTier
  category: string
  pt: 0 | 1 | 2
  sh: boolean
  variant: PetVariant
  rap: number | null
  exists: number | null
  thumbnail: string
  goldenThumbnail: string
  indexDesc?: string
}

type ApiEnvelope<T> = { status: string; data: T; error?: { message?: string } }
type MarketRow = {
  category?: string
  configData?: { id?: string; pt?: number; sh?: boolean | number }
  value?: number
}
type PetCollectionRow = {
  configName?: string
  category?: string
  configData?: {
    name?: string
    thumbnail?: string
    goldenThumbnail?: string
    indexDesc?: string
  }
}

export type CachedPetIndex = { savedAt: number; entries: PetIndexEntry[] }

export function variantName(pt: number, sh: boolean): PetVariant {
  if (pt === 1) return sh ? 'Shiny Golden' : 'Golden'
  if (pt === 2) return sh ? 'Shiny Rainbow' : 'Rainbow'
  return sh ? 'Shiny' : 'Regular'
}

export function petKey(id: string, pt = 0, sh = false) {
  return `${id}|${pt}|${sh ? 1 : 0}`
}

export function assetId(asset: string) {
  return String(asset || '').match(/\d+/)?.[0] || ''
}

export function officialPetImage(asset: string) {
  const id = assetId(asset)
  return id ? `${PS99_API}/image/${id}` : ''
}

export function variantImageName(entry: Pick<PetIndexEntry, 'id' | 'pt' | 'sh'>) {
  const prefix = entry.sh ? 'Shiny_' : ''
  const finish = entry.pt === 1 ? 'Golden_' : entry.pt === 2 ? 'Rainbow_' : ''
  return `${prefix}${finish}${entry.id}`.replaceAll(' ', '_')
}

export function variantPetImage(entry: Pick<PetIndexEntry, 'id' | 'pt' | 'sh'>) {
  return `https://ps99rap.com/images/items/${encodeURIComponent(`${variantImageName(entry)}.png`)}`
}

function finiteNumber(value: unknown, allowZero: boolean) {
  const number = Number(value)
  if (!Number.isFinite(number) || (!allowZero && number <= 0) || (allowZero && number < 0)) return null
  return number
}

function tierFor(category: string, id: string): PetTier {
  if (category === 'Huge' || category === 'Titanic' || category === 'Gargantuan') return category
  if (id.startsWith('Huge ')) return 'Huge'
  if (id.startsWith('Titanic ')) return 'Titanic'
  if (id.startsWith('Gargantuan ')) return 'Gargantuan'
  return 'Other'
}

export function mergePetIndex(
  collection: PetCollectionRow[],
  rapRows: MarketRow[],
  existsRows: MarketRow[],
): PetIndexEntry[] {
  const pets = new Map<string, PetCollectionRow>()
  for (const row of collection) {
    const id = String(row.configName || row.configData?.name || '')
    if (id) pets.set(id, row)
  }

  const variants = new Map<string, { rap: number | null; exists: number | null }>()
  const ensure = (id: string, pt: 0 | 1 | 2, sh: boolean) => {
    const key = petKey(id, pt, sh)
    if (!variants.has(key)) variants.set(key, { rap: null, exists: null })
    return variants.get(key)!
  }

  const readMarket = (rows: MarketRow[], field: 'rap' | 'exists') => {
    for (const row of rows) {
      if (row.category !== 'Pet') continue
      const config = row.configData || {}
      const id = String(config.id || '')
      if (!id) continue
      const rawPt = Number(config.pt || 0)
      const pt = (rawPt === 1 || rawPt === 2 ? rawPt : 0) as 0 | 1 | 2
      const sh = config.sh === true || config.sh === 1
      const value = finiteNumber(row.value, field === 'exists')
      const target = ensure(id, pt, sh)
      if (value !== null) target[field] = value
    }
  }
  readMarket(rapRows, 'rap')
  readMarket(existsRows, 'exists')

  const ids = new Set([...pets.keys()])
  for (const key of variants.keys()) ids.add(key.split('|').slice(0, -2).join('|'))

  const entries: PetIndexEntry[] = []
  for (const id of ids) {
    const row = pets.get(id)
    const config = row?.configData || {}
    const category = String(row?.category || '')
    const related = [...variants.entries()].filter(([key]) => key.startsWith(`${id}|`))
    // Every configured pet remains discoverable, even before its first RAP/exists report.
    if (related.length === 0) related.push([petKey(id), { rap: null, exists: null }])

    for (const [key, market] of related) {
      const parts = key.split('|')
      const rawPt = Number(parts[parts.length - 2])
      const pt = (rawPt === 1 || rawPt === 2 ? rawPt : 0) as 0 | 1 | 2
      const sh = parts[parts.length - 1] === '1'
      entries.push({
        key,
        id,
        name: String(config.name || id),
        tier: tierFor(category, id),
        category: category || 'Pet',
        pt,
        sh,
        variant: variantName(pt, sh),
        rap: market.rap,
        exists: market.exists,
        thumbnail: String(config.thumbnail || ''),
        goldenThumbnail: String(config.goldenThumbnail || ''),
        indexDesc: config.indexDesc,
      })
    }
  }
  return entries
}

async function fetchRows<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${PS99_API}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`BIG Games API responded ${response.status}`)
  const body = await response.json() as ApiEnvelope<T>
  if (body.status !== 'ok' || !Array.isArray(body.data)) {
    throw new Error(body.error?.message || 'The official API returned an invalid response')
  }
  return body.data
}

export async function fetchOfficialPetIndex(signal?: AbortSignal) {
  const [collection, rap, exists] = await Promise.all([
    fetchRows<PetCollectionRow[]>('/api/collection/Pets', signal),
    fetchRows<MarketRow[]>('/api/rap', signal),
    fetchRows<MarketRow[]>('/api/exists', signal),
  ])
  return mergePetIndex(collection, rap, exists)
}

const DB_NAME = 'pawplay-ps99-index'
const STORE_NAME = 'datasets'
const CACHE_KEY = 'pet-index-v1'

function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('IndexedDB is blocked'))
  })
}

export async function readCachedPetIndex(): Promise<CachedPetIndex | null> {
  if (!('indexedDB' in window)) return null
  try {
    const db = await openCache()
    return await new Promise((resolve) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(CACHE_KEY)
      request.onsuccess = () => resolve((request.result as CachedPetIndex | undefined) || null)
      request.onerror = () => resolve(null)
    })
  } catch { return null }
}

export async function writeCachedPetIndex(cache: CachedPetIndex) {
  if (!('indexedDB' in window)) return
  try {
    const db = await openCache()
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(cache, CACHE_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
      transaction.onabort = () => resolve()
    })
  } catch { /* The live index still works when storage is unavailable. */ }
}
