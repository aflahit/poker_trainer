import type { Puzzle } from './types';

export type ScoreEvent = 'correct' | 'wrong' | 'timeout';

const DIFFICULTY_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 2.0,
  5: 3.0,
};

const STREAK_BONUS: Record<number, number> = {
  3: 5,
  5: 10,
  10: 25,
};

export function computePoints(
  event: ScoreEvent,
  puzzle: Puzzle,
  streak: number,
  timedMode = false,
): number {
  if (event === 'timeout') return timedMode ? -2 : 0;
  if (event === 'wrong') return timedMode ? -5 : 0;

  const base = 10;
  const multiplier = DIFFICULTY_MULTIPLIER[puzzle.difficulty] ?? 1.0;
  let points = Math.round(base * multiplier);

  // Streak bonus applies after threshold is crossed
  const bonusAtStreak = STREAK_BONUS[streak];
  if (bonusAtStreak !== undefined) {
    points += bonusAtStreak;
  }

  return points;
}

export type GameStats = {
  totalAnswered: number;
  totalCorrect: number;
  currentStreak: number;
  bestStreak: number;
  score: number;
  mistakeCounts: Record<string, number>;
  accuracyByHandClass: Record<string, { correct: number; total: number }>;
  accuracyByPosition: Record<string, { correct: number; total: number }>;
};

export function initialStats(): GameStats {
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    score: 0,
    mistakeCounts: {},
    accuracyByHandClass: {},
    accuracyByPosition: {},
  };
}

export function updateStats(
  stats: GameStats,
  puzzle: Puzzle,
  correct: boolean,
  timedMode = false,
): GameStats {
  const next = { ...stats };
  next.mistakeCounts = { ...stats.mistakeCounts };
  next.accuracyByHandClass = { ...stats.accuracyByHandClass };
  next.accuracyByPosition = { ...stats.accuracyByPosition };

  next.totalAnswered += 1;

  if (correct) {
    next.totalCorrect += 1;
    next.currentStreak += 1;
    if (next.currentStreak > next.bestStreak) {
      next.bestStreak = next.currentStreak;
    }
    next.score += computePoints('correct', puzzle, next.currentStreak, timedMode);
  } else {
    next.currentStreak = 0;
    next.score += computePoints('wrong', puzzle, 0, timedMode);

    if (puzzle.mistakeTag) {
      next.mistakeCounts[puzzle.mistakeTag] = (next.mistakeCounts[puzzle.mistakeTag] ?? 0) + 1;
    }
  }

  // Track accuracy by hand class
  const hc = puzzle.tags[0] ?? 'unknown';
  if (!next.accuracyByHandClass[hc]) next.accuracyByHandClass[hc] = { correct: 0, total: 0 };
  next.accuracyByHandClass[hc].total += 1;
  if (correct) next.accuracyByHandClass[hc].correct += 1;

  // Track accuracy by position
  const pos = puzzle.heroPosition;
  if (!next.accuracyByPosition[pos]) next.accuracyByPosition[pos] = { correct: 0, total: 0 };
  next.accuracyByPosition[pos].total += 1;
  if (correct) next.accuracyByPosition[pos].correct += 1;

  return next;
}

export function topMistake(stats: GameStats): string | null {
  const entries = Object.entries(stats.mistakeCounts);
  if (entries.length === 0) return null;
  return entries.sort(([, a], [, b]) => b - a)[0][0];
}

export function accuracyPercent(stats: GameStats): number {
  if (stats.totalAnswered === 0) return 0;
  return Math.round((stats.totalCorrect / stats.totalAnswered) * 100);
}
