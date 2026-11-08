import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, Dices, Info, Minus, PawPrint, Plus, ShieldCheck, Sparkles, Star, TrendingUp, X, Zap } from 'lucide-react'
import type { Game, GameId } from '../data'
import { formatCoins, randomInt } from '../data'
import { CaseArt, CubeDie, PawCoin, RocketArt } from './GameArt'

type Result = { tone: 'win' | 'lose' | 'neutral'; title: string; detail: string } | null

type GameProps = {
  balance: number
  onBet: (amount: number) => boolean
  onWin: (amount: number) => void
  onRefill: () => void
}

type GameModalProps = {
  game: Game
  balance: number
  onClose: () => void
  onBet: (gameId: GameId, amount: number) => boolean
  onWin: (amount: number) => void
  onRefill: () => void
}

function WagerControls({ value, onChange, balance, disabled, onRefill }: {
  value: number
  onChange: (value: number) => void
  balance: number
  disabled: boolean
  onRefill: () => void
}) {
  const safeValue = Number.isFinite(value) ? value : 0
  return (
    <div className="wager-controls">
      <div className="control-label"><span>Coins en jeu</span><span className="tiny-label">Minimum 10</span></div>
      <div className="wager-input-wrap">
        <PawCoin size={24} />
        <input
          aria-label="Quantité de PawCoins"
          type="number"
          min="10"
          step="10"
          value={safeValue}
          disabled={disabled}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
        />
        <div className="wager-steppers">
          <button type="button" aria-label="Réduire la quantité" disabled={disabled} onClick={() => onChange(Math.max(10, safeValue - 50))}><Minus size={14} /></button>
          <button type="button" aria-label="Augmenter la quantité" disabled={disabled} onClick={() => onChange(safeValue + 50)}><Plus size={14} /></button>
        </div>
      </div>
      <div className="quick-values">
        {[50, 100, 250, 500].map((amount) => (
          <button key={amount} type="button" disabled={disabled || balance < amount} className={safeValue === amount ? 'active' : ''} onClick={() => onChange(amount)}>{amount}</button>
        ))}
        <button type="button" disabled={disabled || balance < 10} onClick={() => onChange(Math.min(1000, balance))}>MAX</button>
      </div>
      {balance < 10 && (
        <button className="refill-note" type="button" onClick={onRefill}>
          <Plus size={15} /> Recevoir 1 000 PawCoins gratuits
        </button>
      )}
    </div>
  )
}

function ResultBanner({ result }: { result: Result }) {
  if (!result) return null
  return (
    <div className={`game-result result-${result.tone}`} role="status">
      <span className="result-icon">{result.tone === 'win' ? <Sparkles size={20} /> : result.tone === 'lose' ? <Zap size={20} /> : <Info size={20} />}</span>
      <div><strong>{result.title}</strong><span>{result.detail}</span></div>
    </div>
  )
}

