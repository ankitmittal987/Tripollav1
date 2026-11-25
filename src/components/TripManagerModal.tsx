import { useState } from "react";
import { Check, Globe2, Pencil, Plane, Plus, Trash2, Users, X } from "lucide-react";
import type { TripFlight, TripPlan } from "../types/trip";
import {
  DESTINATION_TEMPLATES,
  WORLD_CURRENCIES,
  formatTripDateRange
} from "../data/tripBuilder";

interface DraftFlight {
  travelerName: string;
  travelDate: string;
  airline: string;
  flightNo: string;
  fromCode: string;
  toCode: string;
  depTime: string;
  arrTime: string;
  pnr: string;
}

interface TripManagerModalProps {
  mode: "switch" | "create" | "edit";
  trips: TripPlan[];
  activeTrip: TripPlan;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (opts: {
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
  }) => void;
  onUpdateActiveTrip: (updates: {
    name: string;
    destination: string;
    travelersLabel: string;
    startDate: string;
    departureTime: string;
    hotelName: string;
    homeCurrency: string;
    localCurrency: string;
    members: string[];
  }) => void;
  onDeleteTrip: (tripId: string) => void;
  onClose: () => void;
}

function resizeMembersList(current: string[], nextCount: number): string[] {
  const clamped = Math.min(12, Math.max(1, nextCount));
  const result = current.slice(0, clamped);
  while (result.length < clamped) {
    result.push(`Traveler ${result.length + 1}`);
  }
  return result;
}

