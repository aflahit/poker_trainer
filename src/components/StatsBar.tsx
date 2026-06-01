import type { GameStats } from '../poker/scoring';
import { accuracyPercent } from '../poker/scoring';

type Props = { stats: GameStats };

export function StatsBar({ stats }: Props) {
  const acc = accuracyPercent(stats);

  return (
    <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 rounded-xl">
      <Stat label="Score"    value={stats.score.toString()}                                    color="text-emerald-400" />
      <Divider />
      <Stat label="Streak"   value={stats.currentStreak.toString()}                            color="text-yellow-400" />
      <Divider />
      <Stat label="Best"     value={stats.bestStreak.toString()}                               color="text-blue-400" />
      <Divider />
      <Stat label="Accuracy" value={stats.totalAnswered > 0 ? `${acc}%` : '—'}               color="text-white" />
      <Divider />
      <Stat label="Hands"    value={stats.totalAnswered.toString()}                            color="text-white" />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center min-w-0">
      <span className="text-slate-400 text-[10px] uppercase tracking-wide leading-tight">{label}</span>
      <span className={`${color} text-base font-bold leading-tight`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-7 bg-slate-600 flex-shrink-0" />;
}
