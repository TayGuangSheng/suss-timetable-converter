// src/lib/calendar/colorPalette.ts

// 🔹 Public type so the UI can pass user-picked colors in
export type ColorOverrides = Record<string, string>;

// (Optional) hard defaults you want to ship with
const DEFAULT_OVERRIDES: ColorOverrides = {
  // "NCO101": "#2dd4bf",
  // "PSY213": "#f59e0b",
};

// High-contrast palette (works on dark backgrounds). Up to ~20 distinct colors.
const PALETTE = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#a855f7", // purple
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#10b981", // teal
  "#6366f1", // indigo
  "#d946ef", // fuchsia
  "#f43f5e", // rose
  "#2dd4bf", // mint
];

// Deterministic hash
function hash(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Golden-angle HSL fallback to keep colors spaced if you have many modules
function goldenColor(seed: number) {
  const hue = (seed * 137.508) % 360; // golden angle
  return `hsl(${hue}, 78%, 53%)`; // vivid but readable on dark bg
}

// Normalize various inputs to hex if possible (accepts "#abc", "#aabbcc", or rgb())
// Falls back to the original string if it can't normalize (FullCalendar accepts CSS colors)
function toHex(c: string) {
  const s = c.trim();
  if (/^#([0-9a-f]{3})$/i.test(s)) {
    // #abc -> #aabbcc
    return s.replace(
      /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i,
      (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
    );
  }
  if (/^#([0-9a-f]{6})$/i.test(s)) return s;
  const m = s.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (m) {
    const [r, g, b] = m.slice(1).map((n) => Math.max(0, Math.min(255, parseInt(n, 10))));
    const h = (n: number) => n.toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  return s; // let CSS handle other formats (e.g., hsl())
}

/**
 * Get a color for a module code.
 * - If userOverrides (or DEFAULT_OVERRIDES) contains the code, that color wins.
 * - Otherwise pick deterministically from the base palette.
 * - If there are many modules, fall back to a golden-angle HSL to keep spacing.
 */
export function colorFor(moduleCode: string, userOverrides?: ColorOverrides) {
  const key = moduleCode.toUpperCase().trim();

  const fromUser = userOverrides?.[key];
  if (fromUser) return toHex(fromUser);

  const fromDefaults = DEFAULT_OVERRIDES[key];
  if (fromDefaults) return toHex(fromDefaults);

  const h = hash(key);
  const idx = h % PALETTE.length;
  const chosen = PALETTE[idx];

  // If you exceed palette capacity heavily, mix with golden fallback
  const collisions = Math.floor(h / PALETTE.length) % 3;
  if (collisions === 0) return chosen;
  return goldenColor(h + collisions);
}