export function TripManagerModal({
  mode: initialMode,
  trips,
  activeTrip,
  onSelectTrip,
  onCreateTrip,
  onUpdateActiveTrip,
  onDeleteTrip,
  onClose
}: TripManagerModalProps) {
  const [view, setView] = useState<"switch" | "create" | "edit">(initialMode);

  // Create form state
  const [templateId, setTemplateId] = useState("custom");
  const [newName, setNewName] = useState("");
  const [newDest, setNewDest] = useState("");
  const [newMembers, setNewMembers] = useState<string[]>(["Traveler 1", "Traveler 2"]);
  const [newStartDate, setNewStartDate] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [newDepTime, setNewDepTime] = useState("08:30");
  const [newDaysCount, setNewDaysCount] = useState(5);
  const [newHotel, setNewHotel] = useState("");
  const [newHomeCur, setNewHomeCur] = useState(activeTrip.currency.home || "INR");
  const [newLocalCur, setNewLocalCur] = useState("USD");
  const [draftFlights, setDraftFlights] = useState<DraftFlight[]>([]);

  // Edit active trip state
  const [editName, setEditName] = useState(activeTrip.name);
  const [editDest, setEditDest] = useState(activeTrip.destination);
  const [editMembers, setEditMembers] = useState<string[]>(
    activeTrip.members.length > 0 ? activeTrip.members : ["Traveler 1", "Traveler 2"]
  );
  const [editStartDate, setEditStartDate] = useState(activeTrip.startDate);
  const [editDepTime, setEditDepTime] = useState(activeTrip.departureTime || "08:00");
  const [editHotel, setEditHotel] = useState(activeTrip.hotelName);
  const [editHomeCur, setEditHomeCur] = useState(activeTrip.currency.home);
  const [editLocalCur, setEditLocalCur] = useState(activeTrip.currency.local);

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id);
    if (id === "sri_lanka") {
      setNewName("Sri Lanka Coastal Escape");
      setNewDest("Ahangama & Colombo, Sri Lanka");
      setNewDaysCount(6);
      setNewHotel("Granbell Hotel Colombo");
      setNewLocalCur("LKR");
      return;
    }
    const tpl = DESTINATION_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    if (id === "custom") {
      setNewName("");
      setNewDest("");
      setNewHotel("");
      setNewDaysCount(5);
      setNewLocalCur("USD");
    } else {
      setNewName(tpl.name);
      setNewDest(tpl.destination);
      setNewDaysCount(tpl.daysCount);
      setNewHotel(tpl.hotelName);
      setNewLocalCur(tpl.localCurrency);
    }
  };

  const handleAddDraftFlight = (travelerName: string) => {
    const cleanName = travelerName.trim() || "Traveler";
    setDraftFlights((prev) => [
      ...prev,
      {
        travelerName: cleanName,
        travelDate: newStartDate,
        airline: "",
        flightNo: "",
        fromCode: "",
        toCode: "",
        depTime: newDepTime || "09:00",
        arrTime: "13:00",
        pnr: ""
      }
    ]);
  };

  const handleUpdateDraftFlight = (idx: number, patch: Partial<DraftFlight>) => {
    setDraftFlights((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const handleRemoveDraftFlight = (idx: number) => {
    setDraftFlights((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedMembers = newMembers.map((m, idx) => m.trim() || `Traveler ${idx + 1}`);
    const destLabel = newDest.trim() || "Custom Destination";
    const flightsToCreate: Omit<TripFlight, "id">[] = draftFlights
      .filter((df) => df.flightNo.trim() || df.fromCode.trim() || df.toCode.trim() || df.airline.trim())
      .map((df) => {
        const fromCode = (df.fromCode.trim() || "ORG").toUpperCase();
        const toCode = (df.toCode.trim() || "DST").toUpperCase();
        const flightNo = df.flightNo.trim() || "FLT";
        return {
          header: `${df.travelerName} · ${df.travelDate || newStartDate}`,
          airline: df.airline.trim() || "Airline",
          flightNo,
          fromCode,
          fromCity: fromCode,
          toCode,
          toCity: toCode === "DST" ? destLabel.split(",")[0].trim() : toCode,
          pnr: (df.pnr.trim() || "PENDING").toUpperCase(),
          travelDate: df.travelDate || newStartDate,
          depTime: df.depTime || "09:00",
          arrTime: df.arrTime || "13:00",
          travelerNames: [df.travelerName],
          fr24: flightNo.replace(/\s+/g, "").toLowerCase(),
          fa: "",
          note: `Flight for ${df.travelerName}`
        };
      });

    onCreateTrip({
      templateId,
      name: newName.trim() || `${destLabel} Trip`,
      destination: destLabel,
      travelersLabel: cleanedMembers.join(", "),
      startDate: newStartDate,
      departureTime: newDepTime,
      daysCount: newDaysCount,
      hotelName: newHotel.trim() || "Primary Stay",
      homeCurrency: newHomeCur.trim().toUpperCase() || "INR",
      localCurrency: newLocalCur.trim().toUpperCase() || "USD",
      members: cleanedMembers,
      flights: flightsToCreate.length > 0 ? flightsToCreate : undefined
    });
    onClose();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedMembers = editMembers.map((m, idx) => m.trim() || `Traveler ${idx + 1}`);
    onUpdateActiveTrip({
      name: editName.trim() || activeTrip.name,
      destination: editDest.trim() || activeTrip.destination,
      travelersLabel: cleanedMembers.join(", "),
      startDate: editStartDate || activeTrip.startDate,
      departureTime: editDepTime || "08:00",
      hotelName: editHotel.trim() || activeTrip.hotelName,
      homeCurrency: editHomeCur.trim().toUpperCase() || activeTrip.currency.home,
      localCurrency: editLocalCur.trim().toUpperCase() || activeTrip.currency.local,
      members: cleanedMembers
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tripolla Trip Manager"
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sand-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Globe2 className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white truncate">
                Tripolla Trips
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Plan any destination, travelers, hotels &amp; flights offline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trip manager"
            className="min-w-[38px] min-h-[38px] rounded-xl bg-sand-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sand-200/70 dark:hover:bg-slate-700 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-sand-100 dark:bg-slate-800 border border-sand-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setView("switch")}
              className={`min-h-[38px] rounded-xl text-xs font-bold transition-colors ${
                view === "switch"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              My Trips ({trips.length})
            </button>
            <button
              type="button"
              onClick={() => setView("create")}
              className={`min-h-[38px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors ${
                view === "create"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Trip</span>
            </button>
            <button
              type="button"
              onClick={() => setView("edit")}
              className={`min-h-[38px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors ${
                view === "edit"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <Pencil className="w-3 h-3" />
              <span>Edit Current</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {view === "switch" && (
            <div className="space-y-2.5">
              {trips.map((t) => {
                const isActive = t.id === activeTrip.id;
                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                      isActive
                        ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/30"
                        : "border-sand-200 dark:border-slate-800 bg-sand-50/60 dark:bg-slate-950/60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTrip(t.id);
                        onClose();
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                          {t.name}
                        </span>
                        {isActive && (
                          <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300 inline-flex items-center gap-0.5 shrink-0">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                        {t.destination} · {formatTripDateRange(t.startDate, t.days.length)} ({t.days.length}d)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {t.members.length} travelers ({t.travelersLabel}) · {t.currency.home} / {t.currency.local}
                      </div>
                    </button>

                    {trips.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteTrip(t.id)}
                        aria-label={`Delete trip ${t.name}`}
                        className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setView("create")}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-display font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Plan a New Country / City Trip</span>
              </button>
            </div>
          )}

          {view === "create" && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="tripTplSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Starter Template
                </label>
                <select
                  id="tripTplSelect"
                  value={templateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {DESTINATION_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                  <option value="sri_lanka">Sri Lanka Coastal Escape (6-day South Coast)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="newDestInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Country or City *
                  </label>
                  <input
                    id="newDestInput"
                    type="text"
                    required
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    placeholder="e.g. Tokyo, Japan / Switzerland"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Daily sightseeing &amp; food ideas auto-generate for this destination.
                  </p>
                </div>
                <div>
                  <label htmlFor="newNameInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Trip Title
                  </label>
                  <input
                    id="newNameInput"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Autumn Japan Escape"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="newStartInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Start Date
                  </label>
                  <input
                    id="newStartInput"
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="newTimeInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Departs
                  </label>
                  <input
                    id="newTimeInput"
                    type="time"
                    value={newDepTime}
                    onChange={(e) => setNewDepTime(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="newDaysInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Days (1–14)
                  </label>
                  <input
                    id="newDaysInput"
                    type="number"
                    min={1}
                    max={14}
                    value={newDaysCount}
                    onChange={(e) => setNewDaysCount(Math.min(14, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm font-bold tabular-nums bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newHotelInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  First Hotel / Base Stay (add per-day hotels with check-in/out dates inside Itinerary)
                </label>
                <input
                  id="newHotelInput"
                  type="text"
                  value={newHotel}
                  onChange={(e) => setNewHotel(e.target.value)}
                  placeholder="e.g. Park Hyatt / Airbnb"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Travelers Count + Names + Individual Flights */}
              <div className="p-3.5 rounded-2xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="newPeopleCount"
                    className="text-xs font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>How many people are travelling?</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewMembers((prev) => resizeMembersList(prev, prev.length - 1))}
                      disabled={newMembers.length <= 1}
                      aria-label="Decrease traveler count"
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 font-bold text-sm disabled:opacity-40"
                    >
                      −
                    </button>
                    <input
                      id="newPeopleCount"
                      type="number"
                      min={1}
                      max={12}
                      value={newMembers.length}
                      onChange={(e) => setNewMembers((prev) => resizeMembersList(prev, Number(e.target.value) || 1))}
                      className="w-14 min-h-[34px] text-center rounded-lg text-sm font-bold tabular-nums bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setNewMembers((prev) => resizeMembersList(prev, prev.length + 1))}
                      disabled={newMembers.length >= 12}
                      aria-label="Increase traveler count"
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 font-bold text-sm disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {newMembers.map((memberName, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={memberName}
                        onChange={(e) =>
                          setNewMembers((prev) => prev.map((m, i) => (i === idx ? e.target.value : m)))
                        }
                        placeholder={`Traveler ${idx + 1}`}
                        aria-label={`Traveler ${idx + 1} name`}
                        className="flex-1 min-w-0 min-h-[38px] px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddDraftFlight(memberName)}
                        className="min-h-[38px] px-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/70 dark:border-brand-800/60 text-[11px] font-bold inline-flex items-center gap-1 shrink-0 hover:bg-brand-100 dark:hover:bg-brand-900/60"
                        title={`Add a flight for ${memberName || `Traveler ${idx + 1}`}`}
                      >
                        <Plane className="w-3 h-3" />
                        <span>+ Flight</span>
                      </button>
                    </div>
                  ))}
                </div>

                {draftFlights.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-sand-200 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Individual Flight Details ({draftFlights.length})
                    </div>
                    {draftFlights.map((df, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                            {df.travelerName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftFlight(fIdx)}
                            aria-label={`Remove flight for ${df.travelerName}`}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <input
                            type="date"
                            value={df.travelDate}
                            onChange={(e) => handleUpdateDraftFlight(fIdx, { travelDate: e.target.value })}
                            aria-label="Travel date"
                            className="min-h-[34px] px-2 rounded-lg text-[11px] font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={df.airline}
                            onChange={(e) => handleUpdateDraftFlight(fIdx, { airline: e.target.value })}
                            placeholder="Airline"
                            className="min-h-[34px] px-2 rounded-lg text-xs bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={df.flightNo}
                            onChange={(e) => handleUpdateDraftFlight(fIdx, { flightNo: e.target.value })}
                            placeholder="Flight No (6E 11)"
                            className="min-h-[34px] px-2 rounded-lg text-xs font-mono bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={df.pnr}
                            onChange={(e) => handleUpdateDraftFlight(fIdx, { pnr: e.target.value.toUpperCase() })}
                            placeholder="PNR"
                            className="min-h-[34px] px-2 rounded-lg text-xs font-mono uppercase bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            maxLength={4}
                            value={df.fromCode}
                            onChange={(e) => handleUpdateDraftFlight(fIdx, { fromCode: e.target.value.toUpperCase() })}
                            placeholder="From (BOM)"
                            className="min-h-[34px] px-2 rounded-lg text-xs font-bold uppercase bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            maxLength={4}
                            value={df.toCode}
                            onChange={(e) => handleUpdateDraftFlight(fIdx, { toCode: e.target.value.toUpperCase() })}
                            placeholder="To (NRT)"
                            className="min-h-[34px] px-2 rounded-lg text-xs font-bold uppercase bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={df.depTime}
                            onChange={(e) => handleUpdateDraftFlight(fIdx, { depTime: e.target.value })}
                            placeholder="Dep 09:00"
                            className="min-h-[34px] px-2 rounded-lg text-xs font-mono bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={df.arrTime}
                            onChange={(e) => handleUpdateDraftFlight(fIdx, { arrTime: e.target.value })}
                            placeholder="Arr 13:00"
                            className="min-h-[34px] px-2 rounded-lg text-xs font-mono bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="newHomeCurSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Settlement (Home) Currency
                  </label>
                  <select
                    id="newHomeCurSelect"
                    value={newHomeCur}
                    onChange={(e) => setNewHomeCur(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} · {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="newLocalCurSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Destination Currency
                  </label>
                  <select
                    id="newLocalCurSelect"
                    value={newLocalCur}
                    onChange={(e) => setNewLocalCur(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} · {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-display font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Trip with Auto-Suggested Plan</span>
              </button>
            </form>
          )}

          {view === "edit" && (
            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editNameInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Trip Title
                  </label>
                  <input
                    id="editNameInput"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="editDestInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Country or City
                  </label>
                  <input
                    id="editDestInput"
                    type="text"
                    required
                    value={editDest}
                    onChange={(e) => setEditDest(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editStartInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Start Date (updates day labels)
                  </label>
                  <input
                    id="editStartInput"
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="editDepInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Countdown Time
                  </label>
                  <input
                    id="editDepInput"
                    type="time"
                    value={editDepTime}
                    onChange={(e) => setEditDepTime(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="editHotelInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Fallback Primary Hotel
                </label>
                <input
                  id="editHotelInput"
                  type="text"
                  value={editHotel}
                  onChange={(e) => setEditHotel(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Edit Travelers Count + Individual Names */}
              <div className="p-3.5 rounded-2xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="editPeopleCount" className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Travelers ({editMembers.length})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditMembers((prev) => resizeMembersList(prev, prev.length - 1))}
                      disabled={editMembers.length <= 1}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 font-bold text-sm disabled:opacity-40"
                    >
                      −
                    </button>
                    <input
                      id="editPeopleCount"
                      type="number"
                      min={1}
                      max={12}
                      value={editMembers.length}
                      onChange={(e) => setEditMembers((prev) => resizeMembersList(prev, Number(e.target.value) || 1))}
                      className="w-14 min-h-[34px] text-center rounded-lg text-sm font-bold tabular-nums bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setEditMembers((prev) => resizeMembersList(prev, prev.length + 1))}
                      disabled={editMembers.length >= 12}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 font-bold text-sm disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {editMembers.map((m, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={m}
                      onChange={(e) =>
                        setEditMembers((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))
                      }
                      placeholder={`Traveler ${idx + 1}`}
                      aria-label={`Traveler ${idx + 1} name`}
                      className="min-h-[38px] px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editHomeCurInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Settlement Currency
                  </label>
                  <select
                    id="editHomeCurInput"
                    value={editHomeCur}
                    onChange={(e) => setEditHomeCur(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} · {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="editLocalCurInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Destination Currency
                  </label>
                  <select
                    id="editLocalCurInput"
                    value={editLocalCur}
                    onChange={(e) => setEditLocalCur(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} · {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-display font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Save Trip Settings</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
