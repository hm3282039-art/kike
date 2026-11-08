import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownUp, ArrowRight, BookOpen, Bot, Check, Dices, HelpCircle, History, MessageCircle, Plus, Radio, ShieldCheck, Sparkles, Swords, Trophy, Users, X, Zap } from 'lucide-react'
import { GemIcon, PawLogo } from './components/GameArt'
import { appRoute, assetUrl } from './lib/appUrl'

type DiceColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
type DuelResult = 'win' | 'lose' | 'tie'
type PetTier = 'Huge' | 'Titanic' | 'Gargantuan'
type PetVariant = 'Normal' | 'Golden' | 'Rainbow' | 'Shiny' | 'Golden Shiny' | 'Rainbow Shiny'
type MatchStatus = 'waiting' | 'rolling'
type ActivityKind = 'create' | 'roll' | 'result' | 'chat'

type HistoryEntry = {
  id: number
  opponent: string
  playerScore: number
  botScore: number
  result: DuelResult
  stake: number
  payout: number
  time: string
  rollId: string
}
type OpenMatch = {
  id: number
  bot: string
  pet: PetId
  stake: number
  pets: PetId[]
  level: string
  status: MatchStatus
}
type Activity = { id: number; kind: ActivityKind; text: string; time: string }
type BotProfile = { name: string; pet: PetId }

type PetDefinition = { name: string; tier: PetTier; variant: PetVariant; rap: number }

// Only variants with a recorded RAP of at least 10M Diamonds are used by the game.
const PET_CATALOG = {
  'golden-gargantuan-doge': { name: 'Gargantuan Doge', tier: 'Gargantuan', variant: 'Golden', rap: 187999800000 },
  'shiny-gargantuan-doge': { name: 'Gargantuan Doge', tier: 'Gargantuan', variant: 'Shiny', rap: 850000000000 },
  'gargantuan-evil-scarecrow-pumpkin': { name: 'Gargantuan Evil Scarecrow Pumpkin', tier: 'Gargantuan', variant: 'Normal', rap: 131588146577 },
  'rainbow-gargantuan-skelemelon': { name: 'Gargantuan Skelemelon', tier: 'Gargantuan', variant: 'Rainbow', rap: 1000000000000 },
  'titanic-arcane-cat': { name: 'Titanic Arcane Cat', tier: 'Titanic', variant: 'Normal', rap: 44203658670 },
  'titanic-kitsune-fox': { name: 'Titanic Kitsune Fox', tier: 'Titanic', variant: 'Normal', rap: 17499149616 },
  'golden-titanic-kitsune-fox': { name: 'Titanic Kitsune Fox', tier: 'Titanic', variant: 'Golden', rap: 12825727327 },
  'rainbow-titanic-blue-balloon-cat': { name: 'Titanic Blue Balloon Cat', tier: 'Titanic', variant: 'Rainbow', rap: 102096010240 },
  'shiny-titanic-banana-cat': { name: 'Titanic Banana Cat', tier: 'Titanic', variant: 'Shiny', rap: 23538928227 },
  'shiny-titanic-hologram-cat': { name: 'Titanic Hologram Cat', tier: 'Titanic', variant: 'Shiny', rap: 94500000000 },
  'huge-amethyst-dragon': { name: 'Huge Amethyst Dragon', tier: 'Huge', variant: 'Normal', rap: 614836130 },
  'huge-bread-shiba': { name: 'Huge Bread Shiba', tier: 'Huge', variant: 'Normal', rap: 9158310387 },
  'huge-pumpkin-cat': { name: 'Huge Pumpkin Cat', tier: 'Huge', variant: 'Normal', rap: 655923222 },
  'huge-happy-rock': { name: 'Huge Happy Rock', tier: 'Huge', variant: 'Normal', rap: 40358734 },
  'shiny-huge-happy-rock': { name: 'Huge Happy Rock', tier: 'Huge', variant: 'Shiny', rap: 177371705 },
  'golden-huge-chest-mimic': { name: 'Huge Chest Mimic', tier: 'Huge', variant: 'Golden', rap: 1396174437 },
  'golden-shiny-huge-autumn-chest-mimic': { name: 'Huge Autumn Chest Mimic', tier: 'Huge', variant: 'Golden Shiny', rap: 25000000000 },
  'rainbow-huge-nightfall-pegasus': { name: 'Huge Nightfall Pegasus', tier: 'Huge', variant: 'Rainbow', rap: 3445641172 },
  'rainbow-huge-snowflake-pegasus': { name: 'Huge Snowflake Pegasus', tier: 'Huge', variant: 'Rainbow', rap: 153563193 },
  'rainbow-shiny-huge-snowflake-pegasus': { name: 'Huge Snowflake Pegasus', tier: 'Huge', variant: 'Rainbow Shiny', rap: 908660599176 },
  'huge-rainbow-unicorn': { name: 'Huge Rainbow Unicorn', tier: 'Huge', variant: 'Normal', rap: 651617350 },
} as const satisfies Record<string, PetDefinition>

