import { useEffect, useState } from "react";
import {
  BookOpen,
  Copy,
  Download,
  HardDriveDownload,
  Home,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Wifi,
  WifiOff
} from "lucide-react";
import type { TripPhrase, TripPlan } from "../types/trip";
import { gmapsPlaceUrl } from "../data/tripData";
import { useOnlineStatus } from "../hooks/usePWA";
import { warmOfflineAppCache } from "../utils/offlineExport";
import { PWAInstallButton } from "./PWAInstallButton";
import { VoiceTranslatorCard } from "./VoiceTranslatorCard";
import { getOrderedDayStops } from "./ItineraryTab";

interface ChecklistTabProps {
  trip: TripPlan;
  galleryCount: number;
  onToggleChecklist: (id: string) => void;
  onAddChecklistItem: (text: string) => void;
  onDeleteChecklistItem: (id: string) => void;
  onAddPhrase: (phrase: Omit<TripPhrase, "id">) => void;
  onDeletePhrase: (id: string) => void;
  onJumpToDay: (dayIdx: number) => void;
  onCopy: (text: string, label: string) => void;
  onExportJson: () => void;
  onDownloadOfflineHtml: () => void;
  onImportJsonFile: (file: File) => void;
  onNotify: (msg: string) => void;
}

export function ChecklistTab({
  trip,
  galleryCount,
  onToggleChecklist,
  onAddChecklistItem,
  onDeleteChecklistItem,
  onAddPhrase,
  onDeletePhrase,
  onJumpToDay,
  onCopy,
  onExportJson,
  onDownloadOfflineHtml,
  onImportJsonFile,
  onNotify
}: ChecklistTabProps) {
  const [newItemText, setNewItemText] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [swReady, setSwReady] = useState(false);
  const [cachingOffline, setCachingOffline] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          setSwReady(Boolean(reg?.active || navigator.serviceWorker.controller));
        })
        .catch(() => setSwReady(false));
    }
  }, []);

  const doneCount = trip.checklist.filter((c) => c.done).length;
  const totalCount = trip.checklist.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleCopyShortlist = () => {
    const lines = [`${trip.name} (${trip.destination}) — Shortlisted Itinerary`];
    trip.days.forEach((d, idx) => {
      const { allItems } = getOrderedDayStops(d, trip.dayOrder[idx]);
      const picked = allItems.filter((x) => !!trip.shortlist[x.id]);
      lines.push(`\n${d.title}`);
      picked.forEach((p, pIdx) => lines.push(`${pIdx + 1}. ${p.name}`));
    });
    onCopy(lines.join("\n"), "Shortlisted itinerary copied");
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    onAddChecklistItem(trimmed);
    setNewItemText("");
  };

  const handleCreatePhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim() || !newMeaning.trim()) return;
    onAddPhrase({
      phrase: newPhrase.trim(),
      meaning: newMeaning.trim()
    });
    setNewPhrase("");
    setNewMeaning("");
  };

  const handleSaveAppOffline = async () => {
    setCachingOffline(true);
    const res = await warmOfflineAppCache();
    setCachingOffline(false);
    if (res.ok) {
      onNotify(`Saved ${res.cachedCount} app files & icons for offline use`);
    } else {
      onNotify("Offline browser storage active — open direct URL to install PWA");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
          Checklist, Cheat Sheet &amp; Offline Install
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Review picked stops, packing readiness, pocket phrases, and install Tripolla on phones for offline use.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Shortlisted Places + Local Cheat Sheet */}
        <div className="lg:col-span-6 space-y-4">
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Your Shortlisted Places
              </h3>
              <button
                type="button"
                onClick={handleCopyShortlist}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Plan</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Select any day below to customize stops or rearrange order in Itinerary.
            </p>

            <div className="divide-y divide-sand-200 dark:divide-slate-800">
              {trip.days.map((d, dIdx) => {
                const { allItems } = getOrderedDayStops(d, trip.dayOrder[dIdx]);
                const picked = allItems.filter((x) => !!trip.shortlist[x.id]);
                return (
                  <div key={`${d.code}_${dIdx}`} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <button
                        type="button"
                        onClick={() => onJumpToDay(dIdx)}
                        className="font-display font-bold text-sm text-brand-700 dark:text-brand-400 hover:underline text-left"
                      >
                        {d.title}
                      </button>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                        {picked.length} places
                      </span>
                    </div>
                    {picked.length > 0 ? (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {picked.map((p, idx) => (
                          <span key={p.id}>
                            {idx > 0 && (
                              <span aria-hidden="true" className="text-slate-400 mx-1.5">
                                ·
                              </span>
                            )}
                            <span>{p.name}</span>
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No places picked yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <VoiceTranslatorCard
            destination={trip.destination}
            baseHotel={trip.hotelStays?.[0]?.name || trip.hotelName}
          />

          {/* Offline Pocket Cheat Sheet */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                {trip.destination} Cheat Sheet (Offline)
              </h3>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Handy Local Phrases
              </h4>
              <div className="divide-y divide-sand-200 dark:divide-slate-800">
                {trip.phrases.map((item) => (
                  <div
                    key={item.id}
                    className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-display font-bold text-sm text-brand-700 dark:text-brand-300">
                        {item.phrase}
                      </span>
                      {item.note && <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">· {item.note}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.meaning}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeletePhrase(item.id)}
                        aria-label={`Remove ${item.phrase}`}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreatePhrase} className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  placeholder="Phrase (e.g. Merci)"
                  aria-label="Local phrase"
                  className="sm:col-span-5 min-h-[38px] px-3 rounded-xl text-xs bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  placeholder="Meaning (e.g. Thank you)"
                  aria-label="Phrase meaning"
                  className="sm:col-span-5 min-h-[38px] px-3 rounded-xl text-xs bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 min-h-[38px] px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                >
                  Add
                </button>
              </form>
            </div>

            {trip.tips.length > 0 && (
              <div className="pt-2 border-t border-sand-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Local Savvy Tips
                </h4>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {trip.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Packing Checklist + Emergency + Offline Access & APK + JSON Backup */}
        <div className="lg:col-span-6 space-y-4">
          {/* Packing & Pre-Trip Checklist */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Pre-Trip &amp; Packing Checklist
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {doneCount} of {totalCount} ready ({pct}%)
                </p>
              </div>
              <span className="font-mono font-bold text-sm text-brand-700 dark:text-brand-300 tabular-nums">
                {pct}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-sand-100 dark:bg-slate-800 overflow-hidden mb-3.5">
              <div
                className="h-full bg-brand-600 transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="divide-y divide-sand-200 dark:divide-slate-800">
              {trip.checklist.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2 py-2.5 first:pt-1 last:pb-1">
                  <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => onToggleChecklist(item.id)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#0e7c7b] cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <span
                        className={`text-sm leading-snug ${
                          item.done
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-800 dark:text-slate-100 font-medium"
                        }`}
                      >
                        {item.text}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">· {item.cat}</span>
                    </div>
                  </label>

                  {item.custom && (
                    <button
                      type="button"
                      onClick={() => onDeleteChecklistItem(item.id)}
                      aria-label={`Remove ${item.text}`}
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklist} className="mt-3.5 pt-3.5 border-t border-sand-200 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add custom packing item..."
                aria-label="New packing item"
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>
          </section>

          {/* Emergency & Base Quick Actions */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-3">
              Emergency &amp; Base Stay Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {trip.emergencyContacts.map((ec, idx) => (
                <a
                  key={`${ec.label}_${idx}`}
                  href={`tel:${ec.number}`}
                  className={`min-h-[56px] p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                    idx === 0
                      ? "bg-rose-50 dark:bg-rose-950/35 border-rose-200 dark:border-rose-800/60 hover:border-rose-400"
                      : "bg-amber-50 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800/60 hover:border-amber-400"
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-semibold truncate ${
                        idx === 0 ? "text-rose-700 dark:text-rose-300" : "text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {ec.label}
                    </div>
                    <div
                      className={`font-mono font-bold text-lg tabular-nums ${
                        idx === 0 ? "text-rose-900 dark:text-rose-100" : "text-amber-950 dark:text-amber-100"
                      }`}
                    >
                      {ec.number}
                    </div>
                  </div>
                  <Phone
                    className={`w-4 h-4 shrink-0 ${
                      idx === 0 ? "text-rose-600 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"
                    }`}
                  />
                </a>
              ))}
            </div>
            <a
              href={gmapsPlaceUrl(`${trip.hotelName} ${trip.destination}`.trim())}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-sand-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold flex items-center justify-between hover:bg-sand-200/70 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Home className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="truncate">Navigate to Stay: {trip.hotelName}</span>
              </span>
              <span className="text-brand-700 dark:text-brand-300 shrink-0 ml-2">Offline Maps →</span>
            </a>
          </section>

          {/* Offline App Readiness, Offline Download & Phone Install */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Offline Download &amp; Phone Install</span>
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  isOnline ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isOnline ? "Online · Ready" : "Offline · Cached"}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3 py-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {swReady
                  ? `Offline Service Worker active · ${galleryCount} local ${galleryCount === 1 ? "photo" : "photos"} stored on device.`
                  : `Local browser storage active · Save offline files or install on phone below.`}
              </span>
            </div>

            {/* Direct Offline Downloads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onDownloadOfflineHtml}
                className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Download Offline Trip (.html)</span>
              </button>
              <button
                type="button"
                disabled={cachingOffline}
                onClick={handleSaveAppOffline}
                className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-sand-100 dark:bg-slate-800 hover:bg-sand-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
              >
                <HardDriveDownload className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span>{cachingOffline ? "Caching App..." : "Cache App Files Offline"}</span>
              </button>
            </div>

            <PWAInstallButton variant="card" onDownloadOfflinePack={onDownloadOfflineHtml} />
          </section>

          {/* Share & Sync Trip JSON */}
          <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
              Export &amp; Share Trip Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
              Export <strong>{trip.name}</strong> (places, flights, expenses, notes, and gallery photos) as a JSON file
              to share with travel companions or move to another device.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExportJson}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Trip JSON</span>
              </button>
              <label className="min-h-[44px] py-2.5 px-3 rounded-xl bg-sand-100 dark:bg-slate-800 hover:bg-sand-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Trip JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImportJsonFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
