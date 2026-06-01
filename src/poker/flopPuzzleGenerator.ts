import type {
  Card, CardRank, Suit, Puzzle, FlopPuzzleTheme,
  OpponentType, PreflopRole, OpponentFlopAction,
  PotType, StackDepth, Position,
} from './types';
import { solveFlopPuzzle } from './flopStrategyEngine';

const RANKS: CardRank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) { r -= w; if (r <= 0) return key; }
  return entries[entries.length - 1][0];
}

const THEME_WEIGHTS: Record<FlopPuzzleTheme, number> = {
  'value-bet-strong-top-pair': 14,
  'pot-control-weak-top-pair': 16,
  'charge-draws-on-wet-board': 10,
  'continue-strong-draw': 12,
  'fold-weak-draw-to-big-bet': 12,
  'c-bet-good-board': 10,
  'do-not-bluff-calling-station': 10,
  'respect-passive-aggression': 8,
  'let-maniac-bluff': 4,
  'do-not-marry-one-pair': 4,
};

type CardKey = string;
function key(c: Card): CardKey { return `${c.rank}${c.suit}`; }

function dealCard(rank: CardRank, exclude: Card[]): Card {
  const excSet = new Set(exclude.map(key));
  const available = SUITS.filter(s => !excSet.has(`${rank}${s}`));
  if (available.length === 0) throw new Error(`Cannot deal ${rank}: all suits excluded`);
  return { rank, suit: pick(available) };
}

function dealAnyCard(exclude: Card[], ranks: CardRank[]): Card {
  const excSet = new Set(exclude.map(key));
  const pool: Card[] = [];
  for (const rank of ranks) for (const suit of SUITS) {
    if (!excSet.has(`${rank}${suit}`)) pool.push({ rank, suit });
  }
  if (pool.length === 0) throw new Error('Card pool exhausted');
  return pick(pool);
}

function dealHand(r1: CardRank, r2: CardRank, suited: boolean): [Card, Card] {
  const s1 = pick(SUITS);
  if (r1 === r2) {
    const s2 = pick(SUITS.filter(s => s !== s1));
    return [{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }];
  }
  if (suited) return [{ rank: r1, suit: s1 }, { rank: r2, suit: s1 }];
  const s2 = pick(SUITS.filter(s => s !== s1));
  return [{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }];
}

// Low unrelated ranks for filler board cards
const LOW_RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8'];
const MID_RANKS: CardRank[] = ['6', '7', '8', '9', 'T'];

// Pot sizes by context (100/200 blinds)
// small < 500, medium 500-800, big 900-1200
function potSizeFor(role: PreflopRole, large = false): number {
  if (large) return pick([900, 1000, 1100, 1200]);
  switch (role) {
    case 'limped-pot':    return pick([300, 400, 500]);
    case 'blind-defender':
    case 'preflop-caller': return pick([500, 600, 700]);
    case 'preflop-raiser': return pick([600, 700, 800]);
  }
}

function isHighRank(r: CardRank): boolean {
  return ['A', 'K', 'Q', 'J'].includes(r);
}

// ---- Theme-specific scenario generators ----

type FlopScenario = {
  heroCards: [Card, Card];
  flop: [Card, Card, Card];
  preflopRole: PreflopRole;
  opponentFlopAction: OpponentFlopAction;
  opponentType: OpponentType;
  isHeroInPosition: boolean;
  potType: PotType;
  stackDepth: StackDepth;
  potSize: number;
};

function genValueBetStrongTopPair(): FlopScenario {
  const hands: [CardRank, CardRank, boolean][] = [
    ['A', 'K', false], ['A', 'Q', false], ['A', 'J', false],
    ['K', 'Q', false], ['K', 'J', false], ['Q', 'J', false],
  ];
  const [r1, r2, suited] = pick(hands);
  const heroCards = dealHand(r1, r2, suited);
  const topRank = r1;
  const c1 = dealCard(topRank, heroCards);
  const c2 = dealAnyCard([...heroCards, c1], LOW_RANKS);
  const c3 = dealAnyCard([...heroCards, c1, c2], LOW_RANKS.filter(r => r !== c2.rank));
  return {
    heroCards,
    flop: [c1, c2, c3],
    preflopRole: 'preflop-raiser',
    opponentFlopAction: 'checks-to-hero',
    opponentType: pick(['unknown', 'calling-station', 'loose-passive'] as OpponentType[]),
    isHeroInPosition: true,
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor('preflop-raiser'),
  };
}

