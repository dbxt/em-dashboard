import { Config, Evaluation, Status } from '../domain/types';
import { EmployeeSprint } from '../domain/types';
import { teamSeries } from '../domain/team';
import { BurndownChart } from './BurndownChart';
import { StatusIcon, statusLabel } from './StatusBadge';
import { STATUS_RANK } from '../domain/evaluate';

interface Props {
  evaluations: Evaluation[];
  sprints: EmployeeSprint[];
  config: Config;
  day: number;
  filter: Status | 'all';
  onFilter: (s: Status | 'all') => void;
}

export function TeamSummary({ evaluations, sprints, config, day, filter, onFilter }: Props) {
  const counts: Record<Status, number> = { red: 0, amber: 0, green: 0 };
  evaluations.forEach((e) => counts[e.status]++);
  const series = teamSeries(sprints, config);
  const done = series.done[day];
  const expected = Math.round(series.expected[day]);
  const donePct = series.committed ? Math.round((done / series.committed) * 100) : 0;
  const diff = done - expected;
  const sorted = [...evaluations].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);

  return (
    <section className="summary" aria-label="Team summary">
      <div className="summary-block">
        <h3>Team health</h3>
        <div className="tiles" role="img" aria-label={`${counts.red} red, ${counts.amber} amber, ${counts.green} green`}>
          {sorted.map((e) => (
            <span key={e.employee.id} className={`tile tile-${e.status}`} title={`${e.employee.name}: ${statusLabel(e.status)}`} />
          ))}
        </div>
        <div className="tally">
          {(['red', 'amber', 'green'] as Status[]).map((s) => (
            <button key={s} className={`tally-item tally-${s}${filter === s ? ' is-active' : ''}`} aria-pressed={filter === s} onClick={() => onFilter(filter === s ? 'all' : s)}>
              <StatusIcon status={s} size={13} />
              <strong>{counts[s]}</strong> {statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="summary-block">
        <h3>Team points</h3>
        <p className="big">
          {done}
          <span className="big-of"> of {series.committed}</span>
        </p>
        <div className="meter" role="img" aria-label={`${donePct}% of committed points complete`}>
          <span style={{ width: `${donePct}%` }} />
          <i style={{ left: `${Math.min(100, (expected / series.committed) * 100)}%` }} title="Expected by today" />
        </div>
        <p className="muted">
          {donePct}% complete ·{' '}
          {diff === 0 ? 'right on the expected pace' : `${Math.abs(diff)} pt${Math.abs(diff) === 1 ? '' : 's'} ${diff > 0 ? 'ahead of' : 'behind'} the expected pace`}
        </p>
      </div>

      <div className="summary-block summary-chart">
        <h3>Burndown</h3>
        <BurndownChart series={series} day={day} sprintDays={config.sprintDays} />
      </div>
    </section>
  );
}
