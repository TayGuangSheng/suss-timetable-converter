import type { Event } from "../../lib/calendar/eventSchema";

export default function ConflictBanner({ events }: { events: Event[] }) {
  const conflicts: { a: Event; b: Event }[] = [];
  const sorted = [...events].sort((a,b) => a.start.localeCompare(b.start));
  for (let i=0;i<sorted.length;i++){
    for (let j=i+1;j<sorted.length;j++){
      const A = sorted[i], B = sorted[j];
      if (A.end <= B.start) break;
      // overlap
      conflicts.push({ a: A, b: B });
    }
  }
  if (conflicts.length === 0) return null;
  return (
    <div className="border border-yellow-700 bg-yellow-900/20 text-yellow-200 rounded-lg p-3 text-sm">
      <strong>{conflicts.length}</strong> overlapping event pairs detected. Consider editing or filtering.
    </div>
  );
}