function genPotControlWeakTopPair(): FlopScenario {
  const hands: [CardRank, CardRank][] = [
    ['A', '9'], ['A', '8'], ['A', '7'], ['A', '6'],
    ['K', '9'], ['K', '8'], ['K', '7'], ['Q', '9'], ['Q', '8'],
  ];
  const [r1, r2] = pick(hands);
  const heroCards = dealHand(r1, r2, false);
  const c1 = dealCard(r1, heroCards);
  // Add one card between r1 and r2 rank (a kicker threat), and one low card
  const betterKickerRanks = RANKS.filter(r => {
    const idx = RANKS.indexOf(r);
    const topIdx = RANKS.indexOf(r1);
    const kickerIdx = RANKS.indexOf(r2);
    return idx > topIdx && idx < kickerIdx;
  });
  const midRanks = betterKickerRanks.length > 0 ? betterKickerRanks : MID_RANKS;
  const c2 = dealAnyCard([...heroCards, c1], midRanks);
  const c3 = dealAnyCard([...heroCards, c1, c2], LOW_RANKS.filter(r => r !== c2.rank));
  return {
    heroCards,
    flop: [c1, c2, c3],
    preflopRole: pick(['preflop-raiser', 'preflop-caller'] as PreflopRole[]),
    opponentFlopAction: pick(['checks-to-hero', 'bets-small'] as OpponentFlopAction[]),
    opponentType: pick(['unknown', 'tight', 'loose-passive'] as OpponentType[]),
    isHeroInPosition: pick([true, false]),
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor(pick(['preflop-raiser', 'preflop-caller'] as PreflopRole[])),
  };
}

function genChargeDrawsWetBoard(): FlopScenario {
  // Hero has a set on a wet board
  const pairRank = pick(['8', '9', 'T', 'J', 'Q'] as CardRank[]);
  const heroCards = dealHand(pairRank, pairRank, false);
  const setCard = dealCard(pairRank, heroCards);
  // Two connected cards adjacent to the set rank, same suit
  const rankIdx = RANKS.indexOf(pairRank);
  const adj1 = RANKS[Math.min(rankIdx + 1, 11)];
  const adj2 = RANKS[Math.min(rankIdx + 2, 11)];
  const wetSuit = pick(SUITS);
  const c2: Card = { rank: adj1, suit: wetSuit };
  // make sure c2 isn't excluded
  const excSet = new Set([...heroCards, setCard].map(key));
  const c2Actual = excSet.has(key(c2)) ? { rank: adj1, suit: pick(SUITS.filter(s => s !== wetSuit)) } : c2;
  const c3Candidate: Card = { rank: adj2, suit: wetSuit };
  const c3Actual = excSet.has(key(c3Candidate)) ? { rank: adj2, suit: pick(SUITS.filter(s => s !== wetSuit)) } : c3Candidate;
  return {
    heroCards,
    flop: [setCard, c2Actual, c3Actual],
    preflopRole: 'preflop-raiser',
    opponentFlopAction: 'checks-to-hero',
    opponentType: pick(['unknown', 'calling-station', 'loose-passive'] as OpponentType[]),
    isHeroInPosition: pick([true, false]),
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor('preflop-raiser'),
  };
}

