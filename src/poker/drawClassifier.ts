import type { Card, DrawCategory, Suit } from './types';
import { rankIndex } from './cards';

function suitCounts(cards: Card[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of cards) counts[c.suit] = (counts[c.suit] ?? 0) + 1;
  return counts;
}

function flushDrawSuit(heroCards: [Card, Card], flop: [Card, Card, Card]): Suit | null {
  const all = [...heroCards, ...flop];
  const counts = suitCounts(all);
  for (const [suit, n] of Object.entries(counts)) {
    if (n === 4) return suit as Suit;
  }
  return null;
}

function hasFlushDraw(heroCards: [Card, Card], flop: [Card, Card, Card]): boolean {
  return flushDrawSuit(heroCards, flop) !== null;
}

function hasNutFlushDraw(heroCards: [Card, Card], flop: [Card, Card, Card]): boolean {
  const suit = flushDrawSuit(heroCards, flop);
  return suit !== null && heroCards.some(c => c.suit === suit && c.rank === 'A');
}

function uniqueRankIdxsSorted(heroCards: [Card, Card], flop: [Card, Card, Card]): number[] {
  return [...new Set([...heroCards, ...flop].map(c => rankIndex(c.rank)))].sort((a, b) => a - b);
}

function hasOESD(heroCards: [Card, Card], flop: [Card, Card, Card]): boolean {
  const idxs = uniqueRankIdxsSorted(heroCards, flop);
  for (let i = 0; i <= idxs.length - 4; i++) {
    const sub = idxs.slice(i, i + 4);
    if (sub[3] - sub[0] === 3 && sub.every((v, j) => j === 0 || v === sub[j - 1] + 1)) {
      const canLow = sub[0] < 12; // not at 2 (index 12)
      const canHigh = sub[3] > 0;  // not at A (index 0)
      if (canLow && canHigh) return true;
    }
  }
  return false;
}

function hasGutshot(heroCards: [Card, Card], flop: [Card, Card, Card]): boolean {
  const idxs = uniqueRankIdxsSorted(heroCards, flop);
  // 4 cards spanning 5 with one interior gap
  for (let i = 0; i <= idxs.length - 4; i++) {
    const sub = idxs.slice(i, i + 4);
    if (sub[3] - sub[0] === 4) {
      const missing = [];
      for (let r = sub[0]; r <= sub[3]; r++) if (!sub.includes(r)) missing.push(r);
      if (missing.length === 1) return true;
    }
  }
  // One-ended (A-high or 2-low) 4-card straight
  for (let i = 0; i <= idxs.length - 4; i++) {
    const sub = idxs.slice(i, i + 4);
    if (sub[3] - sub[0] === 3 && sub.every((v, j) => j === 0 || v === sub[j - 1] + 1)) {
      if (sub[0] === 0 || sub[3] === 12) return true; // blocked on one end
    }
  }
  return false;
}

function countOvercards(heroCards: [Card, Card], flop: [Card, Card, Card]): number {
  const topBoardIdx = Math.min(...flop.map(c => rankIndex(c.rank)));
  return heroCards.filter(c => rankIndex(c.rank) < topBoardIdx).length;
}

function hasAnyBoardPair(heroCards: [Card, Card], flop: [Card, Card, Card]): boolean {
  return heroCards.some(c => flop.some(b => b.rank === c.rank));
}

function hasBackdoorFlushDraw(heroCards: [Card, Card], flop: [Card, Card, Card]): boolean {
  const counts = suitCounts([...heroCards, ...flop]);
  for (const [suit, n] of Object.entries(counts)) {
    if (n === 3 && heroCards.some(c => c.suit === suit)) return true;
  }
  return false;
}

export function classifyDraw(heroCards: [Card, Card], flop: [Card, Card, Card]): DrawCategory {
  const fd = hasFlushDraw(heroCards, flop);
  const nfd = hasNutFlushDraw(heroCards, flop);
  const oesd = hasOESD(heroCards, flop);
  const gs = hasGutshot(heroCards, flop);
  const overcards = countOvercards(heroCards, flop);
  const hasPair = hasAnyBoardPair(heroCards, flop);

  if ((fd && oesd) || (fd && hasPair) || (nfd && overcards >= 1)) return 'combo-draw';
  if (nfd) return 'nut-flush-draw';
  if (fd) return 'flush-draw';
  if (oesd) return 'open-ended-straight-draw';
  if (gs) return 'gutshot';
  if (overcards >= 2) return 'two-overcards';
  if (hasBackdoorFlushDraw(heroCards, flop)) return 'backdoor-only';
  return 'no-draw';
}
