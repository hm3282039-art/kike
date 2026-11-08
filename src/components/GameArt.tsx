import { Cat, Dog, Ghost, Rabbit, Star } from 'lucide-react'
import { assetUrl } from '../lib/appUrl'

export function PawLogo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradient" x1="7" y1="4" x2="42" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B89AFB" />
          <stop offset=".5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6634D5" />
        </linearGradient>
        <linearGradient id="logo-shine" x1="13" y1="10" x2="32" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="#E5DBFF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#logo-gradient)" />
      <path d="M6 15 24 5l18 10-18 10L6 15Z" fill="white" fillOpacity=".12" />
      <path d="m6 15 18 10v18L6 32V15Z" fill="white" fillOpacity=".06" />
      <g fill="url(#logo-shine)" transform="translate(1 1)">
        <ellipse cx="23" cy="30.5" rx="8.5" ry="7.2" />
        <ellipse cx="12.7" cy="23.3" rx="3.8" ry="5" transform="rotate(-25 12.7 23.3)" />
        <ellipse cx="33.3" cy="23.3" rx="3.8" ry="5" transform="rotate(25 33.3 23.3)" />
        <ellipse cx="19.3" cy="17.8" rx="3.8" ry="5" transform="rotate(-8 19.3 17.8)" />
        <ellipse cx="27.2" cy="17.8" rx="3.8" ry="5" transform="rotate(8 27.2 17.8)" />
      </g>
    </svg>
  )
}

export function PawCoin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="coin-icon">
      <defs>
        <linearGradient id="coin-face" x1="8" y1="5" x2="25" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF2A6" />
          <stop offset=".42" stopColor="#FFC94A" />
          <stop offset="1" stopColor="#E89318" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="#B96C11" />
      <circle cx="16" cy="14.8" r="13.2" fill="url(#coin-face)" stroke="#FFE484" strokeWidth="1.3" />
      <circle cx="16" cy="14.8" r="9.8" stroke="#D98B1D" strokeWidth="1" strokeDasharray="1.5 1.5" />
      <g fill="#A96013" transform="translate(3.2 3) scale(.68)">
        <ellipse cx="16" cy="21" rx="6.4" ry="5.4" />
        <ellipse cx="7.9" cy="15.8" rx="3" ry="4" transform="rotate(-25 7.9 15.8)" />
        <ellipse cx="24.1" cy="15.8" rx="3" ry="4" transform="rotate(25 24.1 15.8)" />
        <ellipse cx="13" cy="11.8" rx="3" ry="4" />
        <ellipse cx="19.4" cy="11.8" rx="3" ry="4" />
      </g>
      <path d="M8.5 8.5c2-3 5.5-4.5 8.7-4.2" stroke="white" strokeOpacity=".75" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function GemIcon({ size = 20 }: { size?: number }) {
  return (
    <img
      className="ps99-gem-icon"
      src={assetUrl('images/gems/ps99-diamond.png')}
      width={size}
      height={size}
      alt=""
      draggable={false}
      aria-hidden="true"
    />
  )
}

export type DiceColor = 'violet' | 'mint' | 'ruby' | 'sky' | 'amber' | 'pink'
type DieProps = { color?: DiceColor; size?: number; dots?: number; className?: string }

export function CubeDie({ color = 'violet', size = 88, dots = 3, className = '' }: DieProps) {
  const palettes: Record<DiceColor, [string, string, string]> = {
    violet: ['#C4A8FF', '#8A55ED', '#5930B6'],
    mint: ['#B6F9DB', '#48D6A0', '#23966F'],
    ruby: ['#FFB0B8', '#EF5B70', '#A82F50'],
    sky: ['#B4E7FF', '#55A9ED', '#3262B6'],
    amber: ['#FFF0A5', '#FFBB3E', '#D67720'],
    pink: ['#FFD0EE', '#ED79C1', '#A43A8C'],
  }
  const [top, left, right] = palettes[color]
  const dotMap: Record<number, [number, number][]> = {
    1: [[50, 31]],
    2: [[39, 28], [61, 34]],
    3: [[37, 27], [50, 31], [63, 35]],
    4: [[39, 25], [50, 36], [61, 28], [48, 22]],
    5: [[38, 25], [50, 36], [62, 28], [47, 20], [54, 31]],
    6: [[38, 23], [38, 31], [50, 36], [50, 27], [62, 26], [62, 34]],
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <path d="m50 6 40 22-40 23L10 28 50 6Z" fill={top} />
      <path d="m10 28 40 23v43L10 70V28Z" fill={left} />
      <path d="m50 51 40-23v42L50 94V51Z" fill={right} />
      <path d="m50 6 40 22v42L50 94 10 70V28L50 6Z" stroke="white" strokeOpacity=".16" strokeWidth="1.5" />
      {(dotMap[dots] || dotMap[3]).map(([cx, cy], index) => (
        <ellipse key={index} cx={cx} cy={cy} rx="4.2" ry="3.2" fill="#291548" fillOpacity=".82" transform={`rotate(2 ${cx} ${cy})`} />
      ))}
      <ellipse cx="30" cy="57" rx="4" ry="5" fill="#351B65" fillOpacity=".72" />
      <ellipse cx="30" cy="73" rx="4" ry="5" fill="#351B65" fillOpacity=".72" />
      <ellipse cx="68" cy="62" rx="4" ry="5" fill="#261346" fillOpacity=".65" transform="rotate(25 68 62)" />
    </svg>
  )
}