function genContinueStrongDraw(): FlopScenario {
  // Hero has two suited high cards → flush draw on matching board
  const suited: [CardRank, CardRank][] = [
    ['A', 'Q'], ['A', 'J'], ['K', 'Q'], ['J', 'T'], ['T', '9'], ['9', '8'],
  ];
  const [r1, r2] = pick(suited);
  const heroSuit = pick(SUITS);
  const heroCards: [Card, Card] = [{ rank: r1, suit: heroSuit }, { rank: r2, suit: heroSuit }];
  // Flop: one card of hero's suit + two others (no hero ranks)
  const availFlopRanks = RANKS.filter(r => r !== r1 && r !== r2);
  const flopR1 = pick(availFlopRanks.slice(3, 10)); // mid ranks
  const flopSuits: Suit[] = [heroSuit, pick(SUITS.filter(s => s !== heroSuit)), pick(SUITS.filter(s => s !== heroSuit))];
  const c1: Card = { rank: flopR1, suit: flopSuits[0] };
  const flopR2 = pick(availFlopRanks.filter(r => r !== flopR1).slice(3, 10));
  const c2: Card = { rank: flopR2, suit: flopSuits[1] };
  const flopR3 = pick(availFlopRanks.filter(r => r !== flopR1 && r !== flopR2).slice(0, 6));
  const c3: Card = { rank: flopR3, suit: flopSuits[2] };
  return {
    heroCards,
    flop: [c1, c2, c3],
    preflopRole: pick(['preflop-caller', 'preflop-raiser'] as PreflopRole[]),
    opponentFlopAction: pick(['bets-small', 'bets-half-pot'] as OpponentFlopAction[]),
    opponentType: pick(['unknown', 'tight', 'loose-passive'] as OpponentType[]),
    isHeroInPosition: pick([true, false]),
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor(pick(['preflop-caller', 'preflop-raiser'] as PreflopRole[])),
  };
}

function genFoldWeakDraw(): FlopScenario {
  // Hero has two high offsuit cards that miss the board → gutshot or overcards only
  const hands: [CardRank, CardRank][] = [
    ['K', 'Q'], ['K', 'J'], ['Q', 'J'], ['J', 'T'], ['T', '9'],
  ];
  const [r1, r2] = pick(hands);
  const heroCards = dealHand(r1, r2, false);
  // Board: three low disconnected cards that miss hero's hand
  const lowBoard = LOW_RANKS.filter(r => r !== r1 && r !== r2);
  const c1 = dealAnyCard(heroCards, lowBoard);
  const c2 = dealAnyCard([...heroCards, c1], lowBoard.filter(r => r !== c1.rank));
  const c3 = dealAnyCard([...heroCards, c1, c2], lowBoard.filter(r => r !== c1.rank && r !== c2.rank));
  return {
    heroCards,
    flop: [c1, c2, c3],
    preflopRole: pick(['preflop-caller', 'blind-defender'] as PreflopRole[]),
    opponentFlopAction: 'bets-big',
    opponentType: pick(['unknown', 'tight', 'loose-passive'] as OpponentType[]),
    isHeroInPosition: pick([true, false]),
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor(pick(['preflop-caller', 'blind-defender'] as PreflopRole[])),
  };
}

function genCBetGoodBoard(): FlopScenario {
  // Pre-flop raiser misses on dry A/K/Q-high board
  const highRank = pick(['A', 'K', 'Q'] as CardRank[]);
  const r2 = pick(['J', 'T', '9', '8', '7', '6'] as CardRank[]);
  const heroCards = dealHand(r2, pick(RANKS.filter(r => r !== highRank && r !== r2 && isHighRank(r) ? false : true).slice(4, 10) as CardRank[]), false);
  const c1 = dealCard(highRank, heroCards);
  const c2 = dealAnyCard([...heroCards, c1], LOW_RANKS.filter(r => r !== c1.rank));
  const c3 = dealAnyCard([...heroCards, c1, c2], LOW_RANKS.filter(r => r !== c1.rank && r !== c2.rank));
  return {
    heroCards,
    flop: [c1, c2, c3],
    preflopRole: 'preflop-raiser',
    opponentFlopAction: 'checks-to-hero',
    opponentType: pick(['unknown', 'tight'] as OpponentType[]),
    isHeroInPosition: true,
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor('preflop-raiser'),
  };
}