function ColorDiceGame({ balance, onBet, onWin, onRefill }: GameProps) {
  const [selected, setSelected] = useState<number[]>([0, 1])
  const [botColors, setBotColors] = useState<number[]>([])
  const [wager, setWager] = useState(100)
  const [dice, setDice] = useState([0, 1, 2, 3])
  const [dots, setDots] = useState([3, 5, 2, 6])
  const [rolling, setRolling] = useState(false)
  const [score, setScore] = useState<{ player: number; bot: number } | null>(null)
  const [result, setResult] = useState<Result>(null)
  const colors = ['violet', 'mint', 'ruby', 'sky', 'amber', 'pink'] as const
  const names = ['Violet', 'Vert', 'Rouge', 'Bleu', 'Jaune', 'Rose']

  const toggleColor = (index: number) => {
    if (rolling) return
    setResult(null)
    setScore(null)
    setBotColors([])
    setSelected((current) => {
      if (current.includes(index)) return current.filter((color) => color !== index)
      if (current.length < 2) return [...current, index]
      return [current[1], index]
    })
  }

  const roll = () => {
    if (rolling || selected.length !== 2 || wager < 10 || wager > balance || !onBet(wager)) return
    setRolling(true)
    setResult(null)
    setScore(null)
    setBotColors([])
    window.setTimeout(() => {
      const firstBotColor = randomInt(6)
      const secondBotColor = (firstBotColor + 1 + randomInt(5)) % 6
      const nextBotColors = [firstBotColor, secondBotColor]
      const nextDice = Array.from({ length: 4 }, () => randomInt(6))
      const nextDots = Array.from({ length: 4 }, () => randomInt(6) + 1)
      const playerScore = nextDice.filter((color) => selected.includes(color)).length
      const botScore = nextDice.filter((color) => nextBotColors.includes(color)).length
      const payout = playerScore > botScore ? wager * 2 : playerScore === botScore ? wager : 0
      setDice(nextDice)
      setDots(nextDots)
      setBotColors(nextBotColors)
      setScore({ player: playerScore, bot: botScore })
      setRolling(false)
      if (payout > 0) onWin(payout)
      if (playerScore > botScore) {
        setResult({ tone: 'win', title: `Victoire ${playerScore}–${botScore} ! Le pot est à toi.`, detail: `Tu remportes ${formatCoins(wager)} PawCoins. Ton adversaire est simulé.` })
      } else if (playerScore === botScore) {
        setResult({ tone: 'neutral', title: `Égalité ${playerScore}–${botScore}`, detail: `Tes ${formatCoins(wager)} PawCoins sont rendus.` })
      } else {
        setResult({ tone: 'lose', title: `Défaite ${playerScore}–${botScore}`, detail: 'Le bot remporte ce pot. Choisis deux couleurs et retente le duel !' })
      }
    }, 1100)
  }

  return (
    <>
      <div className="dice-game-layout duel-layout">
        <div className="dice-stage dice-duel-stage">
          <div className="stage-grid" />
          <div className="duel-scoreboard">
            <div className="duel-player-card">
              <img src="/images/pets/huge-amethyst-dragon.png" alt="Huge Amethyst Dragon" />
              <span>TOI</span><strong>{score?.player ?? '–'}</strong>
              <div className="score-color-dots">{selected.map((color) => <i key={color} className={`dot-${colors[color]}`} />)}</div>
            </div>
            <span className="duel-vs">VS</span>
            <div className="duel-player-card bot-card">
              <img src="/images/pets/titanic-arcane-cat.png" alt="Titanic Arcane Cat" />
              <span>ARCANE BOT</span><strong>{score?.bot ?? '–'}</strong>
              <div className="score-color-dots">{botColors.length ? botColors.map((color) => <i key={color} className={`dot-${colors[color]}`} />) : <small>? ?</small>}</div>
            </div>
          </div>
          <div className={`duel-dice-row ${rolling ? 'is-rolling' : ''}`}>
            {dice.map((color, index) => (
              <div className={`duel-die duel-die-${index}`} key={index}>
                <CubeDie color={colors[color]} dots={dots[index]} size={88} />
                <span>{names[color]}</span>
                {!rolling && score && <div className="die-score-tags">{selected.includes(color) && <b className="player-tag">TOI +1</b>}{botColors.includes(color) && <b className="bot-tag">BOT +1</b>}</div>}
              </div>
            ))}
          </div>
          <span className="stage-caption">{rolling ? 'Les 4 dés roulent…' : 'Le joueur dont les couleurs apparaissent le plus remporte le pot.'}</span>
        </div>
        <div className="game-controls-panel">
          <div className="control-label"><span>Choisis exactement 2 couleurs</span><span className="tiny-label">{selected.length} / 2</span></div>
          <div className="color-picker duel-color-picker">
            {colors.map((color, index) => {
              const selectionIndex = selected.indexOf(index)
              return (
                <button type="button" key={color} disabled={rolling} className={`color-choice choice-${color} ${selectionIndex >= 0 ? 'selected' : ''}`} onClick={() => toggleColor(index)}>
                  <span className="color-dot" />{names[index]}{selectionIndex >= 0 && <b>{selectionIndex + 1}</b>}
                </button>
              )
            })}
          </div>
          <div className="duel-pot"><span>Pot du duel</span><strong><PawCoin size={19} />{formatCoins(wager * 2)}</strong><small>Toi + le bot = 2 mises</small></div>
          <WagerControls value={wager} onChange={setWager} balance={balance} disabled={rolling} onRefill={onRefill} />
          <button className="primary-button play-round-button" disabled={rolling || selected.length !== 2 || wager < 10 || wager > balance} onClick={roll}>
            <Dices size={19} />{rolling ? 'Duel en cours…' : 'Lancer les 4 dés'}<ArrowRight size={18} />
          </button>
        </div>
      </div>
      <ResultBanner result={result} />
    </>
  )
}

