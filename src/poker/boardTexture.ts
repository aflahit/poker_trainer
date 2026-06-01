import type { Card, BoardTexture } from './types';
import { rankIndex } from './cards';

function getSuitScore(flop: [Card, Card, Card]): number {
  const unique = new Set(flop.map(c => c.suit)).size;
  if (unique === 1) return 2; // monotone
  if (unique === 2) return 1; // two-tone
  return 0; // rainbow
}

function getConnectivityScore(flop: [Card, Card, Card]): number {
  const idxs = flop.map(c => rankIndex(c.rank)).sort((a, b) => a - b);
  const span = idxs[2] - idxs[0];
  const gap0 = idxs[1] - idxs[0];
  const gap1 = idxs[2] - idxs[1];

  if (span <= 2) return 2; // fully connected (e.g. J-T-9)
  if (gap0 <= 1 && gap1 <= 1) return 2;
  if (gap0 <= 1 || gap1 <= 1) return 1; // one adjacent pair (e.g. Q-J-5)
  if (span <= 5) return 1; // close enough to matter (e.g. T-7-5)
  return 0;
}

function isPaired(flop: [Card, Card, Card]): boolean {
  return flop[0].rank === flop[1].rank ||
    flop[1].rank === flop[2].rank ||
    flop[0].rank === flop[2].rank;
}

export function classifyBoardTexture(flop: [Card, Card, Card]): BoardTexture {
  const score = getSuitScore(flop) + getConnectivityScore(flop) + (isPaired(flop) ? -1 : 0);
  if (score <= 0) return 'dry';
  if (score === 1) return 'semi-wet';
  if (score === 2) return 'wet';
  return 'very-wet';
}