function genDoNotBluffCallingStation(): FlopScenario {
  const highRank = pick(['A', 'K', 'Q', 'J'] as CardRank[]);
  const r2 = pick(['T', '9', '8', '7'] as CardRank[]);
  const heroCards = dealHand(highRank, r2, false);
  // Wet/semi-wet board that misses hero
  const midRanks: CardRank[] = ['9', '8', '7', '6', '5'];
  const c1 = dealAnyCard(heroCards, midRanks);
  const c2suit = pick(SUITS);
  const c2 = dealAnyCard([...heroCards, c1], midRanks.filter(r => r !== c1.rank));
  const c3 = { ...dealAnyCard([...heroCards, c1, c2], midRanks.filter(r => r !== c1.rank && r !== c2.rank)), suit: c2suit };
  return {
    heroCards,
    flop: [c1, c2, c3 as Card],
    preflopRole: 'preflop-raiser',
    opponentFlopAction: 'checks-to-hero',
    opponentType: 'calling-station',
    isHeroInPosition: pick([true, false]),
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor('preflop-raiser'),
  };
}

function genRespectPassiveAggression(): FlopScenario {
  // Hero has medium made hand; loose-passive/calling-station check-raises
  const hands: [CardRank, CardRank][] = [
    ['A', 'T'], ['A', '9'], ['K', 'T'], ['K', '9'], ['Q', 'T'],
  ];
  const [r1, r2] = pick(hands);
  const heroCards = dealHand(r1, r2, false);
  const c1 = dealCard(r1, heroCards);
  const c2 = dealAnyCard([...heroCards, c1], ['9', '8', '7', '6', '5']);
  const c3 = dealAnyCard([...heroCards, c1, c2], LOW_RANKS.filter(r => r !== c2.rank));
  return {
    heroCards,
    flop: [c1, c2, c3],
    preflopRole: 'preflop-raiser',
    opponentFlopAction: pick(['check-raises', 'raises-hero-bet'] as OpponentFlopAction[]),
    opponentType: pick(['loose-passive', 'calling-station'] as OpponentType[]),
    isHeroInPosition: true,
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor('preflop-raiser', true),
  };
}

function genLetManiacBluff(): FlopScenario {
  const hands: [CardRank, CardRank][] = [
    ['A', 'K'], ['A', 'Q'], ['K', 'Q'], ['J', 'J'],
  ];
  const [r1, r2] = pick(hands);
  const isPair = r1 === r2;
  const heroCards = dealHand(r1, r2, isPair ? false : pick([true, false]));
  const c1 = dealCard(r1, heroCards);
  const c2 = dealAnyCard([...heroCards, c1], LOW_RANKS);
  const c3 = dealAnyCard([...heroCards, c1, c2], LOW_RANKS.filter(r => r !== c2.rank));
  return {
    heroCards,
    flop: [c1, c2, c3],
    preflopRole: 'preflop-raiser',
    opponentFlopAction: 'bets-big',
    opponentType: 'maniac',
    isHeroInPosition: pick([true, false]),
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor('preflop-raiser', true),
  };
}

function genDoNotMarryOnePair(): FlopScenario {
  // Hero has top pair or overpair; wet board; opponent bets big
  const hands: [CardRank, CardRank][] = [
    ['K', 'J'], ['Q', 'J'], ['A', 'T'], ['A', '9'],
  ];
  const [r1, r2] = pick(hands);
  const heroCards = dealHand(r1, r2, false);
  const c1 = dealCard(r1, heroCards);
  // Two connected mid-cards (wet board)
  const midRange: CardRank[] = ['J', 'T', '9', '8', '7'];
  const c2 = dealAnyCard([...heroCards, c1], midRange.filter(r => r !== r1));
  const c3suit = pick(SUITS);
  const c3base = dealAnyCard([...heroCards, c1, c2], midRange.filter(r => r !== r1 && r !== c2.rank));
  const c3: Card = { rank: c3base.rank, suit: c3suit };
  return {
    heroCards,
    flop: [c1, c2, c3],
    preflopRole: pick(['preflop-raiser', 'preflop-caller'] as PreflopRole[]),
    opponentFlopAction: pick(['bets-big', 'raises-hero-bet'] as OpponentFlopAction[]),
    opponentType: pick(['unknown', 'tight', 'loose-passive'] as OpponentType[]),
    isHeroInPosition: pick([true, false]),
    potType: 'heads-up',
    stackDepth: pick(['medium', 'deep'] as StackDepth[]),
    potSize: potSizeFor(pick(['preflop-raiser', 'preflop-caller'] as PreflopRole[]), true),
  };
}

