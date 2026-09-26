/**
 * Shared date formatting. The app defaults its currency to GBP (`£`) but
 * date formatting was scattered across components with three different
 * approaches -- 'en-US', 'en-GB', and the browser's default locale
 * (`undefined`) -- including two different locales within the same file
 * (`SmokeJournal.tsx`). Centralizing here means one consistent format
 * (matching the GBP-oriented UI) and one place to change it.
 */

const DEFAULT_LOCALE = 'en-GB';

export function formatDate(
  dateStr: string | undefined | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  if (!dateStr) return 'Unknown Date';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Unknown Date';
  return date.toLocaleDateString(DEFAULT_LOCALE, options);
}

export function formatDateLong(dateStr: string | undefined | null): string {
  return formatDate(dateStr, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr: string | undefined | null): string {
  return formatDate(dateStr, { day: 'numeric', month: 'short' });
}
