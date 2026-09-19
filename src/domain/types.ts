export const ROLES = ['SE 1', 'SE 2', 'SE 3', 'Senior Engineer', 'Staff Engineer'] as const;
export type Role = (typeof ROLES)[number];

export interface Employee {
  id: string;
  name: string;
  githubHandle: string;
  jiraHandle: string;
  role: Role;
}

export interface Config {
  /** Story points one person is expected to complete in a full, PTO-free sprint. */
  pointsPerSprint: number;
  /** ISO date (YYYY-MM-DD) of the sprint's first working day (a Monday). */
  sprintStart: string;
  /** Working days in the sprint. */
  sprintDays: number;
  /** More open PRs than this is a warning. */
  maxOpenPRs: number;
  /** Allowed gap (in points) between completed and expected before pace warns. */
  pointsPaceTolerance: number;
  /** Allowed gap (in points) between assigned and capacity before capacity warns. */
  capacityTolerance: number;
  /** Warning count at which a person turns Amber. */
  amberAt: number;
  /** Warning count at which a person turns Red. */
  redAt: number;
}

/** Cumulative metrics at the end of a given working day. Index 0 is the start of the sprint. */
export interface DayMetrics {
  pointsCompleted: number;
  prsOpenedTotal: number;
  prsMerged: number;
  openPRs: number;
}

export interface EmployeeSprint {
  employeeId: string;
  assignedPoints: number;
  /** Working-day numbers (1-based) the person is out. */
  ptoDays: number[];
  /** Length sprintDays + 1; daily[0] is the baseline. */
  daily: DayMetrics[];
}

export type Status = 'green' | 'amber' | 'red';
export type WarningType = 'capacity' | 'pace' | 'prs';
export type CapacityState = 'below' | 'at' | 'above';
export type PaceState = 'behind' | 'on' | 'ahead';

export interface Warning {
  type: WarningType;
  message: string;
}

export interface Evaluation {
  employee: Employee;
  sprint: EmployeeSprint;
  day: number;
  capacity: number;
  capacityState: CapacityState;
  expectedPoints: number;
  completed: number;
  paceState: PaceState;
  paceDelta: number;
  openPRs: number;
  totalPRs: number;
  warnings: Warning[];
  status: Status;
}

export interface TalkingPoint {
  type: WarningType | 'ok' | 'pto';
  text: string;
}
