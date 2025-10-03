import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import { useMemo } from "react";
import type { Event } from "../../lib/calendar/eventSchema";
import { colorFor, type ColorOverrides } from "../../lib/calendar/colorPalette"; // ⬅️ import type
import { DateTime } from "luxon";
import enGb from "@fullcalendar/core/locales/en-gb"; // ⬅️ D–M–Y locale

export default function CalendarView({
  events,
  overrides, // ⬅️ new optional prop
}: {
  events: Event[];
  overrides?: ColorOverrides;
}) {
  const fcEvents = useMemo(
    () =>
      events.map((e) => {
        const color = colorFor(e.moduleCode, overrides); // ⬅️ apply override
        return {
          id: e.id,
          title: `${e.moduleCode}${e.group ? " " + e.group : ""}`, // week/day title
          start: e.start,
          end: e.end,
          extendedProps: e, // { moduleCode, group, venue, remarks, ... }
          backgroundColor: color,
          borderColor: color,
        };
      }),
    [events, overrides] // ⬅️ recompute when overrides change
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
        eventContent={(arg: any) => {
          const ev = arg.event.extendedProps as Event;
          const isMonth = arg.view.type === "dayGridMonth";
          const isList = arg.view.type.startsWith("list");

          if (isMonth) {
            return (
              <div style={{ lineHeight: 1.1 }}>
                <div className="text-xs font-semibold truncate">
                  {arg.timeText} {ev.moduleCode}
                </div>
              </div>
            );
          }

          return (
            <div style={{ lineHeight: 1.15 }}>
              <div className="text-s font-semibold">
                {arg.timeText} {arg.event.title}
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