type PetId = keyof typeof PET_CATALOG
const PET_IDS = Object.keys(PET_CATALOG) as PetId[]

const MIN_STAKE = 10_000_000
const STARTING_BALANCE = 100_000_000_000
const STAKE_LADDER = [10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000, 1_000_000_000, 2_500_000_000, 5_000_000_000]
const QUICK_STAKES = [10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000]

const COLORS: { id: DiceColor; label: string; hex: string; dark: string }[] = [
  { id: 'red', label: 'Red', hex: '#f15467', dark: '#a8243d' },
  { id: 'orange', label: 'Orange', hex: '#f58b37', dark: '#b34c16' },
  { id: 'yellow', label: 'Yellow', hex: '#f1cc43', dark: '#ae7d16' },
  { id: 'green', label: 'Green', hex: '#3fc67d', dark: '#187848' },
  { id: 'blue', label: 'Blue', hex: '#3d8cf3', dark: '#2050a5' },
  { id: 'purple', label: 'Purple', hex: '#9960e8', dark: '#592c9c' },
]

const BOTS: BotProfile[] = [
  { name: 'GargDogeVault', pet: 'golden-gargantuan-doge' },
  { name: 'KitsuneVault', pet: 'golden-titanic-kitsune-fox' },
  { name: 'MikaRolls', pet: 'huge-amethyst-dragon' },
  { name: 'LunaDice', pet: 'rainbow-huge-nightfall-pegasus' },
  { name: 'PxlMaya', pet: 'titanic-arcane-cat' },
  { name: 'HugoKing', pet: 'gargantuan-evil-scarecrow-pumpkin' },
  { name: 'RemyGG', pet: 'huge-pumpkin-cat' },
  { name: 'NinoFR', pet: 'huge-bread-shiba' },
  { name: 'SkyeWin', pet: 'rainbow-huge-snowflake-pegasus' },
  { name: 'TheoDices', pet: 'shiny-huge-happy-rock' },
  { name: 'EvieLuck', pet: 'huge-rainbow-unicorn' },
  { name: 'MarcoPlays', pet: 'shiny-titanic-banana-cat' },
  { name: 'SansaGG', pet: 'shiny-titanic-hologram-cat' },
  { name: 'IlyaTrades', pet: 'golden-huge-chest-mimic' },
  { name: 'NovaByte', pet: 'rainbow-gargantuan-skelemelon' },
  { name: 'ZedTok', pet: 'shiny-gargantuan-doge' },
  { name: 'MeloWins', pet: 'rainbow-shiny-huge-snowflake-pegasus' },
  { name: 'ChestMimic777', pet: 'golden-shiny-huge-autumn-chest-mimic' },
  { name: 'AlexShadow', pet: 'titanic-kitsune-fox' },
  { name: 'JulesXP', pet: 'huge-happy-rock' },
  { name: 'RiriPlays', pet: 'rainbow-titanic-blue-balloon-cat' },
  { name: 'SofiaRNG', pet: 'rainbow-huge-nightfall-pegasus' },
]

