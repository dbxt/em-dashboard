import { Config, Employee, ROLES } from '../domain/types';

const KEY = 'em-dashboard/v1';

export type Theme = 'dark' | 'light';

export interface Persisted {
  config: Config;
  roster: Employee[];
  seed: number;
  theme: Theme;
}

const isRole = (r: unknown): boolean => (ROLES as readonly unknown[]).includes(r);

function valid(p: any): p is Persisted {
  return (
    p &&
    typeof p.seed === 'number' &&
    (p.theme === 'dark' || p.theme === 'light') &&
    p.config &&
    ['pointsPerSprint', 'sprintDays', 'maxOpenPRs', 'pointsPaceTolerance', 'capacityTolerance', 'amberAt', 'redAt'].every(
      (k) => typeof p.config[k] === 'number',
    ) &&
    typeof p.config.sprintStart === 'string' &&
    Array.isArray(p.roster) &&
    p.roster.length > 0 &&
    p.roster.every(
      (e: any) => e && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.githubHandle === 'string' && typeof e.jiraHandle === 'string' && isRole(e.role),
    )
  );
}

export function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return valid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePersisted(p: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable (private mode, quota) — the dashboard still works, it just won't remember. */
  }
}