function UpgraderGame({ balance, onBet, onWin, onRefill }: GameProps) {
  const options = [
    { multiplier: 1.5, pet: 'Huge Rainbow Unicorn', image: '/images/pets/huge-rainbow-unicorn.png' },
    { multiplier: 2, pet: 'Huge Amethyst Dragon', image: '/images/pets/huge-amethyst-dragon.png' },
    { multiplier: 3, pet: 'Titanic Kitsune Fox', image: '/images/pets/titanic-kitsune-fox.png' },
    { multiplier: 5, pet: 'Titanic Arcane Cat', image: '/images/pets/titanic-arcane-cat.png' },
  ]
  const [wager, setWager] = useState(100)
  const [optionIndex, setOptionIndex] = useState(1)
  const [upgrading, setUpgrading] = useState(false)
  const [succeeded, setSucceeded] = useState<boolean | null>(null)
  const [result, setResult] = useState<Result>(null)
  const option = options[optionIndex]
  const chance = Math.floor(85 / option.multiplier)

  const upgrade = () => {
    if (upgrading || wager < 10 || wager > balance || !onBet(wager)) return
    setUpgrading(true)
    setSucceeded(null)
    setResult(null)
    window.setTimeout(() => {
      const won = randomInt(100) < chance
      setUpgrading(false)
      setSucceeded(won)
      if (won) {
        const payout = Math.floor(wager * option.multiplier)
        onWin(payout)
        setResult({ tone: 'win', title: `${option.pet} débloqué visuellement !`, detail: `${formatCoins(payout)} PawCoins ajoutés. Aucun vrai pet n’est crédité.` })
      } else {
        setResult({ tone: 'lose', title: 'L’amélioration a échoué', detail: `La chance était de ${chance} %. Ton Huge Happy Rock reste dans la démo.` })
      }
    }, 1150)
  }

  return (
    <>
      <div className="upgrader-game-layout">
        <div className={`upgrader-stage ${upgrading ? 'is-upgrading' : ''} ${succeeded === true ? 'upgrade-success' : ''} ${succeeded === false ? 'upgrade-failed' : ''}`}>
          <div className="upgrade-rays" />
          <div className="upgrade-pet-column"><span>TON PET DE DÉMO</span><div className="upgrade-pet-frame"><img src="/images/pets/huge-happy-rock.png" alt="Huge Happy Rock" /></div><strong>Huge Happy Rock</strong><small><PawCoin size={15} />{formatCoins(wager)}</small></div>
          <div className="upgrade-direction"><div className="upgrade-chance-ring"><strong>{chance}%</strong><span>CHANCE</span></div><TrendingUp size={28} /><small>x{option.multiplier}</small></div>
          <div className="upgrade-pet-column target-pet"><span>PET VISÉ</span><div className="upgrade-pet-frame"><img src={option.image} alt={option.pet} /></div><strong>{option.pet}</strong><small><PawCoin size={15} />{formatCoins(wager * option.multiplier)}</small></div>
        </div>
        <div className="game-controls-panel">
          <div className="control-label"><span>Choisis ton amélioration</span><span className="tiny-label">Plus rare = moins de chances</span></div>
          <div className="upgrade-options">
            {options.map((item, index) => <button type="button" key={item.multiplier} disabled={upgrading} className={optionIndex === index ? 'selected' : ''} onClick={() => { setOptionIndex(index); setResult(null); setSucceeded(null) }}><img src={item.image} alt="" /><strong>x{item.multiplier}</strong><span>{Math.floor(85 / item.multiplier)} %</span></button>)}
          </div>
          <div className="upgrade-notice"><TrendingUp size={16} /><span>Le résultat est aléatoire. Les pets sont uniquement des visuels de démonstration.</span></div>
          <WagerControls value={wager} onChange={setWager} balance={balance} disabled={upgrading} onRefill={onRefill} />
          <button className="primary-button play-round-button cyan-button" disabled={upgrading || wager < 10 || wager > balance} onClick={upgrade}><TrendingUp size={19} />{upgrading ? 'Amélioration…' : 'Améliorer le pet'}<ArrowRight size={18} /></button>
        </div>
      </div>
      <ResultBanner result={result} />
    </>
  )
}

