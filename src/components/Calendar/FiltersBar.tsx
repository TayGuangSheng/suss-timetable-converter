import { useState } from "react";

export default function FiltersBar({
  modules,
  selected,
  onChange,
  search,
  onSearch
}: {
  modules: string[];
  selected: string[];
  onChange: (mods: string[]) => void;
  search: string;
  onSearch: (s: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-800 rounded-lg">
      <button
        className="w-full text-left px-4 py-2 font-semibold hover:bg-gray-900/60"
        onClick={() => setOpen((o) => !o)}
      >
        2) Filters
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => {
              const active = selected.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => onChange(active ? selected.filter((x) => x !== m) : [...selected, m])}
                  className={`px-2 py-1 rounded border text-sm ${active ? "border-sky-400 text-sky-300" : "border-gray-700 text-gray-300 hover:border-gray-500"}`}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search venue / remarks / code..."
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}
