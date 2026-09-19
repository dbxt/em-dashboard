import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, DEFAULT_DAY, DEFAULT_SEED, defaultRoster } from '../defaults';
import { evaluateTeam } from '../evaluate';
import { simulateSprint } from '../simulate';

const roster = defaultRoster();

describe('simulateSprint', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const a = simulateSprint(roster, 5, DEFAULT_CONFIG);
    expect(simulateSprint(roster, 5, DEFAULT_CONFIG)).toEqual(a);
    expect(simulateSprint(roster, 6, DEFAULT_CONFIG)).not.toEqual(a);
  });

  it.each([1, 2, 3, 42, 999])('respects the spec ranges (seed %i)', (seed) => {
    const sprints = simulateSprint(roster, seed, DEFAULT_CONFIG);
    expect(sprints).toHaveLength(10);
    for (const s of sprints) {
      expect(s.assignedPoints).toBeGreaterThanOrEqual(6);
      expect(s.assignedPoints).toBeLessThanOrEqual(10);
      expect(s.ptoDays.length).toBeLessThanOrEqual(2);
      expect(new Set(s.ptoDays).size).toBe(s.ptoDays.length);
      expect(s.daily).toHaveLength(DEFAULT_CONFIG.sprintDays + 1);
    }
  });

  it('only ever increases cumulative metrics and never exceeds assignments', () => {
    for (const s of simulateSprint(roster, 3, DEFAULT_CONFIG)) {
      for (let d = 1; d < s.daily.length; d++) {
        const prev = s.daily[d - 1];
        const cur = s.daily[d];
        expect(cur.pointsCompleted).toBeGreaterThanOrEqual(prev.pointsCompleted);
        expect(cur.prsOpenedTotal).toBeGreaterThanOrEqual(prev.prsOpenedTotal);
        expect(cur.prsMerged).toBeGreaterThanOrEqual(prev.prsMerged);
        expect(cur.openPRs).toBe(cur.prsOpenedTotal - cur.prsMerged);
        expect(cur.openPRs).toBeGreaterThanOrEqual(0);
        expect(cur.pointsCompleted).toBeLessThanOrEqual(s.assignedPoints);
      }
    }
  });

  it('does not complete points or open PRs on PTO days', () => {
    for (const s of simulateSprint(roster, 11, DEFAULT_CONFIG)) {
      for (const d of s.ptoDays) {
        expect(s.daily[d].pointsCompleted).toBe(s.daily[d - 1].pointsCompleted);
        expect(s.daily[d].prsOpenedTotal).toBe(s.daily[d - 1].prsOpenedTotal);
      }
    }
  });

  it('gives every person a sprint keyed by id, unaffected by editing other roster fields', () => {
    const edited = roster.map((e) => ({ ...e, name: 'X', githubHandle: 'x' }));
    expect(simulateSprint(edited, 1, DEFAULT_CONFIG).map((s) => s.daily)).toEqual(
      simulateSprint(roster, 1, DEFAULT_CONFIG).map((s) => s.daily),
    );
  });

  it('opens the demo with a mix of Red, Amber and Green', () => {
    const sprints = simulateSprint(roster, DEFAULT_SEED, DEFAULT_CONFIG);
    const statuses = new Set(evaluateTeam(roster, sprints, DEFAULT_DAY, DEFAULT_CONFIG).map((e) => e.status));
    expect(statuses).toEqual(new Set(['red', 'amber', 'green']));
  });
});
