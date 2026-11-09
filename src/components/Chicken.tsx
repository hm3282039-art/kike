import { useEffect, useRef, useState } from 'react'
import { appRoute } from '../lib/appUrl'
import { DIAMOND_REFILL, useDiamondBalance, useStoredState } from '../lib/balance'
import './chicken.css'
import { ArrowRight, Diamond, Plus, Check, ChevronRight, Coins, Flag, ShieldCheck, Volume2, VolumeX, X } from 'lucide-react'
import { useGameSound } from '../lib/sound'
const fmt = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n)
const STEPS = 12
const survival = .82
function ChickenArt() {
  return <svg viewBox="0 0 100 110" fill="none" aria-hidden="true"><ellipse cx="50" cy="101" rx="29" ry="6" fill="#000" opacity=".2"/><path d="M37 87v13m20-13v13M29 101h15m7 0h15" stroke="#ffb147" strokeWidth="6" strokeLinecap="round"/><path d="M26 58 10 46l3 28 19 8" fill="#e5e9ec"/><path d="M76 55c17-2 19 12 5 16" fill="#ffbb4d"/><path d="M41 24c-7-17 5-22 10-10 6-18 20-13 15 2 15-8 22 4 11 12" fill="#ff646a"/><path d="M27 60c0-21 9-37 29-37 23 0 29 17 26 38 13 27-4 38-27 37-25-1-41-15-28-38Z" fill="#fff8e9"/><path d="M34 64c-3 19 15 25 27 15" stroke="#e6d9c6" strokeWidth="6" strokeLinecap="round"/><path d="m79 42 16 9-16 6" fill="#ffb147"/><ellipse cx="70" cy="40" rx="4" ry="5" fill="#253043"/><circle cx="71" cy="38" r="1.2" fill="white"/><path d="M80 59c11 16-4 25-9 8" fill="#ff646a"/></svg>
}
function CarArt({ taxi = false }: { taxi?: boolean }) {
  return <svg viewBox="0 0 70 126" fill="none" aria-hidden="true"><rect x="7" y="18" width="9" height="25" rx="3" fill="#101621"/><rect x="54" y="18" width="9" height="25" rx="3" fill="#101621"/><rect x="7" y="85" width="9" height="25" rx="3" fill="#101621"/><rect x="54" y="85" width="9" height="25" rx="3" fill="#101621"/><rect x="12" y="5" width="46" height="116" rx="14" fill={taxi ? '#f4bd4f' : '#86a8e7'}/><path d="m19 37 5-17h22l5 17v44l-7 24H26l-7-24Z" fill={taxi ? '#d49a35' : '#6486c0'}/><path d="m20 42 7-17h16l7 17Z" fill="#273f57"/><path d="m20 81 7 18h16l7-18Z" fill="#273f57"/><rect x="22" y="47" width="26" height="29" rx="6" fill={taxi ? '#ffdb77' : '#b2c8f2'}/><path d="M18 13h9m16 0h9" stroke="#fff7cd" strokeWidth="5" strokeLinecap="round"/><path d="M18 113h9m16 0h9" stroke="#ef6d73" strokeWidth="4" strokeLinecap="round"/>{taxi && <rect x="28" y="54" width="14" height="8" rx="2" fill="#3f4144"/>}</svg>
}
export default function Chicken() {
  const [balance, setBalance] = useDiamondBalance()
  const [stake, setStake] = useState(50_000_000)
  const [step, setStep] = useState(0)
  const [impactLane, setImpactLane] = useState<number | null>(null)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'crossing' | 'dead' | 'paid'>('ready')
  const [message, setMessage] = useState('Choisis ta mise et accompagne le poulet jusqu’au prochain refuge.')
  const [history, setHistory] = useStoredState<{ amount: number; step: number; won: boolean; stake?: number }[]>('pawplay-chicken-history-v1', [])
  const [soundEnabled, setSoundEnabled] = useState(false)
  const soundRef = useRef(false)
  const playSound = useGameSound()
  const timer = useRef<number>(0)
  const busy = useRef(false)
  const multiplier = step === 0 ? 1 : Math.floor(.96 / survival ** step * 100) / 100
  const payout = Math.floor(stake * multiplier)
  const active = phase === 'playing' || phase === 'crossing'
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const finish = (won: boolean, amount: number, reached: number) => {
    setHistory(items => [{ amount, step: reached, won, stake }, ...items].slice(0, 10))
    if (won) setBalance(value => value + amount)
    if (soundRef.current) playSound(won ? 'cashout' : 'collision')
    setPhase(won ? 'paid' : 'dead')
    busy.current = false
  }
  const start = () => {
    if (busy.current || active || balance < stake || stake < 10_000_000) return
    setBalance(value => value - stake)
    setImpactLane(null); setStep(0); setPhase('playing'); setMessage('Mise engagée une seule fois. Avance ou récupère ta mise avant la première route.')
  }
  const cross = () => {
    if (phase !== 'playing' || busy.current) return
    busy.current = true; setPhase('crossing'); setMessage('Traversée en cours… attention à la circulation !')
    const values = new Uint32Array(1); crypto.getRandomValues(values)
    const safe = values[0] / 4294967296 < survival
    setImpactLane(safe ? null : step + 1)
    timer.current = window.setTimeout(() => {
      if (!safe) { finish(false, 0, step); setMessage('Collision ! La mise est perdue. Aucun autre Diamond n’est débité.'); return }
      const next = step + 1
      setStep(next)
      if (next === STEPS) {
        const total = Math.floor(stake * (Math.floor(.96 / survival ** next * 100) / 100))
        finish(true, total, next); setMessage(`Dernier refuge atteint : ${fmt(total)} Diamonds encaissés !`)
      } else { if (soundRef.current) playSound('refuge'); busy.current = false; setPhase('playing'); setMessage('Refuge atteint. Encaisse maintenant ou tente la prochaine route.') }
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 850)
  }
  const cashout = () => {
    if (phase !== 'playing' || busy.current) return
    busy.current = true; finish(true, payout, step); setMessage(`${fmt(payout)} Diamonds crédités à ton solde partagé.`)
  }
  const displayedStep = phase === 'crossing' || phase === 'dead' ? Math.min(step + 1, STEPS) : step
  const nextMultiplier = Math.floor(.96 / survival ** Math.min(step + 1, STEPS) * 100) / 100
  const last = history[0]
  return <div className="chicken-app">
    <header className="chicken-header"><a href={appRoute('dice')} className="chicken-brand">paw<span>play</span> <small>ROAD CLUB</small></a><nav aria-label="Navigation principale"><a href={appRoute('dice')}>Color Dice</a><a href={appRoute('poker')}>Poker</a><a href={appRoute('chicken')} aria-current="page">Poulet</a><a href={appRoute('pets')}>Index des pets</a></nav><button onClick={() => setBalance(v => v + DIAMOND_REFILL)} title="Ajouter 25B Diamonds fictifs"><Diamond size={17}/> {fmt(balance)} <Plus size={15}/></button></header>
    <main className="chicken-main">
      <div className="chicken-heading"><div><span className="chicken-eyebrow"><i /> PAWPLAY ORIGINAL · DIAMONDS FICTIFS</span><h1>Chicken <em>Crossing</em><span className="chicken-title-dot">.</span></h1><p>Traverse. Multiplie. Encaisse avant la route de trop.</p></div><div className="chicken-heading-seal"><ShieldCheck size={18}/><span>100 % simulation<small>Aucun pet · aucune valeur réelle</small></span></div></div>
      <div className="chicken-layout">
        <section className={`chicken-scene ${phase}`} aria-label="Plateau du poulet" data-step={step} data-phase={phase}>
          <div className="chicken-scene-top"><span><i /> NIGHT SHIFT <small>QUARTIER NÉON / 12 ROUTES</small></span><button className="chicken-sound" aria-label={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'} aria-pressed={soundEnabled} onClick={() => { soundRef.current = !soundEnabled; setSoundEnabled(!soundEnabled); if (!soundEnabled) playSound('refuge') }}>{soundEnabled ? <Volume2 size={17}/> : <VolumeX size={17}/>} <span>Sons {soundEnabled ? 'activés' : 'coupés'}</span></button></div>
          <div className="chicken-board-label"><span>{phase === 'dead' ? 'FIN DE LA TRAVERSÉE' : phase === 'paid' ? 'BIEN JOUÉ, BIEN ENCAISSÉ' : 'LE PROCHAIN PAS T’APPARTIENT'}</span><strong>×{multiplier.toFixed(2)}</strong></div>
          <div className="chicken-road-window"><div className="chicken-road" style={{ transform: `translateX(-${Math.max(0, displayedStep - 1) * 112}px)` }}>
            <div className="chicken-start"><Flag size={20}/><span>DÉPART</span><div className="road-planter"/></div>
            {Array.from({ length: STEPS }, (_, i) => <div key={i} className={`chicken-lane ${i < step ? 'passed' : ''} ${i === step && active ? 'next' : ''} ${impactLane === i + 1 ? 'impact-lane' : ''}`}>
              <span className="lane-multiplier">{i < step && <Check size={12}/>} ×{(Math.floor(.96 / survival ** (i + 1) * 100) / 100).toFixed(2)}</span>
              <span className="lane-number">{String(i + 1).padStart(2, '0')}</span><div className="lane-dashes"/>
              <span className={`chicken-car ${i % 2 ? 'reverse' : ''}`} style={{ animationDelay: `${-i * .7}s`, animationDuration: `${2.6 + i % 3}s` }}><CarArt taxi={i % 3 === 0}/></span>
              {impactLane === i + 1 && <span className="collision-car"><CarArt taxi/></span>}
              <div className="lane-refuge">{i < step ? <ShieldCheck size={16}/> : <span/>}</div>
            </div>)}
            <div className={`chicken-bird ${phase === 'crossing' ? 'hopping' : ''}`} style={{ left: `${22 + displayedStep * 112 + (displayedStep > 0 && phase !== 'crossing' && phase !== 'dead' ? 44 : 0)}px` }} role="img" aria-label={phase === 'dead' ? 'Poulet heurté' : phase === 'crossing' ? 'Poulet en traversée' : 'Poulet au refuge'}><ChickenArt/>{phase === 'dead' && <span className="impact-stars">✦</span>}</div>
          </div></div>
          <div className="chicken-route-progress" aria-label={`${step} routes réussies sur 12`}>{Array.from({length:STEPS},(_,i)=><i key={i} className={i < step ? 'complete' : i === step && active ? 'current' : ''}/>)}</div>
          <div className="chicken-scene-bottom"><div className="chicken-status-icon">{phase === 'dead' ? <X/> : phase === 'paid' ? <Coins/> : <ShieldCheck/>}</div><div><span>{phase === 'dead' ? 'COLLISION' : phase === 'paid' ? 'DIAMONDS ENCAISSÉS' : `REFUGE ${step} / ${STEPS}`}</span><p role="status" aria-live="polite">{message}</p></div></div>
          {(phase === 'paid' || phase === 'dead') && <div className={`chicken-end-result ${phase}`}><span>{phase === 'paid' ? '✦ TRAVERSÉE ENCAISSÉE' : 'LA ROUTE A GAGNÉ'}</span><strong>{phase === 'paid' ? `+${fmt(last?.amount || 0)}` : `−${fmt(last?.stake || stake)}`} <small>Diamonds</small></strong><p>{phase === 'paid' ? 'Le bon moment pour s’arrêter.' : 'Aucun débit supplémentaire. Retente à ton rythme.'}</p></div>}
        </section>
        <aside className="chicken-panel">
          <div className="chicken-panel-heading"><span className="chicken-eyebrow">POSTE DE COMMANDE</span><span className="chicken-mode">CLASSIQUE</span></div><h2>Un pas de plus ?</h2>
          <label htmlFor="chicken-stake">Ta mise <span>Diamonds fictifs</span></label><div className="chicken-stake-field"><span><Diamond size={17}/></span><select id="chicken-stake" value={stake} disabled={active} onChange={e => setStake(Number(e.target.value))}>{[10e6,25e6,50e6,100e6,250e6,500e6,1e9,2.5e9,5e9].map(n => <option key={n} value={n}>{fmt(n)}</option>)}</select></div>
          <div className="chicken-quick-stakes">{[10e6,50e6,250e6,1e9].map(n=><button key={n} disabled={active || balance < n} className={stake === n ? 'selected' : ''} onClick={()=>setStake(n)}>{fmt(n)}</button>)}</div>
          <div className="chicken-return"><span>{active ? 'TU PEUX ENCAISSER' : phase === 'paid' ? 'DERNIER ENCAISSEMENT' : 'MISE DU PROCHAIN DÉPART'}</span><strong><Diamond size={17}/> {fmt(active ? payout : phase === 'paid' ? last?.amount || 0 : stake)}</strong><small>{active ? `×${multiplier.toFixed(2)} · mise incluse` : 'Solde partagé avec Color Dice et Poker'}</small></div>
          <div className="chicken-next-return"><span>Prochaine route <small>×{nextMultiplier.toFixed(2)}</small></span><strong>{fmt(Math.floor(stake * nextMultiplier))} <Diamond size={17}/></strong></div>
          {!active ? <button className="chicken-primary" disabled={balance < stake} onClick={start}><span>{phase === 'ready' ? 'Commencer la traversée' : 'Nouvelle traversée'}</span><ArrowRight size={18}/></button> : <><button className="chicken-primary" disabled={phase === 'crossing'} onClick={cross}><span>{phase === 'crossing' ? 'Traversée en cours…' : 'Avancer d’une route'}</span><ArrowRight size={18}/></button><button className="chicken-cashout" disabled={phase === 'crossing'} onClick={cashout}><Coins size={17}/> Encaisser {fmt(payout)}</button></>}
          {balance < stake && !active && <p role="alert" className="chicken-insufficient">Solde insuffisant. Réduis la mise ou utilise le ＋.</p>}
          <div className="chicken-risk-meter"><span>Survie par route <b>82 %</b></span><div><i/></div><small>18 % de risque de collision à chaque pas</small></div>
        </aside>
      </div>
      <section className="chicken-how"><div><span>01</span><p><strong>Engage ta mise</strong>De 10M à 5B, uniquement en Diamonds.</p></div><ChevronRight/><div><span>02</span><p><strong>Traverse les routes</strong>Chaque refuge augmente le multiplicateur.</p></div><ChevronRight/><div><span>03</span><p><strong>Choisis quand encaisser</strong>Une collision perd toute la mise du run.</p></div></section>
      <section className="chicken-history"><h2>Le carnet de route <span>TES 10 DERNIÈRES TRAVERSÉES</span></h2>{!history.length ? <div className="chicken-empty"><Flag size={22}/><p>La route est à toi.<small>Ta première traversée apparaîtra ici.</small></p></div> : <div>{history.map((h,i)=><article key={i} className={h.won ? 'won' : 'lost'}><span>{h.won ? <Check size={14}/> : <X size={14}/>} {h.won ? 'Encaissé' : 'Collision'}</span><strong>{h.won ? '+' : h.stake ? '−' : ''}{fmt(h.won ? h.amount : h.stake || 0)} <small><Diamond size={17}/></small></strong><small>Refuge {h.step} / 12</small></article>)}</div>}</section>
      <details className="chicken-fairness"><summary><ShieldCheck size={15}/> Règles, probabilités et simulation</summary><p>Chaque route : 82 % de survie, 18 % de collision. Tirage aléatoire indépendant. L’animation représente le résultat : le timing des voitures n’est pas un test de réflexes. Une collision perd la mise engagée. Les gains affichés incluent la mise. Dernière route encaissée automatiquement. Retour théorique d’environ 96 % après la première route, arrondi inférieur.</p></details>
      <p className="chicken-disclaimer">Diamonds fictifs uniquement · aucune valeur monétaire · quitter une traversée en cours abandonne sa mise.</p>
    </main>
  </div>
}
