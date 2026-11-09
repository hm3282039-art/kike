import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Database, Dices, ExternalLink, RefreshCw, Search, ShieldCheck, Spade, Sparkles, X } from 'lucide-react'
import { GemIcon, PawLogo } from './GameArt'
import { appRoute, assetUrl } from '../lib/appUrl'
import { PET_SNAPSHOT, PET_SNAPSHOT_AT, PET_SNAPSHOT_SOURCE, localPetImage } from '../data/petSnapshot'
import {
  PS99_API_DOCS,
  fetchOfficialPetIndex,
  officialPetImage,
  readCachedPetIndex,
  variantPetImage,
  writeCachedPetIndex,
  type PetIndexEntry,
  type PetTier,
  type PetVariant,
} from '../lib/ps99'

type DataMode = 'loading' | 'live' | 'cache' | 'snapshot'
type TierFilter = 'All' | PetTier
type VariantFilter = 'All' | PetVariant
type SortMode = 'rap-desc' | 'rap-asc' | 'exists-desc' | 'name'

const PAGE_SIZE = 48
const tierFilters: { id: TierFilter; label: string }[] = [
  { id: 'All', label: 'Tous les pets' },
  { id: 'Gargantuan', label: 'Gargantuan' },
  { id: 'Titanic', label: 'Titanic' },
  { id: 'Huge', label: 'Huge' },
  { id: 'Other', label: 'Autres pets' },
]
const variants: PetVariant[] = ['Regular', 'Golden', 'Rainbow', 'Shiny', 'Shiny Golden', 'Shiny Rainbow']

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const fullNumber = new Intl.NumberFormat('en-US')
const formatCompact = (value: number) => compactNumber.format(value)
const formatTime = (timestamp: number) => new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(timestamp))

function PetIndexImage({ entry, allowRemote }: { entry: PetIndexEntry; allowRemote: boolean }) {
  const sources = useMemo(() => {
    const local = localPetImage(entry)
    const official = officialPetImage(entry.pt === 1 ? entry.goldenThumbnail : entry.thumbnail)
    const variant = allowRemote ? variantPetImage(entry) : ''
    const prefersVariantArt = allowRemote && (entry.pt !== 0 || entry.sh)
    const hasExactLocal = Boolean(local && !local.includes('/official/'))
    return [...new Set([
      hasExactLocal ? local : prefersVariantArt ? variant : local,
      hasExactLocal && prefersVariantArt ? variant : prefersVariantArt ? local : variant,
      allowRemote ? official : '',
      variant,
      local,
      assetUrl('images/pet-placeholder.svg'),
    ].filter(Boolean))]
  }, [entry, allowRemote])
  const [sourceIndex, setSourceIndex] = useState(0)
  useEffect(() => setSourceIndex(0), [entry.key, allowRemote])

  return (
    <img
      src={sources[Math.min(sourceIndex, sources.length - 1)]}
      alt={`${entry.variant} ${entry.name}`}
      loading="lazy"
      draggable={false}
      onError={() => setSourceIndex((current) => Math.min(current + 1, sources.length - 1))}
    />
  )
}

