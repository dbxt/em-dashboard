import { Config, Employee, ROLES } from './types';
import { mulberry32, pick } from './rng';

export const DEFAULT_SEED = 1;

export const DEFAULT_CONFIG: Config = {
  pointsPerSprint: 10,
  sprintStart: '2026-09-14',
  sprintDays: 10,
  maxOpenPRs: 3,
  pointsPaceTolerance: 1,
  capacityTolerance: 0,
  amberAt: 1,
  redAt: 2,
};

/** Default day shown on load: "somewhere in the middle" of the sprint. */
export const DEFAULT_DAY = 6;

const PEOPLE: Array<[name: string, github: string, jira: string]> = [
  ['Priya Nair', 'pnair', 'priya.nair'],
  ['Marcus Webb', 'mwebb-dev', 'marcus.webb'],
  ['Elena Rossi', 'erossi', 'elena.rossi'],
  ['Tomasz Kowalski', 'tkowalski', 'tomasz.kowalski'],
  ['Aiko Tanaka', 'aikot', 'aiko.tanaka'],
  ['Jamal Carter', 'jcarter42', 'jamal.carter'],
  ['Sofia Mendes', 'smendes', 'sofia.mendes'],
  ['Liam O\'Brien', 'lobrien', 'liam.obrien'],
  ['Nadia Haddad', 'nhaddad', 'nadia.haddad'],
  ['Kwame Boateng', 'kboateng', 'kwame.boateng'],
];

/** 10 fictional direct reports with randomized roles (roles are then editable in Settings). */
export function defaultRoster(seed = DEFAULT_SEED): Employee[] {
  const rng = mulberry32(seed * 101 + 13);
  return PEOPLE.map(([name, githubHandle, jiraHandle], i) => ({
    id: `emp-${i + 1}`,
    name,
    githubHandle,
    jiraHandle,
    role: pick(rng, ROLES),
  }));
}
