export const DAY_RE = /\b(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\b/i;
export const DATE_RE = /\b(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})\b/i;
export const TIME_RE = /\b(\d{1,2}:\d{2})\s?(AM|PM)\b/gi;
export const CODE_RE = /\b[A-Z]{2,4}\d{3}\b/;
export const GROUP_RE = /\bTG\d{1,3}\b/;
