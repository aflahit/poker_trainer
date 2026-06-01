import { useGameStore } from './store/gameStore';
import { StatsBar } from './components/StatsBar';
import { PokerTable } from './components/PokerTable';
import { SituationPanel } from './components/SituationPanel';
import { ActionButtons } from './components/ActionButtons';
import { FeedbackPanel } from './components/FeedbackPanel';

export default function App() {
  const { state, startGame, submitAnswer, nextPuzzle } = useGameStore();
  const { phase, puzzle, lastAnswer, wasCorrect, stats } = state;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center py-6 px-4 gap-5">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Texas Hold'em Trainer</h1>
        <p className="text-slate-400 text-sm mt-0.5">Pre-flop decision drills</p>
      </div>

      {/* Stats bar */}
      {phase !== 'idle' && <StatsBar stats={stats} />}

      {/* Idle screen */}
      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-6 mt-12">
          <div className="text-slate-300 text-center max-w-sm leading-relaxed">
            Practice pre-flop decisions. Get instant feedback. Build discipline.
          </div>
          <button
            onClick={startGame}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl px-12 py-4 rounded-2xl transition-colors shadow-lg"
          >
            Start Drilling
          </button>
        </div>
      )}

      {/* Two-column game layout */}
      {puzzle && (phase === 'answering' || phase === 'feedback') && (
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-5 items-start">

          {/* Left column — poker table */}
          <div className="w-full lg:w-[480px] lg:flex-shrink-0 bg-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-3 text-center">
              Table View · {puzzle.playerCount} players
            </div>
            <PokerTable puzzle={puzzle} />
          </div>

          {/* Right column — cards, info, actions */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <SituationPanel puzzle={puzzle} />

            {phase === 'answering' && (
              <ActionButtons
                available={puzzle.availableActions}
                onSelect={submitAnswer}
              />
            )}

            {phase === 'feedback' && lastAnswer && wasCorrect !== null && (
              <FeedbackPanel
                puzzle={puzzle}
                playerAnswer={lastAnswer}
                wasCorrect={wasCorrect}
                onNext={nextPuzzle}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
