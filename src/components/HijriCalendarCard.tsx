// ---------------------------------------------------------------------------
// HijriCalendarCard — Task 22: Hijri Calendar component
// Shows the current Islamic month as a grid with event markers.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import { buildHijriMonth } from "@/lib/hijri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const WEEKDAY_LABELS = ["أحد", "إثن", "ثلا", "أرب", "خمس", "جمع", "سبت"];

export default function HijriCalendarCard() {
  const { days, monthName, hijriYear, firstWeekday } = useMemo(
    () => buildHijriMonth(),
    [],
  );

  // Build a flat array: empty slots for the lead offset + actual days
  const cells: Array<(typeof days)[number] | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            🗓️ {monthName}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {hijriYear} هـ
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-9" />;
              }

              const hasEvent = cell.events.length > 0;
              const eventEmojis = cell.events.map((e) => e.emoji).join(" ");
              const eventNames = cell.events
                .map((e) => e.arabicName)
                .join("، ");

              const dayCell = (
                <div
                  className={`
                    relative flex flex-col items-center justify-center h-9 rounded-md text-xs
                    transition-colors cursor-default select-none
                    ${
                      cell.isToday
                        ? "bg-primary text-primary-foreground font-bold"
                        : hasEvent
                          ? "bg-amber-400/15 text-foreground"
                          : "hover:bg-secondary"
                    }
                  `}
                >
                  <span>{cell.hijriDay}</span>
                  {hasEvent && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-[8px] leading-none"
                      aria-hidden
                    >
                      {cell.events[0].emoji}
                    </span>
                  )}
                </div>
              );

              if (hasEvent) {
                return (
                  <Tooltip key={cell.iso}>
                    <TooltipTrigger asChild>{dayCell}</TooltipTrigger>
                    <TooltipContent side="top" className="text-center max-w-40">
                      <p className="font-semibold">
                        {eventEmojis} {eventNames}
                      </p>
                      {cell.events[0]?.description && (
                        <p className="text-xs opacity-80 mt-0.5">
                          {cell.events[0].description}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={cell.iso}>{dayCell}</div>;
            })}
          </div>

          {/* Legend: events in this month */}
          {days.some((d) => d.events.length > 0) && (
            <div className="mt-3 pt-3 border-t space-y-1">
              {days
                .filter((d) => d.events.length > 0)
                .map((d) =>
                  d.events.map((ev) => (
                    <div
                      key={`${d.iso}-${ev.id}`}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span>{ev.emoji}</span>
                      <span>
                        {d.hijriDay} {monthName} — {ev.arabicName}
                      </span>
                    </div>
                  )),
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
