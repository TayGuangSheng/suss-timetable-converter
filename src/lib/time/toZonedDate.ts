// src/lib/time/toZonedDate.ts
import { DateTime } from "luxon";

/**
 * Return a local-time ISO string without an offset, e.g.
 * "2025-08-11T08:30:00"
 * FullCalendar treats no-offset strings as local time, which avoids UTC shifts.
 */
export function toLocalIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  return DateTime.fromObject(
    { year, month, day, hour, minute, second: 0, millisecond: 0 },
    { zone: "local" }
  ).toISO({ suppressMilliseconds: true, includeOffset: false }) as string;
}

/** Format YYYY-MM-DD from numbers without using Date */
export function ymd(year: number, month: number, day: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${year}-${p(month)}-${p(day)}`;
}
