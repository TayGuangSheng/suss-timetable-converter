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

  const selectAll = () => onChange([...modules]);
  const clearAll  = () => onChange([]);
  const toggleOne = (m: string) =>
    onChange(selected.includes(m) ? selected.filter((x) => x !== m) : [...selected, m]);

  // Counter: empty selection means “show all”, but we don’t highlight any pill
  const selectedCount = selected.length === 0 ? modules.length : selected.length;

  return (
    <div className="border border-gray-800 rounded-lg">
      <button
        className="w-full text-left px-4 py-2 font-semibold hover:bg-gray-900/60 flex items-center justify-between"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>2) Filters</span>
        <span className="text-xs text-gray-400">{selectedCount}/{modules.length}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Module pills (no "All" pill) */}
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => {
              const active = selected.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleOne(m)}
                  aria-pressed={active}
                  className={`px-2 py-1 rounded border text-sm transition
                    ${active
                      ? "border-sky-400 text-sky-300 bg-sky-500/10"
                      : "border-gray-700 text-gray-300 hover:border-gray-500"}`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search venue / remarks / code..."
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {search && (
              <button
                onClick={() => onSearch("")}
                className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-300 hover:border-gray-500"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick links */}
          <div className="text-xs text-gray-400 flex gap-3">
            <button onClick={selectAll} className="underline hover:text-gray-200">Select all</button>
            <button onClick={clearAll}  className="underline hover:text-gray-200">Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