function CoinflipGame({ balance, onBet, onWin, onRefill }: GameProps) {
  const [selected, setSelected] = useState<'paw' | 'star'>('paw')
  const [face, setFace] = useState<'paw' | 'star'>('paw')
  const [wager, setWager] = useState(100)
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState<Result>(null)

  const flip = () => {
    if (flipping || wager < 10 || wager > balance || !onBet(wager)) return
    setFlipping(true)
    setResult(null)
    window.setTimeout(() => {
      const nextFace = randomInt(2) === 0 ? 'paw' : 'star'
      const won = nextFace === selected
      setFace(nextFace)
      setFlipping(false)
      if (won) {
        onWin(wager * 2)
        setResult({ tone: 'win', title: 'Bien joué, la pièce est pour toi !', detail: `Tu remportes ${formatCoins(wager)} PawCoins.` })
      } else {
        setResult({ tone: 'lose', title: `C’est tombé sur ${nextFace === 'paw' ? 'Patte' : 'Étoile'}`, detail: 'Pas cette fois ! Tu peux retenter ta chance.' })
      }
    }, 1100)
  }

  return (
    <>
      <div className="coinflip-layout">
        <div className="coinflip-stage">
          <div className="coin-orbit orbit-a" /><div className="coin-orbit orbit-b" />
          <div className={`flip-coin ${flipping ? 'is-flipping' : ''} face-${face}`}>
            <div className="flip-coin-inner">
              <div className="flip-face flip-paw"><PawCoin size={150} /></div>
              <div className="flip-face flip-star"><Star size={64} fill="currentColor" /></div>
            </div>
          </div>
          <span className="stage-caption">{flipping ? 'La pièce tourne…' : 'Deux faces. Une décision.'}</span>
        </div>
        <div className="game-controls-panel">
          <div className="control-label"><span>Choisis une face</span><span className="tiny-label">Victoire = x2</span></div>
          <div className="face-picker">
            <button type="button" disabled={flipping} className={selected === 'paw' ? 'selected' : ''} onClick={() => { setSelected('paw'); setResult(null) }}><PawPrint size={23} /><span>Patte</span>{selected === 'paw' && <Check size={15} />}</button>
            <button type="button" disabled={flipping} className={selected === 'star' ? 'selected' : ''} onClick={() => { setSelected('star'); setResult(null) }}><Star size={23} /><span>Étoile</span>{selected === 'star' && <Check size={15} />}</button>
          </div>
          <WagerControls value={wager} onChange={setWager} balance={balance} disabled={flipping} onRefill={onRefill} />
          <button className="primary-button play-round-button gold-button" disabled={flipping || wager < 10 || wager > balance} onClick={flip}>
            <PawCoin size={21} />{flipping ? 'En l’air…' : 'Lancer la pièce'}<ArrowRight size={18} />
          </button>
        </div>
      </div>
      <ResultBanner result={result} />
    </>
  )
}

