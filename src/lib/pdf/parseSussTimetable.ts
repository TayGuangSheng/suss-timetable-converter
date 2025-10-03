// src/lib/pdf/parseSussTimetable.ts
import { Event } from "../calendar/eventSchema";
import { CODE_RE, GROUP_RE, DATE_RE, TIME_RE } from "../constants";
import { parseDateToken } from "../time/parseDate";
import { parseTimeToken } from "../time/parseTime";
import { toLocalIso, ymd } from "../time/toZonedDate";

const BRACKET_RE = /\[[^\]]+\]/g;

// Row-start splitter that tolerates newlines between S/N and code
const ROW_SPLIT_RE = /(?=^\s*\d{1,3}\s+[A-Z]{2,4}\d{3}\b)/m;

// Trim page headers/footers and report scaffolding
const CUT_TAIL_RE =
  /(Site Information|End of Report|\*\*\* End of Report \*\*\*|Report ID:|Singapore University of Social Sciences|Page\s+No\.?:|Current Week|Timetable Details|^\s*Report Generated.*$)/im;

// Normalize raw PDF text
function normalize(raw: string) {
  return raw
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/WEDNESDA\nY/gi, "WEDNESDAY")
    .replace(BRACKET_RE, (m) => m); // keep remarks in place
}

// Split PDF text into row-like buffers (one chunk per class row)
function extractRows(pageText: string): string[] {
  const text = normalize(pageText).replace(CUT_TAIL_RE, "");
  // Split BEFORE each S/N + CODE occurrence, keeping the delimiter in the chunk
  const chunks = text.split(ROW_SPLIT_RE).map((s) => s.trim()).filter(Boolean);
  return chunks.map((c) => c.replace(/\s+/g, " ").trim());
}

let idCounter = 0;
const nextId = () => `evt_${++idCounter}`;

/** Regex patterns to salvage venue text */
const SALVAGE_PATTERNS: RegExp[] = [
  /HQ\s+BLK[^,\[\n]+/i,           // HQ BLK C - SR.C.8.11
  /\bSR\.[A-Z0-9.\-]+/i,          // SR.C.6.09
  /Online Session[^\[\n]*/i,      // Online Session conducted on Canvas Zoom
  /Canvas Zoom[^\[\n]*/i,
  /\bLT\d+\b/i,                   // LT1, LT01
  /\bBlk\s+[A-Z0-9]+\b/i,
  /(?:Block|Blk|Building)[^\[\n]*/i,
  /[A-Z]{2,5}\.\w+\s*-\s*SR\.[A-Z0-9.\-]+/i,
  /SIM\s+HEADQUARTERS[^\[\n]*/i,  // extra site wording seen in some exports
];

export async function parseSussTimetable(
  pages: Array<{ page: number; text: string }>
): Promise<Event[]> {
  const events: Event[] = [];

  for (const pg of pages) {
    const rows = extractRows(pg.text);

    for (let row of rows) {
      // Belt-and-suspenders: nuke any remaining scaffolding
      row = row.replace(CUT_TAIL_RE, "").trim();
      if (!row) continue;

      const code = (row.match(CODE_RE) || [])[0];
      if (!code) continue;

      const group = (row.match(GROUP_RE) || [])[0];
      const dateM = row.match(DATE_RE);
      const timeMatches = Array.from(row.matchAll(TIME_RE));
      if (!dateM || timeMatches.length < 2) continue;

      // Parse date and time
      const timeTokens = timeMatches.map((m: any) => `${m[1]} ${m[2]}`.toUpperCase());
      const dateTok = `${dateM[1]} ${dateM[2].toUpperCase()} ${dateM[3]}`;
      const d = parseDateToken(dateTok);
      const tFrom = parseTimeToken(timeTokens[0]);
      const tTo   = parseTimeToken(timeTokens[1]);
      if (!d || !tFrom || !tTo) continue;

      // Extract & de-duplicate remarks (in brackets)
      const remarksArr = row.match(BRACKET_RE) || [];
      const remarks = (() => {
        if (!remarksArr.length) return undefined;
        const uniq = Array.from(new Set(remarksArr.map(s => s.replace(/\s+/g, " ").trim())));
        return uniq.join(" ");
      })();

      // Venue: slice between 2nd time and first cut marker
      const secondTimeMatch = timeMatches[1];
      const toEndIndex = (secondTimeMatch.index ?? 0) + secondTimeMatch[0].length;
      if (toEndIndex < 0) continue;

      const tail = row.slice(toEndIndex);

      // Cut venue at [remarks], next row marker, weekday, or another date
      const CUT_TOKENS: RegExp[] = [
        /\[/,
        /\b\d{1,3}\s+[A-Z]{2,4}\d{3}\b/, // next S/N + Module
        /\b(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\b/i,
        new RegExp(DATE_RE.source, "i"),
      ];
      let cutPos = tail.length;
      for (const re of CUT_TOKENS) {
        const m = re.exec(tail);
        if (m && m.index < cutPos) cutPos = m.index;
      }

      let rawVenue = tail
        .slice(0, cutPos)
        .replace(/^[\s:,\-\u2013\u2014]+/, "")
        .replace(BRACKET_RE, "");

      // Defensive: if a new row marker somehow appears inside the venue slice, cut it
      rawVenue = rawVenue.replace(/\s*\b\d{1,3}\s+[A-Z]{2,4}\d{3}\b[\s\S]*$/m, "");

      let venueText = rawVenue.replace(/\s+/g, " ").trim();

      // Salvage if missing
      if (!venueText) {
        for (const pat of SALVAGE_PATTERNS) {
          const m = row.match(pat);
          if (m && m[0]) {
            venueText = m[0].replace(BRACKET_RE, "").replace(/\s+/g, " ").trim();
            break;
          }
        }
      }

      // Final fallback: generic match
      if (!venueText) {
        const generic = row.match(/(HQ\s+BLK[^,\[\n]+|SR\.[A-Z0-9.\-]+|Online Session[^\[\n]*)/i);
        if (generic && generic[0]) {
          venueText = generic[0].replace(BRACKET_RE, "").replace(/\s+/g, " ").trim();
        }
      }

      const venue = venueText || undefined;

      // Build stable date + ISO times (no timezone drift)
      const startIso = toLocalIso(d.y, d.m, d.d, tFrom.h, tFrom.m);
      const endIso   = toLocalIso(d.y, d.m, d.d, tTo.h, tTo.m);
      const dateStr  = ymd(d.y, d.m, d.d);

      events.push({
        id: nextId(),
        moduleCode: code,
        group,
        date: dateStr,
        start: startIso,
        end: endIso,
        venue,
        remarks,
        sourcePage: pg.page,
      });
    }
  }

  // Deduplicate
  const key = (e: Event) => [e.moduleCode, e.group ?? "", e.start, e.end].join("|");
  const map = new Map<string, Event>();
  for (const e of events) map.set(key(e), e);

  return Array.from(map.values()).sort((a, b) => a.start.localeCompare(b.start));
}