export function DiceArt() {
  return (
    <div className="game-art dice-art" aria-hidden="true">
      <span className="art-orb orb-one" />
      <span className="art-orb orb-two" />
      <CubeDie color="violet" size={103} dots={3} className="die-one" />
      <CubeDie color="mint" size={82} dots={5} className="die-two" />
      <CubeDie color="amber" size={61} dots={2} className="die-three" />
      <span className="art-spark spark-one">✦</span>
      <span className="art-spark spark-two">✦</span>
    </div>
  )
}

export function CoinArt() {
  return (
    <div className="game-art coin-art" aria-hidden="true">
      <span className="coin-halo" />
      <div className="big-coin coin-back"><Star size={37} strokeWidth={2.4} /></div>
      <div className="big-coin coin-front"><PawCoin size={92} /></div>
      <PawCoin size={37} />
      <span className="art-spark spark-one">✦</span>
      <span className="art-spark spark-two">✦</span>
    </div>
  )
}

export function RocketArt({ small = false }: { small?: boolean }) {
  return (
    <div className={`game-art rocket-art ${small ? 'small' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 220 150" fill="none" className="rocket-svg">
        <defs>
          <linearGradient id="rocket-body" x1="106" y1="26" x2="139" y2="104" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#C9BDE9" />
          </linearGradient>
          <linearGradient id="rocket-fire" x1="96" y1="102" x2="66" y2="146" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF18B" />
            <stop offset=".45" stopColor="#FF9C41" />
            <stop offset="1" stopColor="#E654BD" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M25 130c31-1 50-12 68-34" stroke="#9B6BFF" strokeOpacity=".28" strokeWidth="2" strokeDasharray="5 7" />
        <g transform="rotate(37 116 80)">
          <path d="M107 93c-2 16-5 31-12 45 13-10 24-24 29-39l-17-6Z" fill="url(#rocket-fire)" />
          <path d="M91 74 73 90l25 4 7-17-14-3Zm39-16 16 19-25 8-4-19 13-8Z" fill="#7744D7" />
          <path d="M105 23c18 7 29 28 25 53l-12 25-26-8-4-27c2-22 6-37 17-43Z" fill="url(#rocket-body)" />
          <path d="M105 23c7 3 13 8 17 14l-31 3c3-8 8-14 14-17Z" fill="#9D67F6" />
          <ellipse cx="110" cy="57" rx="10" ry="11" fill="#553493" />
          <ellipse cx="110" cy="56" rx="6.5" ry="7" fill="#6FE3F5" />
          <path d="m92 93 26 8-4 9-25-8 3-9Z" fill="#6C41B9" />
        </g>
        <g fill="#D6C3FF"><path d="m44 39 2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5 2.5-6Z"/><path d="m179 32 1.7 4 4 1.7-4 1.7-1.7 4-1.7-4-4-1.7 4-1.7 1.7-4Z"/><circle cx="172" cy="113" r="3"/></g>
      </svg>
    </div>
  )
}

export function CaseArt({ opened = false }: { opened?: boolean }) {
  return (
    <div className={`game-art case-art ${opened ? 'is-open' : ''}`} aria-hidden="true">
      <span className="case-glow" />
      <svg viewBox="0 0 210 160" fill="none" className="case-svg">
        <defs>
          <linearGradient id="case-front" x1="105" y1="77" x2="105" y2="145" gradientUnits="userSpaceOnUse"><stop stopColor="#9258E9"/><stop offset="1" stopColor="#4E288D"/></linearGradient>
          <linearGradient id="case-top" x1="70" y1="45" x2="141" y2="95" gradientUnits="userSpaceOnUse"><stop stopColor="#C6A5FF"/><stop offset="1" stopColor="#8651DC"/></linearGradient>
        </defs>
        <ellipse cx="106" cy="140" rx="72" ry="10" fill="#08050D" fillOpacity=".5" />
        <g className="case-lid">
          <path d="m44 70 16-34h93l16 34-63 27-62-27Z" fill="url(#case-top)" />
          <path d="m60 36 9-11h75l9 11-47 22-46-22Z" fill="#D9C2FF" />
          <path d="m44 70 62 27v17L44 87V70Z" fill="#7740C3" />
          <path d="m106 97 63-27v17l-63 27V97Z" fill="#522795" />
        </g>
        <path d="m44 88 62 26v38l-62-26V88Z" fill="url(#case-front)" />
        <path d="m106 114 63-26v38l-63 26v-38Z" fill="#452078" />
        <path d="m96 109 20 8v27l-20-8v-27Z" fill="#F6B93B" />
        <path d="m100 116 12 5v10l-12-5v-10Z" fill="#FFF0A4" />
        <path d="M75 117v14m58-2v14" stroke="#C69BFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="art-spark spark-one">✦</span>
      <span className="art-spark spark-two">✦</span>
    </div>
  )
}

const avatarIcons = [Cat, Dog, Rabbit, Ghost]

export function PlayerAvatar({ index = 0, size = 'medium' }: { index?: number; size?: 'small' | 'medium' | 'large' }) {
  const Icon = avatarIcons[index % avatarIcons.length]
  return (
    <span className={`player-avatar avatar-${index % 6} avatar-${size}`}>
      <Icon strokeWidth={2.1} />
    </span>
  )
}