function PetCard({ entry, allowRemote, order }: { entry: PetIndexEntry; allowRemote: boolean; order: number }) {
  const variantClass = entry.variant.toLowerCase().replaceAll(' ', '-')
  return (
    <article
      className={`pet-index-card tier-${entry.tier.toLowerCase()} variant-${variantClass}`}
      data-testid="pet-index-card"
      data-tier={entry.tier}
      data-variant={entry.variant}
      data-rap={entry.rap ?? ''}
      style={{ '--pet-order': Math.min(order, 12) } as React.CSSProperties}
    >
      <div className="pet-card-badges">
        <span className="pet-index-tier">{entry.tier === 'Other' ? entry.category : entry.tier}</span>
        <span className="pet-index-variant">{entry.sh && <Sparkles size={9} />}{entry.variant}</span>
      </div>
      <div className="pet-index-art">
        <span className="pet-art-glow" />
        <PetIndexImage entry={entry} allowRemote={allowRemote} />
      </div>
      <div className="pet-index-name">
        <h3 title={entry.name}>{entry.name}</h3>
        <span>{entry.variant} · Pet Simulator 99</span>
      </div>
      <div className="pet-index-rap">
        <div className="pet-value-label"><span>RAP</span><small>Prix moyen récent</small></div>
        {entry.rap !== null ? <>
          <strong title={`${fullNumber.format(entry.rap)} Diamonds`}><GemIcon size={20} />{formatCompact(entry.rap)}</strong>
          <small>{fullNumber.format(entry.rap)} Diamonds</small>
        </> : <div className="pet-value-unavailable"><strong>—</strong><small>RAP officiel absent</small></div>}
      </div>
      <div className="pet-index-exists">
        <span>Exemplaires</span>
        <strong title={entry.exists !== null ? `${fullNumber.format(entry.exists)} exemplaires recensés` : 'Quantité indisponible'}>
          {entry.exists !== null ? fullNumber.format(entry.exists) : 'Indisponible'}
        </strong>
      </div>
    </article>
  )
}

