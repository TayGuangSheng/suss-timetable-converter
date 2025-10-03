import type { Event } from "../../lib/calendar/eventSchema";
import { colorFor } from "../../lib/calendar/colorPalette";

export default function Legend({ events }: { events: Event[] }) {
  const modules = Array.from(new Set(events.map((e) => e.moduleCode))).sort();
  if (modules.length === 0) return null;
  return (
    <div className="border border-gray-800 rounded-lg p-3 text-sm">
      <h3 className="font-semibold mb-2">Legend</h3>
      <div className="grid grid-cols-2 gap-2">
        {modules.map((m) => (
          <div key={m} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: colorFor(m) }}></span>
            <span>{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
