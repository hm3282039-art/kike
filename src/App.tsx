import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownUp, ArrowRight, BookOpen, Check, ChevronDown, Dices, HelpCircle, History, Plus, ShieldCheck, Sparkles, Swords, X } from 'lucide-react'
import { GemIcon, PawLogo } from './components/GameArt'
import { appRoute, assetUrl } from './lib/appUrl'

type DiceColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
type DuelResult = 'win' | 'lose' | 'tie'
type HistoryEntry = { id: number; opponent: string; playerScore: number; botScore: number; result: DuelResult; stake: number; payout: number; time: string; dice?: DiceColor[]; playerColors?: DiceColor[]; botColors?: DiceColor[]; rollId?: string }

type PetTier = 'Huge' | 'Titanic' | 'Gargantuan'
type PetVariant = 'Normal' | 'Golden' | 'Rainbow' | 'Shiny' | 'Golden Shiny' | 'Rainbow Shiny'

const PET_CATALOG = {
  'golden-gargantuan-doge': { name: 'Gargantuan Doge', tier: 'Gargantuan', variant: 'Golden' },
  'shiny-gargantuan-doge': { name: 'Gargantuan Doge', tier: 'Gargantuan', variant: 'Shiny' },
  'golden-shiny-gargantuan-doge': { name: 'Gargantuan Doge', tier: 'Gargantuan', variant: 'Golden Shiny' },
  'gargantuan-evil-scarecrow-pumpkin': { name: 'Gargantuan Evil Scarecrow Pumpkin', tier: 'Gargantuan', variant: 'Normal' },
  'rainbow-gargantuan-skelemelon': { name: 'Gargantuan Skelemelon', tier: 'Gargantuan', variant: 'Rainbow' },
  'rainbow-shiny-gargantuan-skelemelon': { name: 'Gargantuan Skelemelon', tier: 'Gargantuan', variant: 'Rainbow Shiny' },
  'titanic-arcane-cat': { name: 'Titanic Arcane Cat', tier: 'Titanic', variant: 'Normal' },
  'titanic-kitsune-fox': { name: 'Titanic Kitsune Fox', tier: 'Titanic', variant: 'Normal' },
  'golden-titanic-kitsune-fox': { name: 'Titanic Kitsune Fox', tier: 'Titanic', variant: 'Golden' },
  'rainbow-titanic-blue-balloon-cat': { name: 'Titanic Blue Balloon Cat', tier: 'Titanic', variant: 'Rainbow' },
  'shiny-titanic-banana-cat': { name: 'Titanic Banana Cat', tier: 'Titanic', variant: 'Shiny' },
  'shiny-titanic-hologram-cat': { name: 'Titanic Hologram Cat', tier: 'Titanic', variant: 'Shiny' },
  'huge-amethyst-dragon': { name: 'Huge Amethyst Dragon', tier: 'Huge', variant: 'Normal' },
  'huge-bread-shiba': { name: 'Huge Bread Shiba', tier: 'Huge', variant: 'Normal' },
  'huge-pumpkin-cat': { name: 'Huge Pumpkin Cat', tier: 'Huge', variant: 'Normal' },
  'huge-happy-rock': { name: 'Huge Happy Rock', tier: 'Huge', variant: 'Normal' },
  'shiny-huge-happy-rock': { name: 'Huge Happy Rock', tier: 'Huge', variant: 'Shiny' },
  'golden-shiny-huge-happy-rock': { name: 'Huge Happy Rock', tier: 'Huge', variant: 'Golden Shiny' },
  'golden-huge-chest-mimic': { name: 'Huge Chest Mimic', tier: 'Huge', variant: 'Golden' },
  'golden-shiny-huge-autumn-chest-mimic': { name: 'Huge Autumn Chest Mimic', tier: 'Huge', variant: 'Golden Shiny' },
  'rainbow-shiny-huge-autumn-chest-mimic': { name: 'Huge Autumn Chest Mimic', tier: 'Huge', variant: 'Rainbow Shiny' },
  'rainbow-huge-nightfall-pegasus': { name: 'Huge Nightfall Pegasus', tier: 'Huge', variant: 'Rainbow' },
  'rainbow-huge-snowflake-pegasus': { name: 'Huge Snowflake Pegasus', tier: 'Huge', variant: 'Rainbow' },
  'rainbow-shiny-huge-snowflake-pegasus': { name: 'Huge Snowflake Pegasus', tier: 'Huge', variant: 'Rainbow Shiny' },
  'huge-rainbow-unicorn': { name: 'Huge Rainbow Unicorn', tier: 'Huge', variant: 'Normal' },
} as const satisfies Record<string, { name: string; tier: PetTier; variant: PetVariant }>

