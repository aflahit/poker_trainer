import type { Action } from '../poker/types';

type Props = {
  available: Action[];
  onSelect: (action: Action) => void;
  disabled?: boolean;
};

const ACTION_STYLES: Record<Action, string> = {
  Fold: 'bg-slate-600 hover:bg-slate-500 border-slate-500',
  Check: 'bg-blue-700 hover:bg-blue-600 border-blue-500',
  Call: 'bg-blue-700 hover:bg-blue-600 border-blue-500',
  Bet: 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500',
  Raise: 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500',
  'Re-raise': 'bg-rose-700 hover:bg-rose-600 border-rose-500',
  'Bet Small': 'bg-teal-700 hover:bg-teal-600 border-teal-500',
  'Bet Medium': 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500',
  'Bet Big': 'bg-orange-700 hover:bg-orange-600 border-orange-500',
};

export function ActionButtons({ available, onSelect, disabled }: Props) {
  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {available.map(action => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          disabled={disabled}
          className={`
            ${ACTION_STYLES[action]}
            text-white font-bold text-lg px-8 py-3 rounded-xl border-2
            transition-all duration-150 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            min-w-[120px]
          `}
        >
          {action}
        </button>
      ))}
    </div>
  );
}
