import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Bot, ChevronRight, Coins, Dices, Hand, Plus, RotateCcw, ShieldCheck, Spade, Trophy } from 'lucide-react'
import { GemIcon, PawLogo } from './GameArt'
import { appRoute } from '../lib/appUrl'
import { DIAMOND_REFILL, useDiamondBalance, useStoredState } from '../lib/balance'
import {
  combinationCards,
  explainPokerResult,
  applyPokerAction,
  chooseBotAction,
  createPokerHand,
  evaluateHand,
  type Card,
  type PokerAction,
  type PokerGame,
  type PokerWinner,
  type Suit,
} from '../lib/poker'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const formatCompact = (value: number) => compact.format(value)
const BLIND_LEVELS = [10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000, 1_000_000_000, 2_500_000_000, 5_000_000_000]
const STAGES: Record<string, string> = { idle: 'Repos', preflop: 'Préflop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Révélation' }
const BOT_NAMES = ['MikaRolls', 'RemyGG', 'NovaByte', 'SofiaRNG', 'PxlMaya']
const SUITS: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
const RANKS: Record<number, string> = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J' }

type PokerHistoryEntry = {
  handId: number
  botName: string
  winner: PokerWinner
  pot: number
  playerCommitted: number
  playerHand: string
  botHand: string
  time: string
}

function randomBot() {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return BOT_NAMES[values[0] % BOT_NAMES.length]
}

function PokerCard({ card, hidden = false, placeholder = false, highlighted = false }: { card?: Card; hidden?: boolean; placeholder?: boolean; highlighted?: boolean }) {
  if (placeholder) return <div className="poker-card poker-card-placeholder" aria-hidden="true"><Spade size={20} /></div>
  if (hidden || !card) return <div className="poker-card poker-card-back" role="img" aria-label="Carte cachée"><span><Spade size={22} /></span></div>
  const label = `${RANKS[card.rank] || card.rank} de ${{ spades: 'pique', hearts: 'cœur', diamonds: 'carreau', clubs: 'trèfle' }[card.suit]}`
  return (
    <div className={`poker-card poker-card-face ${highlighted ? 'combination-highlight' : ''} ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'is-red' : ''}`} role="img" aria-label={`${label}${highlighted ? ' · combination' : ''}`}>
      <strong>{RANKS[card.rank] || card.rank}</strong>
      <span>{SUITS[card.suit]}</span>
      <small>{SUITS[card.suit]}</small>
    </div>
  )
}

function winnerLabel(winner: PokerWinner) {
  return winner === 'player' ? 'Gagné' : winner === 'bot' ? 'Perdu' : 'Partagé'
}

