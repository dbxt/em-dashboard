import { Evaluation, Role, TalkingPoint } from './types';

const isJunior = (role: Role) => role === 'SE 1' || role === 'SE 2';
const isSenior = (role: Role) => role === 'Senior Engineer' || role === 'Staff Engineer';

const pts = (n: number) => `${n} pt${n === 1 ? '' : 's'}`;

/**
 * Suggested one-on-one prompts for one person, driven by their warnings.
 * Wording is role-aware: juniors get pairing offers, senior folks get scope and delegation prompts.
 */
export function talkingPointsFor(ev: Evaluation): TalkingPoint[] {
  const { employee, sprint, day, capacity, completed, expectedPoints, openPRs } = ev;
  const first = employee.name.split(' ')[0];
  const points: TalkingPoint[] = [];

  for (const w of ev.warnings) {
    if (w.type === 'capacity') {
      const pto = sprint.ptoDays.length;
      const ptoNote = pto > 0 ? ` (${pto} PTO day${pto === 1 ? '' : 's'} already deducted)` : '';
      if (ev.capacityState === 'above') {
        points.push({
          type: 'capacity',
          text: `${first} was assigned ${pts(sprint.assignedPoints)} against ${capacity} pts of capacity${ptoNote}. What can we defer, split or hand off so the sprint is still achievable?`,
        });
      } else {
        points.push({
          type: 'capacity',
          text: `${first} has ${pts(sprint.assignedPoints)} assigned but ${capacity} pts of capacity. Is there a stretch item, tech-debt ticket or review load we can pull in?`,
        });
      }
    }

    if (w.type === 'pace') {
      if (ev.paceState === 'behind') {
        const ask = isJunior(employee.role)
          ? 'Would a pairing session today unblock them?'
          : isSenior(employee.role)
            ? 'Is this scope creep, or are they absorbed by unplanned work like reviews and incidents?'
            : 'Is something blocking them, or is the estimate off?';
        points.push({
          type: 'pace',
          text: `Day ${day}: ${pts(completed)} done vs ~${expectedPoints} expected. ${ask}`,
        });
      } else {
        points.push({
          type: 'pace',
          text: `Day ${day}: ${pts(completed)} done vs ~${expectedPoints} expected. Ahead of pace. Are the estimates padded, and is there room to pull in another ticket?`,
        });
      }
    }

    if (w.type === 'prs') {
      const ask = isSenior(employee.role)
        ? 'Can they help clear the review queue instead of adding to it?'
        : 'Who can review today? Consider swarming on the oldest ones.';
      points.push({
        type: 'prs',
        text: `${openPRs} PRs are open, which is over the limit. Work is stalling in review. ${ask}`,
      });
    }
  }

  if (sprint.ptoDays.length > 0 && !points.some((p) => p.type === 'capacity')) {
    const upcoming = sprint.ptoDays.filter((d) => d > day);
    if (upcoming.length > 0) {
      points.push({
        type: 'pto',
        text: `${first} is out on day${upcoming.length === 1 ? '' : 's'} ${upcoming.join(' and ')}. Who covers reviews, and is there a handoff to plan?`,
      });
    }
  }

  if (points.length === 0) {
    points.push({
      type: 'ok',
      text: isSenior(employee.role)
        ? `${first} is on track. A good moment to ask about mentoring or a cross-team problem they could lead.`
        : `${first} is on track. Recognize the steady progress and ask what would make the rest of the sprint smoother.`,
    });
  }

  return points;
}
