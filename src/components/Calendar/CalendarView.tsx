import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import { useMemo } from "react";
import type { Event } from "../../lib/calendar/eventSchema";
import { colorFor } from "../../lib/calendar/colorPalette";
import { DateTime } from "luxon";

export default function CalendarView({ events }: { events: Event[] }) {
  const fcEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: `${e.moduleCode}${e.group ? " " + e.group : ""}`, // week/day title
        start: e.start,
        end: e.end,
        extendedProps: e, // { moduleCode, group, venue, remarks, ... }
        backgroundColor: colorFor(e.moduleCode),
        borderColor: colorFor(e.moduleCode),
      })),
    [events]
  );

  return (
    <div className="border border-gray-800 rounded-lg p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, luxonPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        nowIndicator
        events={fcEvents}

        /* Time labels */
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: "short" }}
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", meridiem: "short" }}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"

        /* Hide the all-day row in timeGrid views */
        allDaySlot={false}

        /* Month view compaction */
        dayMaxEventRows={3}
        moreLinkClick="popover"
        moreLinkText={(n) => `+${n} more`}
        views={{
          dayGridMonth: { displayEventTime: true },
        }}

        /* Render: month vs week/day/list */
        eventContent={(arg: any) => {
          const ev = arg.event.extendedProps as Event;
          const isMonth = arg.view.type === "dayGridMonth";
          const isList  = arg.view.type.startsWith("list");

          if (isMonth) {
            // Month: ONLY time + module code
            return (
              <div style={{ lineHeight: 1.1 }}>
                <div className="text-xs font-semibold truncate">
                  {arg.timeText} {ev.moduleCode}
                </div>
              </div>
            );
          }

          // Week/Day + List: show venue ONLY (no remarks)
          return (
            <div style={{ lineHeight: 1.15 }}>
              <div className="text-s font-semibold">
                {arg.timeText} {arg.event.title}
              </div>
              {ev?.venue && (
                <div
                  className={
                    isList
                      ? "text-xs opacity-85 whitespace-normal break-words leading-tight" // wrap in List
                      : "text-xs opacity-85 whitespace-normal break-words leading-tight" // wrap in timeGrid
                  }
                >
                  {ev.venue}
                </div>
              )}
            </div>
          );
        }}

        /* Tooltip: exclude remarks everywhere */
        eventDidMount={(info) => {
          const ev = info.event.extendedProps as Event;
          const isMonth = info.view.type === "dayGridMonth";
          if (isMonth) {
            const time = DateTime.fromISO(ev.start).toFormat("t");
            info.el.title = `${time} ${ev.moduleCode}`;
            return;
          }
          const start = DateTime.fromISO(ev.start).toFormat("d LLL yyyy, t");
          const end   = DateTime.fromISO(ev.end).toFormat("t");
          const venue = ev?.venue ? `\nVenue: ${ev.venue}` : "";
          info.el.title = `${info.event.title}\n${start} – ${end}${venue}`;
        }}
      />
    </div>
  );
}
