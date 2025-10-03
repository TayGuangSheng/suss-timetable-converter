import { useState } from "react";
import { extractPdfText } from "../../lib/pdf/extractPdfText";
import { parseSussTimetable } from "../../lib/pdf/parseSussTimetable";
import type { Event } from "../../lib/calendar/eventSchema";

export default function PdfUpload({ onParsed }: { onParsed: (e: Event[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const pages = await extractPdfText(file);
      const events = await parseSussTimetable(pages);
      if (events.length === 0) throw new Error("No timetable rows found. Please ensure it's the official SUSS timetable PDF.");
      onParsed(events);
    } catch (e: any) {
      setError(e?.message ?? "Failed to parse PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <h2 className="font-semibold mb-2">1) Upload Timetable PDF</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        disabled={busy}
        className="block w-full text-sm"
      />
      <p className="text-xs text-gray-400 mt-2">
        Your file is processed locally in your browser. Nothing is uploaded.
      </p>
      {busy && <p className="mt-2 text-sky-400 text-sm">Parsing PDF...</p>}
      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
    </div>
  );
}
