import type { Position, PreviousAction } from './types';

export type SeatStatus = 'hero' | 'raised' | 'three-bet' | 'limped' | 'folded' | 'waiting';

export type SeatInfo = {
  position: Position;
  label: string;       // short label: UTG, BB, BTN, etc.
  status: SeatStatus;
  isHero: boolean;
  isButton: boolean;
  isSB: boolean;
  isBB: boolean;
  angleDeg: number;    // degrees clockwise from bottom, for positioning
};

// Positions in preflop action order for each player count
export const POSITIONS_BY_COUNT: Record<number, Position[]> = {
  2: ['Button', 'Big Blind'],
  3: ['Button', 'Small Blind', 'Big Blind'],
  4: ['Cutoff', 'Button', 'Small Blind', 'Big Blind'],
  5: ['Hijack', 'Cutoff', 'Button', 'Small Blind', 'Big Blind'],
  6: ['Middle', 'Hijack', 'Cutoff', 'Button', 'Small Blind', 'Big Blind'],
  7: ['UTG+1', 'Middle', 'Hijack', 'Cutoff', 'Button', 'Small Blind', 'Big Blind'],
  8: ['UTG', 'UTG+1', 'Middle', 'Hijack', 'Cutoff', 'Button', 'Small Blind', 'Big Blind'],
};

export const MIN_PLAYER_COUNT: Record<Position, number> = {
  'UTG': 8,
  'UTG+1': 7,
  'Middle': 6,
  'Hijack': 5,
  'Cutoff': 4,
  'Button': 2,
  'Small Blind': 2,
  'Big Blind': 2,
};

export const POSITION_LABELS: Record<Position, string> = {
  'UTG': 'UTG',
  'UTG+1': 'UTG+1',
  'Middle': 'MP',
  'Hijack': 'HJ',
  'Cutoff': 'CO',
  'Button': 'BTN',
  'Small Blind': 'SB',
  'Big Blind': 'BB',
};

function findPositionIdx(positions: Position[], pos: Position): number {
  return positions.indexOf(pos);
}

function deriveStatuses(
  positions: Position[],
  heroIdx: number,
  previousAction: PreviousAction,
): SeatStatus[] {
  const n = positions.length;
  const statuses: SeatStatus[] = new Array(n).fill('waiting') as SeatStatus[];
  statuses[heroIdx] = 'hero';

  // Players after hero in action order: waiting (haven't acted yet preflop)
  for (let i = heroIdx + 1; i < n; i++) statuses[i] = 'waiting';

  if (heroIdx === 0) return statuses; // Hero acts first, nobody before them

  const beforeIdxs = Array.from({ length: heroIdx }, (_, i) => i);

  const raiserAtPosition = (p: Position) => {
    const idx = findPositionIdx(positions, p);
    return idx >= 0 && idx < heroIdx ? idx : -1;
  };

  if (previousAction === 'folded-to-hero') {
    beforeIdxs.forEach(i => (statuses[i] = 'folded'));
  } else if (previousAction === 'one-limper') {
    // Closest player before hero limped, rest folded
    beforeIdxs.forEach(i => (statuses[i] = 'folded'));
    statuses[heroIdx - 1] = 'limped';
  } else if (previousAction === 'multiple-limpers') {
    const limpCount = Math.min(3, heroIdx);
    for (let i = 0; i < heroIdx - limpCount; i++) statuses[i] = 'folded';
    for (let i = heroIdx - limpCount; i < heroIdx; i++) statuses[i] = 'limped';
  } else if (previousAction === 'early-raise') {
    // UTG or UTG+1 raised
    let raiserIdx = raiserAtPosition('UTG');
    if (raiserIdx < 0) raiserIdx = raiserAtPosition('UTG+1');
    if (raiserIdx < 0) raiserIdx = 0; // fallback: first seat
    beforeIdxs.forEach(i => (statuses[i] = i === raiserIdx ? 'raised' : 'folded'));
  } else if (previousAction === 'middle-raise') {
    let raiserIdx = raiserAtPosition('Middle');
    if (raiserIdx < 0) raiserIdx = raiserAtPosition('Hijack');
    if (raiserIdx < 0) raiserIdx = Math.max(0, Math.floor(heroIdx / 2));
    beforeIdxs.forEach(i => (statuses[i] = i === raiserIdx ? 'raised' : 'folded'));
  } else if (previousAction === 'late-raise') {
    // CO or BTN raised (these are before hero when hero is SB/BB)
    let raiserIdx = raiserAtPosition('Button');
    if (raiserIdx < 0) raiserIdx = raiserAtPosition('Cutoff');
    if (raiserIdx < 0) raiserIdx = heroIdx - 1;
    beforeIdxs.forEach(i => (statuses[i] = i === raiserIdx ? 'raised' : 'folded'));
  } else if (previousAction === 'raise-and-callers') {
    if (heroIdx >= 1) statuses[0] = 'raised';
    for (let i = 1; i < Math.max(1, heroIdx - 1); i++) statuses[i] = 'limped';
    if (heroIdx > 1) statuses[heroIdx - 1] = 'folded';
  } else if (previousAction === 'three-bet-before-hero') {
    if (heroIdx >= 2) {
      statuses[0] = 'raised';
      statuses[1] = 'three-bet';
      for (let i = 2; i < heroIdx; i++) statuses[i] = 'folded';
    } else if (heroIdx === 1) {
      statuses[0] = 'raised';
    }
  }

  return statuses;
}

export function buildTableSeats(
  playerCount: number,
  heroPosition: Position,
  previousAction: PreviousAction,
): SeatInfo[] {
  const positions = POSITIONS_BY_COUNT[playerCount] ?? POSITIONS_BY_COUNT[8];

  // Heads-up: Button and Small Blind are the same seat
  const effectiveHero: Position =
    playerCount === 2 && heroPosition === 'Small Blind' ? 'Button' : heroPosition;

  const heroIdx = positions.indexOf(effectiveHero);
  if (heroIdx < 0) return [];

  const n = positions.length;
  const statuses = deriveStatuses(positions, heroIdx, previousAction);

  // Build display order so the table matches real poker seating (clockwise on screen = clockwise in poker).
  // Hero at bottom (θ=0). Going right (small +θ) = players before hero in action order (they sit to hero's right).
  // Going left (large θ near 360°) = players after hero in action order (they sit to hero's left).
  const afterHero = positions.slice(heroIdx + 1);
  const beforeHero = positions.slice(0, heroIdx);
  const displayPositions = [
    positions[heroIdx],
    ...beforeHero.reverse(), // closest-before first → right side
    ...afterHero.reverse(),  // furthest-after first → fills left side from top down
  ];

  return displayPositions.map((pos, displayIdx) => {
    const actionIdx = positions.indexOf(pos);
    const angleDeg = displayIdx * (360 / n);
    // In heads-up, the Button seat is also the SB
    const isHUButton = playerCount === 2 && pos === 'Button';
    return {
      position: pos,
      label: isHUButton ? 'BTN/SB' : POSITION_LABELS[pos],
      status: statuses[actionIdx],
      isHero: actionIdx === heroIdx,
      isButton: pos === 'Button',
      isSB: pos === 'Small Blind' || isHUButton,
      isBB: pos === 'Big Blind',
      angleDeg,
    };
  });
}
