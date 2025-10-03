import type { Event } from "../../lib/calendar/eventSchema";

export default function EventList({
  events,
  onChange,
}: {
  events: Event[];
  onChange: (e: Event[]) => void;
}) {
  if (events.length === 0) return null;

  function update(id: string, field: keyof Event, value: string) {
    onChange(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  return (
    <div className="border border-gray-800 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-sky-900 text-white">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
            {/* NEW: S/N header */}
            <th className="w-14 text-center">S/N</th>

            <th>Module</th>
            <th>Group</th>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Venue</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={e.id} className="border-t border-gray-800">
              {/* NEW: S/N cell */}
              <td className="px-3 py-1 text-center text-gray-300">{i + 1}</td>

              <td className="px-3 py-1">{e.moduleCode}</td>
              <td className="px-3 py-1">{e.group}</td>
              <td className="px-3 py-1">{e.date}</td>
              <td className="px-3 py-1">
                <input
                  value={e.start}
                  onChange={(ev) => update(e.id, "start", ev.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  value={e.end}
                  onChange={(ev) => update(e.id, "end", ev.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  value={e.venue ?? ""}
                  onChange={(ev) => update(e.id, "venue", ev.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  value={e.remarks ?? ""}
                  onChange={(ev) => update(e.id, "remarks", ev.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
