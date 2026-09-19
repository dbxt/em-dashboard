import { Status } from '../domain/types';

const LABEL: Record<Status, string> = { green: 'Green', amber: 'Amber', red: 'Red' };

/** Shape + label + color, so status never relies on color alone. */
export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 16 16', 'aria-hidden': true as const };
  if (status === 'green')
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="M4.6 8.2l2.3 2.3 4.5-4.7" fill="none" stroke="var(--on-status)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (status === 'amber')
    return (
      <svg {...common}>
        <path d="M8 1.3l7 12.4H1z" fill="currentColor" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 6v3.6M8 11.6v.1" stroke="var(--on-status)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" fill="currentColor" />
      <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="var(--on-status)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function StatusBadge({ status, detail }: { status: Status; detail?: string }) {
  return (
    <span className={`badge badge-${status}`}>
      <StatusIcon status={status} />
      <span className="badge-text">
        <strong>{LABEL[status]}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </span>
  );
}

export const statusLabel = (s: Status) => LABEL[s];
