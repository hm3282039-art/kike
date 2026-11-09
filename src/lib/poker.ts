export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Card = { rank: number; suit: Suit }
export type PokerStage = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'
export type PokerActor = 'player' | 'bot'
export type PokerAction = 'fold' | 'check' | 'call' | 'raise'
export type PokerWinner = PokerActor | 'tie'

export type HandEvaluation = {
  score: number[]
  label: string
  cards: Card[]
}

export type PokerGame = {
  handId: number
  deck: Card[]
  playerCards: Card[]
  botCards: Card[]
  community: Card[]
  stage: PokerStage
  dealer: PokerActor
  turn: PokerActor
  botName: string
  bigBlind: number
  pot: number
  playerCommitted: number
  botCommitted: number
  playerRound: number
  botRound: number
  currentBet: number
  raises: number
  acted: Record<PokerActor, boolean>
  winner: PokerWinner | null
  playerEvaluation: HandEvaluation | null
  botEvaluation: HandEvaluation | null
  message: string
  folded: PokerActor | null
}

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const CATEGORY_NAMES = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush']
const RANK_NAMES: Record<number, string> = { 14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: 'Ten', 9: 'Nine', 8: 'Eight', 7: 'Seven', 6: 'Six', 5: 'Five', 4: 'Four', 3: 'Three', 2: 'Two' }

function randomInt(max: number) {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return Math.floor((values[0] / (0xffffffff + 1)) * max)
}

export function shuffledDeck(): Card[] {
  const deck = SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, index): Card => ({ rank: index + 2, suit })))
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const other = randomInt(index + 1)
    ;[deck[index], deck[other]] = [deck[other], deck[index]]
  }
  return deck
}

function straightHigh(ranks: number[]) {
  const unique = [...new Set(ranks)].sort((a, b) => b - a)
  if (unique.includes(14)) unique.push(1)
  for (let index = 0; index <= unique.length - 5; index += 1) {
    if (unique[index] - unique[index + 4] === 4) return unique[index]
  }
  return 0
}

function evaluateFive(cards: Card[]): HandEvaluation {
  const ranks = cards.map((card) => card.rank).sort((a, b) => b - a)
  const flush = cards.every((card) => card.suit === cards[0].suit)
  const straight = straightHigh(ranks)
  const groups = new Map<number, number>()
  ranks.forEach((rank) => groups.set(rank, (groups.get(rank) || 0) + 1))
  const grouped = [...groups.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])
  const counts = grouped.map((entry) => entry[1])
  let score: number[]

  if (flush && straight) score = [8, straight]
  else if (counts[0] === 4) score = [7, grouped[0][0], grouped[1][0]]
  else if (counts[0] === 3 && counts[1] === 2) score = [6, grouped[0][0], grouped[1][0]]
  else if (flush) score = [5, ...ranks]
  else if (straight) score = [4, straight]
  else if (counts[0] === 3) score = [3, grouped[0][0], ...grouped.slice(1).map((entry) => entry[0]).sort((a, b) => b - a)]
  else if (counts[0] === 2 && counts[1] === 2) {
    const pairs = grouped.filter((entry) => entry[1] === 2).map((entry) => entry[0]).sort((a, b) => b - a)
    const kicker = grouped.find((entry) => entry[1] === 1)![0]
    score = [2, ...pairs, kicker]
  } else if (counts[0] === 2) score = [1, grouped[0][0], ...grouped.slice(1).map((entry) => entry[0]).sort((a, b) => b - a)]
  else score = [0, ...ranks]

  const detail = score[0] === 8 || score[0] === 4 || score[0] === 0
    ? `${RANK_NAMES[score[1]]} high`
    : RANK_NAMES[score[1]]
  return { score, label: `${CATEGORY_NAMES[score[0]]} · ${detail}`, cards }
}

export function compareEvaluations(a: HandEvaluation, b: HandEvaluation) {
  const length = Math.max(a.score.length, b.score.length)
  for (let index = 0; index < length; index += 1) {
    const difference = (a.score[index] || 0) - (b.score[index] || 0)
    if (difference) return difference > 0 ? 1 : -1
  }
  return 0
}

export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) throw new Error('At least five cards are required')
  let best: HandEvaluation | null = null
  for (let a = 0; a < cards.length - 4; a += 1) {
    for (let b = a + 1; b < cards.length - 3; b += 1) {
      for (let c = b + 1; c < cards.length - 2; c += 1) {
        for (let d = c + 1; d < cards.length - 1; d += 1) {
          for (let e = d + 1; e < cards.length; e += 1) {
            const evaluation = evaluateFive([cards[a], cards[b], cards[c], cards[d], cards[e]])
            if (!best || compareEvaluations(evaluation, best) > 0) best = evaluation
          }
        }
      }
    }
  }
  return best!
}

export function comparePokerHands(player: Card[], bot: Card[], community: Card[]) {
  return compareEvaluations(evaluateHand([...player, ...community]), evaluateHand([...bot, ...community]))
}

export function estimateEquity(holeCards: Card[], community: Card[], iterations = 70) {
  const known = new Set([...holeCards, ...community].map((card) => `${card.rank}-${card.suit}`))
  const available = SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, index): Card => ({ rank: index + 2, suit })))
    .filter((card) => !known.has(`${card.rank}-${card.suit}`))
  let equity = 0
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const deck = [...available]
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const other = randomInt(index + 1)
      ;[deck[index], deck[other]] = [deck[other], deck[index]]
    }
    const opponent = deck.slice(0, 2)
    const runout = deck.slice(2, 2 + (5 - community.length))
    const board = [...community, ...runout]
    const comparison = comparePokerHands(holeCards, opponent, board)
    equity += comparison > 0 ? 1 : comparison === 0 ? 0.5 : 0
  }
  return equity / iterations
}

