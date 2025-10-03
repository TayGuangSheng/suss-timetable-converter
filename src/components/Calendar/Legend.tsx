// src/components/Calendar/Legend.tsx
import { useEffect, useRef, useState } from "react";
import type { Event } from "../../lib/calendar/eventSchema";
import { colorFor, type ColorOverrides } from "../../lib/calendar/colorPalette";

/** Presets aligned with your palette */
const PRESETS = [
  "#3b82f6", "#ef4444", "#22c55e", "#a855f7", "#f59e0b",
  "#06b6d4", "#f97316", "#ec4899", "#10b981", "#6366f1",
  "#d946ef", "#f43f5e", "#2dd4bf",
];

export default function Legend({
  events,
  overrides,
  onPick,
  onReset,
}: {
  events: Event[];
  overrides?: ColorOverrides;
  onPick?: (code: string, color: string) => void;
  onReset?: (code: string) => void;
}) {
  const modules = Array.from(new Set(events.map((e) => e.moduleCode))).sort();
  if (modules.length === 0) return null;

  return (
    <div className="border border-gray-800 rounded-xl p-4 text-sm bg-gray-900/40">
      <h3 className="font-semibold mb-3">Legend</h3>
      <div className="grid grid-cols-2 gap-y-2 gap-x-6">
        {modules.map((m) => (
          <LegendRow
            key={m}
            code={m}
            color={colorFor(m, overrides)}
            hasOverride={!!overrides?.[m]}
            editable={!!onPick}
            onPick={(c) => onPick?.(m, c)}
            onReset={() => onReset?.(m)}
          />
        ))}
      </div>
    </div>
  );
}

function LegendRow({
  code,
  color,
  hasOverride,
  editable,
  onPick,
  onReset,
}: {
  code: string;
  color: string;
  hasOverride: boolean;
  editable: boolean;
  onPick: (c: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(toHex(color));
  const anchorRef = useRef<HTMLDivElement>(null);
  const pickerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setHex(toHex(color)), [color]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className="relative flex items-center gap-2">
      {/* Swatch (fixed-size, no UA styles, no flex shrink) */}
      <button
        type="button"
        onClick={() => editable && setOpen((o) => !o)}
        className={`inline-block shrink-0 w-4 h-4 rounded-md ring-1 ring-white/20
                    appearance-none p-0 border-0 align-middle
                    ${editable ? "cursor-pointer" : "cursor-default"}
                    focus:outline-none focus:ring-2 focus:ring-white/30`}
        style={{ background: color }}
        aria-label={`Color for ${code}`}
        title={editable ? `Click to change ${code} color` : code}
      />
      <span className="select-none">{code}</span>

      {editable && hasOverride && (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-xs text-gray-400 hover:text-gray-200 underline"
        >
          Reset
        </button>
      )}

      {/* Popover */}
      {editable && open && (
        <div
          role="dialog"
          aria-label={`Choose color for ${code}`}
          className="absolute z-20 top-full left-0 mt-2 w-64 rounded-xl border border-gray-800 bg-gray-950 shadow-xl p-3"
        >
          <div className="text-xs text-gray-300 mb-2 font-medium">{code} color</div>

          {/* Preset grid */}
          <div className="grid grid-cols-8 gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className="h-6 w-6 rounded-md ring-1 ring-white/15 hover:ring-white/30"
                style={{ background: p }}
                onClick={() => {
                  const v = toHex(p);
                  setHex(v);
                  onPick(v);
                  setOpen(false);
                }}
                aria-label={`Pick ${p}`}
                title={p}
              />
            ))}
          </div>

          {/* Hex + Custom */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] text-gray-400 mb-1">HEX</label>
              <input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                onBlur={() => {
                  const v = toHex(hex);
                  setHex(v);
                  if (isValidHex(v)) onPick(v);
                }}
                placeholder="#3B82F6"
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs font-mono"
              />
            </div>

            <div className="self-end">
              <button
                type="button"
                onClick={() => pickerInputRef.current?.click()}
                className="px-2 py-1 text-xs rounded-md border border-gray-700 bg-gray-900 hover:bg-gray-800"
              >
                Custom…
              </button>
              <input
                ref={pickerInputRef}
                type="color"
                defaultValue={toHex(color)}
                onChange={(e) => {
                  const v = toHex(e.target.value);
                  setHex(v);
                  onPick(v);
                }}
                className="hidden"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded-md border border-gray-700 bg-gray-900 hover:bg-gray-800"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* utils */
function toHex(c: string) {
  const s = c.trim();
  if (/^#([0-9a-f]{6})$/i.test(s)) return s.toUpperCase();
  if (/^#([0-9a-f]{3})$/i.test(s)) {
    return s.replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`).toUpperCase();
  }
  const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (m) {
    const [r, g, b] = m.slice(1, 4).map((n) => Math.max(0, Math.min(255, parseInt(n, 10))));
    const h = (n: number) => n.toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
  }
  return s;
}
function isValidHex(s: string) {
  return /^#([0-9a-f]{6})$/i.test(s);
}