type PetId = keyof typeof PET_CATALOG

type OpenMatch = {
  id: number
  player: string
  pet: PetId
  stake: number
  pets: PetId[]
  level: string
}

const COLORS: { id: DiceColor; label: string; hex: string; dark: string }[] = [
  { id: 'red', label: 'Red', hex: '#f15467', dark: '#a8243d' },
  { id: 'orange', label: 'Orange', hex: '#f58b37', dark: '#b34c16' },
  { id: 'yellow', label: 'Yellow', hex: '#f1cc43', dark: '#ae7d16' },
  { id: 'green', label: 'Green', hex: '#3fc67d', dark: '#187848' },
  { id: 'blue', label: 'Blue', hex: '#3d8cf3', dark: '#2050a5' },
  { id: 'purple', label: 'Purple', hex: '#9960e8', dark: '#592c9c' },
]

const OPEN_MATCHES: OpenMatch[] = [
  { id: 1, player: 'GargDogeVault', pet: 'golden-shiny-gargantuan-doge', stake: 600, pets: ['golden-shiny-gargantuan-doge', 'golden-gargantuan-doge', 'shiny-gargantuan-doge'], level: 'Gargantuan · 3 real variants' },
  { id: 2, player: 'PumpkinKing99', pet: 'gargantuan-evil-scarecrow-pumpkin', stake: 450, pets: ['gargantuan-evil-scarecrow-pumpkin', 'rainbow-gargantuan-skelemelon', 'rainbow-shiny-gargantuan-skelemelon'], level: 'Gargantuan · Rainbow Shiny' },
  { id: 3, player: 'KitsuneVault', pet: 'golden-titanic-kitsune-fox', stake: 350, pets: ['golden-titanic-kitsune-fox', 'titanic-arcane-cat', 'rainbow-titanic-blue-balloon-cat'], level: 'Titanic · Golden & Rainbow' },
  { id: 4, player: 'ShinyTita', pet: 'shiny-titanic-banana-cat', stake: 250, pets: ['shiny-titanic-banana-cat', 'shiny-titanic-hologram-cat', 'titanic-kitsune-fox'], level: 'Titanic · Shiny collection' },
  { id: 5, player: 'ChestMimic777', pet: 'golden-shiny-huge-autumn-chest-mimic', stake: 150, pets: ['golden-shiny-huge-autumn-chest-mimic', 'rainbow-shiny-huge-autumn-chest-mimic', 'golden-huge-chest-mimic'], level: 'Huge · Golden & Rainbow Shiny' },
  { id: 6, player: 'PegasusRAP', pet: 'rainbow-shiny-huge-snowflake-pegasus', stake: 100, pets: ['rainbow-shiny-huge-snowflake-pegasus', 'rainbow-huge-snowflake-pegasus', 'rainbow-huge-nightfall-pegasus'], level: 'Huge · Rainbow collection' },
  { id: 7, player: 'RockStarPS99', pet: 'shiny-huge-happy-rock', stake: 50, pets: ['shiny-huge-happy-rock', 'golden-shiny-huge-happy-rock', 'huge-bread-shiba'], level: 'Huge · Normal & Shiny' },
]

const PIP_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function randomInt(max: number) {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return Math.floor((array[0] / (0xffffffff + 1)) * max)
}

function formatGems(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value))
}

const SHORT_VARIANTS: Record<PetVariant, string> = {
  Normal: '',
  Golden: 'GOLD',
  Rainbow: 'RAINBOW',
  Shiny: 'SHINY',
  'Golden Shiny': 'GOLD ✦',
  'Rainbow Shiny': 'RAIN ✦',
}