function generateScenario(theme: FlopPuzzleTheme): FlopScenario {
  switch (theme) {
    case 'value-bet-strong-top-pair': return genValueBetStrongTopPair();
    case 'pot-control-weak-top-pair': return genPotControlWeakTopPair();
    case 'charge-draws-on-wet-board': return genChargeDrawsWetBoard();
    case 'continue-strong-draw': return genContinueStrongDraw();
    case 'fold-weak-draw-to-big-bet': return genFoldWeakDraw();
    case 'c-bet-good-board': return genCBetGoodBoard();
    case 'do-not-bluff-calling-station': return genDoNotBluffCallingStation();
    case 'respect-passive-aggression': return genRespectPassiveAggression();
    case 'let-maniac-bluff': return genLetManiacBluff();
    case 'do-not-marry-one-pair': return genDoNotMarryOnePair();
  }
}

let counter = 0;

export function generateFlopPuzzle(): Puzzle {
  const theme = weightedRandom(THEME_WEIGHTS);
  const s = generateScenario(theme);
  const solution = solveFlopPuzzle({
    heroCards: s.heroCards,
    flop: s.flop,
    preflopRole: s.preflopRole,
    isHeroInPosition: s.isHeroInPosition,
    opponentFlopAction: s.opponentFlopAction,
    opponentType: s.opponentType,
    potType: s.potType,
    stackDepth: s.stackDepth,
  });

  const heroPosition: Position = s.isHeroInPosition ? 'Button' : 'Big Blind';
  counter += 1;

  // Available actions depend on opponent's action
  const availableActions = buildFlopAvailableActions(s.opponentFlopAction);

  return {
    id: `fl-${Date.now()}-${counter}`,
    street: 'flop',
    playerCount: 2,
    blinds: { small: 100, big: 200 },
    stackDepth: s.stackDepth,
    heroPosition,
    heroCards: s.heroCards,
    boardCards: s.flop,
    previousAction: 'folded-to-hero', // not meaningful for flop, placeholder
    opponentType: s.opponentType,
    potSize: s.potSize,
    availableActions,
    correctAction: solution.bestAction,
    confidence: solution.confidence,
    alternativeActions: solution.acceptableActions,
    recommendedSizing: solution.recommendedSizing,
    explanation: solution.explanation,
    tags: solution.tags,
    mistakeTag: solution.mistakeTag,
    difficulty: solution.difficulty,
    theme,
    preflopRole: s.preflopRole,
    isHeroInPosition: s.isHeroInPosition,
    opponentFlopAction: s.opponentFlopAction,
    potType: s.potType,
    madeHandCategory: solution.madeHandCategory,
    drawCategory: solution.drawCategory,
    boardTexture: solution.boardTexture,
  };
}

function buildFlopAvailableActions(opponentAction: OpponentFlopAction): import('./types').Action[] {
  switch (opponentAction) {
    case 'checks-to-hero':
      return ['Check', 'Bet Small', 'Bet Medium', 'Bet Big'];
    case 'bets-small':
    case 'bets-half-pot':
    case 'bets-big':
      return ['Fold', 'Call', 'Raise'];
    case 'raises-hero-bet':
    case 'check-raises':
      return ['Fold', 'Call', 'Raise'];
  }
}
