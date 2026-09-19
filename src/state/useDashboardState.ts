import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CONFIG, DEFAULT_DAY, DEFAULT_SEED, defaultRoster } from '../domain/defaults';
import { evaluateTeam } from '../domain/evaluate';
import { simulateSprint } from '../domain/simulate';
import { Config, Employee } from '../domain/types';
import { loadPersisted, savePersisted, Theme } from './storage';

const PLAY_INTERVAL_MS = 900;

function initialTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function useDashboardState() {
  const [persisted] = useState(loadPersisted);
  const [config, setConfig] = useState<Config>(persisted?.config ?? DEFAULT_CONFIG);
  const [roster, setRoster] = useState<Employee[]>(persisted?.roster ?? defaultRoster());
  const [seed, setSeed] = useState(persisted?.seed ?? DEFAULT_SEED);
  const [theme, setTheme] = useState<Theme>(persisted?.theme ?? initialTheme());
  const [day, setDay] = useState(DEFAULT_DAY);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    savePersisted({ config, roster, seed, theme });
  }, [config, roster, seed, theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // The day never exceeds the sprint length, even if sprintDays is edited.
  const currentDay = Math.min(Math.max(day, 1), config.sprintDays);

  useEffect(() => {
    if (!playing) return;
    if (currentDay >= config.sprintDays) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setDay(currentDay + 1), PLAY_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [playing, currentDay, config.sprintDays]);

  const sprints = useMemo(() => simulateSprint(roster, seed, config), [roster, seed, config.sprintDays]);
  const evaluations = useMemo(
    () => evaluateTeam(roster, sprints, currentDay, config),
    [roster, sprints, currentDay, config],
  );

  const updateConfig = useCallback((patch: Partial<Config>) => setConfig((c) => ({ ...c, ...patch })), []);
  const updateEmployee = useCallback(
    (id: string, patch: Partial<Employee>) =>
      setRoster((r) => r.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [],
  );
  const reroll = useCallback(() => setSeed(Math.floor(Math.random() * 100000) + 1), []);
  const resetAll = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setRoster(defaultRoster());
    setSeed(DEFAULT_SEED);
    setDay(DEFAULT_DAY);
    setPlaying(false);
  }, []);

  const selectDay = useCallback((d: number) => {
    setPlaying(false);
    setDay(d);
  }, []);
  const togglePlay = useCallback(() => {
    if (!playing && currentDay >= config.sprintDays) setDay(1);
    setPlaying((p) => !p);
  }, [playing, currentDay, config.sprintDays]);

  return {
    config, roster, seed, theme, day: currentDay, playing,
    sprints, evaluations,
    updateConfig, updateEmployee, reroll, resetAll,
    setTheme, selectDay, togglePlay,
  };
}

export type DashboardState = ReturnType<typeof useDashboardState>;
