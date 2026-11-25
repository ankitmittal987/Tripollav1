import { useEffect, useState } from "react";
import { CheckSquare, CreditCard, Download, Globe2, MapPin, Pencil, Plane, Plus } from "lucide-react";
import type { TabId, TripPlan } from "../types/trip";
import { formatMoney, formatTripDateRange } from "../data/tripBuilder";
import { PWAInstallButton } from "./PWAInstallButton";
import heroImage from "../assets/images/sri_lanka_coast_hero_1794596628426.jpg";

interface TripCountdownHeroProps {
  trip: TripPlan;
  totalShortlisted: number;
  totalExpensesHome: number;
  checklistDone: number;
  checklistTotal: number;
  onNavigateTab: (tab: TabId) => void;
  onOpenTripManager: (mode: "switch" | "create" | "edit") => void;
  onDownloadOfflineHtml: () => void;
}

interface CountdownParts {
  status: "upcoming" | "active" | "completed";
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  tripDay: number;
}

function getCountdownParts(nowMs: number, startDate: string, depTime: string, totalDays: number): CountdownParts {
  const depMs = new Date(`${startDate}T${depTime || "08:00"}:00`).getTime();
  const dayStartMs = new Date(`${startDate}T00:00:00`).getTime();
  const endMs = dayStartMs + Math.max(1, totalDays) * 86400000 - 1000;

  if (Number.isNaN(depMs) || Number.isNaN(dayStartMs)) {
    return { status: "upcoming", days: 0, hours: 0, minutes: 0, seconds: 0, tripDay: 1 };
  }

  if (nowMs < depMs) {
    const diff = Math.max(0, depMs - nowMs);
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { status: "upcoming", days, hours, minutes, seconds, tripDay: 0 };
  }

  if (nowMs <= endMs) {
    const tripDay = Math.min(totalDays, Math.max(1, Math.floor((nowMs - dayStartMs) / 86400000) + 1));
    return { status: "active", days: 0, hours: 0, minutes: 0, seconds: 0, tripDay };
  }

  return { status: "completed", days: 0, hours: 0, minutes: 0, seconds: 0, tripDay: totalDays };
}

export function TripCountdownHero({
  trip,
  totalShortlisted,
  totalExpensesHome,
  checklistDone,
  checklistTotal,
  onNavigateTab,
  onOpenTripManager,
  onDownloadOfflineHtml
}: TripCountdownHeroProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const cd = getCountdownParts(nowMs, trip.startDate, trip.departureTime, trip.days.length);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const packingPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const dateRangeLabel = formatTripDateRange(trip.startDate, trip.days.length);
  const firstFlight = trip.flights[0];
  const formattedStartDate = (() => {
    const d = new Date(`${trip.startDate}T12:00:00`);
    return Number.isNaN(d.getTime())
      ? trip.startDate
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  })();

  return (
    <section className="space-y-3">
      {/* Main Hero Banner with Live Countdown */}
      <div className="relative rounded-3xl overflow-hidden border border-sand-200 dark:border-slate-800 bg-gradient-to-br from-[#0e4d52] via-[#126867] to-[#b46b34] min-h-[240px] sm:min-h-[268px] flex flex-col justify-end shadow-sm">
        {!imgFailed && (
          <img
            src={heroImage}
            alt={`${trip.destination} scenic travel backdrop`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        )}

        {/* Measured Scrim Overlay for WCAG AA+ Contrast */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/20"
        />

        <div className="relative z-10 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          {/* Left: Active Trip Title & Switcher */}
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-teal-200">
              <span>{dateRangeLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{trip.destination}</span>
              {trip.travelersLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{trip.travelersLabel}</span>
                </>
              )}
            </div>

            <h1
              className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight mt-1.5"
              style={{ textWrap: "balance" }}
            >
              {trip.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200/90 mt-1.5 leading-relaxed max-w-lg">
              {cd.status === "upcoming"
                ? firstFlight
                  ? `Countdown to ${firstFlight.flightNo || "departure"} (${firstFlight.fromCode} → ${firstFlight.toCode}) on ${formattedStartDate}.`
                  : `Countdown to your ${trip.destination} departure on ${formattedStartDate}.`
                : cd.status === "active"
                  ? `Currently on Day ${cd.tripDay} of ${trip.days.length} in ${trip.destination}.`
                  : `Trip completed (${dateRangeLabel}). All notes, expenses, and photos are saved locally.`}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenTripManager("switch")}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 backdrop-blur-xs transition-colors whitespace-nowrap"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Switch Trip</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenTripManager("create")}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-sand-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Trip</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenTripManager("edit")}
                aria-label="Edit current trip settings"
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 backdrop-blur-xs transition-colors whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={onDownloadOfflineHtml}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 backdrop-blur-xs transition-colors whitespace-nowrap"
                title="Download complete trip as a standalone offline HTML file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Offline Pack</span>
              </button>
              <PWAInstallButton variant="header" onDownloadOfflinePack={onDownloadOfflineHtml} />
            </div>
          </div>

          {/* Right: Prominent Live Countdown Timer */}
          {cd.status === "upcoming" ? (
            <div
              aria-label={`Countdown until ${formattedStartDate}`}
              className="rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/15 px-4 py-3.5 sm:px-5 sm:py-4 shrink-0"
            >
              <div className="text-[11px] font-semibold text-teal-200 mb-2 flex items-center justify-between gap-4">
                <span>Until {formattedStartDate}</span>
                <span className="font-mono text-white/80">{trip.departureTime || "08:00"}</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center tabular-nums">
                <div>
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-none">
                    {cd.days}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">Days</div>
                </div>
                <div>
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-none">
                    {pad2(cd.hours)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">Hours</div>
                </div>
                <div>
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-none">
                    {pad2(cd.minutes)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">Mins</div>
                </div>
                <div>
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-amber-300 leading-none">
                    {pad2(cd.seconds)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">Secs</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/15 px-5 py-4 shrink-0 text-left sm:text-right">
              <div className="text-xs font-semibold text-teal-200">
                {cd.status === "active" ? "Trip Live Status" : "Journey Complete"}
              </div>
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-white mt-0.5 tabular-nums">
                {cd.status === "active"
                  ? `Day ${cd.tripDay} of ${trip.days.length}`
                  : `${trip.days.length} / ${trip.days.length} Days`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4-Column Quick Trip Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab("fly")}
          className="text-left rounded-2xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-4 py-3 hover:border-brand-600/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Departure</span>
            <Plane className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
          </div>
          <div className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-1 tabular-nums truncate">
            {cd.status === "upcoming" ? `${cd.days}d ${cd.hours}h left` : formattedStartDate}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("tools")}
          className="text-left rounded-2xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-4 py-3 hover:border-brand-600/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Shortlisted Stops</span>
            <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
          </div>
          <div className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-1 tabular-nums">
            {totalShortlisted} places
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("money")}
          className="text-left rounded-2xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-4 py-3 hover:border-brand-600/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Trip Spend ({trip.currency.home})</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatMoney(Math.round(totalExpensesHome), trip.currency.home)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("tools")}
          className="text-left rounded-2xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-4 py-3 hover:border-brand-600/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Packing Ready</span>
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-1 tabular-nums flex items-center gap-2">
            <span>{packingPct}%</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              ({checklistDone}/{checklistTotal})
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
