import { useEffect, useRef, useState } from 'react';
import { Config, Employee, ROLES, Role } from '../domain/types';

interface Props {
  config: Config;
  roster: Employee[];
  onConfig: (patch: Partial<Config>) => void;
  onEmployee: (id: string, patch: Partial<Employee>) => void;
  onReset: () => void;
  onClose: () => void;
}

/** Number input that lets you clear and retype; only commits valid values within [min, max]. */
function NumberField({ label, hint, value, min, max, step = 1, onCommit }: {
  label: string; hint?: string; value: number; min: number; max: number; step?: number; onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const n = Number(text);
  const bad = text.trim() === '' || Number.isNaN(n) || n < min || n > max;
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="number" inputMode="decimal" min={min} max={max} step={step} value={text}
        aria-invalid={bad}
        onChange={(e) => {
          setText(e.target.value);
          const v = Number(e.target.value);
          if (e.target.value.trim() !== '' && !Number.isNaN(v) && v >= min && v <= max) onCommit(v);
        }}
        onBlur={() => setText(String(value))}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function SettingsPanel({ config, roster, onConfig, onEmployee, onReset, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (k: KeyboardEvent) => k.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer drawer-wide" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(x) => x.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2 id="settings-title">Settings</h2>
            <p className="muted">Changes apply instantly and are saved in this browser.</p>
          </div>
          <button ref={closeRef} className="btn btn-ghost" onClick={onClose} aria-label="Close settings">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </header>

        <section>
          <h3>Sprint</h3>
          <div className="fields">
            <NumberField label="Story points per sprint" hint="What one person delivers in a full sprint with no PTO." value={config.pointsPerSprint} min={1} max={100} onCommit={(n) => onConfig({ pointsPerSprint: n })} />
            <label className="field">
              <span className="field-label">First day of sprint</span>
              <input type="date" value={config.sprintStart} onChange={(e) => e.target.value && onConfig({ sprintStart: e.target.value })} />
              <span className="field-hint">Sprints run {config.sprintDays} working days.</span>
            </label>
          </div>
        </section>

        <section>
          <h3>Warning thresholds</h3>
          <div className="fields">
            <NumberField label="Max open PRs" hint="More than this per person is a warning." value={config.maxOpenPRs} min={0} max={20} onCommit={(n) => onConfig({ maxOpenPRs: n })} />
            <NumberField label="Pace tolerance (pts)" hint="How far from expected pace before warning." value={config.pointsPaceTolerance} min={0} max={10} step={0.5} onCommit={(n) => onConfig({ pointsPaceTolerance: n })} />
            <NumberField label="Capacity tolerance (pts)" hint="How far assigned work can differ from capacity." value={config.capacityTolerance} min={0} max={10} step={0.5} onCommit={(n) => onConfig({ capacityTolerance: n })} />
          </div>
        </section>

        <section>
          <h3>Status rules</h3>
          <div className="fields">
            <NumberField label="Amber at (warnings)" value={config.amberAt} min={1} max={3} onCommit={(n) => onConfig({ amberAt: n, redAt: Math.max(config.redAt, n) })} />
            <NumberField label="Red at (warnings)" value={config.redAt} min={1} max={3} onCommit={(n) => onConfig({ redAt: n, amberAt: Math.min(config.amberAt, n) })} />
          </div>
          <p className="field-hint">No warnings is Green. With these settings: {config.amberAt === config.redAt ? `${config.redAt}+ warnings is Red, fewer is Green` : `${config.amberAt}${config.redAt - config.amberAt > 1 ? `–${config.redAt - 1}` : ''} is Amber, ${config.redAt}+ is Red`}.</p>
        </section>

        <section>
          <h3>Direct reports</h3>
          <div className="roster">
            <div className="roster-row roster-head" aria-hidden="true"><span>Name</span><span>GitHub</span><span>Jira</span><span>Role</span></div>
            {roster.map((e) => (
              <div className="roster-row" key={e.id}>
                <input aria-label={`Name for ${e.name}`} value={e.name} onChange={(x) => onEmployee(e.id, { name: x.target.value })} />
                <input aria-label={`GitHub handle for ${e.name}`} value={e.githubHandle} onChange={(x) => onEmployee(e.id, { githubHandle: x.target.value.replace(/^@/, '') })} />
                <input aria-label={`Jira handle for ${e.name}`} value={e.jiraHandle} onChange={(x) => onEmployee(e.id, { jiraHandle: x.target.value })} />
                <select aria-label={`Role for ${e.name}`} value={e.role} onChange={(x) => onEmployee(e.id, { role: x.target.value as Role })}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            ))}
          </div>
        </section>

        <footer className="drawer-foot">
          <button className="btn btn-danger" onClick={() => { if (window.confirm('Reset settings, roster and data to the defaults?')) onReset(); }}>Reset to defaults</button>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </footer>
      </aside>
    </div>
  );
}
