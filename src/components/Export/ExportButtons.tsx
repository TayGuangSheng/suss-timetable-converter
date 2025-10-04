// src/components/Export/ExportButtons.tsx
import * as React from "react";
import { eventsToIcs, downloadIcs } from "../../lib/calendar/ics";
import type { Event } from "../../lib/calendar/eventSchema";
import { encodeSharedState, makeShareUrl } from "../../lib/share/serialize";

type Props = {
  events: Event[];
  overrides?: Record<string, string>; // moduleCode -> hex (optional but recommended)
};

function copy(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  // Fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
  return Promise.resolve();
}

export default function ExportButtons({ events, overrides = {} }: Props) {
  const [status, setStatus] = React.useState<"" | "copied" | "error" | "toolong">("");

  function onExport() {
    const ics = eventsToIcs(events);
    downloadIcs("suss_timetable.ics", ics);
  }

  async function onShare() {
    try {
      // Keep the payload lean (no ids)
      const leanEvents = events.map((e) => ({
        moduleCode: e.moduleCode,
        group: e.group ?? "",
        date: e.date,
        start: e.start,
        end: e.end,
        venue: e.venue ?? "",
        remarks: e.remarks ?? "",
      }));

      const token = encodeSharedState({ v: 1, events: leanEvents, overrides });
      const url = makeShareUrl(token);

      // Hash URLs can be long; warn if very large
      if (url.length > 6000) setStatus("toolong");

      // Use Web Share API if available
      if ((navigator as any).share) {
        try {
          await (navigator as any).share({ title: "SUSS Timetable", url });
          setStatus("copied");
          setTimeout(() => setStatus(""), 2000);
          return;
        } catch {
          // fall through to clipboard
        }
      }

      await copy(url);
      setStatus("copied");
      setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus(""), 3000);
    }
  }

  return (
    <div className="border border-gray-800 rounded-lg p-3 space-y-2">
      <h3 className="font-semibold">3) Export / Share</h3>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onExport}
          className="px-3 py-2 rounded bg-sky-500 text-black font-semibold hover:bg-sky-400"
        >
          Download .ics
        </button>

        <button
          onClick={onShare}
          className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 font-semibold hover:bg-gray-800"
          title="Create a link to share this timetable"
        >
          Copy share link
        </button>

        {status === "copied" && (
          <span className="text-xs text-emerald-400">Link copied!</span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-400">Couldn’t create link.</span>
        )}
        {status === "toolong" && (
          <span className="text-xs text-amber-400">
            Link is long—consider trimming events.
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Import the ICS into Google, Apple, or Outlook Calendar — or share a link
        so others can open the same timetable in their browser.
      </p>
    </div>
  );
}
