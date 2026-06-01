import type { Card, CardRank, MadeHandCategory } from './types';
import { rankIndex } from './cards';
import { classifyBoardTexture } from './boardTexture';

function rankCounts(cards: Card[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of cards) counts[c.rank] = (counts[c.rank] ?? 0) + 1;
  return counts;
}

function suitCounts(cards: Card[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of cards) counts[c.suit] = (counts[c.suit] ?? 0) + 1;
  return counts;
}

function hasFiveFlush(cards: Card[]): boolean {
  return Object.values(suitCounts(cards)).some(n => n >= 5);
}

function hasFiveStraight(cards: Card[]): boolean {
  const idxs = [...new Set(cards.map(c => rankIndex(c.rank)))].sort((a, b) => a - b);
  for (let i = 0; i <= idxs.length - 5; i++) {
    const sub = idxs.slice(i, i + 5);
    if (sub[4] - sub[0] === 4 && sub.every((v, j) => j === 0 || v === sub[j - 1] + 1)) return true;
  }
  // Ace-low: A-2-3-4-5 (indices 0,12,11,10,9)
  if (idxs.includes(0) && [9, 10, 11, 12].every(r => idxs.includes(r))) return true;
  return false;
}

function hasThreeOfAKind(cards: Card[]): boolean {
  return Object.values(rankCounts(cards)).some(n => n >= 3);
}

function hasTwoPairOrBetter(cards: Card[]): boolean {
  return Object.values(rankCounts(cards)).filter(n => n >= 2).length >= 2;
}

function hasQuads(cards: Card[]): boolean {
  return Object.values(rankCounts(cards)).some(n => n >= 4);
}

function hasFullHouse(cards: Card[]): boolean {
  const vals = Object.values(rankCounts(cards));
  return vals.includes(3) && vals.includes(2);
}

// Returns sorted board ranks (highest first, by rank value)
function boardTopRanks(flop: [Card, Card, Card]): [CardRank, CardRank, CardRank] {
  const sorted = [...flop].sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank));
  return [sorted[0].rank, sorted[1].rank, sorted[2].rank];
}

function isTopKicker(rank: CardRank): boolean {
  return rankIndex(rank) <= rankIndex('J'); // A, K, Q, J
}

function isGoodKicker(rank: CardRank): boolean {
  return rankIndex(rank) <= rankIndex('T');
}

function hasOverpair(heroCards: [Card, Card], flop: [Card, Card, Card]): boolean {
  if (heroCards[0].rank !== heroCards[1].rank) return false;
  const pairIdx = rankIndex(heroCards[0].rank);
  return flop.every(c => rankIndex(c.rank) > pairIdx);
}

function topPairKicker(heroCards: [Card, Card], flop: [Card, Card, Card]): CardRank | null {
  const topRank = boardTopRanks(flop)[0];
  if (heroCards[0].rank === topRank) return heroCards[1].rank;
  if (heroCards[1].rank === topRank) return heroCards[0].rank;
  return null;
}

export function classifyMadeHand(heroCards: [Card, Card], flop: [Card, Card, Card]): MadeHandCategory {
  const all5 = [...heroCards, ...flop];

  if (hasQuads(all5) || hasFullHouse(all5) || hasFiveFlush(all5) || hasFiveStraight(all5)) return 'monster';
  if (hasThreeOfAKind(all5)) return 'monster';
  if (hasTwoPairOrBetter(all5)) return 'monster';

  if (hasOverpair(heroCards, flop)) {
    const board = classifyBoardTexture(flop);
    return board === 'dry' || board === 'semi-wet' ? 'strong-made-hand' : 'medium-made-hand';
  }

  const kicker = topPairKicker(heroCards, flop);
  if (kicker !== null) {
    const board = classifyBoardTexture(flop);
    if (isTopKicker(kicker) && (board === 'dry' || board === 'semi-wet')) return 'strong-made-hand';
    if (isGoodKicker(kicker) && board === 'dry') return 'strong-made-hand';
    return 'medium-made-hand';
  }

  // Middle pair: hero card matches 2nd-highest board rank
  const [, midRank] = boardTopRanks(flop);
  if (heroCards.some(c => c.rank === midRank)) return 'medium-made-hand';

  // Bottom pair or underpair
  const botRank = boardTopRanks(flop)[2];
  if (heroCards.some(c => c.rank === botRank)) return 'weak-made-hand';
  if (heroCards[0].rank === heroCards[1].rank) return 'weak-made-hand'; // underpair (overpair already handled above)

  return 'no-made-hand';
}
