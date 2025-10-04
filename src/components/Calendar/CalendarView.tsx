import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import { useMemo } from "react";
import type { Event } from "../../lib/calendar/eventSchema";
import { colorFor, type ColorOverrides } from "../../lib/calendar/colorPalette";
import { DateTime } from "luxon";
import enGb from "@fullcalendar/core/locales/en-gb";

export default function CalendarView({
  events,
  overrides,
}: {
  events: Event[];
  overrides?: ColorOverrides;
}) {
  const fcEvents = useMemo(
    () =>
      events.map((e) => {
        const color = colorFor(e.moduleCode, overrides);
        return {
          id: e.id,
          title: `${e.moduleCode}${e.group ? " " + e.group : ""}`,
          start: e.start,
          end: e.end,
          extendedProps: e,
          backgroundColor: color,
          borderColor: color,
        };
      }),
    [events, overrides]
  );

  return (
    <div className="border border-gray-800 rounded-lg p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, luxonPlugin, interactionPlugin]}
        locale={enGb}
        initialView="timeGridWeek"
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        titleFormat={{ day: "numeric", month: "short", year: "numeric" }}
        nowIndicator
        events={fcEvents}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: "short" }}
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", meridiem: "short" }}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        dayMaxEventRows={3}
        moreLinkClick="popover"
        moreLinkText={(n) => `+${n} more`}
        views={{
          dayGridMonth: { displayEventTime: true },
          timeGridWeek: {
            dayHeaderFormat: { weekday: "short", day: "numeric", month: "short" },
          },
          listWeek: {
            listDayFormat: { weekday: "short", day: "numeric", month: "short" },
            listDaySideFormat: { year: "numeric" },
          },
        }}
        /* ---------- colored dot + compact first line ---------- */
        eventContent={(arg: any) => {
          const ev = arg.event.extendedProps as Event;
          const isMonth = arg.view.type === "dayGridMonth";
          const color =
            arg.event.backgroundColor || arg.event.borderColor || "#9ca3af";

          const Dot = () => (
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                minWidth: 8,
                borderRadius: 9999,
                background: color,
                marginRight: 6,
                marginTop: 1,
                boxShadow: "0 0 0 1px rgba(0,0,0,.15)",
              }}
            />
          );

          if (isMonth) {
            // Single-line: dot + time + code (truncate)
            return (
              <div className="flex items-center min-w-0" style={{ lineHeight: 1.1 }}>
                <Dot />
                <div className="text-xs font-semibold truncate">
                  {arg.timeText} {ev.moduleCode}
                </div>
              </div>
            );
          }

          // Week/Day/List: dot on first row; venue wraps on second row
          return (
            <div style={{ lineHeight: 1.15 }}>
              <div className="flex items-center min-w-0">
                <Dot />
                <div className="text-s font-semibold truncate">
                  {arg.timeText} {arg.event.title}
                </div>
              </div>
              {ev?.venue && (
                <div className="text-xs opacity-85 whitespace-normal break-words leading-tight">
                  {ev.venue}
                </div>
              )}
            </div>
          );
        }}
        eventDidMount={(info) => {
          const ev = info.event.extendedProps as Event;
          const isMonth = info.view.type === "dayGridMonth";
          if (isMonth) {
            const time = DateTime.fromISO(ev.start).toFormat("t");
            info.el.title = `${time} ${ev.moduleCode}`;
            return;
          }
          const start = DateTime.fromISO(ev.start).toFormat("d LLL yyyy, t");
          const end = DateTime.fromISO(ev.end).toFormat("t");
          const venue = ev?.venue ? `\nVenue: ${ev.venue}` : "";
          info.el.title = `${info.event.title}\n${start} – ${end}${venue}`;
        }}
      />
    </div>
  );
}
