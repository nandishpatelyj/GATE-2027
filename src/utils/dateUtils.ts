/**
 * Local calendar date utilities using strict YYYY-MM-DD strings.
 * Avoids Date.prototype.toISOString() so local timezones never shift dates.
 */

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function addDays(yyyyMmDd: string, deltaDays: number): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + deltaDays, 12, 0, 0, 0);
  return getLocalDateString(dt);
}

/**
 * Returns (toDate - fromDate) in exact calendar days, immune to DST shifts.
 */
export function diffDays(fromYyyyMmDd: string, toYyyyMmDd: string): number {
  const [fy, fm, fd] = fromYyyyMmDd.split('-').map(Number);
  const [ty, tm, td] = toYyyyMmDd.split('-').map(Number);
  const utcFrom = Date.UTC(fy, (fm || 1) - 1, fd || 1);
  const utcTo = Date.UTC(ty, (tm || 1) - 1, td || 1);
  return Math.round((utcTo - utcFrom) / 86_400_000);
}

export function getMonthKey(yyyyMmDd: string): string {
  return yyyyMmDd.slice(0, 7); // YYYY-MM
}

export function formatShortDate(yyyyMmDd: string): string {
  const dt = parseLocalDate(yyyyMmDd);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCompactDate(yyyyMmDd: string): string {
  const dt = parseLocalDate(yyyyMmDd);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatWeekdayShort(yyyyMmDd: string): string {
  const dt = parseLocalDate(yyyyMmDd);
  return dt.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Returns 7 YYYY-MM-DD strings (Monday..Sunday) for the week containing `anchorDateStr`.
 */
export function getWeekDatesMondayFirst(anchorDateStr: string): string[] {
  const dt = parseLocalDate(anchorDateStr);
  const dayOfWeek = dt.getDay(); // 0=Sun, 1=Mon...6=Sat
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayStr = addDays(anchorDateStr, offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i));
}

/**
 * Generates a 6-row x 7-col (Mon-first) calendar matrix for a given year and 0-indexed month.
 */
export function getMonthGridMondayFirst(
  year: number,
  monthIndex: number
): { dateStr: string; inMonth: boolean }[] {
  const firstDay = new Date(year, monthIndex, 1);
  const firstStr = getLocalDateString(firstDay);
  const dow = firstDay.getDay();
  const startOffset = dow === 0 ? -6 : 1 - dow;
  const gridStart = addDays(firstStr, startOffset);

  const cells: { dateStr: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const dStr = addDays(gridStart, i);
    const [, m] = dStr.split('-').map(Number);
    cells.push({
      dateStr: dStr,
      inMonth: m - 1 === monthIndex,
    });
  }
  return cells;
}

export function isAfter6PM(now: Date = new Date()): boolean {
  return now.getHours() >= 18;
}
