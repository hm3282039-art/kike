import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, ChevronRight, Clock3, Coins, Dices, Gift, History, Info, PackageOpen, Play, SearchX, ShieldCheck, Sparkles, Swords, Ticket, TrendingUp, Trophy, Users, Zap } from 'lucide-react'
import type { GameId, ViewId } from '../data'
import { formatCoins, games } from '../data'
import { CaseArt, CoinArt, DiceArt, PawCoin, PlayerAvatar, RocketArt } from './GameArt'

type HomeProps = {
  balance: number
  dailyClaimed: boolean
  gamesPlayed: number
  searchQuery: string
  onPlay: (id: GameId) => void
  onClaimDaily: () => void
  onNavigate: (view: ViewId) => void
}

function UpgraderCardArt() {
  return (
    <div className="game-art upgrader-card-art" aria-hidden="true">
      <img src="/images/pets/huge-happy-rock.png" alt="" />
      <span><TrendingUp size={26} /></span>
      <img src="/images/pets/huge-amethyst-dragon.png" alt="" />
    </div>
  )
}

const gameArt: Record<GameId, React.ReactNode> = {
  dice: <DiceArt />,
  upgrader: <UpgraderCardArt />,
  coinflip: <CoinArt />,
  rocket: <RocketArt />,
  cases: <CaseArt />,
}

const duelRows = [
  { player: 'LunaByte', opponent: 'Foxtron', avatar: 0, otherAvatar: 1, pot: 800, score: '2–1', pets: ['titanic-arcane-cat', 'huge-amethyst-dragon', 'huge-rainbow-unicorn'] },
  { player: 'Mochi_', opponent: 'En attente', avatar: 2, otherAvatar: 4, pot: 400, score: 'JOIN', pets: ['huge-happy-rock', 'rainbow-huge-nightfall-pegasus'] },
  { player: 'KiwiSplash', opponent: 'CaptainPaw', avatar: 3, otherAvatar: 4, pot: 250, score: '3–0', pets: ['titanic-kitsune-fox', 'huge-pumpkin-cat', 'huge-bread-shiba'] },
]

