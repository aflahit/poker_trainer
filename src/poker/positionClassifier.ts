import type { Position, PositionClass } from './types';

export function classifyPosition(position: Position): PositionClass {
  switch (position) {
    case 'UTG':
    case 'UTG+1':
      return 'early';
    case 'Middle':
    case 'Hijack':
      return 'middle';
    case 'Cutoff':
    case 'Button':
      return 'late';
    case 'Small Blind':
      return 'small-blind';
    case 'Big Blind':
      return 'big-blind';
  }
}
