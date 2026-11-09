import { useEffect, useRef, useState } from 'react'
import { appRoute } from '../lib/appUrl'
import { DIAMOND_REFILL, useDiamondBalance, useStoredState } from '../lib/balance'
import './chicken.css'
const fmt = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n)
const STEPS = 12
const survival = .82
export default function Chicken() {
  const [balance, setBalance] = useDiamondBalance()
  const [stake, setStake] = useState(50_000_000)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'crossing' | 'dead' | 'paid'>('ready')
  const [message, setMessage] = useState('Choisis ta mise et accompagne le poulet jusqu’au prochain refuge.')
  const [history, setHistory] = useStoredState<{ amount: number; step: number; won: boolean }[]>('pawplay-chicken-history-v1', [])
  const timer = useRef<number>(0)
  const busy = useRef(false)
  const multiplier = step === 0 ? 1 : Math.floor(.96 / survival ** step * 100) / 100
  const payout = Math.floor(stake * multiplier)
  const active = phase === 'playing' || phase === 'crossing'
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const finish = (won: boolean, amount: number, reached: number) => {
    setHistory(items => [{ amount, step: reached, won }, ...items].slice(0, 10))
    if (won) setBalance(value => value + amount)
    setPhase(won ? 'paid' : 'dead')
    busy.current = false
  }
  const start = () => {
    if (busy.current || active || balance < stake || stake < 10_000_000) return
    setBalance(value => value - stake)
    setStep(0); setPhase('playing'); setMessage('Mise engagée une seule fois. Avance ou récupère ta mise avant la première route.')
  }
  const cross = () => {
    if (phase !== 'playing' || busy.current) return
    busy.current = true; setPhase('crossing'); setMessage('Traversée en cours… attention à la circulation !')
    const values = new Uint32Array(1); crypto.getRandomValues(values)
    const safe = values[0] / 4294967296 < survival
    timer.current = window.setTimeout(() => {
      if (!safe) { finish(false, 0, step); setMessage('Collision ! La mise est perdue. Aucun autre Diamond n’est débité.'); return }
      const next = step + 1
      setStep(next)
      if (next === STEPS) {
        const total = Math.floor(stake * (Math.floor(.96 / survival ** next * 100) / 100))
        finish(true, total, next); setMessage(`Dernier refuge atteint : ${fmt(total)} Diamonds encaissés !`)
      } else { busy.current = false; setPhase('playing'); setMessage('Refuge atteint. Encaisse maintenant ou tente la prochaine route.') }
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 850)
  }
  const cashout = () => {
    if (phase !== 'playing' || busy.current) return
    busy.current = true; finish(true, payout, step); setMessage(`${fmt(payout)} Diamonds crédités à ton solde partagé.`)
  }
  return <div className="chicken-app">
    <header className="chicken-header"><a href={appRoute('dice')} className="chicken-brand">paw<span>play</span> <small>ROAD CLUB</small></a><nav aria-label="Navigation principale"><a href={appRoute('dice')}>Color Dice</a><a href={appRoute('poker')}>Poker</a><a href={appRoute('chicken')} aria-current="page">Chicken</a><a href={appRoute('pets')}>Pet Index</a></nav><button onClick={() => setBalance(v => v + DIAMOND_REFILL)} title="Ajouter 25B Diamonds fictifs">💎 {fmt(balance)} <b>＋</b></button></header>
    <main className="chicken-main"><div className="chicken-heading"><div><span className="chicken-eyebrow">DIAMONDS ONLY / LOCAL SIMULATION</span><h1>Chicken <em>Crossing.</em></h1><p>Un petit pas. Un gros risque. Sais quand t’arrêter.</p></div><span className="chicken-live">● 12 routes · 1 poulet · zéro pet</span></div>
    <div className="chicken-layout"><section className={`chicken-scene ${phase}`} aria-label="Plateau du poulet" data-step={step} data-phase={phase}>
      <div className="chicken-scene-top"><span>NEON DISTRICT <small>01 / NIGHT RUN</small></span><strong>💎 ×{multiplier.toFixed(2)}</strong></div>
      <div className="chicken-road-window"><div className="chicken-road" style={{ transform: `translateX(-${Math.max(0, step - 2) * 88}px)` }}><div className="chicken-start">SAFE<br/>ZONE</div>{Array.from({ length: STEPS }, (_, i) => <div key={i} className={`chicken-lane ${i < step ? 'passed' : ''} ${i === step && active ? 'next' : ''}`}><span className="lane-multiplier">×{(Math.floor(.96 / survival ** (i + 1) * 100) / 100).toFixed(2)}</span><span className="chicken-car" style={{ animationDelay: `${-i * .7}s`, animationDuration: `${2 + i % 3}s` }}>{i % 2 ? '🚕' : '🚙'}</span><small>{String(i + 1).padStart(2, '0')}</small></div>)}<div className={`chicken-bird ${phase === 'crossing' ? 'hopping' : ''}`} style={{ left: `${24 + step * 88}px` }} role="img" aria-label={phase === 'dead' ? 'Poulet heurté' : 'Poulet au refuge'}>{phase === 'dead' ? '💥' : '🐔'}</div></div></div>
      <div className="chicken-scene-bottom"><span>REFUGE <strong>{step} / {STEPS}</strong></span><p role="status" aria-live="polite">{message}</p></div>
    </section><aside className="chicken-panel"><span className="chicken-eyebrow">TON RUN</span><h2>Chaque pas compte.</h2><label htmlFor="chicken-stake">Mise en Diamonds fictifs</label><select id="chicken-stake" value={stake} disabled={active} onChange={e => setStake(Number(e.target.value))}>{[10e6,25e6,50e6,100e6,250e6,500e6,1e9,2.5e9,5e9].map(n => <option key={n} value={n}>{fmt(n)} Diamonds</option>)}</select><div className="chicken-return"><span>{active ? 'ENCAISSEMENT DISPONIBLE' : 'MISE SÉLECTIONNÉE'}</span><strong>💎 {fmt(active ? payout : stake)}</strong><small>{step > 0 ? `×${multiplier.toFixed(2)} · mise incluse` : 'Pas de pet. Pas de RAP.'}</small></div>{!active ? <button className="chicken-primary" disabled={balance < stake} onClick={start}>{phase === 'ready' ? 'Commencer le run' : 'Rejouer'} →</button> : <><button className="chicken-primary" disabled={phase === 'crossing'} onClick={cross}>{phase === 'crossing' ? 'Traversée…' : 'Avancer d’une route →'}</button><button className="chicken-cashout" disabled={phase === 'crossing'} onClick={cashout}>Encaisser {fmt(payout)} 💎</button></>}{balance < stake && !active && <p role="alert">Solde insuffisant. Réduis la mise ou utilise le ＋.</p>}<p className="chicken-risk">Chaque route : <b>82 % de survie / 18 % de collision.</b> Tirage aléatoire indépendant : le timing des voitures est décoratif, pas un test de réflexes. Une collision perd toute la mise du run. Retour théorique ~96 % après la première route, arrondi inférieur.</p></aside></div>
    <section className="chicken-history"><h2>Dernières traversées <span>LOCAL HISTORY</span></h2>{!history.length ? <p>Ta première traversée commence ici.</p> : <div>{history.map((h,i) => <article key={i} className={h.won ? 'won' : 'lost'}><span>{h.won ? '↗ Encaissé' : '× Collision'}</span><strong>{h.won ? '+' : ''}{fmt(h.amount)} 💎</strong><small>Refuge {h.step} / 12</small></article>)}</div>}</section><p className="chicken-disclaimer">Simulation locale · Diamonds fictifs uniquement · aucune valeur monétaire. Quitter un run en cours abandonne sa mise.</p></main></div>
}
