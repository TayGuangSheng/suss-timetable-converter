// src/lib/calendar/ics.ts
import { createEvents, type EventAttributes } from "ics";
import { DateTime } from "luxon";
import type { Event } from "./eventSchema";

export function eventsToIcs(events: Event[]) {
  const icsEvents: EventAttributes[] = events.map((e) => {
    const dtStart = DateTime.fromISO(e.start, { zone: "local" });
    const dtEnd   = DateTime.fromISO(e.end,   { zone: "local" });

    return {
      // keep your original title style
      title: `${e.moduleCode}${e.group ? " " + e.group : ""} @ ${e.venue ?? ""}`.trim(),
      description: e.remarks ?? "",
      location: e.venue ?? "",
      status: "CONFIRMED",

      // IMPORTANT: pass Luxon DateTime, not number[]
      start: dtStart,
      end: dtEnd,

      // tell ics these are local times to avoid TZ drift
      startInputType: "local",
      startOutputType: "local",
      endInputType: "local",
      endOutputType: "local",

      // nice-to-have: stable UID
      uid: e.id,
      productId: "suss-timetable-converter",
      calName: "SUSS Timetable",
    };
  });

  const { error, value } = createEvents(icsEvents);
  if (error) throw error;
  return value!;
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
