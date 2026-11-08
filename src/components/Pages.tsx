import { useState } from 'react'
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Coins, Crown, Dices, Gamepad2, Gift, Heart, Medal, RotateCcw, ShieldCheck, Sparkles, Star, Target, Trophy, Zap } from 'lucide-react'
import type { GameId } from '../data'
import { formatCoins, games, leaderboard } from '../data'
import { PawCoin, PlayerAvatar } from './GameArt'

export function LeaderboardPage({ balance, gamesPlayed, onPlay }: { balance: number; gamesPlayed: number; onPlay: (id: GameId) => void }) {
  const [period, setPeriod] = useState<'week' | 'all'>('week')
  const multiplier = period === 'week' ? 1 : 4.7
  return (
    <div className="standard-page page-enter">
      <div className="page-heading">
        <div><span className="eyebrow"><Trophy size={13} /> COMMUNAUTÉ</span><h1>Le top de la meute</h1><p>Des pattes agiles, des coups d’éclat et un soupçon de chance.</p></div>
        <div className="segmented-control"><button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Cette semaine</button><button className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>Depuis toujours</button></div>
      </div>

      <section className="podium-section">
        <div className="podium-glow" />
        {[leaderboard[1], leaderboard[0], leaderboard[2]].map((player, index) => {
          const place = [2, 1, 3][index]
          return (
            <div className={`podium-player podium-${place}`} key={player.name}>
              {place === 1 && <Crown className="podium-crown" size={32} fill="currentColor" />}
              <div className="podium-avatar"><PlayerAvatar index={player.avatar} size="large" /><span>{place}</span></div>
              <strong>{player.name}</strong>
              <span className="podium-badge">{player.badge || `Top ${place}`}</span>
              <div className="podium-score"><PawCoin size={19} />{formatCoins(player.points * multiplier)}</div>
              <div className="podium-base"><strong>{place}</strong><span>{player.wins} victoires</span></div>
            </div>
          )
        })}
      </section>

      <section className="ranking-panel panel-card">
        <div className="ranking-header"><span>Rang & joueur</span><span>Victoires</span><span>PawCoins gagnés</span></div>
        {leaderboard.slice(3).map((player, index) => (
          <div className="ranking-row" key={player.name}>
            <div><span className="ranking-number">{index + 4}</span><PlayerAvatar index={player.avatar} /><strong>{player.name}</strong></div>
            <span>{player.wins}</span>
            <strong className="ranking-coins"><PawCoin size={18} />{formatCoins(player.points * multiplier)}</strong>
          </div>
        ))}
        <div className="ranking-row current-player-row">
          <div><span className="ranking-number">28</span><PlayerAvatar index={0} /><strong>Alex <span className="you-badge">TOI</span></strong></div>
          <span>{gamesPlayed}</span>
          <strong className="ranking-coins"><PawCoin size={18} />{formatCoins(balance)}</strong>
        </div>
      </section>
      <div className="ranking-cta"><div><span className="section-icon"><Gamepad2 size={20} /></span><div><strong>Envie de gravir le classement ?</strong><p>Chaque partie compte. La prochaine victoire est peut-être la tienne.</p></div></div><button className="primary-button" onClick={() => onPlay('dice')}>Jouer maintenant <ArrowRight size={17} /></button></div>
    </div>
  )
}

type RewardsProps = {
  dailyClaimed: boolean
  gameCounts: Record<GameId, number>
  claimedMissions: string[]
  onClaimDaily: () => void
  onClaimMission: (id: string, reward: number) => void
  onPlay: (id: GameId) => void
}

