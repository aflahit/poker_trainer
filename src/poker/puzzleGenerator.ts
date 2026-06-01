import type {
  Card, Position, OpponentType, PreviousAction,
  StackDepth, Puzzle, PreflopPuzzleTheme, Street, Action,
} from './types';
import { MIN_PLAYER_COUNT, POSITIONS_BY_COUNT } from './tableUtils';
import { classifyHand } from './handClassifier';
import { classifyPosition } from './positionClassifier';
import { solve } from './strategyEngine';
import { generateFlopPuzzle } from './flopPuzzleGenerator';

const POSITIONS: Position[] = [
  'UTG', 'UTG+1', 'Middle', 'Hijack', 'Cutoff', 'Button', 'Small Blind', 'Big Blind',
];

const OPPONENT_TYPES: OpponentType[] = [
  'unknown', 'tight', 'loose-passive', 'loose-aggressive', 'maniac', 'calling-station',
];


const STACK_DEPTHS: StackDepth[] = ['short', 'medium', 'deep'];

// Weighted theme selection
const THEME_WEIGHTS: Record<PreflopPuzzleTheme, number> = {
  'premium-open': 10,
  'trap-hand-fold': 18,
  'late-position-steal': 12,
  'suited-junk-trap': 12,
  'small-pair-set-mine': 10,
  'facing-tight-raise': 12,
  'big-blind-defense': 8,
  'limper-isolation': 10,
  'multiway-speculative-call': 5,
  'three-bet-discipline': 3,
};

function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Hand pools per theme
const THEME_HANDS: Record<PreflopPuzzleTheme, string[]> = {
  'premium-open': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs'],
  'trap-hand-fold': ['A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o', 'KJo', 'KTo', 'QTo', 'JTo', 'K9o', 'Q9o'],
  'late-position-steal': ['A5s', 'A4s', 'A3s', 'K9s', 'QTs', 'J9s', 'T9s', '98s', '87s', '65s', 'KJo'],
  'suited-junk-trap': ['K4s', 'K3s', 'K2s', 'Q6s', 'Q5s', 'Q4s', 'J6s', 'J5s', 'T5s', '95s', '84s'],
  'small-pair-set-mine': ['22', '33', '44', '55', '66'],
  'facing-tight-raise': ['KJo', 'KTo', 'QJo', 'QTo', 'JTo', 'A9o', 'A8o', 'AJs', 'KQo', '99', '88'],
  'big-blind-defense': ['A5s', 'A8s', 'QTs', 'JTs', 'T9s', '98s', 'AJo', 'KQo', '77', '88'],
  'limper-isolation': ['AQs', 'AQo', 'AJs', 'KQs', 'QJs', 'JJ', 'TT', '99'],
  'multiway-speculative-call': ['98s', '87s', '76s', '65s', '22', '33', '44', '55', 'A4s', 'A3s'],
  'three-bet-discipline': ['AQo', 'KQs', 'AJs', 'TT', '99', 'JJ', 'AKs', 'QQ'],
};

// Theme constraints
type ThemeConstraints = {
  positions?: Position[];
  previousActions: PreviousAction[];
  stackDepths?: StackDepth[];
  opponentTypes?: OpponentType[];
};

const THEME_CONSTRAINTS: Record<PreflopPuzzleTheme, ThemeConstraints> = {
  'premium-open': {
    previousActions: ['folded-to-hero'],
  },
  'trap-hand-fold': {
    positions: ['UTG', 'UTG+1', 'Middle', 'Hijack'],
    previousActions: ['folded-to-hero', 'early-raise'],
  },
  'late-position-steal': {
    positions: ['Cutoff', 'Button'],
    previousActions: ['folded-to-hero'],
  },
  'suited-junk-trap': {
    positions: ['UTG', 'UTG+1', 'Middle', 'Hijack'],
    previousActions: ['folded-to-hero', 'one-limper'],
  },
  'small-pair-set-mine': {
    previousActions: ['multiple-limpers', 'late-raise', 'early-raise'],
    stackDepths: ['medium', 'deep'],
  },
  'facing-tight-raise': {
    previousActions: ['early-raise', 'middle-raise'],
    opponentTypes: ['tight'],
  },
  'big-blind-defense': {
    positions: ['Big Blind'],
    previousActions: ['late-raise', 'middle-raise'],
  },
  'limper-isolation': {
    previousActions: ['one-limper'],
    opponentTypes: ['loose-passive', 'calling-station'],
  },
  'multiway-speculative-call': {
    positions: ['Cutoff', 'Button', 'Big Blind'],
    previousActions: ['multiple-limpers'],
    stackDepths: ['deep'],
  },
  'three-bet-discipline': {
    previousActions: ['three-bet-before-hero'],
  },
};

function buildPreflopAvailableActions(previousAction: PreviousAction): Action[] {
  if (previousAction === 'three-bet-before-hero') {
    return ['Fold', 'Call', 'Re-raise'];
  }
  if (
    previousAction === 'early-raise' ||
    previousAction === 'middle-raise' ||
    previousAction === 'late-raise' ||
    previousAction === 'raise-and-callers'
  ) {
    return ['Fold', 'Call', 'Re-raise'];
  }
  if (previousAction === 'folded-to-hero') {
    return ['Fold', 'Raise'];
  }
  return ['Fold', 'Call', 'Raise'];
}

