import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  CheckSquare,
  CreditCard,
  Globe2,
  Map as MapIcon,
  Monitor,
  Moon,
  Plane,
  Sun
} from "lucide-react";
import type {
  ChecklistItem,
  ExpenseItem,
  GalleryPhoto,
  HotelStay,
  ItineraryFilter,
  StopItem,
  TabId,
  ThemeMode,
  TripCurrencyConfig,
  TripFlight,
  TripMilestone,
  TripPhrase,
  TripPlan,
  TripollaExportPayload
} from "./types/trip";
import {
  buildDayLabels,
  convertToHomeCurrency,
  createNewTripPlan,
  createSriLankaTripPlan,
  formatTripDateRange,
  migrateLegacyStorage,
  suggestCurrencyConfig
} from "./data/tripBuilder";
import { generateSuggestionsForDay, getDayDateString } from "./data/destinationSuggestions";
import { copyToClipboard, store } from "./utils/storage";
import { downloadOfflineTripHtml } from "./utils/offlineExport";
import {
  collectUpcomingEvents,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleBackgroundTriggers,
  showEventNotification
} from "./utils/notifications";
import { TripCountdownHero } from "./components/TripCountdownHero";
import { ItineraryTab, getOrderedDayStops } from "./components/ItineraryTab";
import { FlightsTab } from "./components/FlightsTab";
import { ExpensesTab } from "./components/ExpensesTab";
import { GalleryTab } from "./components/GalleryTab";
import { ChecklistTab } from "./components/ChecklistTab";
import { TripManagerModal } from "./components/TripManagerModal";
import { OfflineIndicator } from "./components/OfflineIndicator";

function normalizeTripPlan(t: TripPlan): TripPlan {
  const startDate = t.startDate || new Date().toISOString().slice(0, 10);
  const endDate = getDayDateString(startDate, Math.max(0, (t.days?.length || 1) - 1)) || startDate;
  const hotelStays: HotelStay[] =
    Array.isArray(t.hotelStays) && t.hotelStays.length > 0
      ? t.hotelStays
      : [
          {
            id: `${t.id}_h_default`,
            name: t.hotelName || "Primary Stay",
            query: `${t.hotelName || "Primary Stay"} ${t.destination || ""}`.trim(),
            checkInDate: startDate,
            checkOutDate: endDate
          }
        ];

  const flights: TripFlight[] = Array.isArray(t.flights)
    ? t.flights.map((f) => ({
        ...f,
        travelDate: f.travelDate || startDate,
        travelerNames: Array.isArray(f.travelerNames) ? f.travelerNames : []
      }))
    : [];

  const members =
    Array.isArray(t.members) && t.members.length > 0 ? t.members : ["Traveler 1", "Traveler 2"];

  return {
    ...t,
    startDate,
    hotelStays,
    flights,
    members,
    travelersLabel: t.travelersLabel || members.join(", ")
  };
}

function loadInitialStore(): {
  trips: TripPlan[];
  activeTripId: string;
  gallery: GalleryPhoto[];
} {
  const savedTrips = store.get<TripPlan[] | null>("trips", null);
  const savedActiveId = store.get<string | null>("active_trip_id", null);
  const savedGallery = store.get<GalleryPhoto[]>("gallery", []);

  if (Array.isArray(savedTrips) && savedTrips.length > 0) {
    const normalizedTrips = savedTrips.map(normalizeTripPlan);
    const active = normalizedTrips.find((t) => t.id === savedActiveId) ?? normalizedTrips[0];
    return { trips: normalizedTrips, activeTripId: active.id, gallery: savedGallery };
  }

  const migrated = migrateLegacyStorage();
  if (migrated) {
    const normalized = migrated.trips.map(normalizeTripPlan);
    store.set("trips", normalized);
    store.set("active_trip_id", migrated.activeTripId);
    if (migrated.gallery.length > 0) {
      store.set("gallery", migrated.gallery);
    }
    return { ...migrated, trips: normalized };
  }

  const starter = createSriLankaTripPlan();
  store.set("trips", [starter]);
  store.set("active_trip_id", starter.id);
  return { trips: [starter], activeTripId: starter.id, gallery: [] };
}

