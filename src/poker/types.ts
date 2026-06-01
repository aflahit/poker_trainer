export type CardRank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Suit = 's' | 'h' | 'd' | 'c';

export type Card = {
  rank: CardRank;
  suit: Suit;
};

export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export type Position =
  | 'UTG'
  | 'UTG+1'
  | 'Middle'
  | 'Hijack'
  | 'Cutoff'
  | 'Button'
  | 'Small Blind'
  | 'Big Blind';

export type PositionClass = 'early' | 'middle' | 'late' | 'small-blind' | 'big-blind';

export type OpponentType =
  | 'unknown'
  | 'tight'
  | 'loose-passive'
  | 'loose-aggressive'
  | 'maniac'
  | 'calling-station';

export type PreviousAction =
  | 'folded-to-hero'
  | 'one-limper'
  | 'multiple-limpers'
  | 'early-raise'
  | 'middle-raise'
  | 'late-raise'
  | 'raise-and-callers'
  | 'three-bet-before-hero';

export type StackDepth = 'short' | 'medium' | 'deep';

// Pre-flop and post-flop actions unified
export type Action = 'Fold' | 'Check' | 'Call' | 'Bet' | 'Raise' | 'Re-raise';

export type HandClass =
  | 'premium'
  | 'strong'
  | 'medium-playable'
  | 'speculative'
  | 'trap'
  | 'trash';

export type PuzzleTheme =
  | 'premium-open'
  | 'trap-hand-fold'
  | 'late-position-steal'
  | 'suited-junk-trap'
  | 'small-pair-set-mine'
  | 'facing-tight-raise'
  | 'big-blind-defense'
  | 'limper-isolation'
  | 'multiway-speculative-call'
  | 'three-bet-discipline';

export type MistakeTag =
  | 'played-dominated-hand'
  | 'overvalued-suited-junk'
  | 'failed-to-raise-premium'
  | 'called-when-should-raise'
  | 'played-too-loose-early'
  | 'failed-to-defend-big-blind'
  | 'weak-ace-trap'
  | 'wrong-three-bet-spot'
  | 'ignored-position'
  | 'set-mine-wrong-conditions';

export type Puzzle = {
  id: string;
  street: Street;
  playerCount: number;
  blinds: { small: number; big: number };
  stackDepth: StackDepth;
  heroPosition: Position;
  heroCards: [Card, Card];
  boardCards: Card[]; // [] preflop, [3] flop, [4] turn, [5] river
  previousAction: PreviousAction;
  opponentType: OpponentType;
  potSize: number;
  availableActions: Action[];
  correctAction: Action;
  confidence: Confidence;
  alternativeActions: Action[];
  recommendedSizing: string | null;
  explanation: string;
  tags: string[];
  mistakeTag: MistakeTag | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
  theme: PuzzleTheme;
};

export type Confidence = 'clear' | 'borderline';

export type Solution = {
  correctAction: Action;
  confidence: Confidence;
  alternativeActions: Action[];
  recommendedSizing: string | null;
  explanation: string;
  tags: string[];
  mistakeTag: MistakeTag | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export type DecisionInput = {
  handCode: string;
  handClass: HandClass;
  positionClass: PositionClass;
  actionContext: PreviousAction;
  stackDepth: StackDepth;
  opponentType: OpponentType;
  playerCount: number;
};
