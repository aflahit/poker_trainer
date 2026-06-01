import type { HandClass } from './types';

const PREMIUM = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo',
]);

const STRONG = new Set([
  'AQs', 'AQo', 'AJs', 'KQs', '99', '88',
]);

const MEDIUM_PLAYABLE = new Set([
  '77', '66', '55', 'ATs', 'A9s', 'KJs', 'KQo', 'QJs', 'JTs', 'T9s',
]);

const SPECULATIVE = new Set([
  '44', '33', '22',
  'A5s', 'A4s', 'A3s', 'A2s',
  '98s', '87s', '76s', '65s', '54s',
  'KTs', 'QTs', 'J9s', 'T8s', '97s', '86s',
]);

const TRAP = new Set([
  'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  'KJo', 'KTo', 'K9o', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'QTo', 'Q9o', 'Q9s', 'Q8s', 'Q7s', 'Q6s',
  'JTo', 'J9o', 'J8s',
  'T8o', 'T9o',
]);

export function classifyHand(handCode: string): HandClass {
  if (PREMIUM.has(handCode)) return 'premium';
  if (STRONG.has(handCode)) return 'strong';
  if (MEDIUM_PLAYABLE.has(handCode)) return 'medium-playable';
  if (SPECULATIVE.has(handCode)) return 'speculative';
  if (TRAP.has(handCode)) return 'trap';
  return 'trash';
}

export function isSmallPair(handCode: string): boolean {
  return ['22', '33', '44', '55', '66'].includes(handCode);
}

export function isSmallOrMediumPair(handCode: string): boolean {
  return ['22', '33', '44', '55', '66', '77', '88'].includes(handCode);
}

export function isStrongIsolationHand(handCode: string): boolean {
  return (
    PREMIUM.has(handCode) ||
    STRONG.has(handCode) ||
    ['KJs', 'QJs'].includes(handCode)
  );
}

export function isSpeculativeHand(handCode: string): boolean {
  return SPECULATIVE.has(handCode) || isSmallPair(handCode);
}

export function isGoodSpeculativeHand(handCode: string): boolean {
  return ['98s', '87s', '76s', '65s', 'A5s', 'A4s', 'A3s', 'A2s', 'KTs', 'QTs', 'JTs'].includes(handCode);
}

export function isVeryStrongHand(handCode: string): boolean {
  return ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs'].includes(handCode);
}

export function isBigBlindDefenseHand(handCode: string): boolean {
  const defenseHands = new Set([
    '22', '33', '44', '55', '66', '77', '88', '99',
    'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    'AJo', 'ATo',
    'KTs', 'KJs', 'KQs', 'KQo',
    'QTs', 'QJs', 'JTs', 'T9s', '98s', '87s',
  ]);
  return defenseHands.has(handCode);
}

export function isReasonableContinueHand(handCode: string): boolean {
  const continueHands = new Set([
    '66', '77', '88', '99',
    'ATs', 'AJs', 'AJo',
    'KQs', 'KJs', 'QJs', 'JTs', 'T9s', '98s',
  ]);
  return continueHands.has(handCode);
}