export function RewardsPage({ dailyClaimed, gameCounts, claimedMissions, onClaimDaily, onClaimMission, onPlay }: RewardsProps) {
  const missions = [
    { id: 'three-games', title: 'Échauffement de pattes', description: 'Joue 3 parties, peu importe le jeu.', progress: Object.values(gameCounts).reduce((sum, count) => sum + count, 0), goal: 3, reward: 300, icon: Gamepad2, game: 'dice' as GameId },
    { id: 'rocket-explorer', title: 'Cap sur les étoiles', description: 'Lance une fusée dans Crash.', progress: gameCounts.rocket, goal: 1, reward: 200, icon: Zap, game: 'rocket' as GameId },
    { id: 'case-collector', title: 'Petit collectionneur', description: 'Ouvre ta première caisse PS99.', progress: gameCounts.cases, goal: 1, reward: 250, icon: Gift, game: 'cases' as GameId },
  ]
  return (
    <div className="standard-page rewards-page page-enter">
      <div className="page-heading"><div><span className="eyebrow"><Gift size={13} /> CADEAUX & DÉFIS</span><h1>La réserve de PawCoins</h1><p>Des PawCoins gratuits pour prolonger le fun. Revient chaque jour !</p></div><span className="fiction-badge"><ShieldCheck size={15} /> 100 % gratuit & fictif</span></div>

      <section className="daily-reward-hero">
        <div className="daily-reward-copy"><span className="hero-badge"><CalendarDays size={13} /> RÉCOMPENSE QUOTIDIENNE</span><h2>Un petit cadeau<br />chaque grand jour.</h2><p>Connecte-toi chaque jour pour garder ta série et faire grossir les récompenses.</p><button className="primary-button" disabled={dailyClaimed} onClick={onClaimDaily}>{dailyClaimed ? <Check size={18} /> : <Gift size={18} />}{dailyClaimed ? 'Cadeau du jour récupéré' : 'Récupérer 750 PawCoins'}<ArrowRight size={17} /></button></div>
        <div className="reward-days">
          {[100, 150, 250, 400, 500, 750, 1200].map((amount, index) => (
            <div className={`reward-day ${index < 2 || (index === 2 && dailyClaimed) ? 'done' : ''} ${index === 2 && !dailyClaimed ? 'today' : ''}`} key={amount}>
              <span>Jour {index + 1}</span>{index === 6 ? <img className="reward-ps99-pet" src="/images/pets/huge-amethyst-dragon.png" alt="Huge Amethyst Dragon" /> : <PawCoin size={index === 2 ? 35 : 29} />}<strong>{formatCoins(amount)}</strong>{index < 2 || (index === 2 && dailyClaimed) ? <Check className="day-check" size={13} /> : index === 2 ? <small>AUJOURD’HUI</small> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="missions-section">
        <div className="section-heading"><div><span className="section-icon pink-icon"><Target size={19} /></span><h2>Missions du moment</h2><span className="count-badge">3</span></div><span className="reset-time">Nouvelles missions dans 08:42:16</span></div>
        <div className="missions-list">
          {missions.map((mission) => {
            const progress = Math.min(mission.progress, mission.goal)
            const completed = progress >= mission.goal
            const claimed = claimedMissions.includes(mission.id)
            const Icon = mission.icon
            return (
              <div className={`mission-card ${claimed ? 'mission-claimed' : ''}`} key={mission.id}>
                <span className="mission-icon"><Icon size={24} /></span>
                <div className="mission-info"><strong>{mission.title}</strong><p>{mission.description}</p><div className="mission-progress"><div className="progress-track"><span style={{ width: `${(progress / mission.goal) * 100}%` }} /></div><small>{progress} / {mission.goal}</small></div></div>
                <span className="mission-reward"><PawCoin size={19} />+{mission.reward}</span>
                {claimed ? <button className="claimed-button" disabled>Récupéré ✓</button> : completed ? <button className="primary-button small-button" onClick={() => onClaimMission(mission.id, mission.reward)}>Récupérer</button> : <button className="secondary-button" onClick={() => onPlay(mission.game)}>Jouer <ChevronRight size={15} /></button>}
              </div>
            )
          })}
        </div>
      </section>

      <section className="collection-teaser panel-card"><div><span className="eyebrow"><Sparkles size={13} /> TA COLLECTION</span><h2>Un compagnon pour chaque histoire.</h2><p>Ouvre les caisses PS99 et découvre toute la bande. Les pets sont purement décoratifs.</p><button className="secondary-button" onClick={() => onPlay('cases')}>Découvrir les coffres <ArrowRight size={16} /></button></div><div className="collection-pets">{['huge-happy-rock', 'huge-rainbow-unicorn', 'huge-amethyst-dragon', 'titanic-arcane-cat'].map((pet) => <span key={pet} className="collection-pet"><img src={`/images/pets/${pet}.png`} alt={pet.replaceAll('-', ' ')} /></span>)}</div></section>
    </div>
  )
}

const faqs = [
  { q: 'Les PawCoins ont-ils une valeur réelle ?', a: 'Non. Les PawCoins sont des points de démonstration entièrement fictifs. Ils ne peuvent être ni achetés, ni vendus, ni échangés, ni retirés.' },
  { q: 'Comment les résultats sont-ils générés ?', a: 'Cette démo utilise le générateur cryptographique du navigateur pour les tirages aléatoires. Tout se passe localement sur ton appareil : il n’y a ni serveur de jeu ni compte réel.' },
  { q: 'PawPlay est-il lié à Roblox ou BloxyPet ?', a: 'Non. PawPlay est un projet d’interface original et indépendant, sans connexion à Roblox, à BloxyPet ou à un quelconque inventaire externe.' },
  { q: 'Que se passe-t-il si mon solde tombe à zéro ?', a: 'Aucun souci : ouvre n’importe quel jeu et utilise le bouton de recharge gratuite, ou réinitialise la démo depuis cette page. Il n’y a rien à payer.' },
]

export function GuidePage({ onPlay, onReset }: { onPlay: (id: GameId) => void; onReset: () => void }) {
  const [openFaq, setOpenFaq] = useState(0)
  return (
    <div className="standard-page guide-page page-enter">
      <div className="guide-hero"><div><span className="hero-badge"><BookOpen size={13} /> GUIDE DU NOUVEL EXPLORATEUR</span><h1>Bienvenue dans<br /><span>la meute PawPlay.</span></h1><p>Une petite arcade colorée pour jouer sans pression, sans argent et sans prise de tête.</p><button className="primary-button" onClick={() => onPlay('dice')}>Faire ma première partie <ArrowRight size={17} /></button></div><div className="guide-mascot"><img className="guide-ps99-mascot" src="/images/pets/huge-amethyst-dragon.png" alt="Huge Amethyst Dragon" /><span>Les pets PS99 sont là !</span></div></div>
      <div className="guide-principles">
        <div><span><PawCoin size={30} /></span><h3>Des coins 100 % fictifs</h3><p>Pas d’achat, pas de dépôt, pas de retrait. Ton solde est seulement un compteur de jeu sauvegardé sur cet appareil.</p></div>
        <div><span><ShieldCheck size={29} /></span><h3>Un espace sans pression</h3><p>Ici, on joue pour le plaisir. Fais une pause quand tu veux et recharge gratuitement si tu perds tout.</p></div>
        <div><span><Heart size={29} /></span><h3>Une meute bienveillante</h3><p>Le chat est une simulation locale dans cette démo. Dans une vraie communauté, respecte toujours les autres joueurs.</p></div>
      </div>
      <section className="how-to-section"><div className="section-heading"><div><span className="section-icon"><Dices size={19} /></span><h2>Choisis ton aventure</h2></div></div><div className="how-to-grid">{games.map((game, index) => <button key={game.id} onClick={() => onPlay(game.id)}><span className="how-to-number">0{index + 1}</span><span className={`section-icon accent-${game.accent}`}>{game.id === 'rocket' ? <Zap size={21} /> : game.id === 'cases' ? <Gift size={21} /> : game.id === 'coinflip' ? <Coins size={21} /> : <Dices size={21} />}</span><h3>{game.title}</h3><p>{game.description}</p><strong>Essayer <ArrowRight size={15} /></strong></button>)}</div></section>
      <section className="faq-section"><div><span className="eyebrow"><CircleHelp size={13} /> ON TE DIT TOUT</span><h2>Les questions de la meute</h2><p>Tout ce qu’il faut savoir avant de rejoindre l’arcade.</p></div><div className="faq-list">{faqs.map((faq, index) => <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={faq.q}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{faq.q}</span><ChevronDown size={18} /></button>{openFaq === index && <p>{faq.a}</p>}</div>)}</div></section>
      <section className="demo-reset"><div><span className="section-icon"><RotateCcw size={20} /></span><div><strong>Envie de repartir à zéro ?</strong><p>Réinitialise ton solde, tes statistiques et tes cadeaux. Cette action concerne uniquement la démo locale.</p></div></div><button className="secondary-button" onClick={onReset}>Réinitialiser la démo</button></section>
      <div className="independent-note"><Star size={15} /><span>Projet de démonstration indépendant. Aucune affiliation avec Roblox, Pet Simulator ou BloxyPet.</span><Medal size={15} /></div>
    </div>
  )
}