function RocketGame({ balance, onBet, onWin, onRefill }: GameProps) {
  const [wager, setWager] = useState(100)
  const [multiplier, setMultiplier] = useState(1)
  const [running, setRunning] = useState(false)
  const [crashed, setCrashed] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const timerRef = useRef<number | null>(null)
  const multiplierRef = useRef(1)
  const targetRef = useRef(2)
  const startTimeRef = useRef(0)

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
  }, [])

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  const start = () => {
    if (running || wager < 10 || wager > balance || !onBet(wager)) return
    setResult(null)
    setCrashed(false)
    setMultiplier(1)
    multiplierRef.current = 1
    targetRef.current = 1.15 + (randomInt(440) / 100)
    startTimeRef.current = performance.now()
    setRunning(true)
    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current
      const next = Math.exp(elapsed / 3700)
      multiplierRef.current = next
      setMultiplier(next)
      if (next >= targetRef.current) {
        stopTimer()
        setRunning(false)
        setCrashed(true)
        setMultiplier(targetRef.current)
        setResult({ tone: 'lose', title: `La fusée s’est arrêtée à x${targetRef.current.toFixed(2)}`, detail: 'Essaie d’encaisser un peu plus tôt au prochain vol.' })
      }
    }, 45)
  }

  const cashOut = () => {
    if (!running) return
    stopTimer()
    setRunning(false)
    const payout = Math.floor(wager * multiplierRef.current)
    onWin(payout)
    setResult({ tone: 'win', title: `Encaissé à x${multiplierRef.current.toFixed(2)} !`, detail: `${formatCoins(payout)} PawCoins ont rejoint ton solde.` })
  }

  const flight = Math.min(1, Math.log(multiplier) / Math.log(5.5))

  return (
    <>
      <div className="rocket-game-layout">
        <div className={`rocket-flight-stage ${crashed ? 'has-crashed' : ''}`}>
          <div className="flight-stars" />
          <div className="flight-grid" />
          <svg className="flight-path" viewBox="0 0 500 260" preserveAspectRatio="none" aria-hidden="true"><path d="M0 250C140 250 235 239 310 188C386 137 398 64 492 13" /></svg>
          <div className="flying-rocket" style={{ left: `${14 + flight * 61}%`, bottom: `${10 + flight * 58}%`, transform: `rotate(${37 + flight * 8}deg) scale(${1 - flight * .24})` }}><RocketArt small /></div>
          <div className={`multiplier-display ${running ? 'is-live' : ''} ${crashed ? 'is-crashed' : ''}`}>x{multiplier.toFixed(2)}</div>
          <div className="flight-history"><span>x1.84</span><span>x3.12</span><span>x1.27</span><span>x4.68</span></div>
        </div>
        <div className="game-controls-panel">
          <div className="rocket-objective"><Zap size={18} /><p>Encaisse avant la fin du vol.<br /><span>Plus tu attends, plus le multiplicateur grimpe.</span></p></div>
          <WagerControls value={wager} onChange={setWager} balance={balance} disabled={running} onRefill={onRefill} />
          {running ? (
            <button className="primary-button play-round-button cashout-button" onClick={cashOut}>
              <PawCoin size={21} />Encaisser {formatCoins(Math.floor(wager * multiplier))}<ArrowRight size={18} />
            </button>
          ) : (
            <button className="primary-button play-round-button pink-button" disabled={wager < 10 || wager > balance} onClick={start}>
              <Zap size={19} />{crashed ? 'Voler encore' : 'Décoller'}<ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
      <ResultBanner result={result} />
    </>
  )
}

const prizes = [
  { variant: 'cat', name: 'Huge Happy Rock', image: '/images/pets/huge-happy-rock.png', rarity: 'Huge', multiplier: .5, threshold: 32 },
  { variant: 'bunny', name: 'Huge Rainbow Unicorn', image: '/images/pets/huge-rainbow-unicorn.png', rarity: 'Rare', multiplier: 1, threshold: 62 },
  { variant: 'fox', name: 'Huge Amethyst Dragon', image: '/images/pets/huge-amethyst-dragon.png', rarity: 'Super rare', multiplier: 2, threshold: 87 },
  { variant: 'dragon', name: 'Titanic Arcane Cat', image: '/images/pets/titanic-arcane-cat.png', rarity: 'Titanic', multiplier: 5, threshold: 100 },
]

function CasesGame({ balance, onBet, onWin, onRefill }: GameProps) {
  const [wager, setWager] = useState(250)
  const [opening, setOpening] = useState(false)
  const [prize, setPrize] = useState<(typeof prizes)[number] | null>(null)
  const [result, setResult] = useState<Result>(null)

  const openCase = () => {
    if (opening || wager < 10 || wager > balance || !onBet(wager)) return
    setOpening(true)
    setPrize(null)
    setResult(null)
    window.setTimeout(() => {
      const roll = randomInt(100)
      const wonPrize = prizes.find((item) => roll < item.threshold) || prizes[0]
      const payout = Math.floor(wager * wonPrize.multiplier)
      setPrize(wonPrize)
      setOpening(false)
      if (payout > 0) onWin(payout)
      setResult({
        tone: wonPrize.multiplier >= 1 ? 'win' : 'neutral',
        title: `${wonPrize.name} rejoint ta collection !`,
        detail: `${wonPrize.rarity} · ${formatCoins(payout)} PawCoins ajoutés à ton solde.`,
      })
    }, 1250)
  }

  return (
    <>
      <div className="case-game-layout">
        <div className={`case-opening-stage ${opening ? 'is-opening' : ''} ${prize ? 'has-prize' : ''}`}>
          <div className="case-rays" />
          {prize ? (
            <div className="prize-reveal">
              <span className="rarity-pill"><Sparkles size={13} />{prize.rarity}</span>
              <img className="ps99-prize-image" src={prize.image} alt={prize.name} />
              <strong>{prize.name}</strong>
              <span>x{prize.multiplier} en PawCoins</span>
            </div>
          ) : <CaseArt opened={opening} />}
        </div>
        <div className="game-controls-panel">
          <div className="case-odds">
            <div className="control-label"><span>Dans ce coffre</span><span className="tiny-label">4 compagnons</span></div>
            <div className="mini-pets">{prizes.map((item) => <span key={item.variant} className={`mini-pet pet-${item.variant}`}><img src={item.image} alt={item.name} /></span>)}</div>
            <p>Chaque coffre contient un compagnon et des PawCoins. Les plus rares brillent davantage !</p>
          </div>
          <WagerControls value={wager} onChange={setWager} balance={balance} disabled={opening} onRefill={onRefill} />
          <button className="primary-button play-round-button cyan-button" disabled={opening || wager < 10 || wager > balance} onClick={openCase}>
            <Sparkles size={19} />{opening ? 'Ouverture magique…' : prize ? 'Ouvrir un autre coffre' : 'Ouvrir le coffre'}<ArrowRight size={18} />
          </button>
        </div>
      </div>
      <ResultBanner result={result} />
    </>
  )
}

const gameRules: Record<GameId, string> = {
  dice: 'Choisis 2 couleurs. Le bot en choisit 2 aussi. Après 4 dés, le joueur avec le plus de correspondances gagne le pot de x2. Égalité = mise rendue.',
  upgrader: 'Choisis un pet PS99 visuel et un multiplicateur. La probabilité affichée détermine si l’amélioration réussit.',
  coinflip: 'Trouve la bonne face pour doubler tes PawCoins.',
  rocket: 'Le vol s’arrête à un multiplicateur aléatoire. Encaisse avant !',
  cases: 'Chaque coffre révèle un compagnon et une récompense fictive.',
}

export default function GameModal({ game, balance, onClose, onBet, onWin, onRefill }: GameModalProps) {
  const [showRules, setShowRules] = useState(false)
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  let content: ReactNode
  const props: GameProps = { balance, onBet: (amount) => onBet(game.id, amount), onWin, onRefill }
  if (game.id === 'dice') content = <ColorDiceGame {...props} />
  else if (game.id === 'upgrader') content = <UpgraderGame {...props} />
  else if (game.id === 'coinflip') content = <CoinflipGame {...props} />
  else if (game.id === 'rocket') content = <RocketGame {...props} />
  else content = <CasesGame {...props} />

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`game-modal modal-${game.id}`} role="dialog" aria-modal="true" aria-labelledby="game-modal-title">
        <header className="game-modal-header">
          <div className="modal-game-title">
            <span className={`modal-game-icon accent-${game.accent}`}>{game.id === 'dice' ? <Dices /> : game.id === 'upgrader' ? <TrendingUp /> : game.id === 'coinflip' ? <PawCoin size={28} /> : game.id === 'rocket' ? <Zap /> : <Sparkles />}</span>
            <div><span className="eyebrow">ARCADE PAWPLAY</span><h2 id="game-modal-title">{game.title}</h2></div>
          </div>
          <div className="modal-header-actions">
            <div className="modal-balance"><PawCoin size={22} /><strong>{formatCoins(balance)}</strong></div>
            <button className="icon-button" aria-label="Fermer le jeu" onClick={onClose}><X size={21} /></button>
          </div>
        </header>
        <div className="game-modal-body">{content}</div>
        <footer className="game-modal-footer">
          <button type="button" className="rules-toggle" onClick={() => setShowRules(!showRules)}><Info size={15} /> Règles du jeu <ChevronDown size={14} className={showRules ? 'rotate' : ''} /></button>
          <span><ShieldCheck size={15} /> Tirage local · 100 % fictif</span>
        </footer>
        {showRules && <div className="rules-popover"><strong>Comment jouer</strong><p>{gameRules[game.id]}</p><span>Aucun argent, aucun objet réel et aucun retrait. Juste du fun.</span></div>}
      </section>
    </div>
  )
}
