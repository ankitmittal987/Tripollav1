import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CalendarPlus,
  Check,
  Compass,
  ExternalLink,
  GripVertical,
  Home,
  Languages,
  MapPinPlus,
  Music,
  Plus,
  RotateCcw,
  Sparkles,
  Sunset,
  Trash2,
  Utensils,
  X
} from "lucide-react";
import { motion } from "motion/react";
import type { DayPlan, HotelStay, ItineraryFilter, StopItem, StopType, TripPlan } from "../types/trip";
import { STOP_TYPES, estimateLegKmAndMins, formatDuration, getStopMapsUrl, gmapsPlaceUrl, legSpeedStyle } from "../data/tripData";
import { getDayDateString, resolveHotelForDay } from "../data/destinationSuggestions";
import { OfflineSvgMap } from "./OfflineSvgMap";
import { AddPlaceModal } from "./AddPlaceModal";
import { VoiceTranslatorCard } from "./VoiceTranslatorCard";

interface ItineraryTabProps {
  trip: TripPlan;
  selectedDay: number;
  onSelectDay: (dayIdx: number) => void;
  filter: ItineraryFilter;
  onChangeFilter: (filter: ItineraryFilter) => void;
  onToggleShortlist: (id: string) => void;
  onAddHotelStay: (stay: Omit<HotelStay, "id">) => void;
  onUpdateHotelStay: (id: string, updates: Partial<HotelStay>) => void;
  onDeleteHotelStay: (id: string) => void;
  onAutoSuggestDay: (dayIdx: number) => void;
  onChangeNote: (dayIdx: number, text: string) => void;
  onChangeDaySummary: (dayIdx: number, summary: string) => void;
  onAddDay: () => void;
  onDeleteDay: (dayIdx: number) => void;
  onAddStop: (dayIdx: number, stop: StopItem) => void;
  onDeleteStop: (dayIdx: number, id: string) => void;
  onUpdateDayOrder: (dayIdx: number, orderedIds: string[]) => void;
  onResetDayOrder: (dayIdx: number) => void;
}

const TYPE_ICONS: Record<StopType, typeof Compass> = {
  v: Compass,
  f: Utensils,
  s: Sunset,
  p: Music,
  b: Home
};

export function getOrderedDayStops(
  dayObj: DayPlan | undefined,
  orderIds?: string[]
): { coreStops: StopItem[]; altFood: StopItem[]; altParty: StopItem[]; allItems: StopItem[] } {
  if (!dayObj) {
    return { coreStops: [], altFood: [], altParty: [], allItems: [] };
  }
  const rawCore = dayObj.items.filter((x) => x.tier === "core");
  const altFood = dayObj.items.filter((x) => x.tier === "alt_food");
  const altParty = dayObj.items.filter((x) => x.tier === "alt_party");

  let coreStops = rawCore;
  if (orderIds && orderIds.length > 0) {
    const byId = new Map(rawCore.map((item) => [item.id, item]));
    const ordered: StopItem[] = [];
    orderIds.forEach((id) => {
      const found = byId.get(id);
      if (found) {
        ordered.push(found);
        byId.delete(id);
      }
    });
    byId.forEach((remaining) => ordered.push(remaining));
    coreStops = ordered;
  }

  return {
    coreStops,
    altFood,
    altParty,
    allItems: [...coreStops, ...altFood, ...altParty]
  };
}

