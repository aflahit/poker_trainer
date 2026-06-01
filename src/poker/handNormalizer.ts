import type { Card, CardRank } from './types';
import { rankIndex } from './cards';

// Returns canonical hand code: AA, AKs, AKo, 98s, 98o, etc.
export function normalizeHand(cards: [Card, Card]): string {
  const [a, b] = cards;
  const aIdx = rankIndex(a.rank);
  const bIdx = rankIndex(b.rank);

  // Higher rank first
  const [high, low] = aIdx < bIdx ? [a, b] : [b, a];

  if (high.rank === low.rank) {
    return `${high.rank}${low.rank}`;
  }

  const suited = a.suit === b.suit ? 's' : 'o';
  return `${high.rank}${low.rank}${suited}`;
}

export function isPair(handCode: string): boolean {
  return handCode.length === 2 && handCode[0] === handCode[1];
}

export function isSuited(handCode: string): boolean {
  return handCode.endsWith('s');
}

export function getHighRank(handCode: string): CardRank {
  return handCode[0] as CardRank;
}

export function getLowRank(handCode: string): CardRank {
  return handCode[1] as CardRank;
}
