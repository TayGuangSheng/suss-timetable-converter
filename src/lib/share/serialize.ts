// src/lib/share/serialize.ts
import type { Event } from "../calendar/eventSchema";

// keep it minimal to avoid long URLs
export type SharedState = {
  v: 1;
  events: Pick<Event, "moduleCode" | "group" | "date" | "start" | "end" | "venue" | "remarks">[];
  overrides?: Record<string, string>; // moduleCode -> hex
};

// base64url helpers
function b64urlEncode(bytes: string) {
  return btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(b64url: string) {
  const pad = b64url.length % 4 ? "=".repeat(4 - (b64url.length % 4)) : "";
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return atob(b64);
}

export function encodeSharedState(payload: SharedState): string {
  const json = JSON.stringify(payload);
  // UTF-8 safe: encodeURIComponent + decode to bytes before btoa
  const bytes = decodeURIComponent(encodeURIComponent(json));
  return b64urlEncode(bytes);
}

export function decodeSharedState(token: string): SharedState | null {
  try {
    const json = decodeURIComponent(encodeURIComponent(b64urlDecode(token)));
    const obj = JSON.parse(json);
    if (obj && obj.v === 1 && Array.isArray(obj.events)) return obj as SharedState;
    return null;
  } catch {
    return null;
  }
}

export function makeShareUrl(token: string) {
  const { origin, pathname } = window.location;
  // put in hash so no server routing changes needed
  return `${origin}${pathname}#s=${token}`;
}
