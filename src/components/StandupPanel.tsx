import { useState } from 'react';
import { STATUS_RANK } from '../domain/evaluate';
import { talkingPointsFor } from '../domain/talkingPoints';
import { Evaluation } from '../domain/types';
import { StatusIcon, statusLabel } from './StatusBadge';

interface Props {
  evaluations: Evaluation[];
  day: number;
  onOpen: (id: string) => void;
}

function toMarkdown(items: Array<{ ev: Evaluation; points: ReturnType<typeof talkingPointsFor> }>, day: number) {
  const lines = [`# Standup agenda, sprint day ${day}`, ''];
  for (const { ev, points } of items) {
    lines.push(`## ${ev.employee.name} (${ev.employee.role}): ${statusLabel(ev.status)}`);
    points.forEach((p) => lines.push(`- ${p.text}`));
    lines.push('');
  }
  return lines.join('\n');
}

export function StandupPanel({ evaluations, day, onOpen }: Props) {
  const [copied, setCopied] = useState(false);
  const items = [...evaluations]
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.warnings.length - a.warnings.length)
    .map((ev) => ({ ev, points: talkingPointsFor(ev) }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(items, day));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="standup" aria-labelledby="standup-title">
      <div className="section-head">
        <div>
          <h2 id="standup-title">Next standup</h2>
          <p className="muted">Talking points for day {day}, most urgent first.</p>
        </div>
        <button className="btn" onClick={copy}>{copied ? 'Copied' : 'Copy as Markdown'}</button>
      </div>
      <ol className="agenda">
        {items.map(({ ev, points }) => (
          <li key={ev.employee.id} className={`agenda-item agenda-${ev.status}`}>
            <div className="agenda-who">
              <span className={`agenda-icon status-${ev.status}`}><StatusIcon status={ev.status} size={16} /></span>
              <button className="link" onClick={() => onOpen(ev.employee.id)}>{ev.employee.name}</button>
              <span className="muted">{ev.employee.role}</span>
            </div>
            <ul className="points">
              {points.map((p, i) => (
                <li key={i}><span className={`dot dot-${p.type}`} aria-hidden="true" />{p.text}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
