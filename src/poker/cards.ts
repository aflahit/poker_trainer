import type { Card, CardRank, Suit } from './types';

const RANKS: CardRank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function dealCards(count: number, exclude: Card[] = []): Card[] {
  const excludeSet = new Set(exclude.map(cardKey));
  const deck = shuffleDeck(buildDeck()).filter(c => !excludeSet.has(cardKey(c)));
  return deck.slice(0, count);
}

export function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function rankIndex(rank: CardRank): number {
  return RANKS.indexOf(rank);
}

export function cardDisplay(card: Card): string {
  const suitSymbols: Record<Suit, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

export function suitColor(suit: Suit): string {
  return suit === 'h' || suit === 'd' ? 'text-red-500' : 'text-slate-900';
}
