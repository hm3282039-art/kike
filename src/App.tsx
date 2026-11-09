import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowDownUp, ArrowRight, BookOpen, Bot, Check, Crown, Dices, HelpCircle, History, MessageCircle, Plus, Radio, ShieldCheck, ShieldX, Sparkles, Spade, Swords, Trophy, Users, X, Zap } from 'lucide-react'
import { GemIcon, PawLogo } from './components/GameArt'
import { appRoute, assetUrl } from './lib/appUrl'
import { DIAMOND_REFILL, useDiamondBalance, useStoredState } from './lib/balance'

type DiceColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
type DuelResult = 'win' | 'lose' | 'tie'
type PetTier = 'Huge' | 'Titanic' | 'Gargantuan'
type PetVariant = 'Normal' | 'Golden' | 'Rainbow' | 'Shiny' | 'Golden Shiny' | 'Rainbow Shiny'
type MatchStatus = 'waiting' | 'rolling'
type ActivityKind = 'create' | 'roll' | 'result' | 'chat'

type LobbyViewTransition = {
  finished: Promise<void>
}

type DiceRound = { player: number; bot: number }
type HistoryEntry = {
  rounds?: DiceRound[]
  id: number
  opponent: string
  playerScore: number
  botScore: number
  result: DuelResult
  stake: number
  payout: number
  petValue?: number
  sideValue?: number
  potValue?: number
  petCount?: number
  pets?: PetId[]
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
  challenger?: string
}
type Activity = { id: number; kind: ActivityKind; text: string; time: string }
type BotStyle = 'friendly' | 'competitive' | 'quiet' | 'high-roller'
type BotRisk = 'low' | 'medium' | 'high'
type BotProfile = {
  name: string
  pet: PetId
  style: BotStyle
  risk: BotRisk
  favoriteColors: [DiceColor, DiceColor]
}
type BotBattle = { id: number; opponent: string; resolveAt: number }

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
const getPetValue = (pets: PetId[]) => pets.reduce((sum, pet) => sum + PET_CATALOG[pet].rap, 0)
const getSideValue = (stake: number, pets: PetId[]) => stake + getPetValue(pets)
const getPotValue = (stake: number, pets: PetId[]) => getSideValue(stake, pets) * 2

const MIN_STAKE = 10_000_000
const STAKE_LADDER = [10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000, 1_000_000_000, 2_500_000_000, 5_000_000_000]
const RISK_STAKES: Record<BotRisk, number[]> = {
  low: STAKE_LADDER.slice(0, 4),
  medium: STAKE_LADDER.slice(2, 7),
  high: STAKE_LADDER.slice(5),
}
const QUICK_STAKES = STAKE_LADDER

const COLORS: { id: DiceColor; label: string; hex: string; dark: string }[] = [
  { id: 'red', label: 'Rouge', hex: '#f15467', dark: '#a8243d' },
  { id: 'orange', label: 'Orange', hex: '#f58b37', dark: '#b34c16' },
  { id: 'yellow', label: 'Jaune', hex: '#f1cc43', dark: '#ae7d16' },
  { id: 'green', label: 'Vert', hex: '#3fc67d', dark: '#187848' },
  { id: 'blue', label: 'Bleu', hex: '#3d8cf3', dark: '#2050a5' },
  { id: 'purple', label: 'Violet', hex: '#9960e8', dark: '#592c9c' },
]

