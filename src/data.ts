export type GameId = 'dice' | 'upgrader' | 'coinflip' | 'rocket' | 'cases'
export type ViewId = 'home' | 'leaderboard' | 'rewards' | 'guide'

export type Game = {
  id: GameId
  title: string
  shortTitle: string
  description: string
  tag: string
  category: 'solo' | 'multi'
  players: number
  accent: string
}

export const games: Game[] = [
  {
    id: 'dice',
    title: 'Color Dice Duels',
    shortTitle: 'Color Dice',
    description: 'Choisis 2 couleurs, lance 4 dés. Le plus de correspondances remporte le pot.',
    tag: 'Featured',
    category: 'multi',
    players: 128,
    accent: 'violet',
  },
  {
    id: 'upgrader',
    title: 'Upgrader',
    shortTitle: 'Upgrader',
    description: 'Tente d’améliorer ton pet PS99 et vise une récompense plus rare.',
    tag: 'New!',
    category: 'solo',
    players: 73,
    accent: 'cyan',
  },
  {
    id: 'coinflip',
    title: 'Paw ou Étoile',
    shortTitle: 'Coinflip',
    description: 'Une pièce, deux faces. Choisis bien et décroche la victoire.',
    tag: 'Duel',
    category: 'multi',
    players: 64,
    accent: 'amber',
  },
  {
    id: 'rocket',
    title: 'Crash',
    shortTitle: 'Crash',
    description: 'Encaisse tes PawCoins avant que la fusée ne s’arrête.',
    tag: 'Gems Only',
    category: 'solo',
    players: 91,
    accent: 'pink',
  },
  {
    id: 'cases',
    title: 'PS99 Cases',
    shortTitle: 'Cases',
    description: 'Ouvre un coffre et découvre quel pet PS99 se cache dedans.',
    tag: 'Collection',
    category: 'solo',
    players: 47,
    accent: 'cyan',
  },
]

export const leaderboard = [
  { name: 'LunaByte', points: 98450, wins: 184, avatar: 0, badge: 'Titanic collector' },
  { name: 'Foxtron', points: 87200, wins: 161, avatar: 1, badge: 'Maître des dés' },
  { name: 'Mochi_', points: 75680, wins: 149, avatar: 2, badge: 'Chance cosmique' },
  { name: 'KiwiSplash', points: 62420, wins: 133, avatar: 3, badge: '' },
  { name: 'CaptainPaw', points: 58190, wins: 128, avatar: 4, badge: '' },
  { name: 'NéonNino', points: 49870, wins: 102, avatar: 5, badge: '' },
  { name: 'PixelPoppy', points: 42110, wins: 96, avatar: 2, badge: '' },
  { name: 'ZedLeVif', points: 36780, wins: 81, avatar: 1, badge: '' },
]

export const initialMessages = [
  { id: 1, user: 'LunaByte', avatar: 0, time: '21:42', text: 'Quelqu’un pour un Color Dice Duel ?' },
  { id: 2, user: 'Foxtron', avatar: 1, time: '21:42', text: 'Je viens d’avoir 3 violets !!', type: 'win', amount: 2400 },
  { id: 3, user: 'Mochi_', avatar: 2, time: '21:43', text: 'Gg Fox, ça brille par ici !' },
  { id: 4, user: 'KiwiSplash', avatar: 3, time: '21:44', text: 'Le Huge Amethyst Dragon est incroyable !' },
  { id: 5, user: 'CaptainPaw', avatar: 4, time: '21:45', text: 'Rocket à x4.20, je sors juste à temps !' },
  { id: 6, user: 'PawBot', avatar: 5, time: '21:45', text: 'Rappel : les PawCoins sont 100 % fictifs. Amusez-vous !', type: 'system' },
  { id: 7, user: 'NéonNino', avatar: 5, time: '21:46', text: 'On se retrouve sur le classement !' },
]

export function formatCoins(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value))
}

export function randomInt(max: number) {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return Math.floor((array[0] / (0xffffffff + 1)) * max)
}
