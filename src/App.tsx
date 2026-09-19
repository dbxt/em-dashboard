import { useMemo, useState } from 'react';
import { STATUS_RANK } from './domain/evaluate';
import { Status } from './domain/types';
import { DetailDrawer } from './components/DetailDrawer';
import { EmployeeRow } from './components/EmployeeRow';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { SprintTimeline } from './components/SprintTimeline';
import { StandupPanel } from './components/StandupPanel';
import { TeamSummary } from './components/TeamSummary';
import { useDashboardState } from './state/useDashboardState';

export default function App() {
  const s = useDashboardState();
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const rows = useMemo(
    () =>
      s.evaluations
        .filter((e) => filter === 'all' || e.status === filter)
        .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.warnings.length - a.warnings.length),
    [s.evaluations, filter],
  );
  const yMax = Math.max(s.config.pointsPerSprint, ...s.sprints.map((x) => x.assignedPoints));
  const openEv = s.evaluations.find((e) => e.employee.id === openId);

  return (
    <div className="page">
      <Header theme={s.theme} onToggleTheme={() => s.setTheme(s.theme === 'dark' ? 'light' : 'dark')} onOpenSettings={() => setShowSettings(true)} />

      <main>
        <TeamSummary evaluations={s.evaluations} sprints={s.sprints} config={s.config} day={s.day} filter={filter} onFilter={setFilter} />

        <section className="board" aria-label="Direct reports">
          <SprintTimeline config={s.config} day={s.day} playing={s.playing} onSelectDay={s.selectDay} onTogglePlay={s.togglePlay} onReroll={s.reroll} />
          {rows.length === 0 ? (
            <p className="empty">No one is {filter} on day {s.day}. <button className="link" onClick={() => setFilter('all')}>Show everyone</button></p>
          ) : (
            <ul className="lanes">
              {rows.map((ev) => (
                <EmployeeRow key={ev.employee.id} ev={ev} config={s.config} yMax={yMax} onOpen={() => setOpenId(ev.employee.id)} />
              ))}
            </ul>
          )}
          <p className="board-key">
            <span className="key key-bar" /> Points completed
            <span className="key key-expected" /> Expected pace
            <span className="key key-assigned" /> Assigned
            <span className="key key-pto" /> PTO
          </p>
        </section>

        <StandupPanel evaluations={s.evaluations} day={s.day} onOpen={setOpenId} />
      </main>

      <footer className="page-foot">Simulated data · seed {s.seed} · a portfolio project, not connected to GitHub or Jira</footer>

      {openEv && <DetailDrawer ev={openEv} config={s.config} onClose={() => setOpenId(null)} />}
      {showSettings && (
        <SettingsPanel config={s.config} roster={s.roster} onConfig={s.updateConfig} onEmployee={s.updateEmployee} onReset={s.resetAll} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
