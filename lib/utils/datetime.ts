/**
 * All times in this app are anchored to Campo Grande, MS (UTC−4).
 * Brazil eliminated DST in 2019, so America/Campo_Grande is a fixed UTC-4 offset.
 *
 * - Input:  admin types local time → datetimeLocalToUTC() appends -04:00 before saving
 * - Output: any UTC timestamptz from DB → format*() functions convert to Campo Grande
 */

export const APP_TZ = 'America/Campo_Grande'

/**
 * Converts a UTC ISO string (from Supabase) to the "YYYY-MM-DDTHH:mm" string
 * that a <input type="datetime-local"> expects, expressed in Campo Grande local time.
 */
export function utcToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  // sv-SE locale formats as "YYYY-MM-DD HH:MM" — ideal for datetime-local inputs
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: APP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return parts.replace(' ', 'T')
}

/**
 * Converts the "YYYY-MM-DDTHH:mm" value from a datetime-local input — interpreted
 * as Campo Grande local time — into a timestamptz string Postgres can store as UTC.
 * e.g. "2026-06-11T15:00" → "2026-06-11T15:00:00-04:00" → stored as 19:00 UTC.
 */
export function datetimeLocalToUTC(datetimeLocal: string): string {
  return `${datetimeLocal}:00-04:00`
}

/** UTC ISO → "15h00" in Campo Grande */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(':', 'h')
}

/** UTC ISO → "Qui, 11 jun" in Campo Grande */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}

/** UTC ISO → "Qui, 11 jun · 15h00" in Campo Grande */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(/(\d{2}):(\d{2})/, '$1h$2')
}
