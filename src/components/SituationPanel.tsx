import { useState } from 'react';
import type { Puzzle, OpponentType, PreviousAction, Position } from '../poker/types';
import { CardDisplay } from './CardDisplay';
import { POSITIONS_BY_COUNT } from '../poker/tableUtils';

type Props = { puzzle: Puzzle };

const PREVIOUS_ACTION_LABELS: Record<string, string> = {
  'folded-to-hero': 'Folded to you',
  'one-limper': 'One player limped',
  'multiple-limpers': 'Multiple players limped',
  'early-raise': 'Early position raised',
  'middle-raise': 'Middle position raised',
  'late-raise': 'Late position raised',
  'raise-and-callers': 'Raise with callers',
  'three-bet-before-hero': 'Raise and re-raise before you',
};

function getActionLabel(action: PreviousAction, heroPosition: Position, playerCount: number): string {
  if (action === 'folded-to-hero') {
    const positions = POSITIONS_BY_COUNT[playerCount] ?? [];
    // HU: Small Blind and Button are the same seat — normalize so indexOf works
    const effectivePosition: Position = playerCount === 2 && heroPosition === 'Small Blind' ? 'Button' : heroPosition;
    const heroIdx = positions.indexOf(effectivePosition);
    if (heroIdx === 0) return 'First to act';
  }
  return PREVIOUS_ACTION_LABELS[action];
}

const OPPONENT_LABELS: Record<OpponentType, string> = {
  unknown: 'Unknown',
  tight: 'Tight player',
  'loose-passive': 'Loose passive',
  'loose-aggressive': 'Loose aggressive',
  maniac: 'Maniac',
  'calling-station': 'Calling station',
};

const OPPONENT_DESCRIPTIONS: Record<OpponentType, { traits: string[]; strategy: string }> = {
  unknown: {
    traits: [],
    strategy: '',
  },
  tight: {
    traits: ['Plays very few hands', 'Only raises with strong cards', 'Rarely bluffs'],
    strategy: 'Respect their raises. If a tight player raises early, they almost always have a strong hand. Fold marginal hands you might play against others.',
  },
  'loose-passive': {
    traits: ['Plays many hands', 'Calls a lot but rarely raises', 'Weak or passive post-flop'],
    strategy: 'Raise strong hands for value — they will call with worse. Do not try to bluff them off hands. Isolate them when you have good cards.',
  },
  'loose-aggressive': {
    traits: ['Plays many hands', 'Bets and raises frequently', 'Hard to put on a hand'],
    strategy: 'Let them bluff into you. Re-raise with strong hands rather than just calling. Avoid fancy bluffs — they may not fold.',
  },
  maniac: {
    traits: ['Raises and re-raises constantly', 'Plays almost any two cards', 'Very unpredictable'],
    strategy: 'Trap them with strong hands. Call down lighter than normal. Avoid folding good hands — they are often bluffing.',
  },
  'calling-station': {
    traits: ['Calls almost everything', 'Almost never folds once in a hand', 'Rarely raises'],
    strategy: 'Value bet relentlessly with any strong hand. Never bluff — they will not fold. Build big pots when you are ahead.',
  },
};

const STACK_LABELS: Record<string, string> = {
  short: 'Short (~20bb)',
  medium: 'Medium (30–80bb)',
  deep: 'Deep (100bb+)',
};

const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Basic', color: 'text-emerald-400' },
  2: { label: 'Beginner trap', color: 'text-green-400' },
  3: { label: 'Situational', color: 'text-yellow-400' },
  4: { label: 'Advanced', color: 'text-orange-400' },
  5: { label: 'Expert', color: 'text-red-400' },
};

export function SituationPanel({ puzzle }: Props) {
  const diff = DIFFICULTY_LABELS[puzzle.difficulty];

  return (
    <div className="bg-slate-800 rounded-2xl p-5 space-y-4 w-full">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">Pre-flop · {puzzle.playerCount} players</span>
        <span className={`text-xs font-semibold ${diff.color}`}>{diff.label}</span>
      </div>

      <div className="flex gap-3 justify-center">
        {puzzle.heroCards.map((card, i) => (
          <CardDisplay key={i} card={card} size="lg" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <SituationRow label="Your position" value={puzzle.heroPosition} />
        <SituationRow label="Stack depth" value={STACK_LABELS[puzzle.stackDepth]} />
        <SituationRow
          label="Action before you"
          value={getActionLabel(puzzle.previousAction, puzzle.heroPosition, puzzle.playerCount)}
          span
        />
        {puzzle.opponentType !== 'unknown' && (
          <OpponentRow opponentType={puzzle.opponentType} />
        )}
        <SituationRow label="Pot size" value={`${puzzle.potSize.toLocaleString()} chips`} />
        <SituationRow label="Blinds" value={`${puzzle.blinds.small} / ${puzzle.blinds.big}`} />
      </div>
    </div>
  );
}

function OpponentRow({ opponentType }: { opponentType: OpponentType }) {
  const [open, setOpen] = useState(false);
  const info = OPPONENT_DESCRIPTIONS[opponentType];

  return (
    <div className="col-span-2 bg-slate-700/50 rounded-lg px-3 py-2 relative">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Opponent read</span>
        <button
          onClick={() => setOpen(v => !v)}
          className="w-4 h-4 rounded-full bg-slate-500 hover:bg-slate-400 text-white text-[10px] font-bold flex items-center justify-center leading-none transition-colors flex-shrink-0"
          aria-label="Explain opponent type"
        >
          ?
        </button>
      </div>
      <div className="text-white font-medium text-sm">{OPPONENT_LABELS[opponentType]}</div>

      {open && (
        <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
          <ul className="space-y-1">
            {info.traits.map(trait => (
              <li key={trait} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-slate-500 mt-0.5">•</span>
                {trait}
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-300 leading-relaxed">{info.strategy}</p>
        </div>
      )}
    </div>
  );
}

function SituationRow({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={`bg-slate-700/50 rounded-lg px-3 py-2 ${span ? 'col-span-2' : ''}`}>
      <div className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-white font-medium text-sm">{value}</div>
    </div>
  );
}