export function ItineraryTab({
  trip,
  selectedDay,
  onSelectDay,
  filter,
  onChangeFilter,
  onToggleShortlist,
  onAddHotelStay,
  onUpdateHotelStay,
  onDeleteHotelStay,
  onAutoSuggestDay,
  onChangeNote,
  onChangeDaySummary,
  onAddDay,
  onDeleteDay,
  onAddStop,
  onDeleteStop,
  onUpdateDayOrder,
  onResetDayOrder
}: ItineraryTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [showAddStayForm, setShowAddStayForm] = useState(false);
  const [newStayName, setNewStayName] = useState("");
  const [newStayCheckIn, setNewStayCheckIn] = useState("");
  const [newStayCheckOut, setNewStayCheckOut] = useState("");

  const [isReordering, setIsReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const safeDayIdx = Math.min(selectedDay, Math.max(0, trip.days.length - 1));
  const dayObj = trip.days[safeDayIdx];
  const { shortlist, dayOrder, hotelName, hotelStays, notes, destination } = trip;

  const dayDateStr = useMemo(() => getDayDateString(trip.startDate, safeDayIdx), [trip.startDate, safeDayIdx]);
  const resolvedHotel = useMemo(
    () => resolveHotelForDay(hotelStays || [], dayDateStr, hotelName),
    [hotelStays, dayDateStr, hotelName]
  );

  const { coreStops: storedCoreStops, altFood, altParty, allItems: storedAllItems } = useMemo(
    () => getOrderedDayStops(dayObj, dayOrder[safeDayIdx]),
    [dayObj, dayOrder, safeDayIdx]
  );

  // Inject an automatic Base Stay anchor stop whenever a hotel stay is mapped to this day and not already listed
  const { coreStops, virtualBaseId } = useMemo(() => {
    const activeStay =
      resolvedHotel.checkInStay ?? resolvedHotel.overnightStay ?? resolvedHotel.checkOutStay;
    if (!activeStay || !activeStay.name.trim()) {
      return { coreStops: storedCoreStops, virtualBaseId: null as string | null };
    }

    const stayWord = activeStay.name.trim().toLowerCase().split(/\s+/)[0] || "";
    const alreadyHasMatchingStop = storedCoreStops.some(
      (s) =>
        s.id === "d6_1" ||
        s.id === "d5_hotel" ||
        (stayWord.length >= 3 && s.name.toLowerCase().includes(stayWord))
    );

    if (alreadyHasMatchingStop) {
      return { coreStops: storedCoreStops, virtualBaseId: null as string | null };
    }

    const anchorStop = storedCoreStops[0];
    const baseLat = anchorStop ? anchorStop.lat + 0.004 : 0;
    const baseLng = anchorStop ? anchorStop.lng - 0.004 : 0;
    const vId = `__auto_base_${safeDayIdx}`;
    const virtualStop: StopItem = {
      id: vId,
      name: resolvedHotel.summaryText,
      query: `${resolvedHotel.baseQuery} ${destination}`.trim(),
      lat: baseLat,
      lng: baseLng,
      desc: `Auto-assigned base hotel from your check-in (${activeStay.checkInDate}) to check-out (${activeStay.checkOutDate}) schedule.`,
      type: "b",
      diet: "none",
      tier: "core",
      defaultPick: true
    };

    return { coreStops: [virtualStop, ...storedCoreStops], virtualBaseId: vId };
  }, [resolvedHotel, storedCoreStops, safeDayIdx, destination]);

  const allItems = useMemo(() => [...coreStops, ...altFood, ...altParty], [coreStops, altFood, altParty]);

  // Build dynamic driving legs aligned with current coreStops order
  const computedLegs = useMemo<[number, number][]>(() => {
    if (!dayObj || coreStops.length < 2) return [];
    const defaultCore = dayObj.items.filter((x) => x.tier === "core" && !x.custom);
    const defaultPairMap = new Map<string, [number, number]>();
    for (let i = 0; i < defaultCore.length - 1; i++) {
      const leg = dayObj.legs[i];
      if (leg) {
        defaultPairMap.set(`${defaultCore[i].id}->${defaultCore[i + 1].id}`, leg);
      }
    }

    const legs: [number, number][] = [];
    for (let i = 0; i < coreStops.length - 1; i++) {
      const a = coreStops[i];
      const b = coreStops[i + 1];
      const curated = defaultPairMap.get(`${a.id}->${b.id}`);
      legs.push(curated ?? estimateLegKmAndMins(a, b));
    }
    return legs;
  }, [dayObj, coreStops]);

  const isShortlisted = (item: StopItem) => (item.id === virtualBaseId ? true : !!shortlist[item.id]);
  const shortlistedToday = allItems.filter(isShortlisted);
  const shortlistedAlts = allItems.filter((x) => x.tier !== "core" && !!shortlist[x.id]);
  const vegCountToday = allItems.filter((x) => x.diet === "veg").length;

  const totalKm = computedLegs.reduce((sum, l) => sum + l[0], 0);
  const totalMin = computedLegs.reduce((sum, l) => sum + l[1], 0);
  const hasCustomOrder = Boolean(dayOrder[safeDayIdx] && dayOrder[safeDayIdx].length > 0);

  const existingIds = useMemo(() => new Set(storedAllItems.map((i) => i.id)), [storedAllItems]);
  const existingNames = useMemo(() => new Set(storedAllItems.map((i) => i.name.toLowerCase())), [storedAllItems]);

  const moveCoreStop = (fromIdx: number, toIdx: number) => {
    // Reorder only real persisted stops
    const realFrom = virtualBaseId ? fromIdx - 1 : fromIdx;
    const realTo = virtualBaseId ? toIdx - 1 : toIdx;
    if (realTo < 0 || realTo >= storedCoreStops.length || realFrom < 0 || realFrom === realTo) return;
    const next = [...storedCoreStops];
    const [moved] = next.splice(realFrom, 1);
    next.splice(realTo, 0, moved);
    onUpdateDayOrder(
      safeDayIdx,
      next.map((item) => item.id)
    );
  };

  const matchesFilter = (item: StopItem): boolean => {
    if (filter === "shortlisted") return isShortlisted(item);
    if (filter === "veg") return item.diet === "veg";
    return true;
  };

  const renderDietText = (diet: StopItem["diet"]) => {
    if (diet === "veg") {
      return <span className="text-emerald-700 dark:text-emerald-400 font-semibold">100% Veg / Vegan</span>;
    }
    if (diet === "both") {
      return <span className="text-sky-700 dark:text-sky-400 font-medium">Veg + Local Options</span>;
    }
    return null;
  };

  const openAddStayForToday = () => {
    setNewStayName("");
    setNewStayCheckIn(dayDateStr || trip.startDate);
    setNewStayCheckOut(getDayDateString(trip.startDate, safeDayIdx + 1) || dayDateStr || trip.startDate);
    setShowAddStayForm((prev) => !prev);
  };

  const handleSaveStay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStayName.trim() || !newStayCheckIn) return;
    const outDate = newStayCheckOut && newStayCheckOut >= newStayCheckIn ? newStayCheckOut : newStayCheckIn;
    onAddHotelStay({
      name: newStayName.trim(),
      query: `${newStayName.trim()} ${destination}`.trim(),
      checkInDate: newStayCheckIn,
      checkOutDate: outDate
    });
    setNewStayName("");
    setShowAddStayForm(false);
  };

  const renderVenueCard = (item: StopItem, stepNumber: number | null, coreIdx: number | null) => {
    if (!matchesFilter(item)) return null;

    const isVirtualBase = item.id === virtualBaseId;
    const checked = isShortlisted(item);
    const typeMeta = STOP_TYPES[item.type] || STOP_TYPES.v;
    const TypeIcon = TYPE_ICONS[item.type] || Compass;
    const baseHotel = resolvedHotel.baseName || hotelName || "Primary Stay";
    const hotelQuery = `${baseHotel} ${destination}`.trim();
    const displayName =
      item.id === "d6_1"
        ? baseHotel
        : item.id === "d5_hotel"
          ? `${baseHotel} (Luggage Drop / Check-in)`
          : item.name;
    const displayQuery = item.id === "d6_1" || item.id === "d5_hotel" ? hotelQuery : item.query;

    const showReorderControls = isReordering && coreIdx !== null && !isVirtualBase && filter === "all";
    const minReorderIdx = virtualBaseId ? 1 : 0;
    const isDropTarget = showReorderControls && dragOverIndex === coreIdx && dragIndex !== coreIdx;

    return (
      <div
        key={item.id}
        draggable={showReorderControls}
        onDragStart={() => {
          if (coreIdx !== null && !isVirtualBase) setDragIndex(coreIdx);
        }}
        onDragOver={(e) => {
          if (!showReorderControls || coreIdx === null || isVirtualBase) return;
          e.preventDefault();
          if (dragOverIndex !== coreIdx) setDragOverIndex(coreIdx);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragIndex !== null && coreIdx !== null && !isVirtualBase) {
            moveCoreStop(dragIndex, coreIdx);
          }
          setDragIndex(null);
          setDragOverIndex(null);
        }}
        onDragEnd={() => {
          setDragIndex(null);
          setDragOverIndex(null);
        }}
        className={`flex gap-3 items-start rounded-2xl transition-all ${
          isDropTarget ? "ring-2 ring-brand-600/70 bg-brand-50/40 dark:bg-brand-950/20" : ""
        }`}
      >
        {/* Step Index or Alternate Star */}
        <div
          className={`w-7 h-7 rounded-full text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-1.5 tabular-nums shadow-xs ${
            checked ? "opacity-100" : "opacity-50"
          }`}
          style={{ backgroundColor: typeMeta.color }}
        >
          {stepNumber !== null ? stepNumber : "★"}
        </div>

        {/* Venue Card */}
        <article
          className={`flex-1 min-w-0 rounded-2xl p-3.5 sm:p-4 border transition-all ${
            checked
              ? "bg-white dark:bg-slate-900 border-brand-600/35 dark:border-brand-400/35 shadow-xs"
              : "bg-sand-50/80 dark:bg-slate-900/40 border-sand-200 dark:border-slate-800 hover:border-sand-200/90"
          }`}
        >
          {/* Quiet single-line unboxed metadata + Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs min-w-0">
              {showReorderControls && (
                <GripVertical
                  className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className={`inline-flex items-center gap-1 font-semibold ${typeMeta.textClass}`}>
                <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{isVirtualBase ? "Day Base Hotel" : typeMeta.label}</span>
              </span>
              {item.diet !== "none" && (
                <>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  {renderDietText(item.diet)}
                </>
              )}
              {item.custom && (
                <>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="font-medium text-brand-700 dark:text-brand-400">Added</span>
                </>
              )}
            </div>

            {!isVirtualBase && (
              <div className="flex items-center gap-1.5 shrink-0">
                {showReorderControls && coreIdx !== null && (
                  <div className="flex items-center gap-1 mr-0.5">
                    <button
                      type="button"
                      disabled={coreIdx <= minReorderIdx}
                      onClick={() => moveCoreStop(coreIdx, coreIdx - 1)}
                      aria-label={`Move ${displayName} earlier`}
                      className="min-w-[34px] min-h-[34px] rounded-xl border border-sand-200 dark:border-slate-700 bg-sand-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-35 hover:border-brand-600/50 flex items-center justify-center transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={coreIdx === coreStops.length - 1}
                      onClick={() => moveCoreStop(coreIdx, coreIdx + 1)}
                      aria-label={`Move ${displayName} later`}
                      className="min-w-[34px] min-h-[34px] rounded-xl border border-sand-200 dark:border-slate-700 bg-sand-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-35 hover:border-brand-600/50 flex items-center justify-center transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteStop(safeDayIdx, item.id)}
                  aria-label={`Remove ${displayName}`}
                  className="min-w-[34px] min-h-[34px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleShortlist(item.id)}
                  aria-pressed={checked}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition-colors active:scale-[0.97] ${
                    checked
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-sand-200 dark:border-slate-700 hover:border-brand-600/50"
                  }`}
                >
                  {checked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{checked ? "Picked" : "Pick"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Headline + Offline Maps Link */}
          <div className="flex items-baseline justify-between gap-3 mt-1.5">
            <h4 className="font-display font-bold text-base text-slate-900 dark:text-white leading-snug">
              {displayName}
            </h4>
            <a
              href={getStopMapsUrl(item, displayQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline whitespace-nowrap"
            >
              <span>Offline Map</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
        </article>
      </div>
    );
  };

  if (!dayObj) return null;

  const visibleCoreCount = coreStops.filter(matchesFilter).length;
  const visibleAltFoodCount = altFood.filter(matchesFilter).length;
  const visibleAltPartyCount = altParty.filter(matchesFilter).length;

  const routeItemsToLaunch = shortlistedToday.length ? shortlistedToday : coreStops;
  const sortedHotelStays = [...(hotelStays || [])].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  const shortlistPlusVirtual = virtualBaseId ? { ...shortlist, [virtualBaseId]: true } : shortlist;

  const mapAndHotelPanel = (
    <div className="space-y-4">
      <OfflineSvgMap
        destination={destination}
        coreStops={coreStops}
        legs={computedLegs}
        shortlistedAlts={shortlistedAlts}
        shortlist={shortlistPlusVirtual}
        routeItemsToLaunch={routeItemsToLaunch}
        hotelName={resolvedHotel.baseName}
      />

      {/* Per-Day Hotel Check-in / Check-out Manager */}
      <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
              Hotel Stays (Check-in / Check-out)
            </h3>
          </div>
          <button
            type="button"
            onClick={openAddStayForToday}
            className="min-h-[34px] px-2.5 py-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddStayForm ? "Close" : "Add Hotel"}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Enter check-in &amp; check-out dates for each hotel — every itinerary day automatically adopts the matching
          hotel as its base.
        </p>

        {showAddStayForm && (
          <form
            onSubmit={handleSaveStay}
            className="p-3 rounded-2xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 space-y-2"
          >
            <input
              type="text"
              required
              value={newStayName}
              onChange={(e) => setNewStayName(e.target.value)}
              placeholder="Hotel / Airbnb name (e.g. Granbell Hotel)"
              aria-label="New hotel name"
              className="w-full min-h-[38px] px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                  Check-in Date
                </label>
                <input
                  type="date"
                  required
                  value={newStayCheckIn}
                  onChange={(e) => setNewStayCheckIn(e.target.value)}
                  className="w-full min-h-[36px] px-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                  Check-out Date
                </label>
                <input
                  type="date"
                  required
                  value={newStayCheckOut}
                  onChange={(e) => setNewStayCheckOut(e.target.value)}
                  className="w-full min-h-[36px] px-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full min-h-[38px] rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
            >
              Save Hotel Stay
            </button>
          </form>
        )}

        <div className="space-y-2">
          {sortedHotelStays.map((stay) => {
            const coversToday =
              dayDateStr >= stay.checkInDate &&
              (dayDateStr < stay.checkOutDate || dayDateStr === stay.checkOutDate);
            return (
              <div
                key={stay.id}
                className={`p-2.5 rounded-2xl border space-y-2 transition-colors ${
                  coversToday
                    ? "bg-brand-50/60 dark:bg-brand-950/35 border-brand-600/50"
                    : "bg-sand-50 dark:bg-slate-950 border-sand-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={stay.name}
                    onChange={(e) =>
                      onUpdateHotelStay(stay.id, {
                        name: e.target.value,
                        query: `${e.target.value} ${destination}`.trim()
                      })
                    }
                    aria-label="Hotel stay name"
                    className="flex-1 min-w-0 min-h-[34px] px-2.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  {sortedHotelStays.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteHotelStay(stay.id)}
                      aria-label={`Remove ${stay.name}`}
                      className="min-w-[30px] min-h-[30px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                      Check-in
                    </span>
                    <input
                      type="date"
                      value={stay.checkInDate}
                      onChange={(e) => onUpdateHotelStay(stay.id, { checkInDate: e.target.value })}
                      aria-label={`${stay.name} check-in date`}
                      className="w-full min-h-[32px] px-2 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                      Check-out
                    </span>
                    <input
                      type="date"
                      value={stay.checkOutDate}
                      onChange={(e) => onUpdateHotelStay(stay.id, { checkOutDate: e.target.value })}
                      aria-label={`${stay.name} check-out date`}
                      className="w-full min-h-[32px] px-2 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Horizontal Day Selector + Add Day */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {trip.days.map((d, i) => {
          const active = i === safeDayIdx;
          const dayAll = getOrderedDayStops(d, dayOrder[i]).allItems;
          const pickedCount = dayAll.filter((x) => !!shortlist[x.id]).length;
          return (
            <button
              key={`${d.code}_${i}`}
              type="button"
              onClick={() => onSelectDay(i)}
              className={`shrink-0 min-h-[50px] px-4 py-2 rounded-2xl border text-left transition-all active:scale-[0.98] whitespace-nowrap ${
                active
                  ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-sand-200 dark:border-slate-800 hover:border-brand-600/40"
              }`}
            >
              <div className="text-xs font-display font-bold tracking-tight">{d.code}</div>
              <div
                className={`text-[11px] tabular-nums mt-0.5 ${
                  active ? "text-brand-100" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {d.shortDate} · {pickedCount} picked
              </div>
            </button>
          );
        })}

        {trip.days.length < 14 && (
          <button
            type="button"
            onClick={onAddDay}
            aria-label="Add another day"
            className="shrink-0 min-h-[50px] px-3.5 py-2 rounded-2xl border border-dashed border-sand-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-brand-600 hover:text-brand-700 dark:hover:text-brand-400 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Add Day</span>
          </button>
        )}
      </div>

      {/* Day Header & Segmented Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2
              className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white"
              style={{ textWrap: "balance" }}
            >
              {dayObj.title}
            </h2>
            {computedLegs.length > 0 && (
              <span className="text-sm font-semibold tabular-nums text-brand-700 dark:text-brand-400">
                ~{totalKm} km · {formatDuration(totalMin)} drive
              </span>
            )}
            {trip.days.length > 1 && (
              <button
                type="button"
                onClick={() => onDeleteDay(safeDayIdx)}
                className="text-xs font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Remove day
              </button>
            )}
          </div>

          <input
            type="text"
            value={dayObj.summary}
            onChange={(e) => onChangeDaySummary(safeDayIdx, e.target.value)}
            aria-label="Day summary"
            className="w-full max-w-2xl mt-1 bg-transparent text-sm text-slate-600 dark:text-slate-300 border-b border-transparent hover:border-sand-200 dark:hover:border-slate-700 focus:border-brand-600 focus:outline-none py-0.5 transition-colors"
          />

          {/* Resolved Daily Base Hotel + Quick Voice Translator */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <a
              href={gmapsPlaceUrl(`${resolvedHotel.baseQuery} ${destination}`.trim())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              <span>{resolvedHotel.summaryText}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>

            <button
              type="button"
              onClick={() => setShowTranslateModal(true)}
              className="inline-flex items-center gap-1 font-bold text-brand-700 dark:text-brand-400 hover:underline"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Voice Translate ({destination.split(",")[0].trim()})</span>
            </button>
          </div>
        </div>

        {/* Interactive Segmented Filter Control */}
        <div
          role="group"
          aria-label="Filter day stops"
          className="inline-grid grid-cols-3 gap-1 p-1 rounded-2xl bg-sand-100 dark:bg-slate-800/90 border border-sand-200 dark:border-slate-700 shrink-0"
        >
          <button
            type="button"
            onClick={() => onChangeFilter("all")}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeFilter("shortlisted")}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === "shortlisted"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Picked ({shortlistedToday.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeFilter("veg")}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === "veg"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            100% Veg ({vegCountToday})
          </button>
        </div>
      </div>

      {/* Responsive 2-Column Workspace */}
      <motion.div
        key={`${trip.id}_${safeDayIdx}`}
        initial={{ opacity: 0.6, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      >
        {/* Mobile-first Map placement (<lg) */}
        <div className="lg:hidden">{mapAndHotelPanel}</div>

        {/* Left / Main Timeline Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Core Route Section */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Core Route &amp; Must-Do Stops
                </h3>
                {isReordering && (
                  <p className="text-[11px] text-brand-700 dark:text-brand-400 font-medium mt-0.5">
                    Drag cards or tap ↑ / ↓ arrows to rearrange order
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {hasCustomOrder && (
                  <button
                    type="button"
                    onClick={() => onResetDayOrder(safeDayIdx)}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl border border-sand-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                    title="Restore default stop sequence"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                {storedCoreStops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (filter !== "all") onChangeFilter("all");
                      setIsReordering((prev) => !prev);
                    }}
                    aria-pressed={isReordering}
                    className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors whitespace-nowrap ${
                      isReordering
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                        : "bg-sand-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-sand-200 dark:border-slate-700 hover:border-brand-600/40"
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>{isReordering ? "Done" : "Reorder"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAutoSuggestDay(safeDayIdx)}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                  title={`Auto-suggest places for ${destination}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Suggest</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <MapPinPlus className="w-3.5 h-3.5" />
                  <span>Add Place</span>
                </button>
              </div>
            </div>

            {visibleCoreCount > 0 ? (
              <div>
                {coreStops.map((item, idx) => {
                  const leg = computedLegs[idx];
                  const visible = matchesFilter(item);
                  const card = renderVenueCard(item, idx + 1, idx);
                  if (!visible) return null;

                  return (
                    <div key={item.id}>
                      {card}
                      {leg && filter === "all" && (
                        <div className="ml-3.5 pl-6 py-2.5 flex items-center gap-2">
                          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
                          <span className={`text-xs font-semibold tabular-nums ${legSpeedStyle(leg[1]).textClass}`}>
                            Drive ~{leg[0]} km · {formatDuration(leg[1])}
                          </span>
                        </div>
                      )}
                      {leg && filter !== "all" && idx < coreStops.length - 1 && <div className="h-3" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-5 text-center space-y-2.5">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {coreStops.length === 0
                    ? `No places planned for ${dayObj.code} yet.`
                    : "No core stops match the current filter."}
                </p>
                {coreStops.length === 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAutoSuggestDay(safeDayIdx)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Suggest for {destination}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <MapPinPlus className="w-3.5 h-3.5" />
                      <span>Add Place from Google Maps</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Alternate Famous Restaurants & Cafes */}
          {altFood.length > 0 && (visibleAltFoodCount > 0 || filter === "all") && (
            <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Alternate Restaurants &amp; Cafes
                </h3>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  Food Ideas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                Tap Pick on any spot to include it in your shortlisted route and map preview.
              </p>
              <div className="space-y-3">{altFood.map((item) => renderVenueCard(item, null, null))}</div>
            </section>
          )}

          {/* Famous Nightlife & Party Pubs */}
          {altParty.length > 0 && (visibleAltPartyCount > 0 || filter === "all") && (
            <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Nightlife &amp; Evening Bars
                </h3>
                <span className="text-xs font-medium text-purple-700 dark:text-purple-400 whitespace-nowrap">
                  {dayObj.shortDate} Night
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                Evening hangout spots for {dayObj.shortDate} — pick your favourites to shortlist.
              </p>
              <div className="space-y-3">{altParty.map((item) => renderVenueCard(item, null, null))}</div>
            </section>
          )}

          {/* Day Notes Card */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="dayNotesInput" className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Notes &amp; Bookings · {dayObj.code}
              </label>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Auto-saved</span>
            </div>
            <textarea
              id="dayNotesInput"
              rows={3}
              value={notes[safeDayIdx] || ""}
              onChange={(e) => onChangeNote(safeDayIdx, e.target.value)}
              placeholder="Add reservation times, transit notes, ticket codes, or local contacts..."
              className="w-full p-3.5 rounded-2xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600 resize-y"
            />
          </section>
        </div>

        {/* Desktop Sticky Right Column */}
        <aside className="hidden lg:block lg:col-span-5 lg:sticky lg:top-20">{mapAndHotelPanel}</aside>
      </motion.div>

      {/* Add Place Modal */}
      {showAddModal && (
        <AddPlaceModal
          selectedDay={safeDayIdx}
          dayPlan={dayObj}
          destination={destination}
          existingIds={existingIds}
          existingNames={existingNames}
          onAddStop={onAddStop}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Quick Voice Translator Modal */}
      {showTranslateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Google Translate with Voice Mic"
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowTranslateModal(false)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-sand-50 dark:bg-slate-950 p-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setShowTranslateModal(false)}
                aria-label="Close voice translator"
                className="min-w-[36px] min-h-[36px] rounded-xl bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <VoiceTranslatorCard destination={destination} baseHotel={resolvedHotel.baseName} />
          </div>
        </div>
      )}
    </div>
  );
}
