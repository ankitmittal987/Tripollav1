import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Calendar, Clock, Copy, ExternalLink, Pencil, Plane, Plus, Trash2, Users } from "lucide-react";
import type { TripFlight, TripMilestone, TripPlan } from "../types/trip";

interface FlightsTabProps {
  trip: TripPlan;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  notifyLeadMinutes: number;
  onToggleNotifications: () => void;
  onChangeNotifyLeadMinutes: (mins: number) => void;
  onSendTestNotification: () => void;
  onAddFlight: (flight: Omit<TripFlight, "id">) => void;
  onUpdateFlight: (id: string, updates: Partial<TripFlight>) => void;
  onDeleteFlight: (id: string) => void;
  onAddMilestone: (milestone: Omit<TripMilestone, "id">) => void;
  onDeleteMilestone: (id: string) => void;
  onCopy: (text: string, label: string) => void;
}

function formatFlightDateLabel(dateStr?: string): string {
  if (!dateStr) return "Date unset";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function FlightsTab({
  trip,
  notificationsEnabled,
  notificationPermission,
  notifyLeadMinutes,
  onToggleNotifications,
  onChangeNotifyLeadMinutes,
  onSendTestNotification,
  onAddFlight,
  onUpdateFlight,
  onDeleteFlight,
  onAddMilestone,
  onDeleteMilestone,
  onCopy
}: FlightsTabProps) {
  const [now, setNow] = useState(() => Date.now());
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const [travelerFilter, setTravelerFilter] = useState<string>("ALL");

  // Add flight form state
  const [newHeader, setNewHeader] = useState("");
  const [newAirline, setNewAirline] = useState("");
  const [newFlightNo, setNewFlightNo] = useState("");
  const [newFromCode, setNewFromCode] = useState("");
  const [newFromCity, setNewFromCity] = useState("");
  const [newToCode, setNewToCode] = useState("");
  const [newToCity, setNewToCity] = useState("");
  const [newPnr, setNewPnr] = useState("");
  const [newTravelDate, setNewTravelDate] = useState(trip.startDate);
  const [newArrivalDate, setNewArrivalDate] = useState("");
  const [newDep, setNewDep] = useState("09:00");
  const [newArr, setNewArr] = useState("13:00");
  const [newTravelers, setNewTravelers] = useState<string[]>([]); // empty = All Travelers

  // Add milestone form state
  const [msLabel, setMsLabel] = useState("");
  const [msDateTime, setMsDateTime] = useState(`${trip.startDate}T09:00`);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setNewTravelDate(trip.startDate);
    setMsDateTime(`${trip.startDate}T09:00`);
    setTravelerFilter("ALL");
  }, [trip.id, trip.startDate]);

  const sortedFlights = useMemo(() => {
    const list = [...trip.flights].sort((a, b) => {
      const dateCmp = (a.travelDate || trip.startDate).localeCompare(b.travelDate || trip.startDate);
      if (dateCmp !== 0) return dateCmp;
      return (a.depTime || "").localeCompare(b.depTime || "");
    });
    if (travelerFilter === "ALL") return list;
    return list.filter((f) => {
      if (!f.travelerNames || f.travelerNames.length === 0) return true;
      return f.travelerNames.includes(travelerFilter);
    });
  }, [trip.flights, trip.startDate, travelerFilter]);

  const flightCountForMember = (name: string) =>
    trip.flights.filter((f) => !f.travelerNames?.length || f.travelerNames.includes(name)).length;

  const upcomingMilestones = trip.milestones
    .map((m) => ({
      ...m,
      ts: new Date(m.dateTime).getTime()
    }))
    .filter((m) => !Number.isNaN(m.ts) && m.ts > now)
    .sort((a, b) => a.ts - b.ts)
    .slice(0, 8);

  const formatCountdown = (targetTs: number): string => {
    const diffMins = Math.max(1, Math.round((targetTs - now) / 60000));
    const d = Math.floor(diffMins / 1440);
    const h = Math.floor((diffMins % 1440) / 60);
    const m = diffMins % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const toggleNewTraveler = (name: string) => {
    setNewTravelers((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const toggleEditFlightTraveler = (flight: TripFlight, name: string) => {
    const current = flight.travelerNames ?? [];
    const next = current.includes(name)
      ? current.filter((x) => x !== name)
      : [...current, name];
    onUpdateFlight(flight.id, { travelerNames: next });
  };

  const openAddForSelectedTraveler = () => {
    if (travelerFilter !== "ALL") {
      setNewTravelers([travelerFilter]);
    } else {
      setNewTravelers([]);
    }
    setShowAddFlight(true);
  };

  const handleCreateFlight = (e: React.FormEvent) => {
    e.preventDefault();
    const flightNo = newFlightNo.trim() || "FLT";
    const fromCode = (newFromCode.trim() || "ORG").toUpperCase();
    const toCode = (newToCode.trim() || "DST").toUpperCase();
    const travelDate = newTravelDate || trip.startDate;
    const assignedLabel =
      newTravelers.length > 0 ? newTravelers.join(", ") : `All (${trip.members.length})`;

    onAddFlight({
      header: newHeader.trim() || `${formatFlightDateLabel(travelDate)} · ${assignedLabel}`,
      airline: newAirline.trim() || "Airline",
      flightNo,
      fromCode,
      fromCity: newFromCity.trim() || fromCode,
      toCode,
      toCity: newToCity.trim() || toCode,
      pnr: (newPnr.trim() || "PENDING").toUpperCase(),
      travelDate,
      arrivalDate: newArrivalDate.trim() || undefined,
      depTime: newDep || "09:00",
      arrTime: newArr || "13:00",
      travelerNames: newTravelers,
      fr24: flightNo.replace(/\s+/g, "").toLowerCase(),
      fa: "",
      note: "Tap any time or edit icon to update traveler, date, or flight details."
    });
    setShowAddFlight(false);
    setNewHeader("");
    setNewAirline("");
    setNewFlightNo("");
    setNewFromCode("");
    setNewFromCity("");
    setNewToCode("");
    setNewToCity("");
    setNewPnr("");
    setNewArrivalDate("");
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msLabel.trim() || !msDateTime) return;
    onAddMilestone({
      label: msLabel.trim(),
      dateTime: msDateTime
    });
    setMsLabel("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
            Flights &amp; Per-Traveler Schedule
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Add multiple flight legs per traveler with travel dates, PNRs, and live tracking links.
          </p>
        </div>

        <button
          type="button"
          onClick={() => (showAddFlight ? setShowAddFlight(false) : openAddForSelectedTraveler())}
          className="min-h-[42px] px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-display font-bold text-xs inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>
            {showAddFlight
              ? "Cancel"
              : travelerFilter === "ALL"
                ? "Add Flight / Transit"
                : `Add Flight for ${travelerFilter}`}
          </span>
        </button>
      </div>

      {/* Traveler Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 shrink-0 mr-1">
          <Users className="w-3.5 h-3.5" />
          <span>Traveler:</span>
        </span>
        <button
          type="button"
          onClick={() => setTravelerFilter("ALL")}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-colors ${
            travelerFilter === "ALL"
              ? "bg-brand-600 text-white border-brand-600"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-sand-200 dark:border-slate-800 hover:border-brand-600/40"
          }`}
        >
          All Travelers ({trip.flights.length})
        </button>
        {trip.members.map((member) => {
          const active = travelerFilter === member;
          const cnt = flightCountForMember(member);
          return (
            <button
              key={member}
              type="button"
              onClick={() => setTravelerFilter(member)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-colors ${
                active
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-sand-200 dark:border-slate-800 hover:border-brand-600/40"
              }`}
            >
              {member} ({cnt})
            </button>
          );
        })}
      </div>

      {showAddFlight && (
        <form
          onSubmit={handleCreateFlight}
          className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3.5 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
              Add Flight / Transit Leg
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              You can add multiple flights per traveler on different dates
            </span>
          </div>

          {/* Assign Travelers */}
          <div className="p-3 rounded-2xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Who is flying on this leg?
              </span>
              <button
                type="button"
                onClick={() => setNewTravelers([])}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                All Travelers ({trip.members.length})
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {trip.members.map((m) => {
                const selected = newTravelers.includes(m);
                return (
                  <label
                    key={m}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 cursor-pointer select-none transition-colors ${
                      selected
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-sand-200 dark:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleNewTraveler(m)}
                      className="sr-only"
                    />
                    <span>{m}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {newTravelers.length === 0
                ? `Applies to all travelers (${trip.members.join(", ")})`
                : `Assigned to: ${newTravelers.join(", ")}`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label htmlFor="newFlightDate" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Travel Date *
              </label>
              <input
                id="newFlightDate"
                type="date"
                required
                value={newTravelDate}
                onChange={(e) => setNewTravelDate(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="newFlightArrDate" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Arrival Date (optional)
              </label>
              <input
                id="newFlightArrDate"
                type="date"
                value={newArrivalDate}
                onChange={(e) => setNewArrivalDate(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="newFlightAirline" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Airline
              </label>
              <input
                id="newFlightAirline"
                type="text"
                value={newAirline}
                onChange={(e) => setNewAirline(e.target.value)}
                placeholder="e.g. Emirates / IndiGo"
                className="w-full min-h-[42px] px-3 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="newFlightNo" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Flight No *
              </label>
              <input
                id="newFlightNo"
                type="text"
                required
                value={newFlightNo}
                onChange={(e) => setNewFlightNo(e.target.value)}
                placeholder="e.g. EK 501"
                className="w-full min-h-[42px] px-3 rounded-xl text-sm font-mono bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            <input
              type="text"
              maxLength={4}
              value={newFromCode}
              onChange={(e) => setNewFromCode(e.target.value.toUpperCase())}
              placeholder="From (BOM)"
              className="min-h-[42px] px-3 rounded-xl text-sm font-bold uppercase bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={newFromCity}
              onChange={(e) => setNewFromCity(e.target.value)}
              placeholder="Origin City"
              className="min-h-[42px] px-3 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              maxLength={4}
              value={newToCode}
              onChange={(e) => setNewToCode(e.target.value.toUpperCase())}
              placeholder="To (DXB)"
              className="min-h-[42px] px-3 rounded-xl text-sm font-bold uppercase bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={newToCity}
              onChange={(e) => setNewToCity(e.target.value)}
              placeholder="Arrival City"
              className="min-h-[42px] px-3 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={newDep}
              onChange={(e) => setNewDep(e.target.value)}
              placeholder="Dep (09:00)"
              className="min-h-[42px] px-3 rounded-xl text-sm font-mono bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={newArr}
              onChange={(e) => setNewArr(e.target.value)}
              placeholder="Arr (13:00)"
              className="min-h-[42px] px-3 rounded-xl text-sm font-mono bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={newHeader}
              onChange={(e) => setNewHeader(e.target.value)}
              placeholder="Optional label (e.g. Layover / Return)"
              className="sm:col-span-2 min-h-[42px] px-3 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={newPnr}
              onChange={(e) => setNewPnr(e.target.value)}
              placeholder="Booking PNR"
              className="min-h-[42px] px-3 rounded-xl text-sm font-mono uppercase bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="min-h-[42px] px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
          >
            Save Flight Segment
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Boarding Pass Cards */}
        <div className="lg:col-span-7 space-y-4">
          {sortedFlights.map((f, idx) => {
            const isEditing = editingFlightId === f.id;
            const fr24Slug = f.fr24 || f.flightNo.replace(/\s+/g, "").toLowerCase();
            const assignedTravelersLabel =
              f.travelerNames && f.travelerNames.length > 0
                ? f.travelerNames.join(", ")
                : `All Travelers (${trip.members.join(", ")})`;

            return (
              <article
                key={f.id}
                className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-xs"
              >
                <div className={`h-1.5 w-full ${idx % 2 === 0 ? "bg-[#1d3a8a]" : "bg-[#0e7c7b]"}`} />
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <span className="text-xs font-bold tracking-wide text-brand-700 dark:text-brand-400">
                        {f.header}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {formatFlightDateLabel(f.travelDate || trip.startDate)}
                        </span>
                        {f.arrivalDate && f.arrivalDate !== f.travelDate && (
                          <span>→ {formatFlightDateLabel(f.arrivalDate)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                        {f.airline} · {f.flightNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingFlightId(isEditing ? null : f.id)}
                        aria-label={`Edit ${f.flightNo}`}
                        className="min-w-[30px] min-h-[30px] rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteFlight(f.id)}
                        aria-label={`Delete ${f.flightNo}`}
                        className="min-w-[30px] min-h-[30px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2.5 mb-4 p-3 rounded-2xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                          Travelers:
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateFlight(f.id, { travelerNames: [] })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            !f.travelerNames?.length
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-sand-200 dark:border-slate-700"
                          }`}
                        >
                          All
                        </button>
                        {trip.members.map((m) => {
                          const active = Boolean(f.travelerNames?.includes(m));
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => toggleEditFlightTraveler(f, m)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                active
                                  ? "bg-brand-600 text-white border-brand-600"
                                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-sand-200 dark:border-slate-700"
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <input
                          type="date"
                          value={f.travelDate || trip.startDate}
                          onChange={(e) => onUpdateFlight(f.id, { travelDate: e.target.value })}
                          aria-label="Travel date"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={f.header}
                          onChange={(e) => onUpdateFlight(f.id, { header: e.target.value })}
                          placeholder="Header"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={f.airline}
                          onChange={(e) => onUpdateFlight(f.id, { airline: e.target.value })}
                          placeholder="Airline"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={f.flightNo}
                          onChange={(e) => onUpdateFlight(f.id, { flightNo: e.target.value })}
                          placeholder="Flight No"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={f.fromCode}
                          onChange={(e) => onUpdateFlight(f.id, { fromCode: e.target.value.toUpperCase() })}
                          placeholder="From Code"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={f.fromCity}
                          onChange={(e) => onUpdateFlight(f.id, { fromCity: e.target.value })}
                          placeholder="From City"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={f.toCode}
                          onChange={(e) => onUpdateFlight(f.id, { toCode: e.target.value.toUpperCase() })}
                          placeholder="To Code"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={f.toCity}
                          onChange={(e) => onUpdateFlight(f.id, { toCity: e.target.value })}
                          placeholder="To City"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={f.pnr}
                          onChange={(e) => onUpdateFlight(f.id, { pnr: e.target.value.toUpperCase() })}
                          placeholder="PNR"
                          className="min-h-[38px] px-2.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingFlightId(null)}
                        className="min-h-[36px] px-4 rounded-lg bg-brand-600 text-white text-xs font-bold"
                      >
                        Done Editing
                      </button>
                    </div>
                  ) : null}

                  {/* Airport Route Header */}
                  <div className="flex items-center justify-between gap-3 my-2">
                    <div>
                      <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-slate-900 dark:text-white tabular-nums">
                        {f.fromCode}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f.fromCity}</div>
                    </div>

                    <div className="flex-1 flex flex-col items-center px-2 min-w-0">
                      <div className="w-full flex items-center gap-2 text-brand-600 dark:text-brand-400">
                        <span className="w-2 h-2 rounded-full border-2 border-current shrink-0" />
                        <div className="flex-1 border-t-2 border-dashed border-slate-300 dark:border-slate-700" />
                        <Plane className="w-4 h-4 shrink-0" />
                        <div className="flex-1 border-t-2 border-dashed border-slate-300 dark:border-slate-700" />
                        <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1.5 text-center truncate max-w-full">
                        {assignedTravelersLabel}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-slate-900 dark:text-white tabular-nums">
                        {f.toCode}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f.toCity}</div>
                    </div>
                  </div>

                  {/* Editable Departure / Arrival Times */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 rounded-2xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800">
                      <label
                        htmlFor={`dep-${f.id}`}
                        className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                      >
                        Departs (Local)
                      </label>
                      <input
                        id={`dep-${f.id}`}
                        type="text"
                        value={f.depTime}
                        onChange={(e) => onUpdateFlight(f.id, { depTime: e.target.value })}
                        className="w-full bg-transparent font-mono font-bold text-base text-slate-900 dark:text-white tabular-nums focus:outline-none"
                      />
                    </div>
                    <div className="p-3 rounded-2xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800">
                      <label
                        htmlFor={`arr-${f.id}`}
                        className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                      >
                        Arrives (Local)
                      </label>
                      <input
                        id={`arr-${f.id}`}
                        type="text"
                        value={f.arrTime}
                        onChange={(e) => onUpdateFlight(f.id, { arrTime: e.target.value })}
                        className="w-full bg-transparent font-mono font-bold text-base text-slate-900 dark:text-white tabular-nums focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="ticket-divider my-5" />

                  {/* PNR Row */}
                  <div className="flex items-center justify-between gap-3 bg-brand-50/70 dark:bg-brand-950/35 border border-brand-200/80 dark:border-brand-800/50 rounded-2xl px-4 py-3">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Booking Ref (PNR)</div>
                      <div className="font-mono font-bold text-lg tracking-widest text-slate-900 dark:text-white tabular-nums">
                        {f.pnr || "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopy(f.pnr, `PNR ${f.pnr} copied`)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sand-200 dark:border-slate-700 text-xs font-semibold text-brand-700 dark:text-brand-300 inline-flex items-center gap-1.5 hover:border-brand-600/50 active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy PNR</span>
                    </button>
                  </div>

                  {f.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{f.note}</p>}

                  {/* Live Flight Trackers */}
                  <div className="mt-3.5 space-y-2">
                    <a
                      href={`https://www.flightradar24.com/data/flights/${fr24Slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Track Live on Flightradar24</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.flightaware.com/live/flight/${f.fa || fr24Slug.toUpperCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[40px] py-2 px-3 rounded-xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 text-xs font-semibold text-center text-slate-700 dark:text-slate-200 flex items-center justify-center hover:border-brand-600/40 transition-colors"
                      >
                        FlightAware
                      </a>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${f.flightNo} flight status`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[40px] py-2 px-3 rounded-xl bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-800 text-xs font-semibold text-center text-slate-700 dark:text-slate-200 flex items-center justify-center hover:border-brand-600/40 transition-colors"
                      >
                        Google Status
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {sortedFlights.length === 0 && (
            <div className="rounded-3xl border border-dashed border-sand-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-8 text-center space-y-2.5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {travelerFilter === "ALL"
                  ? "No flights or trains added yet. Tap Add Flight / Transit above to save PNRs offline."
                  : `No flights assigned specifically to ${travelerFilter} yet.`}
              </p>
              <button
                type="button"
                onClick={openAddForSelectedTraveler}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {travelerFilter === "ALL" ? "Add First Flight" : `Add Flight for ${travelerFilter}`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Upcoming Milestones Sidebar */}
        <aside className="lg:col-span-5 rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Upcoming Milestones
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live countdowns for key departures, check-ins, and reservations.
            </p>
          </div>

          {upcomingMilestones.length > 0 ? (
            <div className="divide-y divide-sand-200 dark:divide-slate-800">
              {upcomingMilestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-1 last:pb-1">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {m.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                      {m.dateTime.replace("T", " · ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-brand-700 dark:text-brand-300 tabular-nums whitespace-nowrap">
                      in {formatCountdown(m.ts)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteMilestone(m.id)}
                      aria-label={`Remove milestone ${m.label}`}
                      className="min-w-[30px] min-h-[30px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
              No upcoming milestones yet. Add one below!
            </p>
          )}

          <form onSubmit={handleCreateMilestone} className="pt-3 border-t border-sand-200 dark:border-slate-800 space-y-2">
            <input
              type="text"
              value={msLabel}
              onChange={(e) => setMsLabel(e.target.value)}
              placeholder="e.g. Airport pickup / Dinner reservation"
              aria-label="Milestone label"
              className="w-full min-h-[40px] px-3 py-1.5 rounded-xl text-xs bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={msDateTime}
                onChange={(e) => setMsDateTime(e.target.value)}
                aria-label="Milestone date and time"
                className="flex-1 min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-mono bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Upcoming Event Notifications */}
          <div className="pt-3 border-t border-sand-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {notificationsEnabled && notificationPermission === "granted" ? (
                  <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                ) : (
                  <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white truncate">
                  Upcoming Event Notifications
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleNotifications}
                disabled={notificationPermission === "unsupported"}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-colors whitespace-nowrap disabled:opacity-50 ${
                  notificationsEnabled && notificationPermission === "granted"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-brand-600 hover:bg-brand-700 text-white"
                }`}
              >
                {notificationsEnabled && notificationPermission === "granted" ? "Alerts On" : "Enable Alerts"}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {notificationPermission === "unsupported"
                ? "Notifications are unavailable in this browser context. Open in Chrome or installed app to allow alerts."
                : notificationPermission === "denied"
                  ? "Notifications are blocked in browser/app settings. Allow notifications for Tripolla to receive flight & milestone alerts."
                  : "Sends device notifications before upcoming flights, trip departure, and saved milestones."}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="notifyLeadSelect" className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Remind me:
              </label>
              <select
                id="notifyLeadSelect"
                value={notifyLeadMinutes}
                onChange={(e) => onChangeNotifyLeadMinutes(Number(e.target.value))}
                className="flex-1 min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value={15}>15 mins before</option>
                <option value={60}>1 hour before</option>
                <option value={180}>3 hours before</option>
                <option value={1440}>24 hours before</option>
              </select>
              <button
                type="button"
                onClick={onSendTestNotification}
                className="min-h-[36px] px-3 py-1 rounded-xl bg-sand-100 dark:bg-slate-800 hover:bg-sand-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Test Alert
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