export default function App() {
  const initialData = useMemo(() => loadInitialStore(), []);

  const [trips, setTrips] = useState<TripPlan[]>(initialData.trips);
  const [activeTripId, setActiveTripId] = useState<string>(initialData.activeTripId);
  const [gallery, setGallery] = useState<GalleryPhoto[]>(initialData.gallery);

  const [tab, setTab] = useState<TabId>("plan");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [itineraryFilter, setItineraryFilter] = useState<ItineraryFilter>("all");
  const [theme, setTheme] = useState<ThemeMode>(() => store.get<ThemeMode>("theme", "system"));
  const [tripModalMode, setTripModalMode] = useState<"switch" | "create" | "edit" | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    store.get<boolean>("notify_enabled", false)
  );
  const [notifyLeadMinutes, setNotifyLeadMinutes] = useState<number>(() =>
    store.get<number>("notify_lead_mins", 60)
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    () => getNotificationPermission()
  );
  const notifiedIdsRef = useRef<Set<string>>(new Set(store.get<string[]>("notified_ids", [])));

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === activeTripId) ?? trips[0],
    [trips, activeTripId]
  );

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2600);
  }, []);

  const updateActiveTrip = useCallback(
    (updater: (prev: TripPlan) => TripPlan) => {
      setTrips((prevTrips) => {
        const nextTrips = prevTrips.map((t) => (t.id === activeTrip.id ? updater(t) : t));
        store.set("trips", nextTrips);
        return nextTrips;
      });
    },
    [activeTrip.id]
  );

  // Theme application
  useEffect(() => {
    const apply = () => {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = theme === "dark" || (theme === "system" && prefersDark);
      document.documentElement.classList.toggle("dark", isDark);
    };
    apply();

    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (theme === "system") apply();
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme]);

  const cycleTheme = () => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    store.set("theme", next);
  };

  // Upcoming event notifications (polling + background TimestampTrigger when supported)
  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (!notificationsEnabled || notificationPermission !== "granted") return;

    const events = collectUpcomingEvents(activeTrip);
    void scheduleBackgroundTriggers(events, notifyLeadMinutes);

    const checkUpcoming = () => {
      const now = Date.now();
      const leadMs = Math.max(1, notifyLeadMinutes) * 60000;
      let updated = false;

      for (const ev of events) {
        const diff = ev.eventTimeMs - now;
        if (diff > 0 && diff <= leadMs && !notifiedIdsRef.current.has(ev.id)) {
          notifiedIdsRef.current.add(ev.id);
          updated = true;
          void showEventNotification(ev.title, ev.body, ev.id);
          showToast(`Reminder: ${ev.title}`);
        }
      }

      if (updated) {
        store.set("notified_ids", Array.from(notifiedIdsRef.current).slice(-100));
      }
    };

    checkUpcoming();
    const timer = window.setInterval(checkUpcoming, 20000);
    return () => window.clearInterval(timer);
  }, [activeTrip, notificationsEnabled, notificationPermission, notifyLeadMinutes, showToast]);

  const handleToggleNotifications = async () => {
    if (notificationsEnabled && notificationPermission === "granted") {
      setNotificationsEnabled(false);
      store.set("notify_enabled", false);
      showToast("Upcoming event notifications paused");
      return;
    }

    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);

    if (perm === "granted") {
      setNotificationsEnabled(true);
      store.set("notify_enabled", true);
      const events = collectUpcomingEvents(activeTrip);
      const scheduled = await scheduleBackgroundTriggers(events, notifyLeadMinutes);
      showToast(
        scheduled > 0
          ? `Event alerts enabled (${scheduled} scheduled)`
          : "Upcoming event notifications enabled"
      );
    } else if (perm === "denied") {
      setNotificationsEnabled(false);
      store.set("notify_enabled", false);
      showToast("Notifications blocked — enable them in browser/app permissions");
    } else {
      showToast("Notifications require permission in your browser or installed app");
    }
  };

  const handleChangeNotifyLeadMinutes = (mins: number) => {
    setNotifyLeadMinutes(mins);
    store.set("notify_lead_mins", mins);
    if (notificationsEnabled && notificationPermission === "granted") {
      const events = collectUpcomingEvents(activeTrip);
      void scheduleBackgroundTriggers(events, mins);
    }
    showToast(`Alert lead time set to ${mins >= 60 ? `${mins / 60}h` : `${mins}m`} before events`);
  };

  const handleSendTestNotification = async () => {
    let perm = getNotificationPermission();
    if (perm === "default") {
      perm = await requestNotificationPermission();
      setNotificationPermission(perm);
    }
    if (perm !== "granted") {
      showToast(
        perm === "denied"
          ? "Notifications blocked — allow permission in browser/app settings"
          : "Notifications unsupported in this view — install app or open in Chrome"
      );
      return;
    }
    const events = collectUpcomingEvents(activeTrip);
    const nextEv = events.find((e) => e.eventTimeMs > Date.now());
    const sent = await showEventNotification(
      nextEv ? `Tripolla Alert: ${nextEv.title}` : `Tripolla · ${activeTrip.name}`,
      nextEv
        ? nextEv.body
        : `Event notifications are active for your ${activeTrip.destination} trip.`,
      "tripolla-test"
    );
    showToast(sent ? "Test notification sent" : "Could not display notification");
  };

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    showToast(ok ? label : "Could not copy automatically");
  };

  // Trip switching, creation, editing, deletion
  const handleSelectTrip = (tripId: string) => {
    setActiveTripId(tripId);
    store.set("active_trip_id", tripId);
    setSelectedDay(0);
    setItineraryFilter("all");
    const target = trips.find((t) => t.id === tripId);
    if (target) showToast(`Switched to ${target.name}`);
  };

  const handleCreateTrip = (opts: {
    templateId: string;
    name: string;
    destination: string;
    travelersLabel: string;
    startDate: string;
    departureTime: string;
    daysCount: number;
    hotelName: string;
    homeCurrency: string;
    localCurrency: string;
    members: string[];
    flights?: Omit<TripFlight, "id">[];
  }) => {
    const created = createNewTripPlan(opts);
    setTrips((prev) => {
      const next = [created, ...prev];
      store.set("trips", next);
      return next;
    });
    setActiveTripId(created.id);
    store.set("active_trip_id", created.id);
    setSelectedDay(0);
    setItineraryFilter("all");
    showToast(`Created "${created.name}" with suggested itinerary`);
  };

  const handleUpdateActiveTripSettings = (updates: {
    name: string;
    destination: string;
    travelersLabel: string;
    startDate: string;
    departureTime: string;
    hotelName: string;
    homeCurrency: string;
    localCurrency: string;
    members: string[];
  }) => {
    updateActiveTrip((prev) => {
      const startChanged = updates.startDate !== prev.startDate;
      const nextDays = startChanged
        ? prev.days.map((d, idx) => {
            const labels = buildDayLabels(updates.startDate, idx);
            return { ...d, code: labels.code, shortDate: labels.shortDate, title: labels.title };
          })
        : prev.days;

      const curChanged =
        updates.homeCurrency !== prev.currency.home || updates.localCurrency !== prev.currency.local;
      const nextCurrency = curChanged
        ? suggestCurrencyConfig(updates.homeCurrency, updates.localCurrency)
        : prev.currency;

      return {
        ...prev,
        name: updates.name,
        destination: updates.destination,
        travelersLabel: updates.travelersLabel,
        startDate: updates.startDate,
        departureTime: updates.departureTime,
        hotelName: updates.hotelName,
        members: updates.members,
        days: nextDays,
        currency: nextCurrency
      };
    });
    showToast("Trip settings updated");
  };

  const handleDeleteTrip = (tripId: string) => {
    if (trips.length <= 1) return;
    const remaining = trips.filter((t) => t.id !== tripId);
    setTrips(remaining);
    store.set("trips", remaining);

    if (activeTripId === tripId) {
      const nextActive = remaining[0];
      setActiveTripId(nextActive.id);
      store.set("active_trip_id", nextActive.id);
      setSelectedDay(0);
    }
    setGallery((prev) => {
      const cleaned = prev.filter((p) => p.tripId !== tripId);
      store.set("gallery", cleaned);
      return cleaned;
    });
    showToast("Trip deleted");
  };

  // Itinerary handlers
  const handleToggleShortlist = (id: string) => {
    const nextVal = !activeTrip.shortlist[id];
    updateActiveTrip((prev) => ({
      ...prev,
      shortlist: { ...prev.shortlist, [id]: nextVal }
    }));
    showToast(nextVal ? "Added to shortlist" : "Removed from shortlist");
  };

  const handleAddHotelStay = (stay: Omit<HotelStay, "id">) => {
    const newStay: HotelStay = { ...stay, id: `stay_${Date.now().toString(36)}` };
    updateActiveTrip((prev) => ({
      ...prev,
      hotelName: prev.hotelStays.length === 0 ? newStay.name : prev.hotelName,
      hotelStays: [...prev.hotelStays, newStay]
    }));
    showToast(`Added stay: ${newStay.name}`);
  };

  const handleUpdateHotelStay = (id: string, updates: Partial<HotelStay>) => {
    updateActiveTrip((prev) => {
      const nextStays = prev.hotelStays.map((s) => (s.id === id ? { ...s, ...updates } : s));
      return {
        ...prev,
        hotelName: nextStays[0]?.name || prev.hotelName,
        hotelStays: nextStays
      };
    });
  };

  const handleDeleteHotelStay = (id: string) => {
    updateActiveTrip((prev) => {
      if (prev.hotelStays.length <= 1) return prev;
      const nextStays = prev.hotelStays.filter((s) => s.id !== id);
      return {
        ...prev,
        hotelName: nextStays[0]?.name || prev.hotelName,
        hotelStays: nextStays
      };
    });
    showToast("Hotel stay removed");
  };

  const handleAutoSuggestDay = (dayIdx: number) => {
    const day = activeTrip.days[dayIdx];
    if (!day) return;
    const existingNames = new Set(day.items.map((x) => x.name.toLowerCase()));
    const suggested = generateSuggestionsForDay(
      activeTrip.destination,
      dayIdx,
      activeTrip.days.length
    ).filter((s) => !existingNames.has(s.name.toLowerCase()));

    if (suggested.length === 0) {
      showToast(`All suggested highlights for ${activeTrip.destination} are already on this day`);
      return;
    }

    updateActiveTrip((prev) => {
      const nextShortlist = { ...prev.shortlist };
      suggested.forEach((s) => {
        nextShortlist[s.id] = true;
      });
      const updatedDays = prev.days.map((d, idx) =>
        idx === dayIdx ? { ...d, items: [...d.items, ...suggested] } : d
      );
      const existingOrder = prev.dayOrder[dayIdx];
      const nextOrder = existingOrder
        ? { ...prev.dayOrder, [dayIdx]: [...existingOrder, ...suggested.map((s) => s.id)] }
        : prev.dayOrder;

      return {
        ...prev,
        days: updatedDays,
        shortlist: nextShortlist,
        dayOrder: nextOrder
      };
    });
    showToast(`Added ${suggested.length} suggestions for ${activeTrip.destination}`);
  };

  const handleChangeNote = (dayIdx: number, text: string) => {
    updateActiveTrip((prev) => ({
      ...prev,
      notes: { ...prev.notes, [dayIdx]: text }
    }));
  };

  const handleChangeDaySummary = (dayIdx: number, summary: string) => {
    updateActiveTrip((prev) => ({
      ...prev,
      days: prev.days.map((d, i) => (i === dayIdx ? { ...d, summary } : d))
    }));
  };

  const handleAddDay = () => {
    if (activeTrip.days.length >= 14) return;
    const newIdx = activeTrip.days.length;
    const labels = buildDayLabels(activeTrip.startDate, newIdx);
    const suggested = generateSuggestionsForDay(activeTrip.destination, newIdx, newIdx + 1);

    updateActiveTrip((prev) => {
      const nextShortlist = { ...prev.shortlist };
      suggested.forEach((s) => {
        nextShortlist[s.id] = true;
      });
      return {
        ...prev,
        shortlist: nextShortlist,
        days: [
          ...prev.days,
          {
            code: labels.code,
            shortDate: labels.shortDate,
            title: labels.title,
            summary: `Suggested ${prev.destination} highlights — customize, reorder, or add Google Maps spots`,
            legs: [],
            items: suggested
          }
        ]
      };
    });
    setSelectedDay(newIdx);
    showToast(`Added ${labels.code} with suggestions`);
  };

  const handleDeleteDay = (dayIdx: number) => {
    if (activeTrip.days.length <= 1) return;
    updateActiveTrip((prev) => {
      const remaining = prev.days.filter((_, i) => i !== dayIdx);
      const reindexedDays = remaining.map((d, idx) => {
        const labels = buildDayLabels(prev.startDate, idx);
        return { ...d, code: labels.code, shortDate: labels.shortDate, title: labels.title };
      });
      return { ...prev, days: reindexedDays, dayOrder: {}, notes: {} };
    });
    setSelectedDay((prev) => Math.max(0, Math.min(prev, activeTrip.days.length - 2)));
    showToast("Day removed");
  };

  const handleAddStop = (dayIdx: number, stop: StopItem) => {
    updateActiveTrip((prev) => {
      const day = prev.days[dayIdx];
      if (!day) return prev;
      const updatedDays = prev.days.map((d, idx) =>
        idx === dayIdx ? { ...d, items: [...d.items, stop] } : d
      );

      let nextDayOrder = prev.dayOrder;
      if (stop.tier === "core") {
        const currentCore = getOrderedDayStops(day, prev.dayOrder[dayIdx]).coreStops;
        const currentIds = currentCore.map((item) => item.id);
        const last = currentCore[currentCore.length - 1];
        const insertBeforeLast =
          last &&
          (last.name.toLowerCase().includes("return to somar") ||
            last.name.toLowerCase().includes("check-out") ||
            last.name.toLowerCase().includes("airport"));
        const nextIds = insertBeforeLast
          ? [...currentIds.slice(0, -1), stop.id, currentIds[currentIds.length - 1]]
          : [...currentIds, stop.id];
        nextDayOrder = { ...prev.dayOrder, [dayIdx]: nextIds };
      }

      return {
        ...prev,
        days: updatedDays,
        shortlist: { ...prev.shortlist, [stop.id]: true },
        dayOrder: nextDayOrder
      };
    });
    showToast(`Added "${stop.name}"`);
  };

  const handleDeleteStop = (dayIdx: number, id: string) => {
    updateActiveTrip((prev) => {
      const updatedDays = prev.days.map((d, idx) =>
        idx === dayIdx ? { ...d, items: d.items.filter((x) => x.id !== id) } : d
      );
      const nextShortlist = { ...prev.shortlist };
      delete nextShortlist[id];
      const nextOrder = prev.dayOrder[dayIdx]
        ? { ...prev.dayOrder, [dayIdx]: prev.dayOrder[dayIdx].filter((x) => x !== id) }
        : prev.dayOrder;
      return {
        ...prev,
        days: updatedDays,
        shortlist: nextShortlist,
        dayOrder: nextOrder
      };
    });
    showToast("Place removed");
  };

  const handleUpdateDayOrder = (dayIdx: number, orderedIds: string[]) => {
    updateActiveTrip((prev) => ({
      ...prev,
      dayOrder: { ...prev.dayOrder, [dayIdx]: orderedIds }
    }));
  };

  const handleResetDayOrder = (dayIdx: number) => {
    updateActiveTrip((prev) => {
      const nextOrder = { ...prev.dayOrder };
      delete nextOrder[dayIdx];
      return { ...prev, dayOrder: nextOrder };
    });
    showToast("Restored default stop order");
  };

  // Flights & Milestones handlers
  const handleAddFlight = (flight: Omit<TripFlight, "id">) => {
    const item: TripFlight = { ...flight, id: `fl_${Date.now()}` };
    updateActiveTrip((prev) => ({ ...prev, flights: [...prev.flights, item] }));
    showToast(`Added ${item.flightNo}`);
  };

  const handleUpdateFlight = (id: string, updates: Partial<TripFlight>) => {
    updateActiveTrip((prev) => ({
      ...prev,
      flights: prev.flights.map((f) => (f.id === id ? { ...f, ...updates } : f))
    }));
  };

  const handleDeleteFlight = (id: string) => {
    updateActiveTrip((prev) => ({
      ...prev,
      flights: prev.flights.filter((f) => f.id !== id)
    }));
    showToast("Flight removed");
  };

  const handleAddMilestone = (ms: Omit<TripMilestone, "id">) => {
    const item: TripMilestone = { ...ms, id: `ms_${Date.now()}` };
    updateActiveTrip((prev) => ({ ...prev, milestones: [...prev.milestones, item] }));
    showToast("Milestone added");
  };

  const handleDeleteMilestone = (id: string) => {
    updateActiveTrip((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id)
    }));
  };

  // Expenses handlers
  const handleChangeCurrencyConfig = (next: TripCurrencyConfig) => {
    updateActiveTrip((prev) => ({ ...prev, currency: next }));
  };

  const handleChangeMembers = (members: string[]) => {
    updateActiveTrip((prev) => ({
      ...prev,
      members,
      travelersLabel: members.filter(Boolean).join(", ") || prev.travelersLabel
    }));
  };

  const handleAddExpense = (item: Omit<ExpenseItem, "id">) => {
    const newItem: ExpenseItem = { ...item, id: `exp_${Date.now()}` };
    updateActiveTrip((prev) => ({ ...prev, expenses: [newItem, ...prev.expenses] }));
    const homeVal = convertToHomeCurrency(item.amt, item.cur, activeTrip.currency);
    showToast(`Added ${item.cur} ${item.amt} (≈ ${activeTrip.currency.home} ${Math.round(homeVal)})`);
  };

  const handleDeleteExpense = (id: string) => {
    updateActiveTrip((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((x) => x.id !== id)
    }));
    showToast("Expense removed");
  };

  // Checklist & Phrase handlers
  const handleToggleChecklist = (id: string) => {
    updateActiveTrip((prev) => ({
      ...prev,
      checklist: prev.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    }));
  };

  const handleAddChecklistItem = (text: string) => {
    const newItem: ChecklistItem = {
      id: `c_${Date.now()}`,
      cat: "Custom",
      text,
      done: false,
      custom: true
    };
    updateActiveTrip((prev) => ({ ...prev, checklist: [...prev.checklist, newItem] }));
    showToast("Added to checklist");
  };

  const handleDeleteChecklistItem = (id: string) => {
    updateActiveTrip((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((c) => c.id !== id)
    }));
  };

  const handleAddPhrase = (phrase: Omit<TripPhrase, "id">) => {
    const item: TripPhrase = { ...phrase, id: `ph_${Date.now()}` };
    updateActiveTrip((prev) => ({ ...prev, phrases: [...prev.phrases, item] }));
    showToast("Phrase added");
  };

  const handleDeletePhrase = (id: string) => {
    updateActiveTrip((prev) => ({
      ...prev,
      phrases: prev.phrases.filter((p) => p.id !== id)
    }));
  };

  // Gallery scoped to activeTrip
  const activeGallery = useMemo(
    () => gallery.filter((p) => !p.tripId || p.tripId === activeTrip.id),
    [gallery, activeTrip.id]
  );

  const handleAddGalleryPhotos = (newPhotos: GalleryPhoto[]): boolean => {
    const updated = [...newPhotos, ...gallery];
    const ok = store.set("gallery", updated);
    if (!ok) {
      showToast("Browser storage full — delete older photos or export backup first");
      return false;
    }
    setGallery(updated);
    return true;
  };

  const handleUpdateGalleryPhoto = (
    id: string,
    updates: Partial<Pick<GalleryPhoto, "caption" | "dayIndex" | "location">>
  ) => {
    setGallery((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      store.set("gallery", updated);
      return updated;
    });
  };

  const handleDeleteGalleryPhoto = (id: string) => {
    setGallery((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      store.set("gallery", updated);
      return updated;
    });
    showToast("Photo removed");
  };

  // JSON Export & Import
  const handleExportJson = () => {
    const payload: TripollaExportPayload = {
      app: "Tripolla",
      version: 2,
      exportedAt: new Date().toISOString(),
      trip: activeTrip,
      gallery: activeGallery
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = activeTrip.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "tripolla-trip";
    a.download = `tripolla-${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Trip backup JSON downloaded");
  };

  const handleDownloadOfflineHtml = () => {
    downloadOfflineTripHtml(activeTrip, activeGallery);
    showToast("Downloaded standalone offline HTML trip pack");
  };

  const handleImportJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(String(e.target?.result || "{}")) as Partial<TripollaExportPayload> & {
          shortlist?: Record<string, boolean>;
          notes?: Record<number, string>;
          hotelName?: string;
          expenses?: ExpenseItem[];
          checklist?: ChecklistItem[];
          customStops?: Record<number, StopItem[]>;
          dayOrder?: Record<number, string[]>;
        };

        let importedTrip: TripPlan | null = null;
        if (raw.trip && Array.isArray(raw.trip.days)) {
          importedTrip = normalizeTripPlan({
            ...raw.trip,
            id: raw.trip.id || `imp_${Date.now()}`
          });
        } else if (raw.shortlist || raw.expenses || raw.checklist) {
          // Support legacy Sri Lanka JSON export seamlessly
          importedTrip = createSriLankaTripPlan({
            hotelName: raw.hotelName,
            shortlist: raw.shortlist,
            customStops: raw.customStops,
            dayOrder: raw.dayOrder,
            notes: raw.notes,
            expenses: raw.expenses,
            checklist: raw.checklist
          });
          importedTrip.id = `imp_${Date.now()}`;
        }

        if (!importedTrip) {
          showToast("Unrecognized Tripolla backup file");
          return;
        }

        const finalTrip = importedTrip;
        setTrips((prev) => {
          const exists = prev.some((t) => t.id === finalTrip.id);
          const next = exists ? prev.map((t) => (t.id === finalTrip.id ? finalTrip : t)) : [finalTrip, ...prev];
          store.set("trips", next);
          return next;
        });
        setActiveTripId(finalTrip.id);
        store.set("active_trip_id", finalTrip.id);

        if (Array.isArray(raw.gallery) && raw.gallery.length > 0) {
          const tagged = raw.gallery.map((g) => ({ ...g, tripId: finalTrip.id }));
          const mergedGallery = [...tagged, ...gallery.filter((g) => g.tripId !== finalTrip.id)];
          const ok = store.set("gallery", mergedGallery);
          if (ok) {
            setGallery(mergedGallery);
          } else {
            showToast("Trip imported (photos exceeded browser storage)");
            return;
          }
        }
        setSelectedDay(0);
        showToast(`Imported "${finalTrip.name}"`);
      } catch {
        showToast("Invalid backup JSON file");
      }
    };
    reader.readAsText(file);
  };

  const switchTab = (nextTab: TabId) => {
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navItems: { id: TabId; label: string; Icon: typeof MapIcon }[] = [
    { id: "plan", label: "Itinerary", Icon: MapIcon },
    { id: "fly", label: "Flights", Icon: Plane },
    { id: "money", label: "Expenses", Icon: CreditCard },
    { id: "gallery", label: "Gallery", Icon: Camera },
    { id: "tools", label: "Checklist", Icon: CheckSquare }
  ];

  const themeLabel = theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark";

  const totalShortlisted = useMemo(
    () =>
      activeTrip.days.reduce((sum, day, idx) => {
        const { allItems } = getOrderedDayStops(day, activeTrip.dayOrder[idx]);
        return sum + allItems.filter((item) => !!activeTrip.shortlist[item.id]).length;
      }, 0),
    [activeTrip.days, activeTrip.dayOrder, activeTrip.shortlist]
  );

  const totalExpensesHome = useMemo(
    () =>
      activeTrip.expenses.reduce(
        (sum, item) => sum + convertToHomeCurrency(Number(item.amt) || 0, item.cur, activeTrip.currency),
        0
      ),
    [activeTrip.expenses, activeTrip.currency]
  );

  const checklistDone = activeTrip.checklist.filter((c) => c.done).length;
  const checklistTotal = activeTrip.checklist.length;
  const daysUntilDeparture = Math.max(
    0,
    Math.ceil(
      (new Date(`${activeTrip.startDate}T${activeTrip.departureTime || "08:00"}:00`).getTime() - Date.now()) / 86400000
    )
  );

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 dark:bg-[#0f1616] text-slate-900 dark:text-slate-100 pb-20 md:pb-10">
      {/* Top Bar (3-zone on desktop, compact 56px on mobile) */}
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-sand-50/90 dark:bg-[#0f1616]/90 backdrop-blur-md border-b border-sand-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              switchTab("plan");
            }}
            className="font-display font-extrabold text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 inline-flex items-center gap-2"
          >
            <span className="w-6 h-6 rounded-lg bg-brand-600 text-white text-xs font-extrabold flex items-center justify-center">
              T
            </span>
            <span>Tripolla</span>
          </a>

          {/* Zone 2: Desktop Navigation Links */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6">
            {navItems.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchTab(id)}
                  className={`py-2 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    active
                      ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Theme Switcher Action */}
          <button
            type="button"
            onClick={cycleTheme}
            aria-label={`Switch theme (currently ${themeLabel})`}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:border-brand-600/40 active:scale-[0.98] transition-all"
          >
            {theme === "system" && <Monitor className="w-3.5 h-3.5" />}
            {theme === "light" && <Sun className="w-3.5 h-3.5 text-amber-600" />}
            {theme === "dark" && <Moon className="w-3.5 h-3.5 text-brand-400" />}
            <span>{themeLabel}</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
        {tab === "plan" ? (
          <TripCountdownHero
            trip={activeTrip}
            totalShortlisted={totalShortlisted}
            totalExpensesHome={totalExpensesHome}
            checklistDone={checklistDone}
            checklistTotal={checklistTotal}
            onNavigateTab={switchTab}
            onOpenTripManager={(mode) => setTripModalMode(mode)}
            onDownloadOfflineHtml={handleDownloadOfflineHtml}
          />
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{activeTrip.name}</span>
              <span aria-hidden="true">·</span>
              <span>{activeTrip.destination}</span>
              <span aria-hidden="true">·</span>
              <span>{formatTripDateRange(activeTrip.startDate, activeTrip.days.length)}</span>
              {daysUntilDeparture > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-brand-700 dark:text-brand-400 tabular-nums">
                    {daysUntilDeparture} days left
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setTripModalMode("switch")}
              className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline whitespace-nowrap"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Switch / New Trip</span>
            </button>
          </div>
        )}

        {tab === "plan" && (
          <ItineraryTab
            trip={activeTrip}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            filter={itineraryFilter}
            onChangeFilter={setItineraryFilter}
            onToggleShortlist={handleToggleShortlist}
            onAddHotelStay={handleAddHotelStay}
            onUpdateHotelStay={handleUpdateHotelStay}
            onDeleteHotelStay={handleDeleteHotelStay}
            onAutoSuggestDay={handleAutoSuggestDay}
            onChangeNote={handleChangeNote}
            onChangeDaySummary={handleChangeDaySummary}
            onAddDay={handleAddDay}
            onDeleteDay={handleDeleteDay}
            onAddStop={handleAddStop}
            onDeleteStop={handleDeleteStop}
            onUpdateDayOrder={handleUpdateDayOrder}
            onResetDayOrder={handleResetDayOrder}
          />
        )}

        {tab === "fly" && (
          <FlightsTab
            trip={activeTrip}
            notificationsEnabled={notificationsEnabled}
            notificationPermission={notificationPermission}
            notifyLeadMinutes={notifyLeadMinutes}
            onToggleNotifications={handleToggleNotifications}
            onChangeNotifyLeadMinutes={handleChangeNotifyLeadMinutes}
            onSendTestNotification={handleSendTestNotification}
            onAddFlight={handleAddFlight}
            onUpdateFlight={handleUpdateFlight}
            onDeleteFlight={handleDeleteFlight}
            onAddMilestone={handleAddMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onCopy={handleCopy}
          />
        )}

        {tab === "money" && (
          <ExpensesTab
            trip={activeTrip}
            onChangeCurrencyConfig={handleChangeCurrencyConfig}
            onChangeMembers={handleChangeMembers}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onCopy={handleCopy}
            onNotify={showToast}
          />
        )}

        {tab === "gallery" && (
          <GalleryTab
            trip={activeTrip}
            photos={activeGallery}
            onAddPhotos={handleAddGalleryPhotos}
            onUpdatePhoto={handleUpdateGalleryPhoto}
            onDeletePhoto={handleDeleteGalleryPhoto}
            onNotify={showToast}
          />
        )}

        {tab === "tools" && (
          <ChecklistTab
            trip={activeTrip}
            galleryCount={activeGallery.length}
            onToggleChecklist={handleToggleChecklist}
            onAddChecklistItem={handleAddChecklistItem}
            onDeleteChecklistItem={handleDeleteChecklistItem}
            onAddPhrase={handleAddPhrase}
            onDeletePhrase={handleDeletePhrase}
            onJumpToDay={(dayIdx) => {
              setSelectedDay(dayIdx);
              switchTab("plan");
            }}
            onCopy={handleCopy}
            onExportJson={handleExportJson}
            onDownloadOfflineHtml={handleDownloadOfflineHtml}
            onImportJsonFile={handleImportJsonFile}
            onNotify={showToast}
          />
        )}
      </main>

      {/* Trip Switcher / Creator / Editor Modal */}
      {tripModalMode && (
        <TripManagerModal
          mode={tripModalMode}
          trips={trips}
          activeTrip={activeTrip}
          onSelectTrip={handleSelectTrip}
          onCreateTrip={handleCreateTrip}
          onUpdateActiveTrip={handleUpdateActiveTripSettings}
          onDeleteTrip={handleDeleteTrip}
          onClose={() => setTripModalMode(null)}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      <OfflineIndicator />

      {/* Mobile Bottom Navigation Bar (64px height + safe area) */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#141d1d]/95 backdrop-blur-md border-t border-sand-200 dark:border-slate-800"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="grid grid-cols-5 h-16 px-1">
          {navItems.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 transition-colors ${
                  active ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10.5px] font-semibold tracking-tight leading-none whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
