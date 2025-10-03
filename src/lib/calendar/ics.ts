import { createEvents } from "ics";
import type { Event } from "./eventSchema";

export function eventsToIcs(events: Event[]) {
  const icsEvents = events.map((e) => {
    const start = new Date(e.start);
    const end = new Date(e.end);
    return {
      title: `${e.moduleCode}${e.group ? " " + e.group : ""} @ ${e.venue ?? ""}`.trim(),
      description: e.remarks ?? "",
      start: [start.getFullYear(), start.getMonth()+1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth()+1, end.getDate(), end.getHours(), end.getMinutes()],
      location: e.venue ?? "",
      status: "CONFIRMED"
    };
  });
  const { error, value } = createEvents(icsEvents);
  if (error) throw error;
  return value;
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
