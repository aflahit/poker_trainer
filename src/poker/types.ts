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
export type Action = 'Fold' | 'Check' | 'Call' | 'Bet' | 'Raise' | 'Re-raise' | 'Bet Small' | 'Bet Medium' | 'Bet Big';

export type HandClass =
  | 'premium'
  | 'strong'
  | 'medium-playable'
  | 'speculative'
  | 'trap'
  | 'trash';

export type PreflopPuzzleTheme =
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

export type FlopPuzzleTheme =
  | 'value-bet-strong-top-pair'
  | 'pot-control-weak-top-pair'
  | 'charge-draws-on-wet-board'
  | 'continue-strong-draw'
  | 'fold-weak-draw-to-big-bet'
  | 'c-bet-good-board'
  | 'do-not-bluff-calling-station'
  | 'respect-passive-aggression'
  | 'let-maniac-bluff'
  | 'do-not-marry-one-pair';

export type PuzzleTheme = PreflopPuzzleTheme | FlopPuzzleTheme;

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
  | 'set-mine-wrong-conditions'
  | 'overplayed-weak-top-pair'
  | 'bluffed-calling-station'
  | 'chased-weak-draw'
  | 'missed-value-bet'
  | 'folded-strong-draw'
  | 'ignored-passive-aggression'
  | 'married-one-pair';

// Flop-specific types
export type PreflopRole =
  | 'preflop-raiser'
  | 'preflop-caller'
  | 'blind-defender'
  | 'limped-pot';

export type OpponentFlopAction =
  | 'checks-to-hero'
  | 'bets-small'
  | 'bets-half-pot'
  | 'bets-big'
  | 'raises-hero-bet'
  | 'check-raises';

export type PotType = 'heads-up' | 'multiway';

export type MadeHandCategory =
  | 'monster'
  | 'strong-made-hand'
  | 'medium-made-hand'
  | 'weak-made-hand'
  | 'no-made-hand';

export type DrawCategory =
  | 'combo-draw'
  | 'nut-flush-draw'
  | 'flush-draw'
  | 'open-ended-straight-draw'
  | 'gutshot'
  | 'two-overcards'
  | 'backdoor-only'
  | 'no-draw';

export type BoardTexture = 'dry' | 'semi-wet' | 'wet' | 'very-wet';

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
  // Flop-specific (present when street === 'flop')
  preflopRole?: PreflopRole;
  isHeroInPosition?: boolean;
  opponentFlopAction?: OpponentFlopAction;
  potType?: PotType;
  madeHandCategory?: MadeHandCategory;
  drawCategory?: DrawCategory;
  boardTexture?: BoardTexture;
};

export type FlopDecisionInput = {
  heroCards: [Card, Card];
  flop: [Card, Card, Card];
  preflopRole: PreflopRole;
  isHeroInPosition: boolean;
  opponentFlopAction: OpponentFlopAction;
  opponentType: OpponentType;
  potType: PotType;
  stackDepth: StackDepth;
};

export type FlopSolution = {
  bestAction: Action;
  acceptableActions: Action[];
  madeHandCategory: MadeHandCategory;
  drawCategory: DrawCategory;
  boardTexture: BoardTexture;
  recommendedSizing: string | null;
  confidence: Confidence;
  explanation: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  mistakeTag: MistakeTag | null;
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