export default function Home({ balance, dailyClaimed, gamesPlayed, searchQuery, onPlay, onClaimDaily, onNavigate }: HomeProps) {
  const [filter, setFilter] = useState<'all' | 'multi' | 'solo'>('all')
  const [joinedGiveaway, setJoinedGiveaway] = useState(false)
  const visibleGames = useMemo(() => games.filter((game) => {
    const categoryMatches = filter === 'all' || game.category === filter
    const query = searchQuery.trim().toLocaleLowerCase('fr')
    return categoryMatches && (!query || `${game.title} ${game.description}`.toLocaleLowerCase('fr').includes(query))
  }), [filter, searchQuery])
  const showingCatalog = Boolean(searchQuery.trim()) || filter !== 'all'
  const featuredGames = showingCatalog ? visibleGames : ['dice', 'upgrader', 'rocket'].map((id) => games.find((game) => game.id === id)!)

  return (
    <div className="home-page bloxy-home page-enter">
      <section className="giveaway-ribbon">
        <div className="giveaway-pet-thumb"><img src="/images/pets/gargantuan-evil-scarecrow-pumpkin.png" alt="Gargantuan Evil Scarecrow Pumpkin" /><span><Sparkles size={12} /></span></div>
        <div className="giveaway-title"><span>GIVEAWAY</span><strong>Gargantuan Evil Scarecrow Pumpkin</strong></div>
        <span className="giveaway-value"><PawCoin size={19} />124 000</span>
        <span className="giveaway-joined"><Users size={14} />{joinedGiveaway ? '388' : '387'} joined</span>
        <div className="giveaway-countdown"><span><strong>16</strong><small>DAYS</small></span><b>:</b><span><strong>06</strong><small>HRS</small></span><b>:</b><span><strong>54</strong><small>MIN</small></span></div>
        <button className={joinedGiveaway ? 'joined-giveaway' : ''} onClick={() => setJoinedGiveaway(true)} disabled={joinedGiveaway}>{joinedGiveaway ? 'Joined ✓' : 'Join Now'}<ArrowRight size={15} /></button>
      </section>

      <section className="ps99-welcome-banner">
        <div className="welcome-grid-pattern" />
        <div className="ps99-welcome-copy">
          <span className="hero-badge"><Sparkles size={13} /> BIENVENUE SUR PAWPLAY !</span>
          <h1>L’arcade n°1<br />pour les <span>pets PS99.</span></h1>
          <p>Des duels colorés, des pets emblématiques et des récompenses fictives. Aucun dépôt. Aucun vrai objet. Juste du fun.</p>
          <div className="hero-actions"><button className="primary-button hero-play" onClick={() => onPlay('dice')}><Play size={17} fill="currentColor" /> Play Now <ArrowRight size={18} /></button><button className="hero-info" aria-label="Comment jouer" onClick={() => onNavigate('guide')}><Info size={19} /></button></div>
          <span className="welcome-fiction"><ShieldCheck size={14} /> Fan-made demo · 100 % monnaie fictive</span>
        </div>
        <div className="ps99-pet-stage" aria-label="Pets Pet Simulator 99 en vedette">
          <span className="pet-stage-glow" />
          <span className="floating-gem gem-a">◆</span><span className="floating-gem gem-b">◆</span><span className="floating-gem gem-c">◆</span>
          <div className="ps99-pet-cube pet-cube-back pet-cube-unicorn"><img src="/images/pets/huge-rainbow-unicorn.png" alt="Huge Rainbow Unicorn" /></div>
          <div className="ps99-pet-cube pet-cube-back pet-cube-arcane"><img src="/images/pets/titanic-arcane-cat.png" alt="Titanic Arcane Cat" /></div>
          <div className="ps99-pet-cube pet-cube-main"><img src="/images/pets/huge-amethyst-dragon.png" alt="Huge Amethyst Dragon" /><span>HUGE</span></div>
          <div className="pet-stage-name"><span>FEATURED PET</span><strong>Huge Amethyst Dragon</strong></div>
        </div>
      </section>

      <section className="ps99-promo-grid">
        <button className="ps99-promo special-cases-promo" onClick={() => onPlay('cases')}>
          <div className="promo-copy"><span className="promo-label">NEW SPECIAL CASES!</span><h2>Des caisses remplies de pets !</h2><p>Ouvre les caisses spéciales et découvre les visuels PS99 les plus rares.</p><strong>View Special Cases <ArrowRight size={15} /></strong></div>
          <div className="promo-pet-stack"><img src="/images/pets/titanic-kitsune-fox.png" alt="Titanic Kitsune Fox" /><img src="/images/pets/shiny-titanic-banana-cat.png" alt="Shiny Titanic Banana Cat" /><img src="/images/pets/rainbow-titanic-blue-balloon-cat.png" alt="Rainbow Titanic Blue Balloon Cat" /></div>
        </button>
        <button className={`ps99-promo free-cases-promo ${dailyClaimed ? 'claimed' : ''}`} onClick={onClaimDaily} disabled={dailyClaimed}>
          <div className="promo-copy"><span className="promo-label">DAILY REWARDS</span><h2>{dailyClaimed ? 'Récompense récupérée !' : 'Free Cases & PawCoins !'}</h2><p>{dailyClaimed ? 'Reviens demain pour une nouvelle récompense gratuite.' : 'Ton cadeau gratuit du jour est prêt. Aucun achat, maintenant et pour toujours.'}</p><strong>{dailyClaimed ? 'À demain ✓' : 'Claim +750'} {!dailyClaimed && <PawCoin size={17} />}</strong></div>
          <div className="free-case-visual"><CaseArt /><span>+750</span></div>
        </button>
      </section>

      <section className="games-section bloxy-games" id="games">
        <div className="section-heading">
          <div><span className="section-icon"><Swords size={19} /></span><h2>Popular Games</h2><span className="count-badge">{games.length}</span></div>
          <div className="game-filters" aria-label="Filtrer les jeux"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tous</button><button className={filter === 'multi' ? 'active' : ''} onClick={() => setFilter('multi')}>Multijoueur</button><button className={filter === 'solo' ? 'active' : ''} onClick={() => setFilter('solo')}>Solo</button></div>
        </div>
        {featuredGames.length > 0 ? <div className="games-grid bloxy-games-grid">{featuredGames.map((game) => (
          <button className={`game-card game-card-${game.accent}`} key={game.id} onClick={() => onPlay(game.id)}>
            <div className="game-card-art">{gameArt[game.id]}<span className={`game-tag tag-${game.accent}`}>{game.id === 'rocket' && <Zap size={11} fill="currentColor" />}{game.tag}</span><span className="round-play"><Play size={19} fill="currentColor" /></span></div>
            <div className="game-card-content"><h3>{game.title}</h3><p>{game.description}</p><div className="game-card-footer"><span><span className="live-dot" />{game.players} en jeu</span><strong>Play <ArrowRight size={15} /></strong></div></div>
          </button>
        ))}</div> : <div className="empty-search"><SearchX size={34} /><h3>Aucun jeu trouvé</h3><p>Essaie un autre nom ou change de filtre.</p></div>}
      </section>

      {!showingCatalog && <>
        <section className="more-section">
          <div className="section-heading"><div><span className="section-icon"><Sparkles size={18} /></span><h2>More</h2></div></div>
          <div className="bloxy-more-grid">
            <button onClick={() => onPlay('coinflip')}><span className="more-icon amber"><Coins size={20} /></span><div><strong>Coinflip</strong><p>1v1 PvP, choisis ta face et remporte le pot fictif.</p></div><span className="more-go">Go <ArrowRight size={14} /></span></button>
            <button onClick={() => onPlay('cases')}><span className="more-icon violet"><PackageOpen size={20} /></span><div><strong>Cases</strong><p>Ouvre des caisses pour découvrir des pets PS99.</p></div><span className="more-go">Go <ArrowRight size={14} /></span></button>
            <button onClick={() => onNavigate('leaderboard')}><span className="more-icon gold"><Trophy size={20} /></span><div><strong>Leaderboard</strong><p>Découvre les meilleurs joueurs de la meute.</p></div><span className="more-go">Go <ArrowRight size={14} /></span></button>
            <button onClick={() => onNavigate('rewards')}><span className="more-icon pink"><Gift size={20} /></span><div><strong>Giveaways & Rewards</strong><p>Des récompenses gratuites et 100 % fictives.</p></div><span className="more-go">Go <ArrowRight size={14} /></span></button>
            <button onClick={() => onPlay('dice')}><span className="more-icon green"><History size={20} /></span><div><strong>Duel History</strong><p>Rejoins un Color Dice Duel et teste tes couleurs.</p></div><span className="more-go">Go <ArrowRight size={14} /></span></button>
            <button onClick={() => onNavigate('guide')}><span className="more-icon cyan"><BookOpen size={20} /></span><div><strong>How It Works</strong><p>Règles, tirages locaux et fonctionnement de la démo.</p></div><span className="more-go">Go <ArrowRight size={14} /></span></button>
          </div>
        </section>

        <section className="duel-lobby-preview">
          <div className="duel-lobby-header"><div><span className="section-icon"><Dices size={19} /></span><div><h2>Color Dice Duels</h2><p>Pick 2 colors, roll 4 dice. The player whose colors appear most wins the pot.</p></div></div><button className="primary-button" onClick={() => onPlay('dice')}>Create Duel <ArrowRight size={15} /></button></div>
          <div className="duel-stats"><span><strong>6</strong>Open Matches</span><span><strong>2 450</strong>Total PawCoins</span><span><strong>26</strong>PS99 Items</span><span className="duel-rules"><ShieldCheck size={14} />Local & simulated</span></div>
          <div className="duel-table-heading"><span>PLAYERS</span><span>PETS IN THE POT</span><span>VALUE</span><span>SCORE</span><span /></div>
          {duelRows.map((duel) => <button className="duel-preview-row" key={duel.player} onClick={() => onPlay('dice')}>
            <div className="duel-players"><PlayerAvatar index={duel.avatar} size="small" /><span>VS</span><PlayerAvatar index={duel.otherAvatar} size="small" /><div><strong>{duel.player}</strong><small>{duel.opponent}</small></div></div>
            <div className="duel-pet-list">{duel.pets.map((pet) => <img key={pet} src={`/images/pets/${pet}.png`} alt={pet.replaceAll('-', ' ')} />)}<span>+{duel.pets.length * 3}</span></div>
            <strong className="duel-pot-value"><PawCoin size={17} />{formatCoins(duel.pot)}</strong>
            <span className={`duel-score ${duel.score === 'JOIN' ? 'join-score' : ''}`}>{duel.score}</span><ChevronRight size={16} />
          </button>)}
          <button className="view-all-duels" onClick={() => onPlay('dice')}>View all Color Dice Duels <ArrowRight size={15} /></button>
        </section>
      </>}

      <footer className="home-footer"><span><PawCoin size={17} /> Ton solde : <strong>{formatCoins(balance)} PawCoins</strong></span><span><ShieldCheck size={15} /> Fan-made · Aucun vrai pet · Aucun retrait</span><span><Clock3 size={14} />{gamesPlayed} parties · <Ticket size={14} /> Mode démo</span></footer>
    </div>
  )
}