const INITIAL_MATCHES: OpenMatch[] = [
  { id: 1, bot: 'GargDogeVault', pet: 'golden-gargantuan-doge', stake: 2_500_000_000, pets: ['golden-gargantuan-doge', 'shiny-gargantuan-doge', 'rainbow-gargantuan-skelemelon'], level: 'Gargantuan lobby', status: 'waiting' },
  { id: 2, bot: 'KitsuneVault', pet: 'golden-titanic-kitsune-fox', stake: 500_000_000, pets: ['golden-titanic-kitsune-fox', 'titanic-arcane-cat', 'rainbow-titanic-blue-balloon-cat'], level: 'Titanic lobby', status: 'waiting' },
  { id: 3, bot: 'MikaRolls', pet: 'huge-amethyst-dragon', stake: 100_000_000, pets: ['huge-amethyst-dragon', 'huge-pumpkin-cat', 'huge-rainbow-unicorn'], level: 'Relaxed Huge game', status: 'waiting' },
  { id: 4, bot: 'LunaDice', pet: 'rainbow-huge-snowflake-pegasus', stake: 250_000_000, pets: ['rainbow-huge-snowflake-pegasus', 'rainbow-huge-nightfall-pegasus', 'rainbow-shiny-huge-snowflake-pegasus'], level: 'Rainbow collectors', status: 'waiting' },
  { id: 5, bot: 'PxlMaya', pet: 'titanic-arcane-cat', stake: 1_000_000_000, pets: ['titanic-arcane-cat', 'shiny-titanic-hologram-cat', 'shiny-titanic-banana-cat'], level: 'High-roller Titanic', status: 'waiting' },
  { id: 6, bot: 'HugoKing', pet: 'gargantuan-evil-scarecrow-pumpkin', stake: 5_000_000_000, pets: ['gargantuan-evil-scarecrow-pumpkin', 'golden-gargantuan-doge', 'rainbow-gargantuan-skelemelon'], level: 'Gargantuan high-roller', status: 'waiting' },
  { id: 7, bot: 'RemyGG', pet: 'huge-happy-rock', stake: 10_000_000, pets: ['huge-happy-rock', 'shiny-huge-happy-rock', 'golden-huge-chest-mimic'], level: '10M starter duel', status: 'waiting' },
  { id: 8, bot: 'NinoFR', pet: 'huge-bread-shiba', stake: 50_000_000, pets: ['huge-bread-shiba', 'huge-pumpkin-cat', 'huge-amethyst-dragon'], level: 'Friendly Huge game', status: 'waiting' },
]

const PIP_MAP: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
}
const SHORT_VARIANTS: Record<PetVariant, string> = { Normal: '', Golden: 'GOLD', Rainbow: 'RAINBOW', Shiny: 'SHINY', 'Golden Shiny': 'GOLD ✦', 'Rainbow Shiny': 'RAIN ✦' }
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const formatCompact = (value: number) => compact.format(value)
const timeNow = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

function randomInt(max: number) {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return Math.floor((array[0] / (0xffffffff + 1)) * max)
}
function randomItem<T>(items: T[]): T { return items[randomInt(items.length)] }

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) as T : initialValue
    } catch { return initialValue }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage is optional. */ }
  }, [key, value])
  return [value, setValue] as const
}

