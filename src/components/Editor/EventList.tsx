// src/components/Editor/EventList.tsx
import type { Event } from "../../lib/calendar/eventSchema";
import { DateTime } from "luxon";
import * as React from "react";

function hhmmFromIso(iso: string) {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

function combineDateTime(dateYmd: string, hhmm: string) {
  const ok = /^\d{2}:\d{2}$/.test(hhmm);
  return `${dateYmd}T${ok ? hhmm : "00:00"}:00`;
}

type Draft = {
  moduleCode: string;
  group: string;
  dateYmd: string;    // yyyy-MM-dd for <input type="date">
  startHHmm: string;  // HH:mm
  endHHmm: string;    // HH:mm
  venue: string;
  remarks: string;
};

function makeDefaultDraft(): Draft {
  const today = DateTime.local().toFormat("yyyy-MM-dd");
  return {
    moduleCode: "",
    group: "",
    dateYmd: today,
    startHHmm: "09:00",
    endHHmm: "10:00",
    venue: "",
    remarks: "",
  };
}

export default function EventList({
  events,
  onChange,
}: {
  events: Event[];
  onChange: (e: Event[]) => void;
}) {
  const [draft, setDraft] = React.useState<Draft | null>(null);

  function update(id: string, field: keyof Event, value: string) {
    onChange(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function updateTime(id: string, which: "start" | "end", hhmm: string) {
    onChange(
      events.map((e) =>
        e.id === id ? { ...e, [which]: combineDateTime(e.date, hhmm) } : e
      )
    );
  }

  function handleAddClick() {
    setDraft(makeDefaultDraft());
  }

  function handleDraftChange<K extends keyof Draft>(key: K, val: Draft[K]) {
    setDraft((d) => (d ? { ...d, [key]: val } : d));
  }

  function handleDraftSave() {
    if (!draft) return;

    const id = (globalThis.crypto?.randomUUID?.() ?? `ev_${Date.now()}`);
    const start = combineDateTime(draft.dateYmd, draft.startHHmm);
    const end = combineDateTime(draft.dateYmd, draft.endHHmm);

    if (!draft.moduleCode.trim()) {
      alert("Please enter a Module code.");
      return;
    }

    const newEvent: Event = {
      id,
      moduleCode: draft.moduleCode.trim(),
      group: draft.group.trim(),
      date: draft.dateYmd, // keep your model: separate date + ISO start/end
      start,
      end,
      venue: draft.venue.trim(),
      remarks: draft.remarks.trim(),
    };

    onChange([...events, newEvent]);
    setDraft(null);
  }

  function handleDraftCancel() {
    setDraft(null);
  }

  function handleDelete(id: string) {
    const ev = events.find((e) => e.id === id);
    const label = ev
      ? `${ev.moduleCode} — ${DateTime.fromISO(ev.date).toFormat("d LLL yyyy")} ${hhmmFromIso(ev.start)}`
      : "";
    if (confirm(`Delete this event?\n${label}`)) {
      onChange(events.filter((e) => e.id !== id));
    }
  }

  return (
    <div className="border border-gray-800 rounded-lg overflow-x-auto">
      {/* Tiny toolbar: Add button only. Layout of the table itself is unchanged. */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="text-l font-semibold text-gray-200">Event List</div>
        <button
          type="button"
          onClick={handleAddClick}
          className="text-xs rounded border border-gray-700 px-3 py-1.5 bg-gray-900 hover:bg-gray-800"
        >
          + Add event
        </button>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-sky-900 text-white">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
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
              <td className="px-3 py-1 text-center text-gray-300">{i + 1}</td>
              <td className="px-3 py-1">{e.moduleCode}</td>
              <td className="px-3 py-1">{e.group ?? ""}</td>

              {/* Date: show as "25 Sep 2025" */}
              <td className="px-3 py-1">
                {DateTime.fromISO(e.date).toFormat("d LLL yyyy")}
              </td>

              {/* time-only inputs (no clock icon) */}
              <td className="px-3 py-1">
                <input
                  type="time"
                  value={hhmmFromIso(e.start)}
                  onChange={(ev) => updateTime(e.id, "start", ev.target.value)}
                  className="time-input w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  type="time"
                  value={hhmmFromIso(e.end)}
                  onChange={(ev) => updateTime(e.id, "end", ev.target.value)}
                  className="time-input w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>

              <td className="px-3 py-1">
                <input
                  value={e.venue ?? ""}
                  onChange={(ev) => update(e.id, "venue", ev.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>

              {/* Remarks + Delete (keeps same column count/structure) */}
              <td className="px-3 py-1">
                <div className="flex gap-2">
                  <input
                    value={e.remarks ?? ""}
                    onChange={(ev) => update(e.id, "remarks", ev.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    title="Delete event"
                    aria-label="Delete event"
                    className="shrink-0 rounded border border-gray-700 px-3 py-1.5 bg-gray-900 hover:bg-red-900/40 text-xs"
                  >
                    <span aira-hidden>X</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {/* Draft row (appears only after clicking Add event) */}
          {draft && (
            <tr className="border-t border-gray-800 bg-gray-800/40">
              <td className="px-3 py-1 text-center text-gray-300">—</td>
              <td className="px-3 py-1">
                <input
                  autoFocus
                  placeholder="e.g. MTH101"
                  value={draft.moduleCode}
                  onChange={(e) => handleDraftChange("moduleCode", e.target.value)}
                  className="w-40 bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  placeholder="G1"
                  value={draft.group}
                  onChange={(e) => handleDraftChange("group", e.target.value)}
                  className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  type="date"
                  value={draft.dateYmd}
                  onChange={(e) => handleDraftChange("dateYmd", e.target.value)}
                  className="w-44 bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  type="time"
                  value={draft.startHHmm}
                  onChange={(e) => handleDraftChange("startHHmm", e.target.value)}
                  className="time-input w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  type="time"
                  value={draft.endHHmm}
                  onChange={(e) => handleDraftChange("endHHmm", e.target.value)}
                  className="time-input w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  placeholder="LT1A"
                  value={draft.venue}
                  onChange={(e) => handleDraftChange("venue", e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                />
              </td>
              <td className="px-3 py-1">
                <div className="flex gap-2">
                  <input
                    placeholder="(optional) remarks"
                    value={draft.remarks}
                    onChange={(e) => handleDraftChange("remarks", e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={handleDraftSave}
                    className="shrink-0 rounded border border-gray-700 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleDraftCancel}
                    className="shrink-0 rounded border border-gray-700 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* When there are initially no events, keep the Add button visible */}
      {events.length === 0 && !draft && (
        <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-800">
          No events yet. Click <span className="font-semibold">Add event</span> to create one.
        </div>
      )}
    </div>
  );
}
