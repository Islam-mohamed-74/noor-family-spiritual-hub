// ---------------------------------------------------------------------------
// IslamicEventsAlert — Task 22: Upcoming Islamic event banners
// Shows a highlighted card for any Islamic event occurring in the next 7 days.
// ---------------------------------------------------------------------------

import { getUpcomingIslamicEvents } from "@/lib/hijri";

export default function IslamicEventsAlert() {
  const events = getUpcomingIslamicEvents(new Date(), 7);

  if (events.length === 0) return null;

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className={`rounded-lg border p-3 ${event.color}`}>
          <div className="flex items-start gap-2">
            <span className="text-xl leading-none mt-0.5">{event.emoji}</span>
            <div>
              <p className="font-semibold text-sm">
                {event.arabicName}
                {event.daysUntil === 0 && (
                  <span className="mr-2 text-xs font-normal opacity-75">
                    (اليوم)
                  </span>
                )}
                {event.daysUntil === 1 && (
                  <span className="mr-2 text-xs font-normal opacity-75">
                    (غداً)
                  </span>
                )}
                {event.daysUntil > 1 && (
                  <span className="mr-2 text-xs font-normal opacity-75">
                    (بعد {event.daysUntil} أيام)
                  </span>
                )}
              </p>
              <p className="text-xs opacity-80 mt-0.5">{event.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
