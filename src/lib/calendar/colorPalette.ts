// src/lib/calendar/colorPalette.ts

// Optional: force a specific color for certain modules (exact codes)
const overrides: Record<string, string> = {
  // "NCO101": "#2dd4bf",
  // "PSY213": "#f59e0b",
};

// High-contrast palette (works on dark backgrounds). Up to ~20 distinct colors.
const palette = [
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
  "#2dd4bf"  // mint
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

// Golden-angle HSL fallback to keep colors spaced out if you have many modules
function goldenColor(seed: number) {
  const hue = (seed * 137.508) % 360; // golden angle
  return `hsl(${hue}, 78%, 53%)`;      // vivid but readable on dark bg
}

export function colorFor(moduleCode: string) {
  const key = moduleCode.toUpperCase().trim();
  if (overrides[key]) return overrides[key];

  const h = hash(key);
  const idx = h % palette.length;
  const chosen = palette[idx];

  // If you exceed palette capacity heavily, mix with golden fallback
  // (e.g., every 3rd collision we shift hue)
  const collisions = Math.floor(h / palette.length) % 3;
  if (collisions === 0) return chosen;
  return goldenColor(h + collisions);
}
