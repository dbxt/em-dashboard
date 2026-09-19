import { expectedPoints } from './evaluate';
import { Config, EmployeeSprint } from './types';

export interface TeamSeries {
  committed: number;
  /** Index = working day (0..sprintDays). */
  done: number[];
  expected: number[];
}

/** Team-wide cumulative points by day, for the burndown chart. */
export function teamSeries(sprints: EmployeeSprint[], config: Config): TeamSeries {
  const days = Array.from({ length: config.sprintDays + 1 }, (_, d) => d);
  return {
    committed: sprints.reduce((n, s) => n + s.assignedPoints, 0),
    done: days.map((d) => sprints.reduce((n, s) => n + s.daily[d].pointsCompleted, 0)),
    expected: days.map((d) => sprints.reduce((n, s) => n + expectedPoints(config, s, d), 0)),
  };
}
