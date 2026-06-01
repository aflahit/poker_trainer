import type { PositionClass } from './types';

const EARLY_OPEN = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs',
]);

const MIDDLE_OPEN = new Set([
  ...EARLY_OPEN,
  '66', '55',
  'ATs', 'AJo', 'KQo', 'KJs', 'QJs', 'JTs', 'T9s',
]);

const LATE_OPEN = new Set([
  ...MIDDLE_OPEN,
  '44', '33', '22',
  'A2s', 'A3s', 'A4s', 'A5s', 'A6s', 'A7s', 'A8s', 'A9s',
  'ATo', 'KJo', 'KTs', 'QJo', 'QTs', 'J9s', 'T8s', '98s', '87s', '76s', '65s', '54s',
]);

const SMALL_BLIND_OPEN = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
  'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'ATs',
  'A2s', 'A3s', 'A4s', 'A5s', 'A6s', 'A7s', 'A8s',
  'A8o', 'A9o', 'ATo', 'AJo',
  'KQs', 'KJs', 'KTs', 'K9s', 'KQo', 'KTo',
  'QTs', 'JTs', 'T9s', '98s',
]);

export function isInOpeningRange(handCode: string, positionClass: PositionClass): boolean {
  switch (positionClass) {
    case 'early': return EARLY_OPEN.has(handCode);
    case 'middle': return MIDDLE_OPEN.has(handCode);
    case 'late': return LATE_OPEN.has(handCode);
    case 'small-blind': return SMALL_BLIND_OPEN.has(handCode);
    case 'big-blind': return true; // BB doesn't open — faces action
  }
}
