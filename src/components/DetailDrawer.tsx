import { useEffect, useRef } from 'react';
import { fmtShort, workingDayDate } from '../domain/dates';
import { expectedPoints } from '../domain/evaluate';
import { talkingPointsFor } from '../domain/talkingPoints';
import { Config, Evaluation } from '../domain/types';
import { StatusBadge } from './StatusBadge';

interface Props {
  ev: Evaluation;
  config: Config;
  onClose: () => void;
}

const W = 420;
const H = 150;
const PAD = { l: 26, r: 10, t: 10, b: 22 };

function PointsChart({ ev, config }: { ev: Evaluation; config: Config }) {
  const n = config.sprintDays;
  const yMax = Math.max(ev.sprint.assignedPoints, config.pointsPerSprint);
  const x = (d: number) => PAD.l + (d / n) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);
  const all = Array.from({ length: n + 1 }, (_, d) => d);
  const actual = all.filter((d) => d <= ev.day).map((d) => `${x(d)},${y(ev.sprint.daily[d].pointsCompleted)}`).join(' ');
  const expected = all.map((d) => `${x(d)},${y(expectedPoints(config, ev.sprint, d))}`).join(' ');
  return (
    <svg className="drawer-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Points completed by day: ${ev.completed} of ${ev.sprint.assignedPoints}, expected ${ev.expectedPoints}`}>
      {[0, yMax / 2, yMax].map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="grid-line" />
          <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" className="axis-text">{Math.round(t)}</text>
        </g>
      ))}
      {ev.sprint.ptoDays.map((d) => (
        <rect key={d} x={x(d - 1)} y={PAD.t} width={x(d) - x(d - 1)} height={H - PAD.t - PAD.b} className="pto-band" />
      ))}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(ev.sprint.assignedPoints)} y2={y(ev.sprint.assignedPoints)} className="line-assigned-solid" />
      <polyline points={expected} className="bd-ideal" />
      <polyline points={actual} className="bd-actual" />
      <circle cx={x(ev.day)} cy={y(ev.completed)} r="4" className="bd-dot" />
      {[0, n / 2, n].map((d) => (
        <text key={d} x={x(d)} y={H - 6} textAnchor={d === 0 ? 'start' : d === n ? 'end' : 'middle'} className="axis-text">{d === 0 ? 'Start' : `Day ${d}`}</text>
      ))}
    </svg>
  );
}

function PrChart({ ev, config }: { ev: Evaluation; config: Config }) {
  const n = config.sprintDays;
  const days = Array.from({ length: ev.day }, (_, i) => i + 1);
  const yMax = Math.max(config.maxOpenPRs + 2, ...days.map((d) => ev.sprint.daily[d].openPRs));
  const bw = (W - PAD.l - PAD.r) / n;
  const y = (v: number) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);
  return (
    <svg className="drawer-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Open pull requests by day; ${ev.openPRs} open now, limit ${config.maxOpenPRs}`}>
      <line x1={PAD.l} x2={W - PAD.r} y1={y(config.maxOpenPRs)} y2={y(config.maxOpenPRs)} className="line-limit" />
      <text x={W - PAD.r} y={y(config.maxOpenPRs) - 4} textAnchor="end" className="axis-text">limit {config.maxOpenPRs}</text>
      {days.map((d) => {
        const open = ev.sprint.daily[d].openPRs;
        return (
          <rect key={d} x={PAD.l + (d - 1) * bw + bw * 0.2} width={bw * 0.6} y={y(open)} height={Math.max(0, H - PAD.b - y(open))} className={open > config.maxOpenPRs ? 'pr-bar pr-over' : 'pr-bar'} rx="2" />
        );
      })}
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} className="grid-line" />
      {[1, Math.ceil(n / 2), n].map((d) => (
        <text key={d} x={PAD.l + (d - 0.5) * bw} y={H - 6} textAnchor="middle" className="axis-text">Day {d}</text>
      ))}
    </svg>
  );
}

export function DetailDrawer({ ev, config, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const e = ev.employee;
  const points = talkingPointsFor(ev);
  const pto = ev.sprint.ptoDays.map((d) => fmtShort(workingDayDate(config.sprintStart, d)));

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (k: KeyboardEvent) => k.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onClick={(x) => x.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2 id="drawer-title">{e.name}</h2>
            <p className="muted">{e.role} · @{e.githubHandle} · {e.jiraHandle}</p>
          </div>
          <button ref={closeRef} className="btn btn-ghost" onClick={onClose} aria-label="Close details">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </header>

        <div className="drawer-status">
          <StatusBadge status={ev.status} detail={`${ev.warnings.length} warning${ev.warnings.length === 1 ? '' : 's'} on day ${ev.day}`} />
        </div>

        <dl className="facts">
          <div><dt>Assigned</dt><dd>{ev.sprint.assignedPoints} pts</dd></div>
          <div><dt>Capacity</dt><dd>{ev.capacity} pts</dd></div>
          <div><dt>Done</dt><dd>{ev.completed} pts</dd></div>
          <div><dt>Expected</dt><dd>{ev.expectedPoints} pts</dd></div>
          <div><dt>PTO</dt><dd>{pto.length ? pto.join(', ') : 'None'}</dd></div>
          <div><dt>PRs</dt><dd>{ev.openPRs} open / {ev.totalPRs} total</dd></div>
        </dl>

        <section>
          <h3>Points vs. expected pace</h3>
          <PointsChart ev={ev} config={config} />
          <p className="legend"><span className="key key-actual" /> Completed <span className="key key-expected" /> Expected <span className="key key-pto" /> PTO</p>
        </section>

        <section>
          <h3>Open pull requests by day</h3>
          <PrChart ev={ev} config={config} />
        </section>

        <section>
          <h3>Why this status</h3>
          {ev.warnings.length === 0 ? (
            <p className="muted">Assigned work matches capacity, points are on pace, and open PRs are within the limit.</p>
          ) : (
            <ul className="warn-list">
              {ev.warnings.map((w) => (
                <li key={w.type}><span className={`dot dot-${w.type}`} aria-hidden="true" />{w.message}</li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Next one on one</h3>
          <ul className="points">
            {points.map((p, i) => (
              <li key={i}><span className={`dot dot-${p.type}`} aria-hidden="true" />{p.text}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
