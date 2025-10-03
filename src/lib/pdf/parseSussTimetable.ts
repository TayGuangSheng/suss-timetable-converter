// src/lib/pdf/parseSussTimetable.ts
import { Event } from "../calendar/eventSchema";
import { CODE_RE, GROUP_RE, DATE_RE, TIME_RE } from "../constants";
import { parseDateToken } from "../time/parseDate";
import { parseTimeToken } from "../time/parseTime";
import { toLocalIso, ymd } from "../time/toZonedDate";

const BRACKET_RE = /\[[^\]]+\]/g;

function normalize(raw: string) {
  return raw
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/WEDNESDA\nY/gi, "WEDNESDAY")
    .replace(BRACKET_RE, (m) => m); // keep remarks in place (don't remove)
}

function extractRows(pageText: string): string[] {
  const lines = pageText.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: string[] = [];
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length) rows.push(buffer.join(" "));
    buffer = [];
  };
  for (const ln of lines) {
    buffer.push(ln);
    const joined = buffer.join(" ");
    const hasDate = DATE_RE.test(joined);
    const timesCount = (joined.match(TIME_RE) || []).length;
    const hasCode = CODE_RE.test(joined);
    if (hasDate && timesCount >= 2 && hasCode) {
      flush();
    }
  }
  flush();
  return rows;
}

let idCounter = 0;
const nextId = () => `evt_${++idCounter}`;

/**
 * Venue salvage regexes — try these patterns if the simple slice fails.
 * Add more patterns here if you see other venue formats in the PDFs.
 */
const SALVAGE_PATTERNS: RegExp[] = [
  /HQ\s+BLK[^,\[\n]+/i,                          // "HQ BLK C - SR.C.8.11"
  /\bSR\.[A-Z0-9.\-]+/i,                        // "SR.C.6.09"
  /\bSR\.C\.[0-9.\-]+/i,
  /Online Session[^\[\n]*/i,                    // "Online Session conducted on Canvas Zoom ..."
  /Canvas Zoom[^\[\n]*/i,
  /\bLT\d+\b/i,                                 // "LT1", "LT01"
  /\bBlk\s+[A-Z0-9]+\b/i,                       // "Blk C" variants
  /(?:Block|Blk|Building)[^\[\n]*/i,
  /[A-Z]{2,5}\.\w+\s*-\s*SR\.[A-Z0-9.\-]+/i,    // compound patterns
];

export async function parseSussTimetable(
  pages: Array<{ page: number; text: string }>
): Promise<Event[]> {
  const events: Event[] = [];

  for (const pg of pages) {
    const text = normalize(pg.text);
    const rows = extractRows(text);

    for (const row of rows) {
      const code = (row.match(CODE_RE) || [])[0];
      if (!code) continue;

      const group = (row.match(GROUP_RE) || [])[0];
      const dateM = row.match(DATE_RE);
      const timeMatches = Array.from(row.matchAll(TIME_RE));
      if (!dateM || timeMatches.length < 2) continue;

      // date + times
      const timeTokens = timeMatches.map((m: any) => `${m[1]} ${m[2]}`.toUpperCase());
      const dateTok = `${dateM[1]} ${dateM[2].toUpperCase()} ${dateM[3]}`;
      const d = parseDateToken(dateTok);
      const tFrom = parseTimeToken(timeTokens[0]);
      const tTo = parseTimeToken(timeTokens[1]);
      if (!d || !tFrom || !tTo) continue;

      // remarks = bracketed content (if any)
      const remarksArr = row.match(BRACKET_RE) || [];
      const remarks = remarksArr.length ? remarksArr.join(" ").trim() : undefined;

      // Primary extraction: text BETWEEN the 2nd time token and the first '[' after it
      const secondTimeMatch = timeMatches[1];
      const toEndIndex = (secondTimeMatch.index ?? 0) + secondTimeMatch[0].length;
      if (toEndIndex < 0) continue;

      // Candidate raw tail
      const bracketPos = row.indexOf("[", toEndIndex);
      let rawVenue = bracketPos !== -1 ? row.slice(toEndIndex, bracketPos) : row.slice(toEndIndex);

      // Clean leading separators/spaces
      rawVenue = rawVenue.replace(/^[\s:,\-\u2013\u2014]+/, "");

      // Remove any bracketed text left just in case
      rawVenue = rawVenue.replace(BRACKET_RE, "");

      // Collapse whitespace and trim
      let venueText = rawVenue.replace(/\s+/g, " ").trim();

      // If primary approach produced nothing, try salvage patterns searching the entire row
      if (!venueText) {
        for (const pat of SALVAGE_PATTERNS) {
          const m = row.match(pat);
          if (m && m[0]) {
            venueText = m[0].replace(BRACKET_RE, "").replace(/\s+/g, " ").trim();
            break;
          }
        }
      }

      // Final safety fallback
      if (!venueText) {
        const generic = row.match(/(HQ\s+BLK[^,\[\n]+|SR\.[A-Z0-9.\-]+|Online Session[^\[\n]*)/i);
        if (generic && generic[0]) {
          venueText = generic[0].replace(BRACKET_RE, "").replace(/\s+/g, " ").trim();
        }
      }

      const venue = venueText || undefined;

      // Build ISO start/end (local-time, no offset) + stable date (no UTC shift)
      const startIso = toLocalIso(d.y, d.m, d.d, tFrom.h, tFrom.m);
      const endIso   = toLocalIso(d.y, d.m, d.d, tTo.h,   tTo.m);
      const dateStr  = ymd(d.y, d.m, d.d); // <-- use parsed Y/M/D directly

      events.push({
        id: nextId(),
        moduleCode: code,
        group,
        date: dateStr,         // <-- fixed to avoid timezone drift
        start: startIso,
        end: endIso,
        venue,
        remarks,
        sourcePage: pg.page,
      });
    }
  }

  // dedupe: same code, group, start, end
  const key = (e: Event) => [e.moduleCode, e.group ?? "", e.start, e.end].join("|");
  const map = new Map<string, Event>();
  for (const e of events) map.set(key(e), e);

  return Array.from(map.values()).sort((a, b) => a.start.localeCompare(b.start));
}
