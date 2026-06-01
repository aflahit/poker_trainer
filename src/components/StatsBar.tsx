import type { GameStats } from '../poker/scoring';
import { accuracyPercent } from '../poker/scoring';

type Props = { stats: GameStats };

export function StatsBar({ stats }: Props) {
  const acc = accuracyPercent(stats);
  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-slate-800 rounded-xl text-sm font-medium">
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Score</span>
        <span className="text-emerald-400 text-lg font-bold">{stats.score}</span>
      </div>
      <div className="w-px h-8 bg-slate-600" />
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Streak</span>
        <span className="text-yellow-400 text-lg font-bold">{stats.currentStreak}</span>
      </div>
      <div className="w-px h-8 bg-slate-600" />
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Best</span>
        <span className="text-blue-400 text-lg font-bold">{stats.bestStreak}</span>
      </div>
      <div className="w-px h-8 bg-slate-600" />
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Accuracy</span>
        <span className="text-white text-lg font-bold">{stats.totalAnswered > 0 ? `${acc}%` : '—'}</span>
      </div>
      <div className="w-px h-8 bg-slate-600" />
      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Hands</span>
        <span className="text-white text-lg font-bold">{stats.totalAnswered}</span>
      </div>
    </div>
  );
}
