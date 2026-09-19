/** Date of working day `n` (1-based). Weekends are skipped, so a 10-day sprint spans two calendar weeks. */
export function workingDayDate(startIso: string, n: number): Date {
  const d = new Date(`${startIso}T12:00:00`);
  let remaining = n - 1;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return d;
}

export const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const fmtWeekday = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
export const fmtRange = (start: Date, end: Date) => `${fmtShort(start)} – ${fmtShort(end)}`;
