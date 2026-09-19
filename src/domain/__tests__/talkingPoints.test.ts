import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, DEFAULT_DAY, DEFAULT_SEED, defaultRoster } from '../defaults';
import { evaluateTeam } from '../evaluate';
import { simulateSprint } from '../simulate';
import { talkingPointsFor } from '../talkingPoints';

const roster = defaultRoster();
const evals = evaluateTeam(roster, simulateSprint(roster, DEFAULT_SEED, DEFAULT_CONFIG), DEFAULT_DAY, DEFAULT_CONFIG);

describe('talkingPointsFor', () => {
  it('always returns at least one point', () => {
    for (const ev of evals) expect(talkingPointsFor(ev).length).toBeGreaterThan(0);
  });

  it('has one point per warning', () => {
    for (const ev of evals.filter((e) => e.warnings.length > 0)) {
      const types = talkingPointsFor(ev).map((p) => p.type);
      for (const w of ev.warnings) expect(types).toContain(w.type);
    }
  });

  it('gives green people a positive prompt', () => {
    const green = evals.find((e) => e.warnings.length === 0);
    expect(green).toBeDefined();
    expect(talkingPointsFor(green!)[0].type).toBe('ok');
  });
});
