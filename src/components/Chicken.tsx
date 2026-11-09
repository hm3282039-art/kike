import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { appRoute } from '../lib/appUrl'
import { DIAMOND_REFILL, useDiamondBalance, useStoredState } from '../lib/balance'
import './chicken.css'
import { ArrowRight, Diamond, Plus, Check, ChevronRight, Coins, Flag, ShieldCheck, Volume2, VolumeX, X } from 'lucide-react'
import { CHICKEN_ROUTES as STEPS, CHICKEN_MODES, chickenMultiplier, chickenPayout, chickenSurvives, type ChickenMode, type ChickenHistory } from '../lib/chicken'
import { useGameSound } from '../lib/sound'
const fmt = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n)
function ChickenArt() {
  return <svg viewBox="0 0 100 110" fill="none" aria-hidden="true"><ellipse cx="50" cy="101" rx="29" ry="6" fill="#000" opacity=".2"/><path d="M37 87v13m20-13v13M29 101h15m7 0h15" stroke="#ffb147" strokeWidth="6" strokeLinecap="round"/><path d="M26 58 10 46l3 28 19 8" fill="#e5e9ec"/><path d="M76 55c17-2 19 12 5 16" fill="#ffbb4d"/><path d="M41 24c-7-17 5-22 10-10 6-18 20-13 15 2 15-8 22 4 11 12" fill="#ff646a"/><path d="M27 60c0-21 9-37 29-37 23 0 29 17 26 38 13 27-4 38-27 37-25-1-41-15-28-38Z" fill="#fff8e9"/><path d="M34 64c-3 19 15 25 27 15" stroke="#e6d9c6" strokeWidth="6" strokeLinecap="round"/><path d="m79 42 16 9-16 6" fill="#ffb147"/><ellipse cx="70" cy="40" rx="4" ry="5" fill="#253043"/><circle cx="71" cy="38" r="1.2" fill="white"/><path d="M80 59c11 16-4 25-9 8" fill="#ff646a"/></svg>
}
function CarArt({ taxi = false }: { taxi?: boolean }) {
  return <svg viewBox="0 0 70 126" fill="none" aria-hidden="true"><rect x="7" y="18" width="9" height="25" rx="3" fill="#101621"/><rect x="54" y="18" width="9" height="25" rx="3" fill="#101621"/><rect x="7" y="85" width="9" height="25" rx="3" fill="#101621"/><rect x="54" y="85" width="9" height="25" rx="3" fill="#101621"/><rect x="12" y="5" width="46" height="116" rx="14" fill={taxi ? '#f4bd4f' : '#86a8e7'}/><path d="m19 37 5-17h22l5 17v44l-7 24H26l-7-24Z" fill={taxi ? '#d49a35' : '#6486c0'}/><path d="m20 42 7-17h16l7 17Z" fill="#273f57"/><path d="m20 81 7 18h16l7-18Z" fill="#273f57"/><rect x="22" y="47" width="26" height="29" rx="6" fill={taxi ? '#ffdb77' : '#b2c8f2'}/><path d="M18 13h9m16 0h9" stroke="#fff7cd" strokeWidth="5" strokeLinecap="round"/><path d="M18 113h9m16 0h9" stroke="#ef6d73" strokeWidth="4" strokeLinecap="round"/>{taxi && <rect x="28" y="54" width="14" height="8" rx="2" fill="#3f4144"/>}</svg>
}
export default function Chicken() {
  const [balance, setBalance] = useDiamondBalance()
  const [mode, setMode] = useState<ChickenMode>('classic')
  const [target, setTarget] = useState(0)
  const [fast, setFast] = useState(false)
  const [leavingUrl, setLeavingUrl] = useState<string | null>(null)
  const [stake, setStake] = useState(50_000_000)
  const [step, setStep] = useState(0)
  const [impactLane, setImpactLane] = useState<number | null>(null)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'crossing' | 'dead' | 'paid'>('ready')
  const [message, setMessage] = useState('Choisis ta mise et accompagne le poulet jusqu’au prochain refuge.')
  const [history, setHistory] = useStoredState<ChickenHistory[]>('pawplay-chicken-history-v1', [])
  const [soundEnabled, setSoundEnabled] = useState(false)
  const soundRef = useRef(false)
  const playSound = useGameSound()
  const timer = useRef<number>(0)
  const leaveDialog = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const busy = useRef(false)
  const runOpen = useRef(false)
  const allowLeave = useRef(false)
  const config = CHICKEN_MODES[mode]
  const multiplier = chickenMultiplier(step, mode)
  const payout = chickenPayout(stake, step, mode)
  const active = phase === 'playing' || phase === 'crossing'
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const finish = (won: boolean, amount: number, reached: number) => {
    if (!runOpen.current) return
    runOpen.current = false
    setHistory(items => [{ amount, step: reached, won, stake, mode }, ...items].slice(0, 10))
    if (won) setBalance(value => value + amount)
    if (soundRef.current) playSound(won ? 'cashout' : 'collision')
    setPhase(won ? 'paid' : 'dead')
    busy.current = false
  }
  const start = () => {
    if (runOpen.current || busy.current || active || balance < stake || stake < 10_000_000) return
    runOpen.current = true
    setBalance(value => value - stake)
    setImpactLane(null); setStep(0); setPhase('playing');
    if (window.innerWidth <= 800) window.requestAnimationFrame(() => document.querySelector('.chicken-scene')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })); setMessage('Mise engagée une seule fois. Avance ou récupère ta mise avant la première route.')
  }
  const cross = () => {
    if (!runOpen.current || phase !== 'playing' || busy.current) return
    busy.current = true; setPhase('crossing'); setMessage('Traversée en cours… attention à la circulation !')
    const values = new Uint32Array(1); crypto.getRandomValues(values)
    const safe = chickenSurvives(values[0] / 4294967296, mode)
    setImpactLane(safe ? null : step + 1)
    timer.current = window.setTimeout(() => {
      if (!safe) { finish(false, 0, step); setMessage('Collision ! La mise est perdue. Aucun autre Diamond n’est débité.'); return }
      const next = step + 1
      setStep(next)
      if (next === STEPS || (target > 0 && next >= target)) {
        const total = chickenPayout(stake, next, mode)
        finish(true, total, next); setMessage(`Objectif atteint au refuge ${next} : ${fmt(total)} Diamonds encaissés automatiquement !`)
      } else { if (soundRef.current) playSound('refuge'); busy.current = false; setPhase('playing'); setMessage('Refuge atteint. Encaisse maintenant ou tente la prochaine route.') }
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : fast ? 420 : 850)
  }
  const cashout = () => {
    if (!runOpen.current || phase !== 'playing' || busy.current) return
    busy.current = true; finish(true, payout, step); setMessage(`${fmt(payout)} Diamonds crédités à ton solde partagé.`)
  }
  const displayedStep = phase === 'crossing' || phase === 'dead' ? Math.min(step + 1, STEPS) : step
  const nextMultiplier = chickenMultiplier(step + 1, mode)
  const last = history[0]
  const recentNet = history.filter(h => h.stake !== undefined).reduce((sum, h) => sum + h.amount - h.stake!, 0)
  const bestRoute = history.reduce((max, h) => Math.max(max, h.step), 0)
  const securedRuns = history.filter(h => h.won).length
  const currentNet = active ? payout - stake : last?.stake ? last.amount - last.stake : 0
  const guardNavigation = (event: MouseEvent<HTMLElement>) => {
    if (!active) return
    const link = (event.target as Element).closest('a')
    if (link) { event.preventDefault(); returnFocus.current = link; setLeavingUrl(link.href) }
  }
  useEffect(() => {
    if (!active) { setLeavingUrl(null); return }
    const warn = (event: BeforeUnloadEvent) => { if (!allowLeave.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])
  useEffect(() => {
    if (!leavingUrl) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLeavingUrl(null)
      if (event.key === 'Tab') {
        const buttons = leaveDialog.current?.querySelectorAll('button')
        if (!buttons?.length) return
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[buttons.length - 1].focus() }
        else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0].focus() }
      }
    }
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', close)
    return () => { document.body.style.overflow = old; window.removeEventListener('keydown', close); returnFocus.current?.focus() }
  }, [leavingUrl])
  return <div className={`chicken-app mode-${mode} ${fast ? 'fast-mode' : ''} ${active ? 'run-active' : ''}`} style={{ '--run-accent': config.color } as CSSProperties}>
    <header className="chicken-header" onClick={guardNavigation}><a href={appRoute('dice')} className="chicken-brand">paw<span>play</span> <small>ROAD CLUB</small></a><nav aria-label="Navigation principale"><a href={appRoute('dice')}>Color Dice</a><a href={appRoute('poker')}>Poker</a><a href={appRoute('chicken')} aria-current="page">Poulet</a><a href={appRoute('pets')}>Index des pets</a></nav><button onClick={() => setBalance(v => v + DIAMOND_REFILL)} title="Ajouter 25B Diamonds fictifs"><Diamond size={17}/> {fmt(balance)} <Plus size={15}/></button></header>
    <main className="chicken-main">
      <div className="chicken-heading"><div><span className="chicken-eyebrow"><i /> PAWPLAY ORIGINAL · DIAMONDS FICTIFS</span><h1>Chicken <em>Crossing</em><span className="chicken-title-dot">.</span></h1><p>Traverse. Multiplie. Encaisse avant la route de trop.</p></div><div className="chicken-heading-seal"><ShieldCheck size={18}/><span>100 % simulation<small>Aucun pet · aucune valeur réelle</small></span></div></div>
      <section className="chicken-session-stats" aria-label="Bilan des dix dernières traversées"><div><Flag size={15}/><span>Meilleur parcours<strong>{bestRoute}<small> / 12 routes</small></strong></span></div><div><ShieldCheck size={15}/><span>Traversées encaissées<strong>{securedRuns}<small> / {history.length}</small></strong></span></div><div><Coins size={15}/><span>Bilan récent en Diamonds<strong className={recentNet < 0 ? 'negative' : ''}>{recentNet > 0 ? '+' : ''}{fmt(recentNet)}</strong></span></div><p>10 dernières parties · mise déduite du bilan</p></section>
      <div className="chicken-layout">
        <section className={`chicken-scene ${phase}`} aria-label="Plateau du poulet" data-mode={mode} data-step={step} data-phase={phase}>
          <div className="chicken-scene-top"><span><i /> TRAVERSÉE NOCTURNE <small>{config.district} / 12 ROUTES</small></span><button className="chicken-sound" aria-label={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'} aria-pressed={soundEnabled} onClick={() => { soundRef.current = !soundEnabled; setSoundEnabled(!soundEnabled); if (!soundEnabled) playSound('refuge') }}>{soundEnabled ? <Volume2 size={17}/> : <VolumeX size={17}/>} <span>Sons {soundEnabled ? 'activés' : 'coupés'}</span></button></div>
          <div className="chicken-board-label"><span>{phase === 'dead' ? 'FIN DE LA TRAVERSÉE' : phase === 'paid' ? 'BIEN JOUÉ, BIEN ENCAISSÉ' : 'LE PROCHAIN PAS T’APPARTIENT'}</span><strong>×{multiplier.toFixed(2)}</strong></div>
          <div className="chicken-road-window"><div className="chicken-road" style={{ transform: `translateX(-${Math.max(0, displayedStep - 1) * 112}px)` }}>
            <div className="chicken-start"><Flag size={20}/><span>DÉPART</span><div className="road-planter"/></div>
            {Array.from({ length: STEPS }, (_, i) => <div key={i} className={`chicken-lane ${i < step ? 'passed' : ''} ${i === step && active ? 'next' : ''} ${impactLane === i + 1 ? 'impact-lane' : ''}`}>
              <span className="lane-multiplier">{i < step && <Check size={12}/>} ×{chickenMultiplier(i + 1, mode).toFixed(2)}</span>
              <span className="lane-number">{String(i + 1).padStart(2, '0')}</span><div className="lane-dashes"/>
              <span className={`chicken-car ${i % 2 ? 'reverse' : ''}`} style={{ animationDelay: `${-i * .7}s`, animationDuration: `${2.6 + i % 3}s` }}><CarArt taxi={i % 3 === 0}/></span>
              {impactLane === i + 1 && <span className="collision-car"><CarArt taxi/></span>}
              <div className={`lane-refuge ${target === i + 1 ? 'target-refuge' : ''}`} title={target === i + 1 ? 'Objectif d’encaissement automatique' : undefined}>{target === i + 1 ? <Flag size={16}/> : i < step ? <ShieldCheck size={16}/> : <span/>}</div>
            </div>)}
            <div className={`chicken-bird ${phase === 'crossing' ? 'hopping' : ''}`} style={{ left: `${22 + displayedStep * 112 + (displayedStep > 0 && phase !== 'crossing' && phase !== 'dead' ? 44 : 0)}px` }} role="img" aria-label={phase === 'dead' ? 'Poulet heurté' : phase === 'crossing' ? 'Poulet en traversée' : 'Poulet au refuge'}><ChickenArt/>{phase === 'dead' && <span className="impact-stars">✦</span>}</div>
          </div></div>
          <div className="chicken-route-progress" aria-label={`${step} routes réussies sur 12`}>{Array.from({length:STEPS},(_,i)=><i key={i} className={i < step ? 'complete' : i === step && active ? 'current' : ''}/>)}</div>
          <div className="chicken-scene-bottom"><div className="chicken-status-icon">{phase === 'dead' ? <X/> : phase === 'paid' ? <Coins/> : <ShieldCheck/>}</div><div><span>{phase === 'dead' ? 'COLLISION' : phase === 'paid' ? 'DIAMONDS ENCAISSÉS' : `REFUGE ${step} / ${STEPS}`}</span><p role="status" aria-live="polite">{message}</p></div></div>
          <div className="chicken-route-preview"><div><strong>La route en un coup d’œil</strong><span>{target ? `Objectif : refuge ${target}` : 'Encaisse quand tu le décides'}</span></div><ol>{Array.from({length:STEPS},(_,i)=><li key={i} className={`${i < step ? 'reached' : ''} ${target === i + 1 ? 'is-target' : ''}`}><span>{target === i + 1 ? <Flag size={10}/> : String(i + 1).padStart(2,'0')}</span><strong>×{chickenMultiplier(i + 1, mode).toFixed(2)}</strong></li>)}</ol><p><ShieldCheck size={12}/> Atteindre les 12 routes : {(config.survival ** STEPS * 100).toFixed(1)} % de chances · aucun refuge garanti.</p></div>
          {(phase === 'paid' || phase === 'dead') && <div className={`chicken-end-result ${phase}`}><span>{phase === 'paid' ? '✦ TRAVERSÉE ENCAISSÉE' : 'LA ROUTE A GAGNÉ'}</span><strong>{phase === 'paid' ? `+${fmt(last?.amount || 0)}` : `−${fmt(last?.stake || stake)}`} <small>Diamonds</small></strong><p>{phase === 'paid' ? 'Le bon moment pour s’arrêter.' : 'Aucun débit supplémentaire. Retente à ton rythme.'}</p></div>}
        </section>
        <aside className="chicken-panel">
          <div className="chicken-panel-heading"><span className="chicken-eyebrow">POSTE DE COMMANDE</span><span className="chicken-mode">{config.label.toUpperCase()}</span></div><h2>Un pas de plus ?</h2>
          <fieldset className="chicken-difficulty" disabled={active}><legend>Choisis ton rythme</legend><div>{(Object.keys(CHICKEN_MODES) as ChickenMode[]).map(id => <button key={id} aria-pressed={mode === id} onClick={() => { setMode(id); setPhase('ready'); setStep(0); setImpactLane(null); setMessage('Choisis ta mise et accompagne le poulet jusqu’au prochain refuge.') }}><span>{CHICKEN_MODES[id].label}</span><small>{Math.round((1 - CHICKEN_MODES[id].survival) * 100)} % risque</small></button>)}</div><p>{config.description}</p></fieldset>
          <label htmlFor="chicken-stake">Ta mise <span>Diamonds fictifs</span></label><div className="chicken-stake-field"><span><Diamond size={17}/></span><select id="chicken-stake" value={stake} disabled={active} onChange={e => setStake(Number(e.target.value))}>{[10e6,25e6,50e6,100e6,250e6,500e6,1e9,2.5e9,5e9].map(n => <option key={n} value={n}>{fmt(n)}</option>)}</select></div>
          <div className="chicken-quick-stakes">{[10e6,50e6,250e6,1e9].map(n=><button key={n} disabled={active || balance < n} className={stake === n ? 'selected' : ''} onClick={()=>setStake(n)}>{fmt(n)}</button>)}</div>
          <div className="chicken-target"><label htmlFor="chicken-target">Encaissement automatique</label><select id="chicken-target" disabled={active} value={target} onChange={e => setTarget(Number(e.target.value))}><option value={0}>Manuel · à toi de décider</option>{[3,6,9,12].map(n => <option key={n} value={n}>Refuge {n} · ×{chickenMultiplier(n, mode).toFixed(2)}</option>)}</select><p>{target ? `Objectif : ${fmt(chickenPayout(stake, target, mode))} Diamonds · ${(config.survival ** target * 100).toFixed(1)} % de chances de l’atteindre.` : 'Tu peux encaisser à chaque refuge.'} {target > 0 && 'Encaissement anticipé toujours possible.'}</p></div>
          <div className="chicken-return"><span>{active ? 'TU PEUX ENCAISSER' : phase === 'paid' ? 'DERNIER ENCAISSEMENT' : 'MISE DU PROCHAIN DÉPART'}</span><strong><Diamond size={17}/> {fmt(active ? payout : phase === 'paid' ? last?.amount || 0 : stake)}</strong><small>{active ? `×${multiplier.toFixed(2)} · mise incluse` : 'Solde partagé avec Color Dice et Poker'}</small>{(active || phase === 'paid' || phase === 'dead') && <p className={currentNet < 0 ? 'chicken-net negative' : 'chicken-net'}>Bénéfice net : {currentNet > 0 ? '+' : ''}{fmt(currentNet)} Diamonds</p>}</div>
          <div className="chicken-next-return"><span>Prochaine route <small>×{nextMultiplier.toFixed(2)}</small></span><strong>{fmt(Math.floor(stake * nextMultiplier))} <Diamond size={17}/></strong></div>
          {!active ? <button className="chicken-primary" disabled={balance < stake} onClick={start}><span>{phase === 'ready' ? 'Commencer la traversée' : 'Nouvelle traversée'}</span><ArrowRight size={18}/></button> : <><button className="chicken-primary" disabled={phase === 'crossing'} onClick={cross}><span>{phase === 'crossing' ? 'Traversée en cours…' : 'Avancer d’une route'}</span><ArrowRight size={18}/></button><button className="chicken-cashout" disabled={phase === 'crossing'} onClick={cashout}><Coins size={17}/> Encaisser {fmt(payout)}</button></>}
          {balance < stake && !active && <p role="alert" className="chicken-insufficient">Solde insuffisant. Réduis la mise ou utilise le ＋.</p>}
          <div className="chicken-risk-meter"><span>Survie par route <b>{Math.round(config.survival * 100)} %</b></span><div><i style={{width: `${config.survival * 100}%`}}/></div><small>{Math.round((1 - config.survival) * 100)} % de risque de collision à chaque pas</small></div>
          <button className="chicken-speed" aria-pressed={fast} disabled={phase === 'crossing'} onClick={() => setFast(v => !v)}>Animation {fast ? 'rapide · 0,42 s' : 'normale · 0,85 s'} <span>⇄</span></button>
        </aside>
      </div>
      <section className="chicken-how"><div><span>01</span><p><strong>Engage ta mise</strong>De 10M à 5B, uniquement en Diamonds.</p></div><ChevronRight/><div><span>02</span><p><strong>Traverse les routes</strong>Chaque refuge augmente le multiplicateur.</p></div><ChevronRight/><div><span>03</span><p><strong>Choisis quand encaisser</strong>Une collision perd toute la mise du run.</p></div></section>
      <section className="chicken-history"><h2>Le carnet de route <span>TES 10 DERNIÈRES TRAVERSÉES</span></h2>{!history.length ? <div className="chicken-empty"><Flag size={22}/><p>La route est à toi.<small>Ta première traversée apparaîtra ici.</small></p></div> : <div>{history.map((h,i)=><article key={i} className={h.won ? 'won' : 'lost'}><span>{h.won ? <Check size={14}/> : <X size={14}/>} {h.won ? 'Encaissé' : 'Collision'}</span><strong>{h.won ? '+' : h.stake ? '−' : ''}{fmt(h.won ? h.amount : h.stake || 0)} <small><Diamond size={17}/></small></strong><small>Refuge {h.step} / 12 · {CHICKEN_MODES[h.mode || 'classic'].label}</small>{h.stake !== undefined && <small>Net : {h.amount - h.stake > 0 ? '+' : ''}{fmt(h.amount - h.stake)}</small>}</article>)}</div>}</section>
      <details className="chicken-fairness"><summary><ShieldCheck size={15}/> Règles, probabilités et simulation</summary><p>Mode {config.label} : {Math.round(config.survival * 100)} % de survie, {Math.round((1 - config.survival) * 100)} % de collision par route. Les réglages ne peuvent pas changer pendant une traversée. Un objectif encaisse automatiquement après une traversée réussie ; il ne protège pas contre les collisions. Tu dois toujours déclencher chaque pas et peux encaisser avant l’objectif. Tirage aléatoire indépendant. L’animation représente le résultat : le timing des voitures n’est pas un test de réflexes. Une collision perd la mise engagée. Les gains affichés incluent la mise. Dernière route encaissée automatiquement. Retour théorique d’environ 96 % après la première route, arrondi inférieur.</p></details>
      {active && !leavingUrl && <div className="chicken-mobile-actions" aria-label="Actions rapides de la traversée"><button disabled={phase === 'crossing'} onClick={cross}><ArrowRight size={17}/>{phase === 'crossing' ? 'Traversée…' : 'Avancer'}</button><button disabled={phase === 'crossing'} onClick={cashout}><Coins size={17}/>Encaisser {fmt(payout)}</button></div>}
      {leavingUrl && <div className="chicken-leave-backdrop" onClick={e => { if (e.target === e.currentTarget) setLeavingUrl(null) }}><section ref={leaveDialog} className="chicken-leave" role="dialog" aria-modal="true" aria-labelledby="chicken-leave-title"><ShieldCheck size={28}/><h2 id="chicken-leave-title">Une traversée est en cours</h2><p>{phase === 'crossing' ? 'Une route est en cours de résolution. Attends le refuge pour encaisser.' : `Tu peux encore encaisser ${fmt(payout)} Diamonds. Quitter maintenant abandonne ta mise.`}</p><button autoFocus onClick={() => setLeavingUrl(null)}>Rester dans la partie</button><button className="leave-confirm" onClick={() => { allowLeave.current = true; window.location.href = leavingUrl }}>Quitter et abandonner la mise</button></section></div>}
      <p className="chicken-disclaimer">Diamonds fictifs uniquement · aucune valeur monétaire · quitter une traversée en cours abandonne sa mise.</p>
    </main>
  </div>
}
