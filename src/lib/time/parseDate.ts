const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"] as const;

export function parseDateToken(token: string) {
  // "11 AUG 2025" -> {y:2025,m:8,d:11}
  const m = token.trim().toUpperCase().match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mon = MONTHS.indexOf(m[2] as any) + 1;
  const y = parseInt(m[3], 10);
  if (mon <= 0) return null;
  return { y, m: mon, d };
}
