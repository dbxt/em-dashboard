import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../defaults';
import { availableDaysElapsed, capacityFor, evaluateEmployee, expectedPoints, statusForWarnings } from '../evaluate';
import { DayMetrics, Employee, EmployeeSprint } from '../types';

const emp: Employee = { id: 'e1', name: 'Test Person', githubHandle: 'tp', jiraHandle: 'test.person', role: 'SE 2' };
const cfg = DEFAULT_CONFIG;

/** Builds a sprint where every day has the same metrics unless overridden. */
function sprint(opts: Partial<EmployeeSprint> & { at?: Partial<DayMetrics> } = {}): EmployeeSprint {
  const base: DayMetrics = { pointsCompleted: 0, prsOpenedTotal: 0, prsMerged: 0, openPRs: 0, ...opts.at };
  return {
    employeeId: 'e1',
    assignedPoints: 10,
    ptoDays: [],
    daily: Array.from({ length: 11 }, () => ({ ...base })),
    ...opts,
  };
}

describe('capacity', () => {
  it('deducts PTO days from capacity', () => {
    expect(capacityFor(cfg, sprint({ ptoDays: [] }))).toBe(10);
    expect(capacityFor(cfg, sprint({ ptoDays: [3] }))).toBe(9);
    expect(capacityFor(cfg, sprint({ ptoDays: [3, 8] }))).toBe(8);
  });

  it('scales with the global points-per-sprint setting', () => {
    expect(capacityFor({ ...cfg, pointsPerSprint: 20 }, sprint({ ptoDays: [1] }))).toBe(18);
  });

  it.each([
    [10, [], 'at', 0],
    [8, [], 'below', 1],
    [10, [4], 'above', 1],
    [8, [2, 5], 'at', 0],
  ] as const)('assigned %i with PTO %j is %s', (assigned, pto, state, capWarnings) => {
    const ev = evaluateEmployee(emp, sprint({ assignedPoints: assigned, ptoDays: [...pto], at: { pointsCompleted: 0 } }), 0, cfg);
    expect(ev.capacityState).toBe(state);
    expect(ev.warnings.filter((w) => w.type === 'capacity')).toHaveLength(capWarnings);
  });

  it('respects capacityTolerance', () => {
    const ev = evaluateEmployee(emp, sprint({ assignedPoints: 9 }), 0, { ...cfg, capacityTolerance: 1 });
    expect(ev.capacityState).toBe('at');
  });
});

describe('pace', () => {
  it('expects one point per available day', () => {
    expect(expectedPoints(cfg, sprint(), 6)).toBe(6);
  });

  it('does not expect progress on PTO days that have passed', () => {
    const s = sprint({ ptoDays: [2, 9] });
    expect(availableDaysElapsed(s, 6)).toBe(5);
    expect(expectedPoints(cfg, s, 6)).toBe(5);
  });

  it('never expects more than was assigned', () => {
    expect(expectedPoints(cfg, sprint({ assignedPoints: 6 }), 10)).toBe(6);
  });

  it('is on pace within tolerance', () => {
    const ev = evaluateEmployee(emp, sprint({ at: { pointsCompleted: 5 } }), 6, cfg);
    expect(ev.paceState).toBe('on');
  });

  it('warns when behind or ahead beyond tolerance', () => {
    expect(evaluateEmployee(emp, sprint({ at: { pointsCompleted: 3 } }), 6, cfg).paceState).toBe('behind');
    expect(evaluateEmployee(emp, sprint({ assignedPoints: 10, at: { pointsCompleted: 8 } }), 6, cfg).paceState).toBe('ahead');
  });
});

describe('open PRs', () => {
  it('warns only above the limit', () => {
    const at = (n: number) => evaluateEmployee(emp, sprint({ at: { openPRs: n, pointsCompleted: 6 } }), 6, cfg);
    expect(at(3).warnings.some((w) => w.type === 'prs')).toBe(false);
    expect(at(4).warnings.some((w) => w.type === 'prs')).toBe(true);
    expect(evaluateEmployee(emp, sprint({ at: { openPRs: 4, pointsCompleted: 6 } }), 6, { ...cfg, maxOpenPRs: 5 }).warnings).toHaveLength(0);
  });
});

describe('status', () => {
  it('maps warning counts to R/A/G with configurable thresholds', () => {
    expect(statusForWarnings(0, cfg)).toBe('green');
    expect(statusForWarnings(1, cfg)).toBe('amber');
    expect(statusForWarnings(2, cfg)).toBe('red');
    expect(statusForWarnings(3, cfg)).toBe('red');
    expect(statusForWarnings(2, { amberAt: 1, redAt: 3 })).toBe('amber');
  });

  it('turns red when all three checks warn', () => {
    const ev = evaluateEmployee(emp, sprint({ assignedPoints: 7, at: { pointsCompleted: 1, openPRs: 5 } }), 6, cfg);
    expect(ev.warnings.map((w) => w.type).sort()).toEqual(['capacity', 'pace', 'prs']);
    expect(ev.status).toBe('red');
  });

  it('is green with no warnings', () => {
    const ev = evaluateEmployee(emp, sprint({ at: { pointsCompleted: 6, openPRs: 1 } }), 6, cfg);
    expect(ev.status).toBe('green');
  });
});
