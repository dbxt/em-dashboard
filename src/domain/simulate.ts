import { Config, DayMetrics, Employee, EmployeeSprint } from './types';
import { hashString, mulberry32, randInt, shuffle, Rng } from './rng';

/**
 * Each person is given a "work style" so a single seed produces an interesting
 * mix of healthy and struggling people rather than uniform noise.
 */
type Archetype = 'steady' | 'ahead' | 'behind' | 'review-backlog';

const ARCHETYPE_MIX: Archetype[] = [
  'steady', 'steady', 'steady', 'steady',
  'ahead',
  'behind', 'behind',
  'review-backlog', 'review-backlog', 'review-backlog',
];

interface Style {
  /** Multiplier on the baseline 1-point-per-working-day pace. */
  velocity: [number, number];
  /** Days between a PR being opened and merged. */
  reviewLag: number;
}

const STYLES: Record<Archetype, Style> = {
  steady: { velocity: [0.95, 1.1], reviewLag: 1 },
  ahead: { velocity: [1.3, 1.5], reviewLag: 1 },
  behind: { velocity: [0.5, 0.7], reviewLag: 2 },
  'review-backlog': { velocity: [0.9, 1.1], reviewLag: 4 },
};

function pickPtoDays(rng: Rng, sprintDays: number): number[] {
  const roll = rng();
  const count = roll < 0.3 ? 0 : roll < 0.7 ? 1 : 2;
  const days = new Set<number>();
  while (days.size < count) days.add(randInt(rng, 1, sprintDays));
  return [...days].sort((a, b) => a - b);
}

function simulateEmployee(
  employee: Employee,
  archetype: Archetype,
  seed: number,
  sprintDays: number,
): EmployeeSprint {
  const rng = mulberry32(seed ^ hashString(employee.id));
  const style = STYLES[archetype];
  const assignedPoints = randInt(rng, 6, 10);
  const ptoDays = pickPtoDays(rng, sprintDays);
  const velocity = style.velocity[0] + rng() * (style.velocity[1] - style.velocity[0]);

  const daily: DayMetrics[] = [{ pointsCompleted: 0, prsOpenedTotal: 0, prsMerged: 0, openPRs: 0 }];
  let progress = 0;
  let prsFloat = 0;

  for (let day = 1; day <= sprintDays; day++) {
    const prev = daily[day - 1];
    const isPto = ptoDays.includes(day);
    let opened = prev.prsOpenedTotal;

    if (!isPto) {
      progress = Math.min(assignedPoints, progress + velocity * (0.6 + rng() * 0.8));
      prsFloat += 0.7 + rng() * 0.5;
      opened = Math.max(opened, Math.floor(prsFloat));
    }
    const pointsCompleted = Math.max(prev.pointsCompleted, Math.min(assignedPoints, Math.floor(progress + 0.25)));

    // PRs merge after a review lag; merged can never exceed what was opened.
    const lagIdx = Math.max(0, day - style.reviewLag);
    const mergeable = Math.min(opened, daily[lagIdx].prsOpenedTotal);
    const prsMerged = Math.max(prev.prsMerged, mergeable);

    daily.push({ pointsCompleted, prsOpenedTotal: opened, prsMerged, openPRs: opened - prsMerged });
  }

  return { employeeId: employee.id, assignedPoints, ptoDays, daily };
}

/**
 * Builds the whole sprint (days 0..sprintDays) for every employee up front, so scrubbing
 * the day slider is consistent and cumulative metrics only ever go up.
 */
export function simulateSprint(
  roster: Employee[],
  seed: number,
  config: Pick<Config, 'sprintDays'>,
): EmployeeSprint[] {
  const archetypes = shuffle(mulberry32(seed), ARCHETYPE_MIX);
  return roster.map((employee, i) =>
    simulateEmployee(employee, archetypes[i % archetypes.length], seed, config.sprintDays),
  );
}
