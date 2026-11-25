import type { TripPlan } from "../types/trip";

export interface UpcomingTripEvent {
  id: string;
  kind: "flight" | "milestone" | "departure";
  title: string;
  body: string;
  eventTimeMs: number;
}

function parseTimeString(rawTime: string | undefined): string {
  const cleaned = (rawTime || "").trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "08:00:00";
  return `${match[1].padStart(2, "0")}:${match[2]}:00`;
}

export function collectUpcomingEvents(trip: TripPlan): UpcomingTripEvent[] {
  const events: UpcomingTripEvent[] = [];

  // 1. Trip departure
  if (trip.startDate) {
    const depTs = new Date(`${trip.startDate}T${parseTimeString(trip.departureTime)}`).getTime();
    if (!Number.isNaN(depTs)) {
      events.push({
        id: `${trip.id}_dep_${trip.startDate}`,
        kind: "departure",
        title: `${trip.name} departs soon`,
        body: `Heading to ${trip.destination} at ${trip.departureTime || "08:00"}.`,
        eventTimeMs: depTs
      });
    }
  }

  // 2. Flights
  trip.flights.forEach((f) => {
    const dateStr = f.travelDate || trip.startDate;
    if (!dateStr) return;
    const ts = new Date(`${dateStr}T${parseTimeString(f.depTime)}`).getTime();
    if (Number.isNaN(ts)) return;
    const travelers = f.travelerNames?.length ? f.travelerNames.join(", ") : trip.travelersLabel;
    events.push({
      id: `${trip.id}_fl_${f.id}_${dateStr}_${f.depTime}`,
      kind: "flight",
      title: `Flight ${f.flightNo}: ${f.fromCode} → ${f.toCode}`,
      body: `${f.airline} departs ${f.depTime} (${dateStr}) · PNR ${f.pnr} · ${travelers}`,
      eventTimeMs: ts
    });
  });

  // 3. Milestones
  trip.milestones.forEach((m) => {
    const ts = new Date(m.dateTime).getTime();
    if (Number.isNaN(ts)) return;
    events.push({
      id: `${trip.id}_ms_${m.id}_${m.dateTime}`,
      kind: "milestone",
      title: `Upcoming: ${m.label}`,
      body: `${trip.name} (${trip.destination}) · ${m.dateTime.replace("T", " at ")}`,
      eventTimeMs: ts
    });
  });

  return events.sort((a, b) => a.eventTimeMs - b.eventTimeMs);
}

export function isNotificationApiSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationApiSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationApiSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function showEventNotification(title: string, body: string, tag = "tripolla-event"): Promise<boolean> {
  if (!isNotificationApiSupported() || Notification.permission !== "granted") {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
  } catch {
    // Fall back to direct Notification
  }

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

export async function scheduleBackgroundTriggers(
  events: UpcomingTripEvent[],
  leadMinutes: number
): Promise<number> {
  if (!isNotificationApiSupported() || Notification.permission !== "granted") {
    return 0;
  }
  const win = window as unknown as {
    TimestampTrigger?: new (timestamp: number) => unknown;
  };
  if (typeof win.TimestampTrigger !== "function" || !("serviceWorker" in navigator)) {
    return 0;
  }

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return 0;

    const now = Date.now();
    const leadMs = Math.max(1, leadMinutes) * 60000;
    let scheduled = 0;

    for (const ev of events) {
      const fireAt = ev.eventTimeMs - leadMs;
      if (fireAt > now && fireAt - now < 30 * 86400000) {
        const trigger = new win.TimestampTrigger(fireAt);
        await reg.showNotification(ev.title, {
          body: ev.body,
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: `sched_${ev.id}`,
          showTrigger: trigger
        } as NotificationOptions);
        scheduled++;
      }
    }
    return scheduled;
  } catch {
    return 0;
  }
}
