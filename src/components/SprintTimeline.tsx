import { KeyboardEvent } from 'react';
import { fmtRange, fmtShort, fmtWeekday, workingDayDate } from '../domain/dates';
import { Config } from '../domain/types';

interface Props {
  config: Config;
  day: number;
  playing: boolean;
  onSelectDay: (d: number) => void;
  onTogglePlay: () => void;
  onReroll: () => void;
}

/** Column header for the lane board: the day scrubber shares its grid with every lane below. */
export function SprintTimeline({ config, day, playing, onSelectDay, onTogglePlay, onReroll }: Props) {
  const days = Array.from({ length: config.sprintDays }, (_, i) => i + 1);
  const half = Math.ceil(config.sprintDays / 2);
  const start = workingDayDate(config.sprintStart, 1);
  const end = workingDayDate(config.sprintStart, config.sprintDays);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (step === 0 && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next = e.key === 'Home' ? 1 : e.key === 'End' ? config.sprintDays : Math.min(config.sprintDays, Math.max(1, day + step));
    onSelectDay(next);
    requestAnimationFrame(() => document.getElementById(`day-${next}`)?.focus());
  };

  return (
    <div className="lane-grid timeline">
      <div className="timeline-id">
        <h2 className="sprint-title">Sprint 38</h2>
        <p className="sprint-range">
          {fmtRange(start, end)} · day {day} of {config.sprintDays}
        </p>
        <div className="timeline-actions">
          <button className="btn btn-primary" onClick={onTogglePlay} aria-pressed={playing}>
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5l9 5.5-9 5.5z" fill="currentColor" /></svg>
            )}
            {playing ? 'Pause' : day >= config.sprintDays ? 'Replay' : 'Play sprint'}
          </button>
          <button className="btn" onClick={onReroll} title="Generate a new set of assignments, PTO and progress">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 11-1.7-4M13 1.5V4.5H10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Re-roll data
          </button>
        </div>
      </div>

      <div className="track-head">
        <div className="weeks" aria-hidden="true">
          <span style={{ gridColumn: `1 / span ${half}` }}>Week 1</span>
          <span style={{ gridColumn: `${half + 1} / span ${config.sprintDays - half}` }}>Week 2</span>
        </div>
        <div className="days" role="radiogroup" aria-label="Sprint day" onKeyDown={onKey}>
          {days.map((d) => {
            const date = workingDayDate(config.sprintStart, d);
            const state = d < day ? 'past' : d === day ? 'now' : 'future';
            return (
              <button
                key={d}
                id={`day-${d}`}
                role="radio"
                aria-checked={d === day}
                tabIndex={d === day ? 0 : -1}
                className={`day day-${state}${d === half + 1 ? ' week-start' : ''}`}
                onClick={() => onSelectDay(d)}
                aria-label={`Day ${d}, ${fmtWeekday(date)} ${fmtShort(date)}`}
              >
                <span className="day-name">{fmtWeekday(date)}</span>
                <span className="day-num">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="col-head col-cap">Points</div>
      <div className="col-head col-pr">Open PRs</div>
      <div className="col-head col-status">Status</div>
    </div>
  );
}
