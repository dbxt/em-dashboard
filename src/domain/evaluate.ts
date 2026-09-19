import {
  CapacityState, Config, Employee, EmployeeSprint, Evaluation, PaceState, Status, Warning,
} from './types';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Points a person can take on this sprint once PTO is deducted. */
export function capacityFor(config: Config, sprint: EmployeeSprint): number {
  return round1((config.pointsPerSprint * (config.sprintDays - sprint.ptoDays.length)) / config.sprintDays);
}

/** Working days elapsed by `day` that the person was actually available. */
export function availableDaysElapsed(sprint: EmployeeSprint, day: number): number {
  return day - sprint.ptoDays.filter((d) => d <= day).length;
}

/** Where a person should be by `day`: 1 pace-unit per available day, never more than their assignment. */
export function expectedPoints(config: Config, sprint: EmployeeSprint, day: number): number {
  const perDay = config.pointsPerSprint / config.sprintDays;
  return round1(Math.min(sprint.assignedPoints, perDay * availableDaysElapsed(sprint, day)));
}

export function statusForWarnings(count: number, config: Pick<Config, 'amberAt' | 'redAt'>): Status {
  if (count >= config.redAt) return 'red';
  if (count >= config.amberAt) return 'amber';
  return 'green';
}

export function evaluateEmployee(
  employee: Employee,
  sprint: EmployeeSprint,
  day: number,
  config: Config,
): Evaluation {
  const warnings: Warning[] = [];

  // 1. Capacity: judged on what was assigned at the start of the sprint.
  const capacity = capacityFor(config, sprint);
  const capGap = sprint.assignedPoints - capacity;
  const capacityState: CapacityState =
    Math.abs(capGap) <= config.capacityTolerance ? 'at' : capGap > 0 ? 'above' : 'below';
  if (capacityState !== 'at') {
    warnings.push({
      type: 'capacity',
      message: `${capacityState === 'above' ? 'Over' : 'Under'} capacity: ${sprint.assignedPoints} pts assigned vs ${capacity} pts available`,
    });
  }

  // 2. Pace: completed points vs. days passed.
  const metrics = sprint.daily[Math.min(day, sprint.daily.length - 1)];
  const expected = expectedPoints(config, sprint, day);
  const paceDelta = round1(metrics.pointsCompleted - expected);
  const paceState: PaceState =
    Math.abs(paceDelta) <= config.pointsPaceTolerance ? 'on' : paceDelta < 0 ? 'behind' : 'ahead';
  if (paceState !== 'on') {
    warnings.push({
      type: 'pace',
      message: `${paceState === 'behind' ? 'Behind' : 'Ahead of'} pace: ${metrics.pointsCompleted} pts done vs ~${expected} expected`,
    });
  }

  // 3. Work in progress: too many open PRs.
  if (metrics.openPRs > config.maxOpenPRs) {
    warnings.push({
      type: 'prs',
      message: `${metrics.openPRs} open PRs (limit ${config.maxOpenPRs})`,
    });
  }

  return {
    employee,
    sprint,
    day,
    capacity,
    capacityState,
    expectedPoints: expected,
    completed: metrics.pointsCompleted,
    paceState,
    paceDelta,
    openPRs: metrics.openPRs,
    totalPRs: metrics.prsOpenedTotal,
    warnings,
    status: statusForWarnings(warnings.length, config),
  };
}

export function evaluateTeam(
  roster: Employee[],
  sprints: EmployeeSprint[],
  day: number,
  config: Config,
): Evaluation[] {
  const byId = new Map(sprints.map((s) => [s.employeeId, s]));
  return roster.flatMap((e) => {
    const s = byId.get(e.id);
    return s ? [evaluateEmployee(e, s, day, config)] : [];
  });
}

export const STATUS_RANK: Record<Status, number> = { red: 0, amber: 1, green: 2 };