function PetThumbnail({ petId }: { petId: PetId }) {
  const pet = PET_CATALOG[petId]
  const variantClass = pet.variant.toLowerCase().replaceAll(' ', '-')
  return (
    <span
      className={`pet-thumbnail tier-${pet.tier.toLowerCase()} variant-${variantClass}`}
      tabIndex={0}
      aria-label={`${pet.variant} ${pet.name}`}
    >
      <img src={assetUrl(`images/pets/${petId}.png`)} alt="" draggable={false} />
      <span className="pet-tier-tag">{pet.tier === 'Gargantuan' ? 'GARG' : pet.tier === 'Titanic' ? 'TITA' : 'HUGE'}</span>
      {pet.variant !== 'Normal' && <span className="pet-variant-tag">{SHORT_VARIANTS[pet.variant]}</span>}
      <span className="pet-tooltip" aria-hidden="true"><strong>{pet.name}</strong><small>{pet.tier} · {pet.variant}</small></span>
    </span>
  )
}

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) as T : initialValue
    } catch { return initialValue }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* The demo also works without storage. */ }
  }, [key, value])
  return [value, setValue] as const
}

function ColorDie({ color, value, index, rolling, playerColors, botColors }: {
  color: DiceColor
  value: number
  index: number
  rolling: boolean
  playerColors: DiceColor[]
  botColors: DiceColor[]
}) {
  const definition = COLORS.find((item) => item.id === color)!
  return (
    <div className={`die-result die-result-${index} ${rolling ? 'rolling' : ''}`}>
      <div className={`color-die color-die-${color}`} style={{ '--die-color': definition.hex, '--die-dark': definition.dark } as React.CSSProperties}>
        <div className="die-pips">{Array.from({ length: 9 }, (_, pip) => <span key={pip} className={PIP_MAP[value].includes(pip) ? 'visible' : ''} />)}</div>
        <span className="die-shine" />
      </div>
      <span className="die-color-name">{definition.label}</span>
      {!rolling && botColors.length > 0 && <div className="die-owner-tags">{playerColors.includes(color) && <span className="owner-you">YOU +1</span>}{botColors.includes(color) && <span className="owner-bot">BOT +1</span>}</div>}
    </div>
  )
}

