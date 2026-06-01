import type { Puzzle, Action } from '../poker/types';

type Props = {
  puzzle: Puzzle;
  playerAnswer: Action;
  wasCorrect: boolean;
  onNext: () => void;
};

const MISTAKE_LABELS: Record<string, string> = {
  'played-dominated-hand': 'Played a dominated hand',
  'overvalued-suited-junk': 'Overvalued suited cards',
  'failed-to-raise-premium': 'Failed to raise a premium hand',
  'called-when-should-raise': 'Called when you should have raised',
  'played-too-loose-early': 'Played too loose from early position',
  'failed-to-defend-big-blind': 'Failed to defend big blind',
  'weak-ace-trap': 'Fell for a weak ace trap',
  'wrong-three-bet-spot': 'Wrong three-bet spot',
  'ignored-position': 'Ignored position',
  'set-mine-wrong-conditions': 'Set-mined in wrong conditions',
};

export function FeedbackPanel({ puzzle, playerAnswer, wasCorrect, onNext }: Props) {
  return (
    <div
      className={`w-full max-w-lg rounded-2xl p-6 space-y-4 border-2 ${
        wasCorrect
          ? 'bg-emerald-950 border-emerald-600'
          : 'bg-rose-950 border-rose-700'
      }`}
    >
      {/* Result header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{wasCorrect ? '✓' : '✗'}</span>
        <div>
          <div className={`font-bold text-xl ${wasCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
            {wasCorrect ? 'Correct!' : 'Wrong'}
          </div>
          {!wasCorrect && (
            <div className="text-sm text-slate-300">
              You chose <span className="font-semibold text-white">{playerAnswer}</span>
              {' · '}
              Correct was <span className="font-semibold text-emerald-300">{puzzle.correctAction}</span>
            </div>
          )}
          {wasCorrect && (
            <div className="text-sm text-emerald-300">{puzzle.correctAction}</div>
          )}
        </div>
      </div>

      {/* Explanation */}
      <p className="text-slate-200 text-sm leading-relaxed">{puzzle.explanation}</p>

      {/* Mistake tag */}
      {!wasCorrect && puzzle.mistakeTag && (
        <div className="inline-flex items-center gap-2 bg-rose-900/50 border border-rose-700 rounded-lg px-3 py-1.5 text-xs text-rose-300">
          <span>Mistake:</span>
          <span className="font-semibold">{MISTAKE_LABELS[puzzle.mistakeTag] ?? puzzle.mistakeTag}</span>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {puzzle.tags.map(tag => (
          <span
            key={tag}
            className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full"
          >
            {tag.replace(/-/g, ' ')}
          </span>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors border border-slate-500"
      >
        Next hand →
      </button>
    </div>
  );
}
