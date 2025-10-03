import { useEffect, useMemo, useState } from "react";
import PdfUpload from "./components/Upload/PdfUpload";
import CalendarView from "./components/Calendar/CalendarView";
import FiltersBar from "./components/Calendar/FiltersBar";
import Legend from "./components/Calendar/Legend";
import ConflictBanner from "./components/Calendar/ConflictBanner";
import ExportButtons from "./components/Export/ExportButtons";
import EventList from "./components/Editor/EventList";
import { Event } from "./lib/calendar/eventSchema";
import type { ColorOverrides } from "./lib/calendar/colorPalette"; // ⬅️ NEW
import logo from "./assets/logo.png";

const COLOR_KEY = "suss-color-overrides"; // ⬅️ NEW

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<{ modules: string[]; search: string }>({
    modules: [],
    search: ""
  });

  // ⬅️ NEW: load & persist color overrides
  const [overrides, setOverrides] = useState<ColorOverrides>(() => {
    try {
      return JSON.parse(localStorage.getItem(COLOR_KEY) || "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(COLOR_KEY, JSON.stringify(overrides));
    } catch {}
  }, [overrides]);

  const visible = events.filter((e) => {
    const modOk = filter.modules.length === 0 || filter.modules.includes(e.moduleCode);
    const s = (e.venue || "") + " " + (e.remarks || "") + " " + e.moduleCode + " " + (e.group || "");
    const searchOk = filter.search.trim() === "" || s.toLowerCase().includes(filter.search.toLowerCase());
    return modOk && searchOk;
  });

  const modules = useMemo(
    () => Array.from(new Set(events.map((e) => e.moduleCode))).sort(),
    [events]
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <img
            src={logo}
            alt="SUSS Timetable Converter"
            className="h-6 w-6 rounded-md"
            loading="eager"
            decoding="async"
          />
          <h1 className="text-lg font-semibold">SUSS Timetable Converter</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="lg:col-span-1 space-y-4">
          <PdfUpload onParsed={setEvents} />
          <FiltersBar
            modules={modules}
            selected={filter.modules}
            onChange={(mods) => setFilter((f) => ({ ...f, modules: mods }))}
            search={filter.search}
            onSearch={(v) => setFilter((f) => ({ ...f, search: v }))}
          />
          {/* ⬇️ pass overrides + handlers */}
          <Legend
            events={events}
            overrides={overrides}
            onPick={(code, color) => setOverrides((o) => ({ ...o, [code]: color }))}
            onReset={(code) =>
              setOverrides((o) => {
                const n = { ...o };
                delete n[code];
                return n;
              })
            }
          />
          <ExportButtons events={visible} />
        </section>

        <section className="lg:col-span-3 space-y-4">
          <ConflictBanner events={visible} />
          {/* ⬇️ make calendar use the chosen colors */}
          <CalendarView events={visible} overrides={overrides} />
          <EventList events={visible} onChange={setEvents} />
        </section>
      </main>

      <footer className="border-t border-gray-800 py-6 text-sm text-gray-400">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-3">
          <p>All parsing is done locally in your browser. No files are uploaded.</p>
          <p>
            Built by{" "}
            <span className="font-medium text-gray-200">
              <a href="https://github.com/TayGuangSheng" target="_blank" rel="noreferrer">
                GS Tay
              </a>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
