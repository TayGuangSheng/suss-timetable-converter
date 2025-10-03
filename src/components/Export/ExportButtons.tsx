import { eventsToIcs, downloadIcs } from "../../lib/calendar/ics";
import type { Event } from "../../lib/calendar/eventSchema";

export default function ExportButtons({ events }: { events: Event[] }) {
  function onExport() {
    const ics = eventsToIcs(events);
    downloadIcs("suss_timetable.ics", ics);
  }
  return (
    <div className="border border-gray-800 rounded-lg p-3 space-y-2">
      <h3 className="font-semibold">3) Export</h3>
      <button onClick={onExport} className="px-3 py-2 rounded bg-sky-500 text-black font-semibold hover:bg-sky-400">
        Download .ics
      </button>
      <p className="text-xs text-gray-400">
        Import the ICS into Google, Apple, or Outlook Calendar.
      </p>
    </div>
  );
}
