import type { Puzzle, Action } from '../poker/types';

type Props = {
  puzzle: Puzzle;
  playerAnswer: Action;
  wasCorrect: boolean;
  wasAcceptable: boolean;
  flopJustUnlocked?: boolean;
  onNext: () => void;
};

const MISTAKE_LABELS: Record<string, string> = {
  // preflop
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
  // flop
  'overplayed-weak-top-pair': 'Overplayed weak top pair',
  'bluffed-calling-station': 'Bluffed a calling station',
  'chased-weak-draw': 'Chased a weak draw',
  'missed-value-bet': 'Missed a value bet',
  'folded-strong-draw': 'Folded a strong draw',
  'ignored-passive-aggression': 'Ignored passive-player aggression',
  'married-one-pair': 'Got married to one pair',
};

export function FeedbackPanel({ puzzle, playerAnswer, wasCorrect, wasAcceptable, flopJustUnlocked, onNext }: Props) {
  const isBorderline = puzzle.confidence === 'borderline';

  const theme =
    wasCorrect
      ? { bg: 'bg-emerald-950', border: 'border-emerald-600', accent: 'text-emerald-400', label: 'Correct!', sub: 'text-emerald-300' }
      : wasAcceptable
      ? { bg: 'bg-amber-950', border: 'border-amber-600', accent: 'text-amber-400', label: 'Acceptable', sub: 'text-amber-300' }
      : { bg: 'bg-rose-950', border: 'border-rose-700', accent: 'text-rose-400', label: 'Wrong', sub: 'text-rose-300' };

  return (
    <div className={`w-full max-w-lg rounded-2xl p-6 space-y-4 border-2 ${theme.bg} ${theme.border}`}>
      {/* Phase unlock banner */}
      {flopJustUnlocked && (
        <div className="bg-purple-900/60 border border-purple-500 rounded-xl px-4 py-3 text-center space-y-1">
          <div className="text-purple-300 font-bold text-base">Phase 2 Unlocked: Flop Training</div>
          <div className="text-purple-400 text-xs">90%+ accuracy on 10+ hands — your next puzzle will be a flop decision.</div>
        </div>
      )}

      {/* Result header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{wasCorrect ? '✓' : wasAcceptable ? '~' : '✗'}</span>
        <div>
          <div className={`font-bold text-xl ${theme.accent}`}>{theme.label}</div>
          {wasCorrect && (
            <div className={`text-sm ${theme.sub}`}>{puzzle.correctAction}</div>
          )}
          {wasAcceptable && (
            <div className={`text-sm ${theme.sub}`}>
              You chose <span className="font-semibold text-white">{playerAnswer}</span>
              {' · '}
              Best play: <span className="font-semibold text-emerald-300">{puzzle.correctAction}</span>
            </div>
          )}
          {!wasCorrect && !wasAcceptable && (
            <div className="text-sm text-slate-300">
              You chose <span className="font-semibold text-white">{playerAnswer}</span>
              {' · '}
              Correct was <span className="font-semibold text-emerald-300">{puzzle.correctAction}</span>
            </div>
          )}
        </div>
      </div>

      {/* Acceptable note */}
      {wasAcceptable && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-200 leading-relaxed">
          This is a borderline spot. {playerAnswer} is reasonable here, but {puzzle.correctAction} is the stronger play.
        </div>
      )}

      {/* Borderline note when correct */}
      {wasCorrect && isBorderline && (
        <div className="bg-slate-700/60 border border-slate-500 rounded-lg px-3 py-2 text-xs text-slate-300 leading-relaxed">
          Close spot — {puzzle.alternativeActions.join(' or ')} is also acceptable depending on stack depth and reads.
        </div>
      )}

      {/* Explanation */}
      <p className="text-slate-200 text-sm leading-relaxed">{puzzle.explanation}</p>

      {/* Recommended sizing */}
      {puzzle.recommendedSizing && (
        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
          <span className="text-slate-400 text-xs uppercase tracking-wide">Suggested size</span>
          <span className="text-white font-semibold text-sm ml-auto">{puzzle.recommendedSizing}</span>
        </div>
      )}

      {/* Mistake tag */}
      {!wasCorrect && !wasAcceptable && puzzle.mistakeTag && (
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
        className={`w-full font-semibold py-3 rounded-xl transition-colors border ${
          flopJustUnlocked
            ? 'bg-purple-700 hover:bg-purple-600 border-purple-500 text-white'
            : 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-white'
        }`}
      >
        {flopJustUnlocked ? 'Start Flop Training →' : 'Next hand →'}
      </button>
    </div>
  );
}