let puzzleCounter = 0;

export function generatePuzzle(street: Street = 'preflop'): Puzzle {
  if (street === 'flop') return generateFlopPuzzle();
  if (street !== 'preflop') throw new Error(`Generator for ${street} not yet implemented`);
  return generatePreflopPuzzle();
}

function generatePreflopPuzzle(): Puzzle {
  const theme = weightedRandom(THEME_WEIGHTS);
  const constraints = THEME_CONSTRAINTS[theme];

  const positions = constraints.positions ?? POSITIONS;
  const previousActions = constraints.previousActions;
  const stackDepths = constraints.stackDepths ?? STACK_DEPTHS;
  const opponentTypes = constraints.opponentTypes ?? OPPONENT_TYPES;

  const heroPosition = pick(positions);
  const stackDepth = pick(stackDepths);
  const opponentType = pick(opponentTypes);

  // Ensure playerCount is always valid for the chosen heroPosition
  const minCount = MIN_PLAYER_COUNT[heroPosition];
  const playerCount = Math.max(minCount, Math.floor(Math.random() * (9 - minCount)) + minCount);

  // Filter previousActions to those logically valid for this seat's position index
  const heroIdx = (POSITIONS_BY_COUNT[playerCount] ?? []).indexOf(heroPosition);
  const validActions = previousActions.filter(a => isPreviousActionValid(a, heroIdx));
  const previousAction = pick<PreviousAction>(validActions.length > 0 ? validActions : ['folded-to-hero']);

  // Pick hole cards from theme hand pool, then deal actual suited/offsuit cards
  const handPool = THEME_HANDS[theme];
  const handCode = pick(handPool);
  const heroCards = dealHandFromCode(handCode);

  const positionClass = classifyPosition(heroPosition);
  const handClass = classifyHand(handCode);

  const potSize = computePotSize(previousAction, { small: 100, big: 200 });

  const availableActions = buildPreflopAvailableActions(previousAction);

  const solution = solve('preflop', {
    handCode,
    handClass,
    positionClass,
    actionContext: previousAction,
    stackDepth,
    opponentType,
    playerCount,
  });

  puzzleCounter += 1;
  const id = `pf-${Date.now()}-${puzzleCounter}`;

  return {
    id,
    street: 'preflop',
    playerCount,
    blinds: { small: 100, big: 200 },
    stackDepth,
    heroPosition,
    heroCards,
    boardCards: [],
    previousAction,
    opponentType,
    potSize,
    availableActions,
    correctAction: solution.correctAction,
    confidence: solution.confidence,
    alternativeActions: solution.alternativeActions,
    recommendedSizing: solution.recommendedSizing,
    explanation: solution.explanation,
    tags: solution.tags,
    mistakeTag: solution.mistakeTag,
    difficulty: solution.difficulty,
    theme,
  };
}

// Convert hand code (e.g. "AKs", "QQ", "98o") to actual Card objects
function dealHandFromCode(handCode: string): [Card, Card] {
  const suits = ['s', 'h', 'd', 'c'] as const;

  if (handCode.length === 2) {
    // Pair
    const rank = handCode[0] as Card['rank'];
    const s1 = pick([...suits]);
    const s2 = pick(suits.filter(s => s !== s1));
    return [{ rank, suit: s1 }, { rank, suit: s2 }];
  }

  const r1 = handCode[0] as Card['rank'];
  const r2 = handCode[1] as Card['rank'];
  const suited = handCode[2] === 's';

  if (suited) {
    const suit = pick([...suits]);
    return [{ rank: r1, suit }, { rank: r2, suit }];
  } else {
    const s1 = pick([...suits]);
    const s2 = pick(suits.filter(s => s !== s1));
    return [{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }];
  }
}

function computePotSize(
  previousAction: PreviousAction,
  blinds: { small: number; big: number },
): number {
  const bb = blinds.big;
  switch (previousAction) {
    case 'folded-to-hero': return bb * 1.5;
    case 'one-limper': return bb * 3;
    case 'multiple-limpers': return bb * (2 + Math.floor(Math.random() * 3) + 1);
    case 'early-raise': return bb * 3.5;
    case 'middle-raise': return bb * 3.5;
    case 'late-raise': return bb * 3;
    case 'raise-and-callers': return bb * (3.5 + (Math.floor(Math.random() * 2) + 1) * 3);
    case 'three-bet-before-hero': return bb * 10;
    default: return bb * 2;
  }
}

// Minimum number of players before hero required for each previous action
function isPreviousActionValid(action: PreviousAction, heroIdx: number): boolean {
  switch (action) {
    case 'folded-to-hero':   return true;         // valid for any position
    case 'one-limper':       return heroIdx >= 1;  // need 1 player before hero
    case 'multiple-limpers': return heroIdx >= 2;  // need 2+ players before hero
    case 'early-raise':      return heroIdx >= 1;
    case 'middle-raise':     return heroIdx >= 2;
    case 'late-raise':       return heroIdx >= 1;  // BTN/CO raise, hero is in blinds
    case 'raise-and-callers':return heroIdx >= 2;
    case 'three-bet-before-hero': return heroIdx >= 2;
  }
}