function PetThumbnail({ petId }: { petId: PetId }) {
  const pet = PET_CATALOG[petId]
  const variantClass = pet.variant.toLowerCase().replaceAll(' ', '-')
  return (
    <span className={`pet-thumbnail tier-${pet.tier.toLowerCase()} variant-${variantClass}`} tabIndex={0} aria-label={`${pet.variant} ${pet.name}, RAP ${formatCompact(pet.rap)}`}>
      <img src={assetUrl(`images/pets/${petId}.png`)} alt="" draggable={false} />
      <span className="pet-tier-tag">{pet.tier === 'Gargantuan' ? 'GARG' : pet.tier === 'Titanic' ? 'TITA' : 'HUGE'}</span>
      {pet.variant !== 'Normal' && <span className="pet-variant-tag">{SHORT_VARIANTS[pet.variant]}</span>}
      <span className="pet-tooltip" aria-hidden="true"><strong>{pet.name}</strong><small>{pet.tier} · {pet.variant}</small><small>RAP {formatCompact(pet.rap)} Diamonds</small></span>
    </span>
  )
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

function createBotMatch(id: number, excludedNames: string[]): OpenMatch {
  const availableBots = BOTS.filter((bot) => !excludedNames.includes(bot.name))
  const bot = randomItem(availableBots.length ? availableBots : BOTS)
  const pet = randomItem(PET_IDS)
  const otherPets = PET_IDS.filter((id) => id !== pet)
  const second = randomItem(otherPets)
  const third = randomItem(otherPets.filter((id) => id !== second))
  return {
    id,
    bot: bot.name,
    pet,
    stake: randomItem(STAKE_LADDER),
    pets: [pet, second, third],
    level: `${PET_CATALOG[pet].tier} · looking for a game`,
    status: 'waiting',
  }
}

export default function App() {
  const [balance, setBalance] = useStoredState('pawplay-live-balance-v1', STARTING_BALANCE)
  const [history, setHistory] = useStoredState<HistoryEntry[]>('pawplay-live-history-v1', [])
  const [matches, setMatches] = useState<OpenMatch[]>(INITIAL_MATCHES)
  const matchesRef = useRef<OpenMatch[]>(INITIAL_MATCHES)
  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, kind: 'chat', text: 'MikaRolls: GG everyone — good luck in the next round!', time: timeNow() },
    { id: 2, kind: 'create', text: 'RemyGG opened a friendly 10M duel.', time: timeNow() },
    { id: 3, kind: 'roll', text: 'LunaDice is picking two lucky colors…', time: timeNow() },
  ])
  const [onlineCount, setOnlineCount] = useState(21)
  const [sortDescending, setSortDescending] = useState(true)
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open')
  const [selectedColors, setSelectedColors] = useState<DiceColor[]>(['purple', 'yellow'])
  const [botColors, setBotColors] = useState<DiceColor[]>([])
  const [dice, setDice] = useState<DiceColor[]>(['purple', 'red', 'green', 'blue'])
  const [pips, setPips] = useState([5, 3, 6, 2])
  const [stake, setStake] = useState(50_000_000)
  const [stakeInput, setStakeInput] = useState('50M')
  const [opponent, setOpponent] = useState('Arcane Bot')
  const [opponentPet, setOpponentPet] = useState<PetId>('titanic-arcane-cat')
  const [duelPets, setDuelPets] = useState<PetId[]>(['titanic-arcane-cat', 'huge-amethyst-dragon', 'golden-huge-chest-mimic'])
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null)
  const selectedMatchRef = useRef<number | null>(null)
  const [duelModalOpen, setDuelModalOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [score, setScore] = useState<{ player: number; bot: number } | null>(null)
  const [result, setResult] = useState<DuelResult | null>(null)
  const [lastRollId, setLastRollId] = useState('')
  const [infoModal, setInfoModal] = useState<'how' | 'verify' | null>(null)
  const [toast, setToast] = useState('')
  const nextMatchId = useRef(100)
  const nextActivityId = useRef(10)
  const battleRef = useRef<{ id: number; opponent: string } | null>(null)
  const rollIntervalRef = useRef<number | null>(null)
  const rollTimeoutsRef = useRef<number[]>([])
  const revealedRef = useRef(0)

  const commitMatches = (next: OpenMatch[]) => {
    matchesRef.current = next
    setMatches(next)
  }
  const addActivity = (kind: ActivityKind, text: string) => {
    const entry = { id: nextActivityId.current++, kind, text, time: timeNow() }
    setActivities((current) => [entry, ...current].slice(0, 8))
  }
  const changeStake = (value: number) => {
    const safe = Math.max(0, Math.round(value))
    setStake(safe)
    setStakeInput(safe >= 1_000_000_000 ? `${Number((safe / 1_000_000_000).toFixed(2))}B` : `${Number((safe / 1_000_000).toFixed(2))}M`)
  }
  const parseStake = (raw: string) => {
    const match = raw.trim().toLowerCase().replaceAll(',', '.').match(/^(\d+(?:\.\d+)?)\s*([kmbt])?$/)
    if (!match) return
    const suffix = match[2] || ''
    const multiplier = suffix === 't' ? 1e12 : suffix === 'b' ? 1e9 : suffix === 'm' ? 1e6 : suffix === 'k' ? 1e3 : 1
    const value = Number(match[1]) * multiplier
    if (Number.isFinite(value)) setStake(Math.round(value))
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (battleRef.current) {
        const battle = battleRef.current
        battleRef.current = null
        const match = matchesRef.current.find((item) => item.id === battle.id)
        if (match) {
          const firstScore = randomInt(5)
          const secondScore = randomInt(5)
          const winner = firstScore === secondScore ? null : firstScore > secondScore ? match.bot : battle.opponent
          addActivity('result', winner
            ? `${winner} won ${formatCompact(match.stake * 2)} against ${winner === match.bot ? battle.opponent : match.bot} · ${Math.max(firstScore, secondScore)}–${Math.min(firstScore, secondScore)}`
            : `${match.bot} and ${battle.opponent} tied ${firstScore}–${secondScore} · stakes refunded`)
          commitMatches(matchesRef.current.filter((item) => item.id !== battle.id))
        }
        return
      }

      const available = matchesRef.current.filter((item) => item.status === 'waiting' && item.id !== selectedMatchRef.current)
      if (available.length >= 3 && randomInt(100) < 64) {
        const match = randomItem(available)
        const opponent = randomItem(BOTS.filter((bot) => bot.name !== match.bot)).name
        battleRef.current = { id: match.id, opponent }
        commitMatches(matchesRef.current.map((item) => item.id === match.id ? { ...item, status: 'rolling' } : item))
        addActivity('roll', `${opponent} accepted ${match.bot}’s duel · ${formatCompact(match.stake)} each. Dice are rolling!`)
        return
      }

      if (matchesRef.current.length < 10) {
        const match = createBotMatch(nextMatchId.current++, matchesRef.current.map((item) => item.bot))
        commitMatches([match, ...matchesRef.current])
        const prompts = [
          `${match.bot}: anyone for a ${formatCompact(match.stake)} duel?`,
          `${match.bot} is looking for an opponent · ${formatCompact(match.stake)} entry.`,
          `${match.bot}: I’m in for ${formatCompact(match.stake)}. Who wants to roll?`,
        ]
        addActivity('create', randomItem(prompts))
      } else if (randomInt(100) < 35) {
        addActivity('chat', randomItem([
          'MikaRolls: that last roll was way too close 😅',
          'LunaDice: purple and yellow are carrying me today!',
          'NinoFR: GG, rematch after this one?',
          'PxlMaya: anyone up for a Titanic-only round?',
        ]))
      }
      setOnlineCount((current) => Math.max(17, Math.min(BOTS.length, current + randomItem([-1, 0, 0, 1]))))
    }, 4200)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setInfoModal(null)
      if (!rolling) {
        setDuelModalOpen(false)
        selectedMatchRef.current = null
        setSelectedMatch(null)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [rolling])

  useEffect(() => {
    if (!duelModalOpen && !infoModal) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [duelModalOpen, infoModal])

  useEffect(() => () => {
    if (rollIntervalRef.current) window.clearInterval(rollIntervalRef.current)
    rollTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
  }, [])

  const sortedMatches = useMemo(() => [...matches].sort((a, b) => sortDescending ? b.stake - a.stake : a.stake - b.stake), [matches, sortDescending])
  const totalValue = matches.reduce((sum, match) => sum + match.stake * 2, 0)
  const liveBattles = matches.filter((match) => match.status === 'rolling').length

  const resetDuelState = () => {
    setResult(null)
    setScore(null)
    setBotColors([])
    setRevealedCount(0)
    revealedRef.current = 0
    setSelectedColors(['purple', 'yellow'])
  }
  const openCreateDuel = () => {
    selectedMatchRef.current = null
    setSelectedMatch(null)
    setOpponent('Arcane Bot')
    setOpponentPet('titanic-arcane-cat')
    setDuelPets(['titanic-arcane-cat', 'huge-amethyst-dragon', 'golden-huge-chest-mimic'])
    changeStake(50_000_000)
    resetDuelState()
    setDuelModalOpen(true)
  }
  const joinMatch = (match: OpenMatch) => {
    if (rolling || match.status !== 'waiting') return
    selectedMatchRef.current = match.id
    setSelectedMatch(match.id)
    setOpponent(match.bot)
    setOpponentPet(match.pet)
    setDuelPets(match.pets)
    changeStake(match.stake)
    resetDuelState()
    setDuelModalOpen(true)
  }
  const closeDuelModal = () => {
    if (rolling) return
    setDuelModalOpen(false)
    selectedMatchRef.current = null
    setSelectedMatch(null)
  }
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

  const startDuel = () => {
    if (rolling || selectedColors.length !== 2) return
    if (stake < MIN_STAKE) {
      setToast('The minimum duel stake is 10M fictive Diamonds.')
      return
    }
    if (stake > balance) {
      setToast('Not enough fictive Diamonds — use the free refill.')
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
    setLastRollId(rollId)
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
        rollTimeoutsRef.current.push(window.setTimeout(() => {
          setRolling(false)
          setScore({ player: playerScore, bot: botScore })
          setResult(duelResult)
          setBalance((current) => current + payout)
          setHistory((current) => [{ id: Date.now(), opponent, playerScore, botScore, result: duelResult, stake, payout, time: timeNow(), rollId }, ...current].slice(0, 30))
          if (selectedMatchRef.current !== null) commitMatches(matchesRef.current.filter((item) => item.id !== selectedMatchRef.current))
          selectedMatchRef.current = null
          addActivity('result', `You ${duelResult === 'win' ? 'won' : duelResult === 'lose' ? 'lost' : 'tied'} against ${opponent} · ${formatCompact(stake * 2)} pot`)
        }, 330))
      }
    }, delay))
  }

  const refill = () => {
    setBalance((current) => current + 25_000_000_000)
    setToast('25B free fictive Diamonds added.')
  }
  const activityIcon = (kind: ActivityKind) => kind === 'result' ? <Trophy size={13} /> : kind === 'roll' ? <Dices size={13} /> : kind === 'chat' ? <MessageCircle size={13} /> : <Zap size={13} />

  return (
    <div className="dice-app live-dice-app">
      <header className="dice-topbar">
        <button className="dice-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="blue-brand-mark"><PawLogo size={37} /></span><span>paw<span>play</span><small>COLOR DICE</small></span></button>
        <nav className="dice-game-nav" aria-label="Main navigation"><span className="dice-header-game"><Dices size={17} /><span>Color Dice Duels</span></span><a className="dice-index-link" href={appRoute('pets')}><BookOpen size={15} /><span>Pet Index</span></a></nav>
        <div className="dice-header-right"><span className="demo-label"><ShieldCheck size={14} />100% FICTIVE</span><div className="gems-balance"><GemIcon size={24} /><span><strong>{formatCompact(balance)}</strong><small>Fictive Diamonds</small></span><button aria-label="Free Diamonds refill" onClick={refill}><Plus size={16} /></button></div></div>
      </header>

      <main className="dice-main live-dice-main">
        <section className="dice-page-heading">
          <div className="dice-title-wrap"><span className="blue-dice-icon"><Dices size={28} /></span><div><span className="live-eyebrow"><span className="online-dot" />SIMULATED LIVE LOBBY</span><h1>Color Dice Duels</h1><p>Pick two colors, roll four dice and challenge the simulated lobby.</p></div></div>
          <div className="dice-page-actions"><button className="create-duel-open" onClick={openCreateDuel}><Plus size={17} />Create Duel</button><button onClick={() => setInfoModal('how')}><HelpCircle size={15} />How It Works</button><button onClick={() => setInfoModal('verify')}><ShieldCheck size={15} />Verify</button></div>
        </section>

        <section className="dice-stats-bar live-stats-bar">
          <div><span className="stat-icon blue"><Swords size={18} /></span><span>Open Duels<strong>{matches.length}</strong></span></div>
          <div><span className="stat-icon green"><Users size={18} /></span><span>Bots Online<strong>{onlineCount}</strong></span></div>
          <div><span className="stat-icon cyan"><GemIcon size={21} /></span><span>Open Pot Value<strong>{formatCompact(totalValue)}</strong></span></div>
          <div><span className="stat-icon purple"><Sparkles size={18} /></span><span>Eligible Pets<strong>{PET_IDS.length} <small>RAP ≥10M</small></strong></span></div>
          <span className="local-game-note"><span className="online-dot" />{liveBattles ? `${liveBattles} live bot ${liveBattles === 1 ? 'battle' : 'battles'}` : 'Bots ready to play'}</span>
        </section>

        <section className="live-server-panel" aria-label="Simulated server activity">
          <div className="live-server-title"><span><Radio size={15} />Live server</span><small>Human-like bots · simulated locally</small></div>
          <div className="live-event-list">{activities.slice(0, 3).map((activity) => <div className={`live-event ${activity.kind}`} key={activity.id}><span>{activityIcon(activity.kind)}</span><p>{activity.text}</p><time>{activity.time}</time></div>)}</div>
          <div className="bot-presence">{BOTS.slice(0, 5).map((bot) => <span key={bot.name} title={`${bot.name} · online`}><img src={assetUrl(`images/pets/${bot.pet}.png`)} alt="" /><i /></span>)}<small>+{Math.max(0, onlineCount - 5)} online</small></div>
        </section>

        <section className="duel-lobby-panel live-lobby-panel">
          <div className="lobby-tabs"><button className={activeTab === 'open' ? 'active' : ''} onClick={() => setActiveTab('open')}><Swords size={15} />Open Duels<span>{matches.length}</span></button><button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}><History size={15} />Your History<span>{history.length}</span></button><button className="sort-button" onClick={() => setSortDescending((current) => !current)}><ArrowDownUp size={14} />{sortDescending ? 'Highest stake' : 'Lowest stake'}</button></div>
          {activeTab === 'open' ? <>
            <div className="lobby-table-head"><span>Players</span><span>Pets in the pot · RAP ≥10M</span><span>Stake / Pot</span><span>Action</span></div>
            <div className="live-match-list">{sortedMatches.map((match) => <div className={`open-match-row ${match.status === 'rolling' ? 'match-in-progress' : ''}`} key={match.id}>
              <div className="match-players"><span className={`match-avatar tier-${PET_CATALOG[match.pet].tier.toLowerCase()}`}><img src={assetUrl(`images/pets/${match.pet}.png`)} alt={PET_CATALOG[match.pet].name} /><i /></span><div><strong>{match.bot}</strong><span><span className="online-dot" />{match.status === 'rolling' ? 'Rolling against another bot' : 'Online · waiting for opponent'}</span></div></div>
              <div className="match-pets">{match.pets.map((pet) => <PetThumbnail key={pet} petId={pet} />)}<small>{match.level}</small></div>
              <div className="match-value"><strong><GemIcon size={18} />{formatCompact(match.stake)}</strong><span>Pot {formatCompact(match.stake * 2)}</span></div>
              {match.status === 'waiting' ? <button className="join-duel-button" onClick={() => joinMatch(match)}>Join<ArrowRight size={14} /></button> : <span className="match-live-pill"><Radio size={12} />LIVE</span>}
            </div>)}</div>
          </> : <div className="history-list">{history.length === 0 ? <div className="empty-history"><History size={32} /><h3>No duels yet</h3><p>Join a bot or create your own duel to see your results here.</p><button onClick={openCreateDuel}><Plus size={14} />Create your first duel</button></div> : history.map((entry) => <div className="history-row" key={entry.id}><span className={`history-result ${entry.result}`}>{entry.result === 'win' ? 'WON' : entry.result === 'lose' ? 'LOST' : 'TIE'}</span><div><strong>You vs {entry.opponent}</strong><span>{entry.time} · Score {entry.playerScore}–{entry.botScore} · {entry.rollId}</span></div><span className="history-stake"><GemIcon size={15} />{formatCompact(entry.stake)}</span><strong className={`history-payout ${entry.result}`}>{entry.result === 'win' ? '+' : entry.result === 'lose' ? '−' : ''}{entry.result === 'tie' ? 'Refunded' : formatCompact(entry.result === 'win' ? entry.payout - entry.stake : entry.stake)}</strong></div>)}</div>}
          <div className="lobby-bottom-note"><Bot size={13} />Bots create, accept and finish their own duels every few seconds. Minimum stake 10M · simulated opponents, no real players.</div>
        </section>
      </main>

      {duelModalOpen && <div className="duel-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDuelModal() }}>
        <section className="duel-modal" role="dialog" aria-modal="true" aria-labelledby="duel-modal-title">
          <header className="duel-modal-header"><div><span className="duel-modal-kicker"><span className="online-dot" />{selectedMatch ? 'BOT CHALLENGE ACCEPTED' : 'NEW LOCAL DUEL'}</span><h2 id="duel-modal-title">{selectedMatch ? `Play ${opponent}` : 'Create a Duel'}</h2><p>Two colors each, four dice, one winner. Minimum 10M.</p></div><button className="duel-modal-close" aria-label="Close duel" onClick={closeDuelModal} disabled={rolling}><X size={20} /></button></header>
          <div className="duel-modal-body">
            <div className="duel-arena-column">
              <div className="arena-player-row"><div className="arena-player"><span className="arena-avatar tier-huge"><img src={assetUrl('images/pets/huge-amethyst-dragon.png')} alt="Your PS99 pet" /></span><div><span>YOU</span><div className="arena-color-dots">{selectedColors.map((color) => <i key={color} className={`color-dot-${color}`} />)}</div></div><strong>{score?.player ?? '–'}</strong></div><span className="arena-vs">VS</span><div className="arena-player opponent"><strong>{score?.bot ?? '–'}</strong><div><span>{opponent.toUpperCase()}</span><div className="arena-color-dots">{botColors.length ? botColors.map((color) => <i key={color} className={`color-dot-${color}`} />) : <small>? &nbsp; ?</small>}</div></div><span className={`arena-avatar tier-${PET_CATALOG[opponentPet].tier.toLowerCase()}`}><img src={assetUrl(`images/pets/${opponentPet}.png`)} alt={`${PET_CATALOG[opponentPet].variant} ${PET_CATALOG[opponentPet].name}`} /><i /></span></div></div>
              <div className="match-pets modal-duel-pets">{duelPets.map((pet) => <PetThumbnail key={pet} petId={pet} />)}<span>Featured pets · all RAP ≥10M</span></div>
              <div className={`dice-arena modal-dice-arena ${rolling ? 'is-rolling' : ''}`}><div className="dice-results">{dice.map((color, index) => <ColorDie key={index} color={color} value={pips[index]} index={index} rolling={rolling && index >= revealedCount} playerColors={selectedColors} botColors={botColors} />)}</div><div className="arena-status"><span className="online-dot" />{rolling ? `Rolling dice · ${revealedCount}/4 revealed` : result ? 'Duel complete — check the result below' : 'Most matching colors wins the pot'}</div></div>
              {result && <div className={`duel-result-banner ${result}`}><Trophy size={23} /><div><strong>{result === 'win' ? 'You won the duel!' : result === 'lose' ? `${opponent} wins this one` : 'It’s a tie!'}</strong><span>Final score {score?.player}–{score?.bot} · {result === 'win' ? `+${formatCompact(stake)} profit` : result === 'tie' ? 'Stake refunded' : `-${formatCompact(stake)}`}</span></div></div>}
            </div>

            <div className="duel-setup-column">
              <div className="color-pick-section"><div className="stake-heading"><label>Pick your 2 colors</label><span>{selectedColors.length}/2</span></div><div className="color-picker">{COLORS.map((color) => <button key={color.id} className={`color-option ${selectedColors.includes(color.id) ? 'selected' : ''} ${rolling ? 'disabled' : ''}`} onClick={() => toggleColor(color.id)} disabled={rolling}><span className={`color-dot-${color.id}`} />{color.label}{selectedColors.includes(color.id) && <small>{selectedColors.indexOf(color.id) + 1}</small>}</button>)}</div></div>
              <div className="stake-section"><div className="stake-heading"><label htmlFor="stake-input">Your stake</label><span>Pot <strong><GemIcon size={14} />{formatCompact(stake * 2)}</strong></span></div><div className="stake-input"><GemIcon size={23} /><input id="stake-input" type="text" inputMode="decimal" value={stakeInput} disabled={rolling} onChange={(event) => { setStakeInput(event.target.value); parseStake(event.target.value) }} onBlur={() => changeStake(stake)} aria-describedby="stake-help" /><button disabled={rolling} onClick={() => changeStake(Math.max(MIN_STAKE, Math.floor(stake / 2)))}>½</button><button disabled={rolling} onClick={() => changeStake(stake * 2)}>2×</button><button disabled={rolling} onClick={() => changeStake(balance)}>MAX</button></div><div className="stake-help" id="stake-help">Use K, M, B or T · minimum 10M · balance {formatCompact(balance)}</div><div className="quick-stakes">{QUICK_STAKES.map((amount) => <button key={amount} disabled={rolling || balance < amount} className={stake === amount ? 'active' : ''} onClick={() => changeStake(amount)}><GemIcon size={12} />{formatCompact(amount)}</button>)}</div></div>
              <div className="opponent-note"><Bot size={17} /><div><strong>{opponent}</strong><span>Simulated bot · two hidden colors chosen fairly at roll time.</span></div></div>
              <button className="roll-dice-button" disabled={rolling || selectedColors.length !== 2 || stake < MIN_STAKE || stake > balance} onClick={startDuel}><Dices size={20} /><span>{rolling ? 'Rolling Dice…' : result ? 'Roll Again' : 'Roll 4 Dice'}</span><span className="roll-pot"><GemIcon size={17} />{formatCompact(stake * 2)}</span></button>
              {stake < MIN_STAKE && <span className="stake-error">Enter at least 10M to start this duel.</span>}
              <p className="random-local-note"><ShieldCheck size={12} />Random local roll · no real currency, pets or players.</p>
            </div>
          </div>
        </section>
      </div>}

      {infoModal && <div className="info-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setInfoModal(null) }}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-title"><button className="info-close" aria-label="Close" onClick={() => setInfoModal(null)}><X size={19} /></button><span className="info-modal-icon">{infoModal === 'how' ? <Dices size={27} /> : <ShieldCheck size={27} />}</span><h2 id="info-title">{infoModal === 'how' ? 'How Color Dice Works' : 'Verify the Outcome'}</h2>{infoModal === 'how' ? <><p>Each player picks <strong>2 of the 6 colors</strong>. Four colored dice are rolled and each matching die gives one point.</p><ol><li>Join a waiting bot or use the small Create Duel button.</li><li>Choose a stake of at least 10M fictive Diamonds.</li><li>The highest score wins the pot; a tie refunds both stakes.</li></ol><p>Bots also accept and finish their own games in the live lobby. Everyone is simulated locally.</p></> : <><p>This local demo uses <strong>crypto.getRandomValues()</strong> for every die, pip and bot decision.</p><div className="verification-box"><span>ROLL ID</span><strong>{lastRollId || 'No roll yet'}</strong><span>YOUR COLORS</span><strong>{selectedColors.map((color) => COLORS.find((item) => item.id === color)?.label).join(' + ')}</strong><span>BOT COLORS</span><strong>{botColors.length ? botColors.map((color) => COLORS.find((item) => item.id === color)?.label).join(' + ') : 'Hidden until the duel'}</strong><span>LATEST SCORE</span><strong>{score ? `${score.player}–${score.bot}` : 'No roll yet'}</strong></div><p>There is no real server, wager, blockchain seed or Roblox inventory.</p></>}<button className="info-got-it" onClick={() => setInfoModal(null)}>Got it<Check size={15} /></button></section></div>}
      {toast && <div className="dice-toast" role="status">{toast}</div>}
    </div>
  )
}