function App() {
  const [balance, setBalance] = useStoredState('pawplay-balance', 12500)
  const [history, setHistory] = useStoredState<HistoryEntry[]>('pawplay-dice-history', [])
  const [selectedColors, setSelectedColors] = useState<DiceColor[]>(['purple', 'yellow'])
  const [botColors, setBotColors] = useState<DiceColor[]>([])
  const [dice, setDice] = useState<DiceColor[]>(['purple', 'red', 'green', 'blue'])
  const [pips, setPips] = useState([5, 3, 6, 2])
  const [stake, setStake] = useState(100)
  const [opponent, setOpponent] = useState('Arcane Bot')
  const [opponentPet, setOpponentPet] = useState<PetId>('titanic-arcane-cat')
  const [rolling, setRolling] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null)
  const [lastRollId, setLastRollId] = useState('')
  const [score, setScore] = useState<{ player: number; bot: number } | null>(null)
  const [result, setResult] = useState<DuelResult | null>(null)
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open')
  const [sortDescending, setSortDescending] = useState(true)
  const [infoModal, setInfoModal] = useState<'how' | 'verify' | null>(null)
  const [toast, setToast] = useState('')
  const createPanelRef = useRef<HTMLElement>(null)
  const revealedRef = useRef(0)
  const rollIntervalRef = useRef<number | null>(null)
  const rollTimeoutsRef = useRef<number[]>([])

  const sortedMatches = useMemo(() => [...OPEN_MATCHES].sort((a, b) => sortDescending ? b.stake - a.stake : a.stake - b.stake), [sortDescending])
  const totalValue = OPEN_MATCHES.reduce((sum, match) => sum + match.stake * 2, 0)
  const totalItems = OPEN_MATCHES.reduce((sum, match) => sum + match.pets.length, 0)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setInfoModal(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const toggleColor = (color: DiceColor) => {
    if (rolling) return
    setResult(null)
    setScore(null)
    setBotColors([])
    setSelectedColors((current) => {
      if (current.includes(color)) return current.filter((item) => item !== color)
      if (current.length < 2) return [...current, color]
      return [current[1], color]
    })
  }

  useEffect(() => () => {
    if (rollIntervalRef.current) window.clearInterval(rollIntervalRef.current)
    rollTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
  }, [])

  const joinMatch = (match: OpenMatch) => {
    if (rolling) return
    setSelectedMatch(match.id)
    setRevealedCount(0)
    revealedRef.current = 0
    setOpponent(match.player)
    setOpponentPet(match.pet)
    setStake(match.stake)
    setResult(null)
    setScore(null)
    setBotColors([])
    createPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setToast(`${match.player}'s duel selected · Pick your 2 colors`)
  }

  const startDuel = () => {
    if (rolling || selectedColors.length !== 2) return
    if (stake < 10 || stake > balance) {
      setToast('Not enough fictive gems — use the free refill')
      return
    }

    const first = randomInt(6)
    const second = (first + 1 + randomInt(5)) % 6
    const nextBotColors = [COLORS[first].id, COLORS[second].id]
    const finalDice = Array.from({ length: 4 }, () => COLORS[randomInt(6)].id)
    const finalPips = Array.from({ length: 4 }, () => randomInt(6) + 1)
    const playerScore = finalDice.filter((color) => selectedColors.includes(color)).length
    const botScore = finalDice.filter((color) => nextBotColors.includes(color)).length
    const duelResult: DuelResult = playerScore > botScore ? 'win' : playerScore < botScore ? 'lose' : 'tie'
    const payout = duelResult === 'win' ? stake * 2 : duelResult === 'tie' ? stake : 0
    const rollId = `#${Date.now().toString(36).toUpperCase()}`

    setBalance((current) => current - stake)
    setRolling(true)
    setResult(null)
    setScore(null)
    setBotColors(nextBotColors)
    revealedRef.current = 0
    setRevealedCount(0)

    rollIntervalRef.current = window.setInterval(() => {
      setDice((current) => current.map((color, index) => index < revealedRef.current ? color : COLORS[randomInt(6)].id))
      setPips((current) => current.map((value, index) => index < revealedRef.current ? value : randomInt(6) + 1))
    }, 85)

    const revealDelays = [520, 790, 1060, 1340]
    rollTimeoutsRef.current = revealDelays.map((delay, index) => window.setTimeout(() => {
      revealedRef.current = index + 1
      setRevealedCount(index + 1)
      setDice((current) => current.map((color, dieIndex) => dieIndex <= index ? finalDice[dieIndex] : color))
      setPips((current) => current.map((value, dieIndex) => dieIndex <= index ? finalPips[dieIndex] : value))

      if (index === 3) {
        if (rollIntervalRef.current) window.clearInterval(rollIntervalRef.current)
        rollIntervalRef.current = null
        setDice(finalDice)
        setPips(finalPips)
        setScore({ player: playerScore, bot: botScore })
        setResult(duelResult)
        setRolling(false)
        setLastRollId(rollId)
        if (payout) setBalance((current) => current + payout)
        setHistory((current) => [{ id: Date.now(), opponent, playerScore, botScore, result: duelResult, stake, payout, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), dice: finalDice, playerColors: selectedColors, botColors: nextBotColors, rollId }, ...current].slice(0, 12))
      }
    }, delay))
  }

  const resetDuel = () => {
    if (rolling) return
    setOpponent('Arcane Bot')
    setOpponentPet('titanic-arcane-cat')
    setSelectedMatch(null)
    setRevealedCount(0)
    revealedRef.current = 0
    setStake(100)
    setResult(null)
    setScore(null)
    setBotColors([])
  }

  const refill = () => {
    setBalance((current) => current + 1000)
    setToast('1 000 free fictive gems added')
  }

  return (
    <div className="dice-app">
      <header className="dice-topbar">
        <button className="dice-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="blue-brand-mark"><PawLogo size={37} /></span><span>paw<span>play</span><small>COLOR DICE</small></span></button>
        <nav className="dice-game-nav" aria-label="Main navigation"><span className="dice-header-game"><Dices size={17} /><span>Color Dice Duels</span></span><a className="dice-index-link" href={appRoute('pets')}><BookOpen size={15} /><span>Pet Index</span></a></nav>
        <div className="dice-header-right"><span className="demo-label"><ShieldCheck size={14} />100% FICTIVE</span><div className="gems-balance"><GemIcon size={24} /><span><strong>{formatGems(balance)}</strong><small>Fictive gems</small></span><button aria-label="Free gems refill" onClick={refill}><Plus size={16} /></button></div></div>
      </header>

      <main className="dice-main">
        <section className="dice-page-heading">
          <div className="dice-title-wrap"><span className="blue-dice-icon"><Dices size={28} /></span><div><h1>PawPlay Color Dice Duels</h1><p>Pick 2 colors, roll 4 dice. The player whose colors appear most wins the pot.</p></div></div>
          <div className="dice-page-actions"><button onClick={() => setInfoModal('how')}><HelpCircle size={15} />How It Works</button><button onClick={() => setInfoModal('verify')}><ShieldCheck size={15} />Verify Outcome</button></div>
        </section>

        <section className="dice-stats-bar">
          <div><span className="stat-icon blue"><Swords size={18} /></span><span>Open Matches<strong>{OPEN_MATCHES.length}</strong></span></div>
          <div><span className="stat-icon cyan"><GemIcon size={21} /></span><span>Total Value<strong>{formatGems(totalValue)}</strong></span></div>
          <div><span className="stat-icon purple"><Sparkles size={18} /></span><span>PS99 Items<strong>{totalItems}</strong></span></div>
          <span className="local-game-note"><span className="online-dot" />Local demo · Simulated players</span>
        </section>

        <div className="dice-workspace">
          <section className="duel-lobby-panel">
            <div className="lobby-tabs"><button className={activeTab === 'open' ? 'active' : ''} onClick={() => setActiveTab('open')}><Swords size={15} />Open Duels<span>{OPEN_MATCHES.length}</span></button><button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}><History size={15} />History<span>{history.length}</span></button><button className="sort-button" onClick={() => setSortDescending(!sortDescending)}><ArrowDownUp size={14} />{sortDescending ? 'Highest to Lowest' : 'Lowest to Highest'}<ChevronDown size={13} /></button></div>
            {activeTab === 'open' ? <>
              <div className="lobby-table-head"><span>PLAYERS</span><span>PETS IN THE POT</span><span>VALUE</span><span>ACTION</span></div>
              <div className="open-match-list">{sortedMatches.map((match) => <article className={`open-match-row ${selectedMatch === match.id ? 'selected-match' : ''}`} key={match.id}>
                <div className="match-players"><span className={`match-avatar tier-${PET_CATALOG[match.pet].tier.toLowerCase()}`}><img src={assetUrl(`images/pets/${match.pet}.png`)} alt={PET_CATALOG[match.pet].name} /></span><span className="match-vs">VS</span><span className="match-avatar waiting">?</span><div><strong>{match.player}</strong><span>Waiting for opponent</span></div></div>
                <div className="match-pets">{match.pets.map((pet) => <PetThumbnail key={pet} petId={pet} />)}<span className="match-pet-count">{match.pets.length} pets</span><small className="match-pet-level">{match.level}</small></div>
                <div className="match-value"><strong><GemIcon size={17} />{formatGems(match.stake * 2)}</strong><span>{formatGems(match.stake)} each</span></div>
                <button className={`join-duel-button ${selectedMatch === match.id ? 'selected' : ''}`} disabled={rolling} onClick={() => joinMatch(match)}>{selectedMatch === match.id ? <><Check size={13} />Selected</> : <>Join<ArrowRight size={14} /></>}</button>
              </article>)}</div>
              <div className="lobby-bottom-note"><ShieldCheck size={13} />No real pets are added to the pot. Images are for the fan-made demo only.</div>
            </> : <div className="history-list">{history.length === 0 ? <div className="empty-history"><History size={32} /><h3>No duels yet</h3><p>Create or join a duel to see your local history here.</p></div> : history.map((entry) => <div className="history-row" key={entry.id}><span className={`history-result ${entry.result}`}>{entry.result === 'win' ? 'WON' : entry.result === 'lose' ? 'LOST' : 'TIE'}</span><div><strong>You vs {entry.opponent}</strong><span>{entry.time} · Score {entry.playerScore}–{entry.botScore}{entry.rollId ? ` · ${entry.rollId}` : ''}</span></div><span className="history-stake"><GemIcon size={15} />{formatGems(entry.stake)}</span><strong className={`history-payout ${entry.result}`}>{entry.result === 'win' ? '+' : entry.result === 'lose' ? '−' : ''}{entry.result === 'tie' ? 'Refunded' : formatGems(entry.result === 'win' ? entry.payout - entry.stake : entry.stake)}</strong></div>)}</div>}
          </section>

          <aside className="create-duel-panel" ref={createPanelRef}>
            <div className="create-panel-heading"><div><span className="create-dice-icon"><Dices size={20} /></span><div><h2>{opponent === 'Arcane Bot' ? 'Create a Duel' : 'Join the Duel'}</h2><p>You vs {opponent}</p></div></div><div className="create-header-actions">{opponent !== 'Arcane Bot' && <button className="new-duel-button" disabled={rolling} onClick={resetDuel}><Plus size={12} />New</button>}<span className="two-players-badge">2 PLAYERS</span></div></div>
            <div className="duel-arena">
              <div className="arena-scoreboard">
                <div className="arena-player"><span className="arena-avatar tier-huge"><img src={assetUrl('images/pets/huge-amethyst-dragon.png')} alt="Your PS99 pet" /></span><div><span>YOU</span><div className="arena-color-dots">{selectedColors.map((color) => <i key={color} className={`color-dot-${color}`} />)}</div></div><strong>{score?.player ?? '–'}</strong></div>
                <span className="arena-vs">VS</span>
                <div className="arena-player opponent"><strong>{score?.bot ?? '–'}</strong><div><span>{opponent.toUpperCase()}</span><div className="arena-color-dots">{botColors.length ? botColors.map((color) => <i key={color} className={`color-dot-${color}`} />) : <small>? &nbsp; ?</small>}</div></div><span className={`arena-avatar tier-${PET_CATALOG[opponentPet].tier.toLowerCase()}`}><img src={assetUrl(`images/pets/${opponentPet}.png`)} alt={`${PET_CATALOG[opponentPet].variant} ${PET_CATALOG[opponentPet].name}`} /></span></div>
              </div>
              {result === 'win' && !rolling && <div className="win-confetti" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ '--confetti-x': `${(index * 43) % 100}%`, '--confetti-delay': `${(index % 7) * .07}s`, '--confetti-color': COLORS[index % COLORS.length].hex } as React.CSSProperties} />)}</div>}
              <div className="dice-rolling-area">{dice.map((color, index) => <ColorDie key={index} color={color} value={pips[index]} index={index} rolling={rolling && index >= revealedCount} playerColors={selectedColors} botColors={botColors} />)}</div>
              <div className="arena-rule"><span className="online-dot" />{rolling ? `Rolling the dice… ${revealedCount} / 4 revealed` : 'Most matching colors wins the pot'}</div>
            </div>

            <div className="duel-settings">
              <div className="settings-label"><span>Pick your 2 colors</span><strong>{selectedColors.length} / 2</strong></div>
              <div className="dice-color-picker">{COLORS.map((color) => {
                const selectedIndex = selectedColors.indexOf(color.id)
                return <button key={color.id} disabled={rolling} className={`${selectedIndex >= 0 ? 'selected' : ''} picker-${color.id}`} onClick={() => toggleColor(color.id)}><span className={`picker-swatch color-dot-${color.id}`} />{color.label}{selectedIndex >= 0 && <b>{selectedIndex + 1}</b>}</button>
              })}</div>
              <div className="combo-presets"><span>Popular picks</span><button disabled={rolling} onClick={() => { setSelectedColors(['purple', 'yellow']); setResult(null); setScore(null); setBotColors([]) }}><i className="color-dot-purple" /><i className="color-dot-yellow" />Purple + Yellow</button><button disabled={rolling} onClick={() => { setSelectedColors(['blue', 'orange']); setResult(null); setScore(null); setBotColors([]) }}><i className="color-dot-blue" /><i className="color-dot-orange" />Blue + Orange</button></div>
              <div className="stake-heading"><label htmlFor="stake-input">Your stake</label><span>Pot: <strong><GemIcon size={14} />{formatGems(stake * 2)}</strong></span></div>
              <div className="stake-input"><GemIcon size={22} /><input id="stake-input" type="number" min="10" step="10" value={stake} disabled={rolling} onChange={(event) => setStake(Math.max(0, Number(event.target.value)))} /><button disabled={rolling} onClick={() => setStake(Math.max(10, Math.floor(stake / 2)))}>½</button><button disabled={rolling} onClick={() => setStake(stake * 2)}>2×</button><button disabled={rolling} onClick={() => setStake(Math.min(1000, balance))}>MAX</button></div>
              <div className="quick-stakes">{[50, 100, 250, 500].map((amount) => <button key={amount} disabled={rolling || balance < amount} className={stake === amount ? 'active' : ''} onClick={() => setStake(amount)}><GemIcon size={12} />{amount}</button>)}</div>
              {balance < 10 && <button className="free-refill" onClick={refill}><Plus size={14} />Get 1 000 free fictive gems</button>}
              <button className="roll-dice-button" disabled={rolling || selectedColors.length !== 2 || stake < 10 || stake > balance} onClick={startDuel}><Dices size={19} /><span>{rolling ? 'Rolling Dice…' : result ? 'Roll Again' : 'Roll 4 Dice'}</span><span className="roll-pot"><GemIcon size={16} />{formatGems(stake * 2)}</span></button>
              {result && score && <div className={`duel-outcome outcome-${result}`} role="status"><span>{result === 'win' ? <Sparkles size={20} /> : result === 'tie' ? <ShieldCheck size={20} /> : <Swords size={20} />}</span><div><strong>{result === 'win' ? `You won ${score.player}–${score.bot}!` : result === 'lose' ? `${opponent} won ${score.bot}–${score.player}` : `Tie ${score.player}–${score.bot}`}</strong><p>{result === 'win' ? `You win ${formatGems(stake)} fictive gems from the pot.` : result === 'lose' ? 'Try another color combination.' : `${formatGems(stake)} gems refunded.`}</p></div>{result === 'win' && <Check size={18} />}</div>}
              <p className="provably-local"><ShieldCheck size={12} />Random local roll · No real currency or items</p>
            </div>
          </aside>
        </div>
        <footer className="dice-footer"><span><span className="blue-brand-mark"><PawLogo size={22} /></span>pawplay</span><span>Fan-made PS99 demo · No affiliation with BloxyPet, Roblox or BIG Games</span><span>100% fictive gems</span></footer>
      </main>

      {infoModal && <div className="info-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setInfoModal(null) }}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-title"><button className="info-close" aria-label="Close" onClick={() => setInfoModal(null)}><X size={19} /></button><span className="info-modal-icon">{infoModal === 'how' ? <Dices size={27} /> : <ShieldCheck size={27} />}</span><h2 id="info-title">{infoModal === 'how' ? 'How Color Dice Works' : 'Verify the Outcome'}</h2>{infoModal === 'how' ? <><p>Each player picks <strong>2 of the 6 colors</strong>: Red, Orange, Yellow, Green, Blue and Purple.</p><ol><li>Four colored dice are rolled.</li><li>Each die matching one of your colors gives you 1 point.</li><li>The player with the most points wins the pot.</li><li>A tie refunds your fictive stake.</li></ol><p>The opponent and all players in the lobby are simulated.</p></> : <><p>This local demo uses <strong>crypto.getRandomValues()</strong> in your browser to choose each die and each pip.</p><div className="verification-box"><span>ROLL ID</span><strong>{lastRollId || 'No roll yet'}</strong><span>YOUR COLORS</span><strong>{selectedColors.map((color) => COLORS.find((item) => item.id === color)?.label).join(' + ')}</strong><span>BOT COLORS</span><strong>{botColors.length ? botColors.map((color) => COLORS.find((item) => item.id === color)?.label).join(' + ') : 'Hidden until the duel'}</strong><span>LATEST DICE</span><strong>{dice.map((color) => COLORS.find((item) => item.id === color)?.label).join(' · ')}</strong><span>LATEST SCORE</span><strong>{score ? `${score.player}–${score.bot}` : 'No roll yet'}</strong></div><p>There is no server, real wager or blockchain seed. Verification only describes the local demo.</p></>}<button className="info-got-it" onClick={() => setInfoModal(null)}>Got it<Check size={15} /></button></section></div>}
      {toast && <div className="dice-toast"><Check size={16} />{toast}</div>}
    </div>
  )
}

export default App
