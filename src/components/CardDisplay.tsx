import type { Card } from '../poker/types';
import { suitColor } from '../poker/cards';

type Props = { card: Card; size?: 'sm' | 'md' | 'lg' };

export function CardDisplay({ card, size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'w-10 h-14 text-base',
    md: 'w-14 h-20 text-xl',
    lg: 'w-20 h-28 text-3xl',
  };

  const symbol = { s: '♠', h: '♥', d: '♦', c: '♣' }[card.suit];
  const colorClass = suitColor(card.suit);

  return (
    <div
      className={`${sizeClasses[size]} bg-white rounded-lg border-2 border-slate-300 flex flex-col items-center justify-center font-bold shadow-md select-none`}
    >
      <span className={`${colorClass} leading-none`}>{card.rank}</span>
      <span className={`${colorClass} leading-none`}>{symbol}</span>
    </div>
  );
}