export default function Poker() {
  const [balance, setBalance] = useDiamondBalance()
  const [game, setGame] = useState<PokerGame | null>(null)
  const [bigBlind, setBigBlind] = useState(50_000_000)
  const [notice, setNotice] = useState('Choisis les blinds et distribue ta première main en Diamonds.')
  const [history, setHistory] = useStoredState<PokerHistoryEntry[]>('pawplay-poker-history-v1', [])
  const nextHandId = useRef(history.reduce((max, entry) => Math.max(max, entry.handId), 0) + 1)
  const creditedHand = useRef(0)

  const highlightedCards = game ? combinationCards([...game.playerCards, ...game.community]) : []
  const isHighlighted = (card: Card) => highlightedCards.some(item => item.rank === card.rank && item.suit === card.suit)
  const callAmount = game ? Math.max(0, game.currentBet - game.playerRound) : 0
  const raiseAmount = callAmount + (game?.bigBlind || bigBlind)
  const playerTurn = Boolean(game && !game.winner && game.turn === 'player')
  const revealBot = Boolean(game?.winner && !game.folded)
  const playerEvaluation = useMemo(() => {
    if (!game || game.community.length < 3) return null
    return evaluateHand([...game.playerCards, ...game.community])
  }, [game])

  useEffect(() => {
    if (!game || game.turn !== 'bot' || game.winner) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => {
      setGame((current) => {
        if (!current || current.turn !== 'bot' || current.winner) return current
        return applyPokerAction(current, 'bot', chooseBotAction(current))
      })
    }, reduceMotion ? 120 : 650)
    return () => window.clearTimeout(timer)
  }, [game])

  useEffect(() => {
    if (!game?.winner || creditedHand.current === game.handId) return
    creditedHand.current = game.handId
    const payout = game.winner === 'player' ? game.pot : game.winner === 'tie' ? game.pot / 2 : 0
    if (payout) setBalance((current) => current + payout)
    setHistory((current) => [{
      handId: game.handId,
      botName: game.botName,
      winner: game.winner!,
      pot: game.pot,
      playerCommitted: game.playerCommitted,
      playerHand: game.playerEvaluation?.label || (game.folded === 'player' ? 'Abandon' : 'Non révélée'),
      botHand: game.botEvaluation?.label || (game.folded === 'bot' ? 'Abandon' : 'Non révélée'),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }, ...current].slice(0, 10))
  }, [game, setBalance, setHistory])

  const startHand = () => {
    const dealer = game?.winner ? (game.dealer === 'player' ? 'bot' as const : 'player' as const) : 'player' as const
    const playerBlind = dealer === 'player' ? bigBlind / 2 : bigBlind
    if (balance < playerBlind) {
      setNotice(`Il te faut ${formatCompact(playerBlind)} Diamonds pour cette blind. Recharge gratuitement ou baisse le niveau.`)
      return
    }
    setBalance((current) => current - playerBlind)
    setGame(createPokerHand(nextHandId.current++, bigBlind, dealer, randomBot()))
    setNotice('')
  }

  const playerAction = (action: PokerAction) => {
    if (!game || !playerTurn) return
    const amount = action === 'call' ? callAmount : action === 'raise' ? raiseAmount : 0
    if (amount > balance) {
      setNotice(`Cette action demande ${formatCompact(amount)} Diamonds. Ton solde disponible est de ${formatCompact(balance)}.`)
      return
    }
    if (amount) setBalance((current) => current - amount)
    setNotice('')
    setGame((current) => current ? applyPokerAction(current, 'player', action) : current)
  }

  const refill = () => {
    setBalance((current) => current + DIAMOND_REFILL)
    setNotice('25B Diamonds fictifs ajoutés à ton solde partagé.')
  }

  const net = game?.winner === 'player' ? game.pot - game.playerCommitted : game?.winner === 'bot' ? -game.playerCommitted : 0
  const currentStage = game?.stage || 'idle'

  return (
    <div className="poker-app">
      <header className="dice-topbar poker-topbar">
        <a className="dice-brand" href={appRoute('dice')} aria-label="PawPlay Color Dice home"><span className="blue-brand-mark"><PawLogo size={37} /></span><span>paw<span>play</span><small>POKER</small></span></a>
        <nav className="poker-nav" aria-label="Navigation principale">
          <a href={appRoute('dice')}><Dices size={15} />Color Dice</a>
          <a href={appRoute('poker')} className="active" aria-current="page"><Spade size={15} />Poker</a>
          <a href={appRoute('chicken')}>🐔 Chicken</a><a href={appRoute('pets')}><BookOpen size={15} />Index des pets</a>
        </nav>
        <div className="dice-header-right"><span className="demo-label"><ShieldCheck size={14} />100 % FICTIF</span><span className="version-badge">v1.6.2</span><div className="gems-balance"><GemIcon size={24} /><span><strong>{formatCompact(balance)}</strong><small>Diamonds fictifs</small></span><button aria-label="Recharge gratuite de Diamonds" onClick={refill}><Plus size={16} /></button></div></div>
      </header>

      <main className="poker-main">
        <section className="poker-heading">
          <div className="poker-title-wrap"><span className="poker-title-icon"><Spade size={28} /></span><div><span className="poker-eyebrow">TABLE SIMULÉE EN DUEL</span><h1>Diamond Poker</h1><p>Texas Hold’em contre un bot local. <strong>Diamonds uniquement — aucun pet ni RAP.</strong></p></div></div>
          <div className="poker-format"><span><Bot size={14} />1 bot</span><span><Coins size={14} />Mises fixes</span><span><ShieldCheck size={14} />Simulation locale</span></div>
        </section>

        <div className="poker-layout">
          <section className={`poker-table stage-${currentStage}`} aria-label="Texas Hold'em poker table" data-pot={game?.pot || 0} data-player-committed={game?.playerCommitted || 0} data-bot-committed={game?.botCommitted || 0} data-winner={game?.winner || ''} data-stage={currentStage} data-big-blind={game?.bigBlind || bigBlind} data-current-bet={game?.currentBet || 0} data-player-round={game?.playerRound || 0}>
            <div className="poker-table-rail">
              <div className="poker-table-felt">
                <div className="poker-opponent-row">
                  <div className="poker-seat bot-seat"><span className="poker-bot-avatar"><Bot size={22} /><i /></span><div><strong>{game?.botName || 'PawPlay Bot'}</strong><span>{game?.turn === 'bot' && !game.winner ? 'Réflexion…' : 'Adversaire simulé'}</span></div></div>
                  <div className="poker-hole-cards" aria-label="Cartes privées adverses">{game ? game.botCards.map((card, index) => <PokerCard key={`${index}-${card.rank}-${card.suit}`} card={card} hidden={!revealBot} highlighted={revealBot && Boolean(game.botEvaluation && combinationCards([...game.botCards, ...game.community]).some(item => item.rank === card.rank && item.suit === card.suit))} />) : <><PokerCard hidden /><PokerCard hidden /></>}</div>
                  <div className="poker-seat-value"><span>MISE DU BOT</span><strong><GemIcon size={14} />{formatCompact(game?.botCommitted || 0)}</strong></div>
                </div>

                <div className="poker-pot"><span>POT DE DIAMONDS</span><strong><GemIcon size={22} />{formatCompact(game?.pot || 0)}</strong><small>Aucun pet · aucun RAP</small></div>
                <div className="poker-community" aria-label={`Community cards: ${currentStage}`}>{Array.from({ length: 5 }, (_, index) => game?.community[index] ? <PokerCard key={`${index}-${game.community[index].rank}-${game.community[index].suit}`} card={game.community[index]} highlighted={isHighlighted(game.community[index])} /> : <PokerCard key={index} placeholder />)}</div>
                <div className="poker-stages" aria-label="Hand progress">{['preflop', 'flop', 'turn', 'river', 'showdown'].map((stage) => <span key={stage} className={currentStage === stage ? 'active' : ''}>{STAGES[stage]}</span>)}</div>

                <div className="poker-player-row">
                  <div className="poker-seat"><span className="poker-player-avatar">TOI</span><div><strong>Ta main</strong><span>{game?.dealer === 'player' ? 'Bouton donneur' : 'Position grosse blind'}</span></div></div>
                  <div className="poker-hole-cards player-cards" aria-label="Tes cartes privées">{game ? game.playerCards.map((card, index) => <PokerCard key={`${index}-${card.rank}-${card.suit}`} card={card} highlighted={isHighlighted(card)} />) : <><PokerCard hidden /><PokerCard hidden /></>}</div>
                  <div className="poker-seat-value"><span>TA CONTRIBUTION</span><strong><GemIcon size={14} />{formatCompact(game?.playerCommitted || 0)}</strong></div>
                </div>

                {game?.winner && <div className={`poker-result ${game.winner}`} role="status"><span>{game.winner === 'player' ? <Trophy size={21} /> : game.winner === 'tie' ? <Hand size={21} /> : <Bot size={21} />}</span><div><strong>{game.winner === 'player' ? `Tu gagnes ${formatCompact(game.pot)}` : game.winner === 'bot' ? `${game.botName} gagne` : 'Split pot'}</strong><small>{net > 0 ? `+${formatCompact(net)} Diamonds nets` : net < 0 ? `−${formatCompact(Math.abs(net))} Diamonds` : 'Ta contribution en Diamonds est remboursée'}</small></div></div>}
              </div>
            </div>
            {game?.winner && <div className="poker-explanation" role="status"><strong>Pourquoi ce résultat ?</strong><p>{explainPokerResult(game)}</p>{game.playerEvaluation && game.botEvaluation && <small>Toi : {game.playerEvaluation.label} · {game.botName} : {game.botEvaluation.label}</small>}</div>}
            <div className="poker-table-status" aria-live="polite"><span className={game?.turn === 'bot' && !game.winner ? 'thinking' : ''} /><p>{notice || game?.message || 'Aucune main en cours.'}</p>{game && !game.winner && <strong>{game.turn === 'player' ? 'À toi de jouer' : 'Tour du bot'}</strong>}</div>
          </section>

          <aside className="poker-controls">
            <section className="poker-control-card">
              <div className="poker-control-heading"><span>NIVEAU DE TABLE</span><strong>Grosse blind</strong></div>
              <div className="poker-blind-grid">{BLIND_LEVELS.map((amount) => <button key={amount} className={bigBlind === amount ? 'active' : ''} disabled={Boolean(game && !game.winner)} onClick={() => setBigBlind(amount)}><GemIcon size={12} />{formatCompact(amount)}</button>)}</div>
              <div className="poker-blind-summary"><span>Petite blind<strong>{formatCompact(bigBlind / 2)}</strong></span><span>Grosse blind<strong>{formatCompact(bigBlind)}</strong></span></div>
            </section>

            <section className="poker-control-card poker-action-card">
              <div className="poker-control-heading"><span>{game?.winner ? 'MAIN TERMINÉE' : game ? 'À TOI DE CHOISIR' : 'PRÊT À JOUER'}</span><strong>{game?.winner ? winnerLabel(game.winner) : game ? `${STAGES[currentStage]} · ${formatCompact(callAmount)} à suivre` : 'Diamonds uniquement'}</strong></div>
              {!playerEvaluation && highlightedCards.length > 0 && <div className="poker-hand-strength"><span>Ta combinaison actuelle</span><strong>Paire · cartes surlignées</strong></div>}
              {playerEvaluation && <div className="poker-hand-strength"><span>Ta meilleure combinaison</span><strong>{playerEvaluation.label} · cartes surlignées</strong></div>}
              {!game || game.winner ? <button className="poker-deal-button" onClick={startHand} disabled={balance < (game?.winner && game.dealer === 'player' ? bigBlind : bigBlind / 2)}><Spade size={18} /><span>{game?.winner ? 'Main suivante' : 'Distribuer'}</span><ChevronRight size={17} /></button> : <>
                <div className="poker-actions"><button className="poker-fold" onClick={() => playerAction('fold')} disabled={!playerTurn}>Abandonner</button><button className="poker-call" onClick={() => playerAction(callAmount ? 'call' : 'check')} disabled={!playerTurn || balance < callAmount}>{callAmount ? `Suivre ${formatCompact(callAmount)}` : 'Parole'}</button></div>
                <button className="poker-raise" onClick={() => playerAction('raise')} disabled={!playerTurn || game.raises >= 2 || balance < raiseAmount}><span>Relancer {game.raises >= 2 ? 'limite atteinte' : `à ${formatCompact(game.currentBet + game.bigBlind)}`}</span><GemIcon size={15} /></button>
                {balance < callAmount && <p className="poker-insufficient">Solde insuffisant pour suivre. Abandonne ou recharge gratuitement.</p>}
              </>}
              <div className="poker-balance-line"><span>Solde disponible</span><strong><GemIcon size={14} />{formatCompact(balance)}</strong></div>
            </section>

            <section className="poker-rules-card"><ShieldCheck size={16} /><div><strong>Duel à mises fixes</strong><p>Deux relances maximum par tour. Le bot joue avec des Diamonds simulés. Seul ton solde fictif partagé est sauvegardé.</p></div></section>
          </aside>
        </div>

        <section className="poker-history"><div className="poker-history-heading"><span><RotateCcw size={15} />Dernières mains</span><small>{history.length} enregistrées · Diamonds uniquement</small></div>{history.length ? <div className="poker-history-grid">{history.slice(0, 5).map((entry) => <article key={entry.handId} className={entry.winner}><span>{winnerLabel(entry.winner)}</span><div><strong>Toi contre {entry.botName}</strong><small>{entry.playerHand} · {entry.time}</small></div><strong><GemIcon size={13} />{formatCompact(entry.pot)}</strong></article>)}</div> : <div className="poker-history-empty"><Spade size={20} /><span>Aucune main. Distribue les cartes pour commencer.</span></div>}</section>
      </main>
      <footer className="poker-footer"><ShieldCheck size={13} />Poker simulé localement · aucun joueur réel, argent, pet, inventaire ou échange Roblox.</footer>
    </div>
  )
}