const BOTS: BotProfile[] = [
  { name: 'GargDogeVault', pet: 'golden-gargantuan-doge', style: 'high-roller', risk: 'high', favoriteColors: ['yellow', 'purple'] },
  { name: 'KitsuneVault', pet: 'golden-titanic-kitsune-fox', style: 'quiet', risk: 'medium', favoriteColors: ['orange', 'blue'] },
  { name: 'MikaRolls', pet: 'huge-amethyst-dragon', style: 'friendly', risk: 'low', favoriteColors: ['purple', 'green'] },
  { name: 'LunaDice', pet: 'rainbow-huge-nightfall-pegasus', style: 'friendly', risk: 'medium', favoriteColors: ['purple', 'yellow'] },
  { name: 'PxlMaya', pet: 'titanic-arcane-cat', style: 'competitive', risk: 'high', favoriteColors: ['blue', 'red'] },
  { name: 'HugoKing', pet: 'gargantuan-evil-scarecrow-pumpkin', style: 'high-roller', risk: 'high', favoriteColors: ['orange', 'yellow'] },
  { name: 'RemyGG', pet: 'huge-pumpkin-cat', style: 'friendly', risk: 'low', favoriteColors: ['green', 'orange'] },
  { name: 'NinoFR', pet: 'huge-bread-shiba', style: 'friendly', risk: 'low', favoriteColors: ['yellow', 'blue'] },
  { name: 'SkyeWin', pet: 'rainbow-huge-snowflake-pegasus', style: 'quiet', risk: 'medium', favoriteColors: ['blue', 'purple'] },
  { name: 'TheoDices', pet: 'shiny-huge-happy-rock', style: 'friendly', risk: 'low', favoriteColors: ['red', 'green'] },
  { name: 'EvieLuck', pet: 'huge-rainbow-unicorn', style: 'friendly', risk: 'low', favoriteColors: ['purple', 'red'] },
  { name: 'MarcoPlays', pet: 'shiny-titanic-banana-cat', style: 'competitive', risk: 'medium', favoriteColors: ['yellow', 'green'] },
  { name: 'SansaGG', pet: 'shiny-titanic-hologram-cat', style: 'quiet', risk: 'medium', favoriteColors: ['blue', 'purple'] },
  { name: 'IlyaTrades', pet: 'golden-huge-chest-mimic', style: 'friendly', risk: 'low', favoriteColors: ['orange', 'green'] },
  { name: 'NovaByte', pet: 'rainbow-gargantuan-skelemelon', style: 'high-roller', risk: 'high', favoriteColors: ['red', 'purple'] },
  { name: 'ZedTok', pet: 'shiny-gargantuan-doge', style: 'competitive', risk: 'high', favoriteColors: ['blue', 'yellow'] },
  { name: 'MeloWins', pet: 'rainbow-shiny-huge-snowflake-pegasus', style: 'quiet', risk: 'high', favoriteColors: ['purple', 'blue'] },
  { name: 'ChestMimic777', pet: 'golden-shiny-huge-autumn-chest-mimic', style: 'competitive', risk: 'medium', favoriteColors: ['orange', 'red'] },
  { name: 'AlexShadow', pet: 'titanic-kitsune-fox', style: 'quiet', risk: 'medium', favoriteColors: ['blue', 'red'] },
  { name: 'JulesXP', pet: 'huge-happy-rock', style: 'friendly', risk: 'low', favoriteColors: ['green', 'yellow'] },
  { name: 'RiriPlays', pet: 'rainbow-titanic-blue-balloon-cat', style: 'competitive', risk: 'medium', favoriteColors: ['red', 'blue'] },
  { name: 'SofiaRNG', pet: 'rainbow-huge-nightfall-pegasus', style: 'friendly', risk: 'medium', favoriteColors: ['purple', 'orange'] },
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
const fullNumber = new Intl.NumberFormat('en-US')
const formatCompact = (value: number) => compact.format(value)
const CONFETTI_COLORS = ['#ffd76a', '#63dea5', '#6fb5ff', '#f38aa1', '#b994ff']
const timeNow = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

function randomInt(max: number) {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return Math.floor((array[0] / (0xffffffff + 1)) * max)
}
function randomItem<T>(items: T[]): T { return items[randomInt(items.length)] }
function randomColors(): DiceColor[] {
  const first = randomInt(COLORS.length)
  const second = (first + 1 + randomInt(COLORS.length - 1)) % COLORS.length
  return [COLORS[first].id, COLORS[second].id]
}
function chooseBotColors(name: string, excluded: DiceColor[] = []): DiceColor[] {
  if (excluded.length) {
    const available = COLORS.map(color => color.id).filter(color => !excluded.includes(color))
    const first = available.splice(randomInt(available.length), 1)[0]
    return [first, available[randomInt(available.length)]]
  }
  const bot = BOTS.find((profile) => profile.name === name)
  if (!bot || randomInt(100) < 30) return randomColors()
  const first = bot.favoriteColors[randomInt(2)]
  if (randomInt(100) < 68) return [first, bot.favoriteColors[1] === first ? bot.favoriteColors[0] : bot.favoriteColors[1]]
  return [first, randomColors().find((color) => color !== first) || bot.favoriteColors[0]]
}
function fourRandomColors() { return Array.from({ length: 4 }, () => COLORS[randomInt(COLORS.length)].id) }
function scoreColors(dice: DiceColor[], colors: DiceColor[]) { return dice.filter((color) => colors.includes(color)).length }

function PetThumbnail({ petId }: { petId: PetId }) {
  const pet = PET_CATALOG[petId]
  const variantClass = pet.variant.toLowerCase().replaceAll(' ', '-')
  return (
    <span className={`pet-thumbnail tier-${pet.tier.toLowerCase()} variant-${variantClass}`} tabIndex={0} aria-label={`${pet.variant} ${pet.name}, exact RAP ${fullNumber.format(pet.rap)} Diamonds`}>
      <img src={assetUrl(`images/pets/${petId}.png`)} alt="" draggable={false} />
      <span className="pet-tier-tag">{pet.tier === 'Gargantuan' ? 'GARG' : pet.tier === 'Titanic' ? 'TITA' : 'HUGE'}</span>
      {pet.variant !== 'Normal' && <span className="pet-variant-tag">{SHORT_VARIANTS[pet.variant]}</span>}
      <span className="pet-tooltip" aria-hidden="true"><strong>{pet.name}</strong><small>{pet.tier} · {pet.variant}</small><small>RAP {formatCompact(pet.rap)} Diamonds</small><small className="pet-tooltip-full">Exact RAP · {fullNumber.format(pet.rap)} Diamonds</small></span>
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
  const playerPoint = !rolling && botColors.length > 0 && playerColors.includes(color)
  const botPoint = !rolling && botColors.length > 0 && botColors.includes(color)
  const landed = !rolling && botColors.length > 0
  const scoreClass = playerPoint && botPoint ? 'scores-both' : playerPoint ? 'scores-player' : botPoint ? 'scores-bot' : ''
  return (
    <div className={`die-result die-result-${index} ${rolling ? 'rolling' : ''} ${landed ? 'landed' : ''} ${scoreClass}`}>
      <div className={`color-die color-die-${color}`} role="img" aria-label={`${definition.label} die showing ${value}${playerPoint ? ', one point for you' : ''}${botPoint ? ', one point for the bot' : ''}`} style={{ '--die-color': definition.hex, '--die-dark': definition.dark } as React.CSSProperties}>
        <div className="die-pips">{Array.from({ length: 9 }, (_, pip) => <span key={pip} className={PIP_MAP[value].includes(pip) ? 'visible' : ''} />)}</div>
        <span className="die-shine" />
      </div>
      <span className="die-color-name">{definition.label}</span>
      {!rolling && botColors.length > 0 && <div className="die-owner-tags">{playerPoint && <span className="owner-you">YOU +1</span>}{botPoint && <span className="owner-bot">BOT +1</span>}</div>}
    </div>
  )
}

function createBotMatch(id: number, excludedNames: string[]): OpenMatch {
  const availableBots = BOTS.filter((bot) => !excludedNames.includes(bot.name))
  const bot = randomItem(availableBots.length ? availableBots : BOTS)
  const pet = randomInt(100) < 68 ? bot.pet : randomItem(PET_IDS)
  const otherPets = PET_IDS.filter((id) => id !== pet)
  const second = randomItem(otherPets)
  const third = randomItem(otherPets.filter((id) => id !== second))
  const lobbyLines: Record<BotStyle, string> = {
    friendly: 'Friendly game · rematches welcome',
    competitive: 'Competitive · locking lucky colors',
    quiet: 'Quiet lobby · no pressure',
    'high-roller': 'High-roller · matched value only',
  }
  return {
    id,
    bot: bot.name,
    pet,
    stake: randomItem(RISK_STAKES[bot.risk]),
    pets: [pet, second, third],
    level: lobbyLines[bot.style],
    status: 'waiting',
  }
}

export default function App() {
  const [balance, setBalance] = useDiamondBalance()
  const [history, setHistory] = useStoredState<HistoryEntry[]>('pawplay-live-history-v1', [])
  const [matches, setMatches] = useState<OpenMatch[]>(INITIAL_MATCHES)
  const matchesRef = useRef<OpenMatch[]>(INITIAL_MATCHES)
  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, kind: 'chat', text: 'MikaRolls: GG à tous — bonne chance pour la suite !', time: timeNow() },
    { id: 2, kind: 'create', text: 'RemyGG propose 10M + 3 pets fictifs. Qui veut jouer ?', time: timeNow() },
    { id: 3, kind: 'roll', text: 'LunaDice choisit deux couleurs porte-bonheur…', time: timeNow() },
  ])
  const [onlineCount, setOnlineCount] = useState(21)
  const [presenceOffset, setPresenceOffset] = useState(0)
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
  const [showResultOverlay, setShowResultOverlay] = useState(false)
  const [rounds, setRounds] = useState<DiceRound[]>([])
  const roundsRef = useRef<DiceRound[]>([])
  const [lastRollId, setLastRollId] = useState('')
  const [infoModal, setInfoModal] = useState<'how' | 'verify' | null>(null)
  const [toast, setToast] = useState('')
  const nextMatchId = useRef(100)
  const nextActivityId = useRef(10)
  const battlesRef = useRef<BotBattle[]>([])
  const rollIntervalRef = useRef<number | null>(null)
  const rollTimeoutsRef = useRef<number[]>([])
  const revealedRef = useRef(0)
  const resultContinueRef = useRef<HTMLButtonElement>(null)
  const viewTransitionsEnabledRef = useRef(true)
  const activeViewTransitionRef = useRef<LobbyViewTransition | null>(null)
  viewTransitionsEnabledRef.current = activeTab === 'open' && !duelModalOpen && !infoModal && !showResultOverlay

  const commitMatches = (next: OpenMatch[]) => {
    matchesRef.current = next
    const viewDocument = document as Document & { startViewTransition?: (callback: () => void) => LobbyViewTransition }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (viewDocument.startViewTransition && !reduceMotion && viewTransitionsEnabledRef.current && !activeViewTransitionRef.current) {
      const transition = viewDocument.startViewTransition(() => { flushSync(() => setMatches(next)) })
      activeViewTransitionRef.current = transition
      const releaseTransition = () => {
        if (activeViewTransitionRef.current === transition) activeViewTransitionRef.current = null
      }
      void transition.finished.then(releaseTransition, releaseTransition)
      return
    }
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
    let timer = 0
    const tick = () => {
      const now = Date.now()
      const dueBattles = battlesRef.current.filter((battle) => battle.resolveAt <= now)
      battlesRef.current = battlesRef.current.filter((battle) => battle.resolveAt > now)
      let nextMatches = matchesRef.current

      if (dueBattles.length) {
        dueBattles.forEach((battle) => {
          const match = nextMatches.find((item) => item.id === battle.id)
          if (!match) return
          const dice = fourRandomColors()
          const firstColors = chooseBotColors(match.bot)
          const firstScore = scoreColors(dice, firstColors)
          const secondScore = scoreColors(dice, chooseBotColors(battle.opponent, firstColors))
          const winner = firstScore === secondScore ? null : firstScore > secondScore ? match.bot : battle.opponent
          const pot = getPotValue(match.stake, match.pets)
          if (winner) {
            const loser = winner === match.bot ? battle.opponent : match.bot
            const scoreLine = `${Math.max(firstScore, secondScore)}–${Math.min(firstScore, secondScore)}`
            addActivity('result', randomItem([
              `${winner} remporte ${formatCompact(pot)} contre ${loser} · ${scoreLine}. GG!`,
              `${winner} remporte le pot de ${formatCompact(pot)} · ${scoreLine} contre ${loser}.`,
              `${winner} bat ${loser} ${scoreLine} · ${formatCompact(pot)} avec les deux sets de pets.`,
            ]))
          } else {
            addActivity('roll', `${match.bot} et ${battle.opponent} : égalité — relance automatique, même pot.`)
            battlesRef.current.push({ ...battle, resolveAt: now + 1800 })
            return
          }
          nextMatches = nextMatches.filter((item) => item.id !== battle.id)
        })
        commitMatches(nextMatches)
      } else {
        const busyNames = new Set(battlesRef.current.flatMap((battle) => {
          const match = nextMatches.find((item) => item.id === battle.id)
          return match ? [match.bot, battle.opponent] : [battle.opponent]
        }))
        const available = nextMatches.filter((item) => item.status === 'waiting' && item.id !== selectedMatchRef.current && !busyNames.has(item.bot))
        if (battlesRef.current.length < 2 && available.length >= 3 && randomInt(100) < 62) {
          const match = randomItem(available)
          const opponents = BOTS.filter((bot) => bot.name !== match.bot && !busyNames.has(bot.name) && !nextMatches.some((item) => item.bot === bot.name))
          const opponent = randomItem(opponents).name
          battlesRef.current = [...battlesRef.current, { id: match.id, opponent, resolveAt: now + 2200 + randomInt(2500) }]
          commitMatches(nextMatches.map((item) => item.id === match.id ? { ...item, status: 'rolling', challenger: opponent } : item))
          addActivity('roll', randomItem([
            `${opponent} accepte le duel de ${match.bot} · ${formatCompact(match.stake)} Diamonds chacun + mêmes pets. Bonne chance !`,
            `${opponent}: Je joue, ${match.bot}. Même mise, mêmes pets — on lance !`,
            `${match.bot} vs ${opponent} · ${formatCompact(match.stake)} Diamonds chacun. Les dés sont lancés !`,
          ]))
        } else if (nextMatches.length < 10) {
          const match = createBotMatch(nextMatchId.current++, nextMatches.map((item) => item.bot))
          commitMatches([match, ...nextMatches])
          addActivity('create', randomItem([
            `${match.bot}: un duel à ${formatCompact(match.stake)} Diamonds ? Même set de 3 pets fictifs fourni.`,
            `${match.bot} cherche un adversaire · ${formatCompact(match.stake)} Diamonds + mêmes pets.`,
            `${match.bot}: J’ai ${formatCompact(match.stake)} Diamonds + 3 pets fictifs. Qui veut jouer ?`,
          ]))
        } else if (randomInt(100) < 46) {
          const chatter = randomItem(BOTS)
          const favorite = COLORS.find((color) => color.id === chatter.favoriteColors[0])!.label.toLowerCase()
          addActivity('chat', randomItem([
            `${chatter.name}: ce dernier lancer était serré 😅`,
            `${chatter.name}: ${favorite} me porte chance aujourd’hui. Encore un ?`,
            `${chatter.name}: GG ! Je suis partant pour la revanche.`,
            `${chatter.name}: une seconde, je vérifie la valeur des pets…`,
            `${chatter.name}: qui veut un duel amical à mises égales ?`,
          ]))
        }
      }
      setOnlineCount((current) => Math.max(17, Math.min(BOTS.length, current + randomItem([-1, 0, 0, 0, 1]))))
      if (randomInt(100) < 45) setPresenceOffset(randomInt(BOTS.length))
      timer = window.setTimeout(tick, 1700 + randomInt(2600))
    }
    timer = window.setTimeout(tick, 900 + randomInt(1300))
    return () => window.clearTimeout(timer)
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
      if (showResultOverlay) {
        setShowResultOverlay(false)
        return
      }
      if (!rolling) {
        setDuelModalOpen(false)
        selectedMatchRef.current = null
        setSelectedMatch(null)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [rolling, showResultOverlay])

  useEffect(() => {
    if (showResultOverlay) resultContinueRef.current?.focus()
  }, [showResultOverlay])

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

  const sortedMatches = useMemo(() => [...matches].sort((a, b) => sortDescending ? getPotValue(b.stake, b.pets) - getPotValue(a.stake, a.pets) : getPotValue(a.stake, a.pets) - getPotValue(b.stake, b.pets)), [matches, sortDescending])
  const totalValue = matches.reduce((sum, match) => sum + getPotValue(match.stake, match.pets), 0)
  const totalDiamondStakes = matches.reduce((sum, match) => sum + match.stake, 0)
  const liveBattles = matches.filter((match) => match.status === 'rolling').length
  const duelPetValue = getPetValue(duelPets)
  const duelSideValue = stake + duelPetValue
  const duelPotValue = duelSideValue * 2
  const opponentProfile = BOTS.find((bot) => bot.name === opponent)
  const duelAccent = COLORS.find((color) => color.id === selectedColors[0])?.hex || '#3d8cf3'
  const presenceBots = Array.from({ length: 5 }, (_, index) => BOTS[(presenceOffset + index * 4) % BOTS.length])

  const resetDuelState = () => {
    roundsRef.current = []
    setRounds([])
    setResult(null)
    setShowResultOverlay(false)
    setScore(null)
    setBotColors([])
    setRevealedCount(0)
    revealedRef.current = 0
    setSelectedColors(['purple', 'yellow'])
  }
  const openCreateDuel = () => {
    selectedMatchRef.current = null
    setSelectedMatch(null)
    const friendlyBots = BOTS.filter((bot) => bot.style === 'friendly' && bot.risk === 'low')
    const bot = randomItem(friendlyBots)
    const petChoices: PetId[] = [bot.pet, 'huge-happy-rock', 'golden-huge-chest-mimic', 'huge-pumpkin-cat', 'huge-amethyst-dragon', 'huge-rainbow-unicorn']
    setOpponent(bot.name)
    setOpponentPet(bot.pet)
    setDuelPets(petChoices.filter((pet, index) => petChoices.indexOf(pet) === index).slice(0, 3))
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
    addActivity('chat', randomItem([
      `${match.bot}: salut, bonne chance ! Je verrouille mes couleurs.`,
      `${match.bot}: un adversaire ! Même mise et mêmes pets — on lance.`,
      `${match.bot}: j’attendais un adversaire. Bonne chance !`,
    ]))
  }
  const closeDuelModal = () => {
    if (rolling) return
    setDuelModalOpen(false)
    setShowResultOverlay(false)
    selectedMatchRef.current = null
    setSelectedMatch(null)
  }
  const toggleColor = (color: DiceColor) => {
    if (rolling) return
    roundsRef.current = []; setRounds([])
    setResult(null)
    setShowResultOverlay(false)
    setScore(null)
    setBotColors([])
    setSelectedColors((current) => {
      if (current.includes(color)) return current.filter((item) => item !== color)
      if (current.length < 2) return [...current, color]
      return [current[1], color]
    })
  }

  const startDuel = (reroll = false, lockedColors = botColors) => {
    if ((!reroll && rolling) || selectedColors.length !== 2) return
    if (stake < MIN_STAKE) {
      setToast('La mise minimum est de 10M Diamonds fictifs.')
      return
    }
    if (!reroll && stake > balance) {
      setToast('Solde insuffisant — utilise la recharge gratuite.')
      return
    }

    if (!reroll) { roundsRef.current = []; setRounds([]) }
    const nextBotColors = reroll ? lockedColors : chooseBotColors(opponent, selectedColors)
    const finalDice = fourRandomColors()
    const finalPips = Array.from({ length: 4 }, () => randomInt(6) + 1)
    const playerScore = scoreColors(finalDice, selectedColors)
    const botScore = scoreColors(finalDice, nextBotColors)
    const duelResult: DuelResult = playerScore > botScore ? 'win' : playerScore < botScore ? 'lose' : 'tie'
    const payout = duelResult === 'win' ? stake * 2 : duelResult === 'tie' ? stake : 0
    const matchedSideValue = duelSideValue
    const matchedPotValue = duelPotValue
    const rollId = `#${Date.now().toString(36).toUpperCase()}`

    if (!reroll) setBalance((current) => current - stake)
    setRolling(true)
    setResult(null)
    setShowResultOverlay(false)
    setScore(null)
    setBotColors(nextBotColors)
    setLastRollId(rollId)
    if (!reroll && selectedMatchRef.current === null) addActivity('roll', `${opponent} accepte ton défi · ${formatCompact(stake)} Diamonds chacun + le même set de pets fictifs.`)
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
          roundsRef.current = [...roundsRef.current, { player: playerScore, bot: botScore }]
          setRounds(roundsRef.current)
          if (duelResult === 'tie') {
            setScore({ player: playerScore, bot: botScore })
            setToast('Égalité — relance automatique, même pot, aucun débit supplémentaire.')
            rollTimeoutsRef.current.push(window.setTimeout(() => startDuel(true, nextBotColors), 1100))
            return
          }
          setRolling(false)
          setScore({ player: playerScore, bot: botScore })
          setResult(duelResult)
          setShowResultOverlay(true)
          setBalance((current) => current + payout)
          setHistory((current) => [{ id: Date.now(), rounds: [...roundsRef.current], opponent, playerScore, botScore, result: duelResult, stake, payout, petValue: duelPetValue, sideValue: matchedSideValue, potValue: matchedPotValue, petCount: duelPets.length, pets: [...duelPets], time: timeNow(), rollId }, ...current].slice(0, 30))
          if (selectedMatchRef.current !== null) commitMatches(matchesRef.current.filter((item) => item.id !== selectedMatchRef.current))
          selectedMatchRef.current = null
          addActivity('result', `Toi : ${duelResult === 'win' ? 'victoire' : duelResult === 'lose' ? 'défaite' : 'égalité'} contre ${opponent} · ${formatCompact(matchedPotValue)} pot total, pets inclus`)
          addActivity('chat', duelResult === 'win'
            ? `${opponent}: GG ! Le dernier dé m’a eu — revanche ?`
            : duelResult === 'lose' ? `${opponent}: GG ! C’était serré. On rejoue ?` : `${opponent}: égalité 😅 encore un lancer !`)
        }, 330))
      }
    }, delay))
  }

  const refill = () => {
    setBalance((current) => current + DIAMOND_REFILL)
    setToast('25B Diamonds fictifs ajoutés.')
  }
  const activityIcon = (kind: ActivityKind) => kind === 'result' ? <Trophy size={13} /> : kind === 'roll' ? <Dices size={13} /> : kind === 'chat' ? <MessageCircle size={13} /> : <Zap size={13} />

  return (
    <div className="dice-app live-dice-app" style={{ '--duel-accent': duelAccent } as React.CSSProperties}>
      <header className="dice-topbar">
        <button className="dice-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="blue-brand-mark"><PawLogo size={37} /></span><span>paw<span>play</span><small>COLOR DICE</small></span></button>
        <nav className="dice-game-nav" aria-label="Navigation principale"><span className="dice-header-game"><Dices size={17} /><span>Color Dice Duels</span></span><a className="dice-index-link poker-index-link" href={appRoute('poker')}><Spade size={15} /><span>Poker</span></a><a className="dice-index-link" href={appRoute('chicken')}>🐔<span>Poulet</span></a><a className="dice-index-link" href={appRoute('pets')}><BookOpen size={15} /><span>Index des pets</span></a></nav>
        <div className="dice-header-right"><span className="demo-label"><ShieldCheck size={14} />100 % FICTIF</span><span className="version-badge">v1.7.0</span><div className="gems-balance"><GemIcon size={24} /><span><strong>{formatCompact(balance)}</strong><small>Diamonds fictifs</small></span><button aria-label="Recharge gratuite de Diamonds" onClick={refill}><Plus size={16} /></button></div></div>
      </header>

      <main className="dice-main live-dice-main">
        <section className="dice-page-heading">
          <div className="dice-title-wrap"><span className="blue-dice-icon"><Dices size={28} /></span><div><span className="live-eyebrow"><span className="online-dot" />SALON SIMULÉ EN DIRECT</span><h1>Color Dice Duels</h1><p>Choisis deux couleurs exclusives, lance quatre dés et défie les bots.</p></div></div>
          <div className="dice-page-actions"><button className="create-duel-open" onClick={openCreateDuel}><Plus size={17} />Créer un duel</button><button onClick={() => setInfoModal('how')}><HelpCircle size={15} />Règles du jeu</button><button onClick={() => setInfoModal('verify')}><ShieldCheck size={15} />Vérifier</button></div>
        </section>

        <section className="dice-stats-bar live-stats-bar">
          <div><span className="stat-icon blue"><Swords size={18} /></span><span>Duels ouverts<strong>{matches.length}</strong></span></div>
          <div><span className="stat-icon green"><Users size={18} /></span><span>Bots en ligne<strong>{onlineCount}</strong></span></div>
          <div><span className="stat-icon cyan"><GemIcon size={21} /></span><span>Mises Diamonds ouvertes<strong>{formatCompact(totalDiamondStakes)} <small>DIAMONDS UNIQUEMENT</small></strong><small className="stat-subline">Total avec RAP des pets {formatCompact(totalValue)}</small></span></div>
          <div><span className="stat-icon purple"><Sparkles size={18} /></span><span>Pets admissibles<strong>{PET_IDS.length} <small>RAP ≥10M</small></strong></span></div>
          <span className="local-game-note"><span className="online-dot" />{liveBattles ? `${liveBattles} duel(s) de bots en cours` : 'Bots prêts à jouer'}</span>
        </section>

        <section className="live-server-panel" aria-label="Simulated server activity">
          <div className="live-server-title"><span><Radio size={15} />Activité du salon</span><small>Bots simulés localement</small></div>
          <div className="live-event-list">{activities.slice(0, 3).map((activity) => <div className={`live-event ${activity.kind}`} key={activity.id}><span>{activityIcon(activity.kind)}</span><p>{activity.text}</p><time>{activity.time}</time></div>)}</div>
          <div className="bot-presence">{presenceBots.map((bot) => { const inDuel = matches.some((match) => match.status === 'rolling' && (match.bot === bot.name || match.challenger === bot.name)); return <span key={bot.name} title={`${bot.name} · ${inDuel ? 'lance les dés' : 'en ligne'}`}><img src={assetUrl(`images/pets/${bot.pet}.png`)} alt="" /><i className={inDuel ? 'in-duel' : ''} /></span> })}<small>+{Math.max(0, onlineCount - 5)} en ligne</small></div>
        </section>

        <section className="duel-lobby-panel live-lobby-panel">
          <div className="lobby-tabs"><button className={activeTab === 'open' ? 'active' : ''} onClick={() => setActiveTab('open')}><Swords size={15} />Duels ouverts<span>{matches.length}</span></button><button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}><History size={15} />Ton historique<span>{history.length}</span></button><button className="sort-button" onClick={() => setSortDescending((current) => !current)}><ArrowDownUp size={14} />{sortDescending ? 'Valeur décroissante' : 'Valeur croissante'}</button></div>
          {activeTab === 'open' ? <>
            <div className="lobby-table-head"><span>Joueurs</span><span>Même set de pets · par côté</span><span>Diamonds / total avec pets</span><span>Action</span></div>
            <div className="live-match-list">{sortedMatches.map((match) => {
              const petsValue = getPetValue(match.pets)
              const sideValue = match.stake + petsValue
              const potValue = sideValue * 2
              return <div className={`open-match-row ${match.status === 'rolling' ? 'match-in-progress' : ''}`} key={match.id} style={{ viewTransitionName: `bot-match-${match.id}` } as React.CSSProperties} data-gem-stake={match.stake} data-pet-value={petsValue} data-side-value={sideValue} data-pot-value={potValue}>
                <div className="match-players"><span className={`match-avatar tier-${PET_CATALOG[match.pet].tier.toLowerCase()}`}><img src={assetUrl(`images/pets/${match.pet}.png`)} alt={PET_CATALOG[match.pet].name} /><i /></span><div><strong>{match.bot}</strong><span className={`match-status ${match.status === 'rolling' ? 'is-rolling' : ''}`}><span className="online-dot" /><span className="match-status-text" key={match.challenger || 'waiting'}>{match.status === 'rolling' ? `En duel contre ${match.challenger || 'un autre bot'}` : 'En ligne · attend un adversaire'}</span></span></div></div>
                <div className="match-pets">{match.pets.map((pet) => <PetThumbnail key={pet} petId={pet} />)}<small>{match.level} · RAP {formatCompact(petsValue)} / côté</small></div>
                <div className="match-value"><span className="match-value-label">MISE DIAMONDS</span><strong><GemIcon size={18} />{formatCompact(match.stake)}</strong><span>Pot total {formatCompact(potValue)} incl. RAP</span><small>{formatCompact(sideValue)} / côté · pets de démonstration identiques</small></div>
                {match.status === 'waiting' ? <button className="join-duel-button" disabled={balance < match.stake} title={balance < match.stake ? `Nécessite ${formatCompact(match.stake)} Diamonds` : `Rejoindre pour ${formatCompact(match.stake)} Diamonds avec les mêmes pets fictifs`} onClick={() => joinMatch(match)}>Rejoindre<ArrowRight size={14} /></button> : <span className="match-live-pill"><Radio size={12} />EN COURS</span>}
              </div>
            })}</div>
          </> : <div className="history-list">{history.length === 0 ? <div className="empty-history"><History size={32} /><h3>Aucun duel</h3><p>Rejoins un bot ou crée un duel pour afficher tes résultats ici.</p><button onClick={openCreateDuel}><Plus size={14} />Créer ton premier duel</button></div> : history.map((entry) => {
            const sideValue = entry.sideValue ?? entry.stake
            const potValue = entry.potValue ?? entry.stake * 2
            const petsValue = entry.petValue ?? 0
            const petCount = entry.petCount ?? 0
            return <article className={`history-row ${entry.result}`} key={entry.id}>
              <span className={`history-result ${entry.result}`}>{entry.result === 'win' ? <Trophy size={12} /> : entry.result === 'lose' ? <ShieldX size={12} /> : <Dices size={12} />}<b>{entry.result === 'win' ? 'GAGNÉ' : entry.result === 'lose' ? 'PERDU' : 'ÉGALITÉ'}</b></span>
              <div className="history-main"><strong>Toi contre {entry.opponent}</strong><span>{entry.time} · Score {entry.playerScore}–{entry.botScore} · {entry.rollId}</span>{entry.rounds && <small>{entry.rounds.length - 1} relance(s) · {entry.rounds.map(r => `${r.player}–${r.bot}`).join(" → ")}</small>}</div>
              <div className="match-pets history-pet-set" aria-label={entry.pets?.length ? `Set de ${entry.pets.length} pets, deux sets dans le pot` : 'Aucune image enregistrée pour cet ancien duel'}>{entry.pets?.length ? entry.pets.map((pet) => <PetThumbnail key={pet} petId={pet} />) : <span className="history-no-pets">{petCount ? <Sparkles size={14} /> : <GemIcon size={15} />}{petCount ? `${petCount * 2} pets` : 'Diamonds uniquement'}</span>}{entry.pets?.length ? <small>×2 sets identiques</small> : null}</div>
              <span className="history-stake"><small>POT TOTAL</small><strong><GemIcon size={15} />{formatCompact(potValue)}</strong><small>{formatCompact(entry.stake * 2)} Diamonds</small>{petCount > 0 && <small>+ {formatCompact(petsValue * 2)} RAP des pets</small>}</span>
              <div className={`history-payout ${entry.result}`}><strong>{entry.result === 'win' ? `+${formatCompact(sideValue)} net` : entry.result === 'lose' ? `−${formatCompact(sideValue)} value` : 'Côté remboursé'}</strong><span className="history-gem-delta">{entry.result === 'tie' ? 'Diamonds remboursés' : `${entry.result === 'win' ? '+' : '−'}${formatCompact(entry.stake)} Diamonds`}</span><span className="history-pet-delta">{petCount ? entry.result === 'win' ? `+${petCount} pets · ${formatCompact(petsValue)} RAP` : entry.result === 'lose' ? `−${petCount} pets · ${formatCompact(petsValue)} RAP` : `${petCount} pets rendus` : 'Ancien duel Diamonds'}</span></div>
            </article>
          })}</div>}
          <div className="lobby-bottom-note"><Bot size={13} />Bots chat, pick favorites and play at their own pace. Equal Diamonds + RAP des pets on both sides · simulated locally, no real players.</div>
        </section>
      </main>

      {duelModalOpen && <div className="duel-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDuelModal() }}>
        <section className="duel-modal" role="dialog" aria-modal="true" aria-labelledby="duel-modal-title">
          <header className="duel-modal-header"><div><span className="duel-modal-kicker"><span className="online-dot" />{selectedMatch ? 'DÉFI DU BOT ACCEPTÉ' : 'NOUVEAU DUEL LOCAL'}</span><h2 id="duel-modal-title">{selectedMatch ? `Défier ${opponent}` : 'Créer un duel'}</h2><p>Deux couleurs chacun, quatre dés. Même mise Diamonds et mêmes pets des deux côtés.</p></div><button className="duel-modal-close" aria-label="Fermer le duel" onClick={closeDuelModal} disabled={rolling}><X size={20} /></button></header>
          <div className="duel-modal-body">
            <div className="duel-arena-column">
              <div className="arena-player-row"><div className="arena-player"><span className="arena-avatar tier-huge"><img src={assetUrl('images/pets/huge-amethyst-dragon.png')} alt="Your PS99 pet" /></span><div><span>TOI</span><div className="arena-color-dots">{selectedColors.map((color) => <i key={color} className={`color-dot-${color}`} />)}</div></div><strong>{score?.player ?? '–'}</strong></div><span className="arena-vs">VS</span><div className="arena-player opponent"><strong>{score?.bot ?? '–'}</strong><div><span>{opponent.toUpperCase()}</span><div className="arena-color-dots">{botColors.length ? botColors.map((color) => <i key={color} className={`color-dot-${color}`} />) : <small>? &nbsp; ?</small>}</div></div><span className={`arena-avatar tier-${PET_CATALOG[opponentPet].tier.toLowerCase()}`}><img src={assetUrl(`images/pets/${opponentPet}.png`)} alt={`${PET_CATALOG[opponentPet].variant} ${PET_CATALOG[opponentPet].name}`} /><i /></span></div></div>
              <div className="match-pets modal-duel-pets">{duelPets.map((pet) => <PetThumbnail key={pet} petId={pet} />)}<span>Chaque côté engage ce set fictif de pets · RAP {formatCompact(duelPetValue)}</span></div>
              <div className={`dice-arena modal-dice-arena ${rolling ? 'is-rolling' : ''}`}><div className="dice-results">{dice.map((color, index) => <ColorDie key={index} color={color} value={pips[index]} index={index} rolling={rolling && index >= revealedCount} playerColors={selectedColors} botColors={botColors} />)}</div><div className="arena-status"><span className="online-dot" />{rolling ? `Lancement · ${revealedCount}/4 dés révélés` : result ? 'Duel terminé — résultat ci-dessous' : 'Couleurs exclusives · égalités relancées gratuitement'}</div></div>
              {result && <div className={`duel-result-banner ${result}`}><Trophy size={23} /><div><strong>{result === 'win' ? `Victoire · ${formatCompact(duelPotValue)} pot` : result === 'lose' ? `Défaite · ${formatCompact(duelSideValue)} perdus de ton côté` : 'Égalité · les deux côtés remboursés'}</strong><span>Score final {score?.player}–{score?.bot} · {result === 'win' ? `${formatCompact(stake * 2)} Diamonds + ${duelPets.length * 2} pets gagnés` : result === 'tie' ? `${formatCompact(stake)} Diamonds + tes ${duelPets.length} pets rendus` : `${formatCompact(stake)} Diamonds + tes ${duelPets.length} pets perdus`}</span></div></div>}
            </div>

            <div className="duel-setup-column">
              <section className="dice-rounds" aria-label="Chronologie du duel"><strong>{Math.max(0, rounds.length - (result ? 1 : 0))} relance(s) · même pot</strong><ol>{rounds.map((round, i) => <li key={i}>Lancer {i + 1} : toi {round.player} – {round.bot} adversaire · {round.player === round.bot ? 'égalité, relance gratuite' : 'résultat final'}</li>)}</ol>{!rounds.length && <p>Les scores de chaque lancer apparaîtront ici.</p>}</section>
              <div className="color-pick-section"><div className="stake-heading"><label>Choisis 2 couleurs exclusives</label><span>{selectedColors.length}/2</span></div><div className="color-picker">{COLORS.map((color) => <button key={color.id} className={`color-option ${selectedColors.includes(color.id) ? 'selected' : ''} ${rolling ? 'disabled' : ''}`} onClick={() => toggleColor(color.id)} disabled={rolling}><span className={`color-dot-${color.id}`} />{color.label}{selectedColors.includes(color.id) && <small>{selectedColors.indexOf(color.id) + 1}</small>}</button>)}</div></div>
              <div className="stake-section"><div className="stake-heading"><label htmlFor="stake-input">Tes Diamonds</label><span>Pot total <strong><GemIcon size={14} />{formatCompact(duelPotValue)}</strong></span></div><div className="stake-input"><GemIcon size={23} /><input id="stake-input" type="text" inputMode="decimal" value={stakeInput} disabled={rolling} onChange={(event) => { setStakeInput(event.target.value); parseStake(event.target.value) }} onBlur={() => changeStake(stake)} aria-describedby="stake-help" /><button disabled={rolling} onClick={() => changeStake(Math.max(MIN_STAKE, Math.floor(stake / 2)))}>½</button><button disabled={rolling} onClick={() => changeStake(stake * 2)}>2×</button><button disabled={rolling} onClick={() => changeStake(balance)}>MAX</button></div><div className="stake-help" id="stake-help">Diamonds uniquement · minimum 10M · solde {formatCompact(balance)}</div><div className="quick-stakes">{QUICK_STAKES.map((amount) => <button key={amount} disabled={rolling || balance < amount} className={stake === amount ? 'active' : ''} onClick={() => changeStake(amount)}><GemIcon size={12} />{formatCompact(amount)}</button>)}</div></div>
              <div className="matched-wager-card"><div className="matched-wager-head"><span><ShieldCheck size={13} />Valeur identique par côté</span><strong>{formatCompact(duelSideValue)}</strong></div><div className="matched-wager-parts"><span><GemIcon size={15} />{formatCompact(stake)}<small>Diamonds</small></span><Plus size={12} /><span><Sparkles size={14} />{formatCompact(duelPetValue)}<small>RAP des pets</small></span></div><p>{opponent} engage les mêmes Diamonds et le même set de {duelPets.length} pets fictifs. Le gagnant reçoit les deux sets.</p></div>
              <div className="opponent-note"><Bot size={17} /><div><strong>{opponent}<span className="opponent-live-state">{rolling ? 'lancement…' : 'en ligne'}</span></strong><span>{rolling ? 'Mises verrouillées. Place aux dés…' : `${opponentProfile?.style || 'amical'} · préfère ${opponentProfile?.favoriteColors.map((color) => COLORS.find((item) => item.id === color)?.label).join(' + ') || 'des couleurs surprises'}.`}</span></div></div>
              <button className="roll-dice-button" disabled={rolling || selectedColors.length !== 2 || stake < MIN_STAKE || stake > balance} onClick={() => startDuel()}><Dices size={20} /><span>{rolling ? 'Lancement…' : result ? 'Rejouer' : 'Lancer les 4 dés'}</span><span className="roll-pot"><GemIcon size={17} />{formatCompact(duelPotValue)}</span></button>
              {stake < MIN_STAKE && <span className="stake-error">Mise au moins 10M pour lancer ce duel.</span>}
              <p className="random-local-note"><ShieldCheck size={12} />Pets fictifs fournis · aucun argent, inventaire ou joueur réel.</p>
            </div>
          </div>
          {showResultOverlay && result && <div className={`duel-result-overlay ${result}`} role="alertdialog" aria-modal="true" aria-labelledby="result-overlay-title" aria-live="assertive">
            {result === 'win' && <div className="result-confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} style={{ left: `${(index * 43) % 100}%`, '--confetti-delay': `${(index % 8) * 0.07}s`, '--confetti-drift': `${(index % 2 ? -1 : 1) * (20 + (index % 5) * 12)}px`, '--confetti-color': CONFETTI_COLORS[index % CONFETTI_COLORS.length] } as React.CSSProperties} />)}</div>}
            <div className="result-overlay-card">
              <span className="result-overlay-icon">{result === 'win' ? <Crown size={40} /> : result === 'lose' ? <ShieldX size={40} /> : <Dices size={39} />}</span>
              <span className="result-overlay-kicker">DUEL TERMINÉ · {lastRollId}</span>
              <h3 id="result-overlay-title">{result === 'win' ? 'VICTOIRE !' : result === 'lose' ? 'DÉFAITE' : 'ÉGALITÉ'}</h3>
              <p>{result === 'win' ? `Tu bats ${opponent} et remportes les deux mises.` : result === 'lose' ? `${opponent} gagne ce duel. Ta mise est perdue.` : `Même score : le pot est conservé pour la relance.`}</p>
              <div className="result-overlay-score"><span>TOI<strong>{score?.player}</strong></span><i>–</i><span>{opponent}<strong>{score?.bot}</strong></span></div>
              <div className="result-overlay-value"><span>{result === 'win' ? 'POT TOTAL GAGNÉ' : result === 'lose' ? 'VALEUR DE TON CÔTÉ PERDUE' : 'TON CÔTÉ REMBOURSÉ'}</span><strong><GemIcon size={25} />{formatCompact(result === 'win' ? duelPotValue : duelSideValue)}</strong><small>{result === 'win' ? `${formatCompact(stake * 2)} Diamonds + ${duelPets.length * 2} pets · les deux sets` : result === 'lose' ? `${formatCompact(stake)} Diamonds + tes ${duelPets.length} pets` : `${formatCompact(stake)} Diamonds + tes ${duelPets.length} pets rendus`}</small>{result === 'win' && <em>Gain net : {formatCompact(duelSideValue)} · Diamonds et pets adverses</em>}</div>
              <button ref={resultContinueRef} onClick={() => setShowResultOverlay(false)}>Voir les dés finaux<ArrowRight size={17} /></button>
            </div>
          </div>}
        </section>
      </div>}

      {infoModal && <div className="info-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setInfoModal(null) }}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-title"><button className="info-close" aria-label="Fermer" onClick={() => setInfoModal(null)}><X size={19} /></button><span className="info-modal-icon">{infoModal === 'how' ? <Dices size={27} /> : <ShieldCheck size={27} />}</span><h2 id="info-title">{infoModal === 'how' ? 'Règles du Color Dice' : 'Vérifier le résultat'}</h2>{infoModal === 'how' ? <><p>Chaque joueur choisit <strong>2 couleurs parmi 6</strong>. Quatre dés sont lancés ; chaque couleur correspondante rapporte un point.</p><ol><li>Rejoins un bot disponible ou utilise le bouton Créer un duel.</li><li>Mise au moins 10M Diamonds fictifs et vérifie le set de pets.</li><li>Les deux côtés engagent les mêmes Diamonds et le même set de 3 pets fictifs. Pot = 2 × (Diamonds + RAP des pets).</li><li>Le meilleur score remporte les deux mises. Une égalité relance le même pot sans débit supplémentaire. Les couleurs sont exclusives.</li></ol><p>Les pets fictifs sont fournis par duel ; ce n’est pas un inventaire Roblox. Les bots discutent et jouent à leur rythme. Tout est simulé localement.</p></> : <><p>Cette simulation utilise <strong>crypto.getRandomValues()</strong> pour chaque dé et chaque décision des bots.</p><div className="verification-box"><span>IDENTIFIANT DU LANCER</span><strong>{lastRollId || 'Aucun lancer'}</strong><span>TES COULEURS</span><strong>{selectedColors.map((color) => COLORS.find((item) => item.id === color)?.label).join(' + ')}</strong><span>COULEURS DU BOT</span><strong>{botColors.length ? botColors.map((color) => COLORS.find((item) => item.id === color)?.label).join(' + ') : 'Masquées avant le duel'}</strong><span>DERNIER SCORE</span><strong>{score ? `${score.player}–${score.bot}` : 'Aucun lancer'}</strong></div><p>Aucun serveur réel, mise réelle, seed blockchain ou inventaire Roblox.</p></>}<button className="info-got-it" onClick={() => setInfoModal(null)}>Compris<Check size={15} /></button></section></div>}
      {toast && <div className="dice-toast" role="status">{toast}</div>}
    </div>
  )
}
