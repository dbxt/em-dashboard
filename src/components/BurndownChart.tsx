import { TeamSeries } from '../domain/team';

interface Props {
  series: TeamSeries;
  day: number;
  sprintDays: number;
}

const W = 360;
const H = 120;
const PAD = { l: 30, r: 8, t: 8, b: 20 };

/** Remaining points per day vs. the ideal line derived from each person's available days. */
export function BurndownChart({ series, day, sprintDays }: Props) {
  const x = (d: number) => PAD.l + (d / sprintDays) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / series.committed) * (H - PAD.t - PAD.b);
  const remaining = (arr: number[], d: number) => series.committed - arr[d];
  const line = (arr: number[], upTo: number) =>
    Array.from({ length: upTo + 1 }, (_, d) => `${x(d)},${y(remaining(arr, d))}`).join(' ');
  const ticks = [0, 0.5, 1].map((f) => Math.round(series.committed * f));
  const left = remaining(series.done, day);

  return (
    <svg className="burndown" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Burndown: ${left} of ${series.committed} points remaining on day ${day}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="grid-line" />
          <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" className="axis-text">{t}</text>
        </g>
      ))}
      {[0, sprintDays / 2, sprintDays].map((d) => (
        <text key={d} x={x(d)} y={H - 5} textAnchor={d === 0 ? 'start' : d === sprintDays ? 'end' : 'middle'} className="axis-text">
          {d === 0 ? 'Start' : `Day ${d}`}
        </text>
      ))}
      <polyline points={line(series.expected, sprintDays)} className="bd-ideal" />
      <polyline points={line(series.done, day)} className="bd-actual" />
      <line x1={x(day)} x2={x(day)} y1={PAD.t} y2={H - PAD.b} className="bd-now" />
      <circle cx={x(day)} cy={y(left)} r="4" className="bd-dot" />
      <text x={Math.min(x(day) + 8, W - 40)} y={Math.max(y(left) - 8, 14)} className="bd-label">{left} left</text>
    </svg>
  );
}
