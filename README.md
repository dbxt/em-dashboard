# Sprint Ledger

An engineering-manager dashboard for a two-week sprint. It rolls each direct report's capacity, pace and open PRs
into a Red / Amber / Green status and drafts talking points for the next one on one.

All data is simulated and seeded, so nothing connects to GitHub or Jira. Drag the day scrubber or press
**Play sprint** to watch the sprint unfold.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for simulation, scoring and talking points
npm run build      # typecheck + production build into dist/
```

## How a status is decided

Each person is checked three ways on the selected day. Every failed check is one warning.

| Check | Warns when |
| --- | --- |
| Capacity | Points assigned at sprint start differ from capacity (`pointsPerSprint × available days ÷ 10`). Both under and over count. |
| Pace | Points completed differ from expected by more than the tolerance. Expected is 1 point per available day (PTO days excluded), capped at the person's assignment. |
| Open PRs | More PRs are open than the limit. |

Defaults: 0 warnings is Green, 1 is Amber, 2 or more is Red. Points per sprint, the PR limit, both tolerances and the
Amber/Red cut-offs are editable in **Settings**, along with each person's name, GitHub handle, Jira handle and role.
Settings are saved in `localStorage`.

## Design notes

- **One shared time axis.** The day scrubber is the header of the lane board, so each person's lane lines up under
  the same ten days. Bars show points completed, the dashed line is expected pace, and hatched cells are PTO.
- **Status never relies on colour alone.** Each status has its own shape and label, plus a written reason under the lane.
- **Deterministic simulation.** Each person is given a work style (steady, ahead, behind, review backlog) from a seeded
  PRNG, and the whole sprint is precomputed, so scrubbing back and forth is consistent and cumulative numbers only rise.
  **Re-roll data** picks a new seed.
- **Pure domain layer.** Scoring and talking points live in `src/domain` as plain functions with no React, and are
  covered by Vitest.

## Layout

```
src/domain/      types, seeded RNG, simulation, evaluation, talking points, tests
src/state/       dashboard state hook and localStorage persistence
src/components/  header, timeline, lane rows, summary, charts, drawer, settings
```
