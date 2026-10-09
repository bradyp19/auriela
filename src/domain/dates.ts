export function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
export function daysBetween(start: string, end: string): number { return Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000); }
export function validRange(start: string, end: string) { return validDate(start) && validDate(end) && daysBetween(start, end) > 0 && daysBetween(start, end) <= 30; }
export function addDays(date: string, days: number): string { return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10); }
export function dateLabel(date: string, options?: Intl.DateTimeFormatOptions): string { return validDate(date) ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC', ...options }).format(new Date(`${date}T12:00:00Z`)) : 'Choose dates'; }
export function dateRange(start: string, end: string): string { return start && end ? `${dateLabel(start)} – ${dateLabel(end)}` : 'Choose dates'; }
export function localDate(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function calendarDate(date: string): Date { return new Date(`${date}T12:00:00`); }
export function tripDays(start: string, end: string): string[] { return validRange(start, end) ? Array.from({ length: daysBetween(start, end) + 1 }, (_, i) => addDays(start, i)) : []; }