function settleShowdown(game: PokerGame): PokerGame {
  const playerEvaluation = evaluateHand([...game.playerCards, ...game.community])
  const botEvaluation = evaluateHand([...game.botCards, ...game.community])
  const comparison = compareEvaluations(playerEvaluation, botEvaluation)
  const winner: PokerWinner = comparison > 0 ? 'player' : comparison < 0 ? 'bot' : 'tie'
  return {
    ...game,
    stage: 'showdown',
    winner,
    playerEvaluation,
    botEvaluation,
    message: winner === 'player' ? 'You win the Diamonds pot.' : winner === 'bot' ? `${game.botName} wins the Diamonds pot.` : 'Split pot — equal poker hands.',
  }
}

function advanceStreet(game: PokerGame): PokerGame {
  if (game.stage === 'river') return settleShowdown(game)
  const stage: PokerStage = game.stage === 'preflop' ? 'flop' : game.stage === 'flop' ? 'turn' : 'river'
  const count = stage === 'flop' ? 3 : 1
  const community = [...game.community, ...game.deck.slice(0, count)]
  const next = {
    ...game,
    stage,
    community,
    deck: game.deck.slice(count),
    playerRound: 0,
    botRound: 0,
    currentBet: 0,
    raises: 0,
    acted: { player: false, bot: false },
    turn: game.dealer === 'player' ? 'bot' as const : 'player' as const,
    message: `${stage[0].toUpperCase()}${stage.slice(1)} dealt.`,
  }
  return next
}

export function createPokerHand(handId: number, bigBlind: number, dealer: PokerActor, botName: string): PokerGame {
  const deck = shuffledDeck()
  const smallBlind = bigBlind / 2
  const playerBlind = dealer === 'player' ? smallBlind : bigBlind
  const botBlind = dealer === 'bot' ? smallBlind : bigBlind
  return {
    handId,
    playerCards: [deck[0], deck[2]],
    botCards: [deck[1], deck[3]],
    deck: deck.slice(4),
    community: [],
    stage: 'preflop',
    dealer,
    turn: dealer,
    botName,
    bigBlind,
    pot: playerBlind + botBlind,
    playerCommitted: playerBlind,
    botCommitted: botBlind,
    playerRound: playerBlind,
    botRound: botBlind,
    currentBet: bigBlind,
    raises: 0,
    acted: { player: false, bot: false },
    winner: null,
    playerEvaluation: null,
    botEvaluation: null,
    message: `${dealer === 'player' ? 'You are' : `${botName} is`} on the button. Blinds are in Diamonds only.`,
    folded: null,
  }
}

export function applyPokerAction(game: PokerGame, actor: PokerActor, action: PokerAction): PokerGame {
  if (game.turn !== actor || game.winner || game.stage === 'idle' || game.stage === 'showdown') return game
  const opponent: PokerActor = actor === 'player' ? 'bot' : 'player'
  const actorName = actor === 'player' ? 'You' : game.botName
  if (action === 'fold') {
    return { ...game, stage: 'showdown', winner: opponent, folded: actor, turn: opponent, message: `${actorName} folded. ${opponent === 'player' ? 'You win' : `${game.botName} wins`} the Diamonds pot.` }
  }

  const roundKey = actor === 'player' ? 'playerRound' : 'botRound'
  const committedKey = actor === 'player' ? 'playerCommitted' : 'botCommitted'
  const call = Math.max(0, game.currentBet - game[roundKey])
  if (action === 'check' && call > 0) return game
  if (action === 'call' && call === 0) action = 'check'

  let added = 0
  let nextBet = game.currentBet
  let nextRaises = game.raises
  if (action === 'call') added = call
  if (action === 'raise') {
    added = call + game.bigBlind
    nextBet = game.currentBet + game.bigBlind
    nextRaises += 1
  }

  const next: PokerGame = {
    ...game,
    [roundKey]: game[roundKey] + added,
    [committedKey]: game[committedKey] + added,
    pot: game.pot + added,
    currentBet: nextBet,
    raises: nextRaises,
    acted: {
      ...game.acted,
      [actor]: true,
      ...(action === 'raise' ? { [opponent]: false } : {}),
    },
    message: action === 'check' ? `${actorName} checked.` : action === 'call' ? `${actorName} called.` : `${actorName} raised the Diamonds bet.`,
  }
  const roundComplete = next.acted.player && next.acted.bot && next.playerRound === next.botRound
  if (!roundComplete) return { ...next, turn: opponent }
  return advanceStreet(next)
}

export function chooseBotAction(game: PokerGame): PokerAction {
  const call = Math.max(0, game.currentBet - game.botRound)
  const equity = estimateEquity(game.botCards, game.community)
  const random = randomInt(100) / 100
  const canRaise = game.raises < 2
  if (call > 0) {
    if (equity < 0.3 && call > game.bigBlind / 2 && random < 0.76) return 'fold'
    if (canRaise && (equity > 0.7 || random < 0.055)) return 'raise'
    return 'call'
  }
  if (canRaise && (equity > 0.64 || random < 0.09)) return 'raise'
  return 'check'
}

// Only the combination itself glows; kickers stay neutral for readable hands.
export function combinationCards(cards: Card[]): Card[] {
  if (cards.length < 5) return cards.filter(card => cards.filter(other => other.rank === card.rank).length > 1)
  const best = evaluateHand(cards)
  const category = best.score[0]
  if (!category) return []
  if ([4, 5, 6, 8].includes(category)) return best.cards
  const ranks = category === 2 ? best.score.slice(1, 3) : [best.score[1]]
  return best.cards.filter(card => ranks.includes(card.rank))
}