export default function PetIndex() {
  const [entries, setEntries] = useState<PetIndexEntry[]>([])
  const [mode, setMode] = useState<DataMode>('loading')
  const [loadedAt, setLoadedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const hasData = useRef(false)
  const gridRef = useRef<HTMLElement>(null)

  const [query, setQuery] = useState('')
  const [tier, setTier] = useState<TierFilter>('All')
  const [variant, setVariant] = useState<VariantFilter>('All')
  const [sort, setSort] = useState<SortMode>('rap-desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    setLoading(true)
    setError('')

    const load = async () => {
      if (!hasData.current) {
        const cached = await readCachedPetIndex()
        if (!active) return
        if (cached?.entries.length) {
          hasData.current = true
          setEntries(cached.entries)
          setLoadedAt(cached.savedAt)
          setMode('cache')
        }
      }

      try {
        const official = await fetchOfficialPetIndex(controller.signal)
        if (!active) return
        const savedAt = Date.now()
        hasData.current = true
        setEntries(official)
        setLoadedAt(savedAt)
        setMode('live')
        setError('')
        void writeCachedPetIndex({ savedAt, entries: official })
      } catch (requestError) {
        if (!active) return
        if (!hasData.current) {
          hasData.current = true
          setEntries(PET_SNAPSHOT)
          setLoadedAt(PET_SNAPSHOT_AT)
          setMode('snapshot')
          setError('API indisponible. Affichage d’un aperçu hors ligne limité et daté.')
        } else {
          setError('Refresh failed. The last successfully loaded data is still displayed.')
        }
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          setError('Délai API dépassé. Vérifie ta connexion et réessaie.')
        }
      } finally {
        window.clearTimeout(timeout)
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [reloadToken])

  useEffect(() => setPage(1), [query, tier, variant, sort])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const result = entries.filter((entry) => {
      if (tier !== 'All' && entry.tier !== tier) return false
      if (variant !== 'All' && entry.variant !== variant) return false
      if (normalized && !`${entry.name} ${entry.variant} ${entry.tier}`.toLowerCase().includes(normalized)) return false
      return true
    })
    const nullLast = (value: number | null, fallback: number) => value === null ? fallback : value
    result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name) || a.variant.localeCompare(b.variant)
      if (sort === 'exists-desc') return nullLast(b.exists, -1) - nullLast(a.exists, -1) || a.name.localeCompare(b.name)
      const direction = sort === 'rap-desc' ? -1 : 1
      const aValue = nullLast(a.rap, sort === 'rap-desc' ? -1 : Number.MAX_SAFE_INTEGER)
      const bValue = nullLast(b.rap, sort === 'rap-desc' ? -1 : Number.MAX_SAFE_INTEGER)
      return (aValue - bValue) * direction || a.name.localeCompare(b.name)
    })
    return result
  }, [entries, query, tier, variant, sort])

  const baseCount = useMemo(() => new Set(entries.map((entry) => entry.id)).size, [entries])
  const pricedCount = useMemo(() => entries.filter((entry) => entry.rap !== null).length, [entries])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const filtersActive = Boolean(query || tier !== 'All' || variant !== 'All' || sort !== 'rap-desc')

  const resetFilters = () => {
    setQuery('')
    setTier('All')
    setVariant('All')
    setSort('rap-desc')
  }
  const goToPage = (next: number) => {
    setPage(Math.max(1, Math.min(next, totalPages)))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    gridRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  const modeLabel = mode === 'live' ? 'DONNÉES OFFICIELLES EN DIRECT' : mode === 'cache' ? 'DONNÉES OFFICIELLES EN CACHE' : mode === 'snapshot' ? 'APERÇU HORS LIGNE' : 'CONNEXION À BIG GAMES'
  const sourceUrl = mode === 'snapshot' ? PET_SNAPSHOT_SOURCE : PS99_API_DOCS

  return (
    <div className="pet-index-app">
      <header className="pet-index-topbar">
        <a className="dice-brand" href={appRoute('dice')} aria-label="PawPlay Color Dice home"><span className="blue-brand-mark"><PawLogo size={37} /></span><span>paw<span>play</span><small>PS99 TOOLS</small></span></a>
        <nav className="pet-index-nav" aria-label="Navigation principale">
          <a href={appRoute('dice')}><Dices size={15} /><span>Color Dice</span></a>
          <a href={appRoute('poker')}><Spade size={15} /><span>Poker</span></a>
          <a href={appRoute('chicken')}>🐔 Chicken</a><a href={appRoute('pets')} className="active" aria-current="page"><BookOpen size={15} /><span>Index des pets</span></a>
        </nav>
        <div className="pet-index-header-actions">
          <span className="index-info-label"><ShieldCheck size={13} />INFORMATION · AUCUN ARGENT RÉEL</span>
          <button className="index-refresh-button" onClick={() => setReloadToken((current) => current + 1)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} /><span>{loading ? 'Synchronisation…' : 'Actualiser'}</span>
          </button>
        </div>
      </header>

      <main className="pet-index-main">
        <section className="pet-index-hero">
          <div className="pet-index-title-wrap">
            <span className="pet-index-book"><BookOpen size={27} /></span>
            <div><span className="pet-index-eyebrow">API PUBLIQUE BIG GAMES</span><h1>Index des pets PS99</h1><p>RAP en Diamonds et exemplaires existants pour chaque variante suivie.</p></div>
          </div>
          <a className={`index-data-source mode-${mode}`} href={sourceUrl} target="_blank" rel="noreferrer">
            <span className="source-status-dot" /><span><strong>{modeLabel}</strong><small>{loadedAt ? `Mis à jour ${formatTime(loadedAt)}` : 'Chargement des pets, RAP et quantités…'}</small></span><ExternalLink size={14} />
          </a>
        </section>

        <section className="pet-index-stats" aria-label="Index statistics">
          <div><span className="index-stat-icon blue"><Database size={18} /></span><span>Pets de base<strong>{baseCount || '—'}</strong></span></div>
          <div><span className="index-stat-icon purple"><Sparkles size={18} /></span><span>Variantes suivies<strong>{entries.length || '—'}</strong></span></div>
          <div><span className="index-stat-icon cyan"><GemIcon size={21} /></span><span>Variantes avec RAP<strong>{pricedCount || '—'}</strong></span></div>
          <p><Check size={12} />Aucun prix inventé · RAP absent laissé vide</p>
        </section>

        {(error || mode === 'snapshot') && <div className={`index-notice ${error ? 'warning' : ''}`} role="status">
          <Database size={15} /><span>{error || 'Aperçu hors ligne limité.'}</span>
          {mode === 'snapshot' && <small>{baseCount} pets de base / {entries.length} variantes suivies · Actualise pour obtenir le catalogue complet.</small>}
        </div>}

        <section className="pet-index-filters" aria-label="Pet filters">
          <div className="pet-search-box"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un pet ou une variante…" aria-label="Rechercher des pets" />{query && <button onClick={() => setQuery('')} aria-label="Effacer la recherche"><X size={14} /></button>}</div>
          <div className="pet-tier-filters" role="group" aria-label="Filter by tier">
            {tierFilters.map((filter) => <button key={filter.id} className={tier === filter.id ? 'active' : ''} onClick={() => setTier(filter.id)} aria-pressed={tier === filter.id}>{filter.label}</button>)}
          </div>
          <div className="pet-select-filters">
            <label>Variante<select value={variant} onChange={(event) => setVariant(event.target.value as VariantFilter)}><option value="All">Toutes les variantes</option>{variants.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Trier par<select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="rap-desc">RAP : décroissant</option><option value="rap-asc">RAP : croissant</option><option value="exists-desc">Quantité : décroissante</option><option value="name">Nom : A–Z</option></select></label>
            {filtersActive && <button className="reset-pet-filters" onClick={resetFilters}><X size={13} />Réinitialiser</button>}
          </div>
        </section>

        <section className="pet-index-results" ref={gridRef} aria-live="polite" aria-busy={loading && entries.length === 0}>
          <div className="pet-results-heading"><div><h2>{tier === 'All' ? 'Tous les pets' : tier === 'Other' ? 'Autres pets' : `${tier} pets`}</h2><p>{filtered.length.toLocaleString('en-US')} {filtered.length === 1 ? 'variant' : 'variants'} trouvée(s){query ? ` pour «${query} »` : ''}</p></div><span>{PAGE_SIZE} par page</span></div>

          {loading && entries.length === 0 ? <div className="pet-index-grid pet-grid-animated is-loading" aria-label="Loading pet artworks, RAP and exist counts">{Array.from({ length: 12 }, (_, index) => <div className="pet-index-card pet-card-skeleton" key={index} aria-hidden="true"><span className="skeleton-badges" /><div className="skeleton-art"><i /></div><span className="skeleton-name" /><strong className="skeleton-value" /><small className="skeleton-exists" /></div>)}</div> : visible.length ? <>
            <div className="pet-index-grid pet-grid-animated" key={`${query}-${tier}-${variant}-${sort}-${safePage}-${mode}`}>{visible.map((entry, index) => <PetCard key={entry.key} entry={entry} allowRemote={mode !== 'snapshot'} order={index} />)}</div>
            <nav className="pet-pagination" aria-label="Pet index pages">
              <button onClick={() => goToPage(safePage - 1)} disabled={safePage <= 1}><ChevronLeft size={15} />Précédent</button>
              <span>Page <strong>{safePage}</strong> of <strong>{totalPages}</strong><small>{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</small></span>
              <button onClick={() => goToPage(safePage + 1)} disabled={safePage >= totalPages}>Suivant<ChevronRight size={15} /></button>
            </nav>
          </> : <div className="pet-index-empty"><span className="empty-search-art"><Search size={27} /><Sparkles size={13} /></span><h3>No pet matches these filters</h3><p>Try another name, tier or variant, or reset to see all tracked variants.</p><button onClick={resetFilters}>Reset all filters<ArrowRight size={14} /></button></div>}
        </section>
      </main>

      <footer className="pet-index-footer"><a href={appRoute('dice')}><ArrowLeft size={13} />Retour au Color Dice</a><p>Le RAP est une référence de marché, pas un prix garanti. Outil non officiel, sans affiliation à BIG Games. Aucun achat, inventaire réel ou valeur monétaire.</p><a href={PS99_API_DOCS} target="_blank" rel="noreferrer">API officielle<ExternalLink size={12} /></a></footer>
    </div>
  )
}
