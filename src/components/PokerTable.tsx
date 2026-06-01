import type { Puzzle } from '../poker/types';
import type { SeatInfo, SeatStatus } from '../poker/tableUtils';
import { buildTableSeats } from '../poker/tableUtils';
import { suitColor } from '../poker/cards';

type Props = { puzzle: Puzzle };

const STATUS_RING: Record<SeatStatus, string> = {
  hero: 'ring-2 ring-yellow-400',
  raised: 'ring-2 ring-orange-400',
  'three-bet': 'ring-2 ring-red-500',
  limped: 'ring-2 ring-blue-400',
  folded: 'ring-1 ring-red-900',
  waiting: 'ring-2 ring-slate-400',
};

const STATUS_BG: Record<SeatStatus, string> = {
  hero: 'bg-yellow-500/20',
  raised: 'bg-orange-500/20',
  'three-bet': 'bg-red-500/20',
  limped: 'bg-blue-500/20',
  folded: 'bg-red-950/70',
  waiting: 'bg-slate-600/60',
};

const STATUS_TEXT: Record<SeatStatus, string> = {
  hero: 'text-yellow-300 font-bold',
  raised: 'text-orange-300 font-semibold',
  'three-bet': 'text-red-300 font-semibold',
  limped: 'text-blue-300 font-semibold',
  folded: 'text-red-800',
  waiting: 'text-slate-300',
};

const STATUS_BADGE: Record<SeatStatus, { icon: string; label: string; color: string } | null> = {
  hero: null,
  raised: { icon: '↑', label: 'RAISED', color: 'text-orange-400' },
  'three-bet': { icon: '↑↑', label: '3-BET', color: 'text-red-400' },
  limped: { icon: '→', label: 'LIMPED', color: 'text-blue-400' },
  folded: { icon: '✕', label: 'FOLDED', color: 'text-slate-500' },
  waiting: { icon: '…', label: '', color: 'text-slate-500' },
};

function SeatChip({ seat }: { seat: SeatInfo }) {
  const badge = STATUS_BADGE[seat.status];

  return (
    <div className="flex flex-col items-center gap-0.5" style={{ width: 60 }}>
      {/* Dealer button above seat */}
      {seat.isButton && (
        <div className="w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center shadow mb-0.5">
          D
        </div>
      )}
      {!seat.isButton && <div style={{ height: 20 }} />}

      {/* Main chip circle */}
      <div
        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center
          ${STATUS_BG[seat.status]} ${STATUS_RING[seat.status]} backdrop-blur-sm`}
      >
        <span className={`text-[11px] leading-tight ${STATUS_TEXT[seat.status]}`}>
          {seat.label}
        </span>
        {badge && badge.icon !== '…' && (
          <span className={`text-[11px] leading-none font-bold ${badge.color}`}>
            {badge.icon}
          </span>
        )}
        {seat.isHero && (
          <span className="text-[9px] text-yellow-400 leading-none">YOU</span>
        )}
      </div>

      {/* SB / BB badge */}
      {(seat.isSB || seat.isBB) && (
        <div className={`text-[9px] font-bold px-1 rounded ${seat.isSB ? 'text-blue-300' : 'text-red-300'}`}>
          {seat.isSB ? 'SB' : 'BB'}
        </div>
      )}
    </div>
  );
}

// Inline legend so users know what colors mean
function Legend() {
  const items = [
    { color: 'bg-orange-400', label: 'Raised' },
    { color: 'bg-blue-400', label: 'Limped' },
    { color: 'bg-red-900', label: 'Folded' },
    { color: 'bg-slate-400', label: 'Waiting' },
    { color: 'bg-red-400', label: '3-Bet' },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-slate-400 text-[11px]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function PokerTable({ puzzle }: Props) {
  const seats = buildTableSeats(puzzle.playerCount, puzzle.heroPosition, puzzle.previousAction);

  if (seats.length === 0) return null;

  // Table container dimensions (px) — used for positioning math
  const W = 480;
  const H = 260;
  const cx = W / 2;
  const cy = H / 2;
  // Ellipse radii for seat center positions (leave margin for 60px wide seats)
  const rx = W * 0.42;
  const ry = H * 0.40;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Table wrapper — fixed aspect, responsive via max-width */}
      <div
        className="relative w-full"
        style={{ maxWidth: W, aspectRatio: `${W} / ${H}` }}
      >
        {/* Felt oval */}
        <div
          className="absolute rounded-[50%] border-4 border-amber-900/60 shadow-inner"
          style={{
            left: '10%', right: '10%', top: '10%', bottom: '10%',
            background: 'radial-gradient(ellipse at center, #166534 60%, #14532d 100%)',
            boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.5)',
          }}
        />

        {/* Seats */}
        {seats.map((seat, i) => {
          const θ = (seat.angleDeg * Math.PI) / 180;
          // x = cx + rx*sin(θ), y = cy + ry*cos(θ)  — bottom at θ=0, clockwise
          const xPx = cx + rx * Math.sin(θ);
          const yPx = cy + ry * Math.cos(θ);
          const xPct = (xPx / W) * 100;
          const yPct = (yPx / H) * 100;

          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <SeatChip seat={seat} />
            </div>
          );
        })}

        {/* Hero cards on the table, centered low */}
        <div
          className="absolute flex gap-1.5 items-center"
          style={{ left: '50%', top: '73%', transform: 'translate(-50%, -50%)' }}
        >
          {puzzle.heroCards.map((card, i) => {
            const symbol = { s: '♠', h: '♥', d: '♦', c: '♣' }[card.suit];
            const colorClass = suitColor(card.suit);
            return (
              <div
                key={i}
                className="w-9 h-12 bg-white rounded-md border border-slate-300 flex flex-col items-center justify-center shadow-md"
              >
                <span className={`${colorClass} text-sm font-bold leading-none`}>{card.rank}</span>
                <span className={`${colorClass} text-sm font-bold leading-none`}>{symbol}</span>
              </div>
            );
          })}
        </div>

        {/* Pot label in center */}
        <div
          className="absolute text-center"
          style={{ left: '50%', top: '42%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="text-slate-400 text-[10px] uppercase tracking-widest">Pot</div>
          <div className="text-white text-sm font-bold">{puzzle.potSize.toLocaleString()}</div>
        </div>
      </div>

      <Legend />
    </div>
  );
}
