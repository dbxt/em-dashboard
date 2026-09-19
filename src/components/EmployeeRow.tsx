import { CSSProperties } from 'react';
import { fmtShort, workingDayDate } from '../domain/dates';
import { expectedPoints } from '../domain/evaluate';
import { Config, Evaluation } from '../domain/types';
import { StatusBadge } from './StatusBadge';

interface Props {
  ev: Evaluation;
  config: Config;
  yMax: number;
  onOpen: () => void;
}

const initials = (name: string) =>
  name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export function EmployeeRow({ ev, config, yMax, onOpen }: Props) {
  const { employee: e, sprint, day } = ev;
  const days = Array.from({ length: config.sprintDays }, (_, i) => i + 1);
  const pct = (v: number) => Math.min(100, (v / yMax) * 100);

  // Expected-pace polyline through the centre of each day column (all days, so the target is visible ahead of time).
  const expectedLine = days
    .map((d) => `${((d - 0.5) / config.sprintDays) * 100},${100 - pct(expectedPoints(config, sprint, d))}`)
    .join(' ');

  const pips = Math.max(config.maxOpenPRs, ev.openPRs);
  const capWarn = ev.capacityState !== 'at';
  const capLabel = ev.capacityState === 'above' ? 'over capacity' : ev.capacityState === 'below' ? 'under capacity' : 'at capacity';
  const ptoDates = sprint.ptoDays.map((d) => fmtShort(workingDayDate(config.sprintStart, d)));

  return (
    <li className={`lane-item lane-${ev.status}`}>
      <div className="lane-grid lane" onClick={onOpen}>
        <div className="person">
          <span className={`avatar avatar-${ev.status}`} aria-hidden="true">{initials(e.name)}</span>
          <div className="person-text">
            <button className="person-name" onClick={(evt) => { evt.stopPropagation(); onOpen(); }} aria-label={`Open details for ${e.name}`}>
              {e.name}
            </button>
            <span className="person-role">{e.role}</span>
            <span className="person-handles">@{e.githubHandle} · {e.jiraHandle}</span>
          </div>
        </div>

        <div className="track" style={{ '--cols': config.sprintDays } as CSSProperties}>
          <div className="track-cells">
            {days.map((d) => {
              const m = sprint.daily[d];
              const isPto = sprint.ptoDays.includes(d);
              const reached = d <= day;
              const title = isPto
                ? `${fmtShort(workingDayDate(config.sprintStart, d))}: PTO`
                : `${fmtShort(workingDayDate(config.sprintStart, d))}: ${reached ? `${m.pointsCompleted} pts done` : 'upcoming'}, ${expectedPoints(config, sprint, d)} expected`;
              return (
                <div key={d} className={`cell${isPto ? ' cell-pto' : ''}${d === day ? ' cell-now' : ''}${d > day ? ' cell-future' : ''}${d === Math.ceil(config.sprintDays / 2) + 1 ? ' week-start' : ''}`} title={title}>
                  {reached && !isPto && <span className={`bar${d === day ? ' bar-now' : ''}`} style={{ height: `${pct(m.pointsCompleted)}%` }} />}
                  {reached && isPto && m.pointsCompleted > 0 && <span className="bar bar-pto" style={{ height: `${pct(m.pointsCompleted)}%` }} />}
                </div>
              );
            })}
          </div>
          <svg className="track-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" x2="100" y1={100 - pct(sprint.assignedPoints)} y2={100 - pct(sprint.assignedPoints)} className="line-assigned" />
            <polyline points={expectedLine} className="line-expected" />
          </svg>
          <span className="track-assigned" style={{ bottom: `${pct(sprint.assignedPoints)}%` }}>{sprint.assignedPoints}</span>
        </div>

        <div className={`stat col-cap${capWarn ? ' stat-warn' : ''}`}>
          <strong>{ev.completed}<span className="of"> / {sprint.assignedPoints}</span></strong>
          <small>{capLabel}{capWarn ? ` (${ev.capacity})` : ''}</small>
          {ptoDates.length > 0 && <small className="pto-note">PTO {ptoDates.join(', ')}</small>}
        </div>

        <div className={`stat col-pr${ev.openPRs > config.maxOpenPRs ? ' stat-warn' : ''}`}>
          <div className="pips" role="img" aria-label={`${ev.openPRs} open pull requests, limit ${config.maxOpenPRs}`}>
            {Array.from({ length: pips }, (_, i) => (
              <span key={i} className={`pip${i < ev.openPRs ? ' pip-on' : ''}${i >= config.maxOpenPRs ? ' pip-over' : ''}`} />
            ))}
          </div>
          <small>{ev.openPRs} open · {ev.totalPRs} total</small>
        </div>

        <div className="col-status">
          <StatusBadge status={ev.status} detail={ev.warnings.length === 0 ? 'no warnings' : `${ev.warnings.length} warning${ev.warnings.length === 1 ? '' : 's'}`} />
        </div>
      </div>

      {ev.warnings.length > 0 && (
        <ul className="lane-notes">
          {ev.warnings.map((w) => (
            <li key={w.type}><span className={`dot dot-${w.type}`} aria-hidden="true" />{w.message}</li>
          ))}
        </ul>
      )}
    </li>
  );
}
