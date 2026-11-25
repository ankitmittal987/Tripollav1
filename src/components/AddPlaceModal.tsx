import { useMemo, useState } from "react";
import { Check, ExternalLink, MapPin, Plus, Sparkles, X } from "lucide-react";
import type { DayPlan, DietType, StopItem, StopType, TierType } from "../types/trip";
import { STOP_TYPES, SUGGESTED_GEMS, parseGoogleMapsInput } from "../data/tripData";

interface AddPlaceModalProps {
  selectedDay: number;
  dayPlan: DayPlan;
  destination: string;
  existingIds: Set<string>;
  existingNames: Set<string>;
  onAddStop: (dayIdx: number, stop: StopItem) => void;
  onClose: () => void;
}

export function AddPlaceModal({
  selectedDay,
  dayPlan,
  destination,
  existingIds,
  existingNames,
  onAddStop,
  onClose
}: AddPlaceModalProps) {
  const existingCoords = dayPlan.items.find((i) => Number.isFinite(i.lat) && Number.isFinite(i.lng));
  const isSriLanka = /sri lanka|ahangama|galle|colombo|mirissa|weligama/i.test(destination);
  const fallbackLat = existingCoords ? existingCoords.lat : isSriLanka ? (selectedDay >= 4 ? 6.915 : 5.972) : 0;
  const fallbackLng = existingCoords ? existingCoords.lng : isSriLanka ? (selectedDay >= 4 ? 79.855 : 80.365) : 0;

  const [mode, setMode] = useState<"maps" | "gems">("maps");
  const [mapsInput, setMapsInput] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<StopType>("v");
  const [diet, setDiet] = useState<DietType>("none");
  const [tier, setTier] = useState<TierType>("core");

  const parsed = useMemo(
    () => parseGoogleMapsInput(mapsInput, fallbackLat, fallbackLng, destination),
    [mapsInput, fallbackLat, fallbackLng, destination]
  );

  const handleMapsInputChange = (val: string) => {
    setMapsInput(val);
    const nextParsed = parseGoogleMapsInput(val, fallbackLat, fallbackLng, destination);
    if (nextParsed.name) {
      setPlaceName(nextParsed.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = placeName.trim() || parsed.name.trim();
    if (!finalName) return;

    const query =
      parsed.query ||
      (destination && !finalName.toLowerCase().includes(destination.split(",")[0].toLowerCase())
        ? `${finalName} ${destination}`
        : finalName);

    const offset = (dayPlan.items.length % 5) * 0.004;
    const stop: StopItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: finalName,
      query,
      lat: parsed.hasExactCoords ? parsed.lat : fallbackLat + offset,
      lng: parsed.hasExactCoords ? parsed.lng : fallbackLng + offset,
      desc: desc.trim() || "Added from Google Maps",
      type,
      diet,
      tier,
      defaultPick: true,
      custom: true,
      mapsUrl: parsed.mapsUrl
    };

    onAddStop(selectedDay, stop);
    onClose();
  };

  const region = selectedDay >= 4 ? "colombo" : "south";
  const sortedGems = useMemo(() => {
    if (isSriLanka) {
      return [...SUGGESTED_GEMS].sort((a, b) => {
        if (a.region === region && b.region !== region) return -1;
        if (a.region !== region && b.region === region) return 1;
        return 0;
      });
    }
    return [
      {
        id: "gen_landmark",
        region: "south" as const,
        name: `Top Landmark in ${destination}`,
        query: `Top attractions ${destination}`,
        lat: fallbackLat + 0.008,
        lng: fallbackLng + 0.005,
        desc: `Must-visit cultural site or iconic neighborhood in ${destination}`,
        type: "v" as const,
        diet: "none" as const
      },
      {
        id: "gen_food",
        region: "south" as const,
        name: `Local Food Market / Cafe (${destination})`,
        query: `Best local food market ${destination}`,
        lat: fallbackLat - 0.006,
        lng: fallbackLng + 0.007,
        desc: `Signature street food, coffee, or sit-down local lunch`,
        type: "f" as const,
        diet: "both" as const
      },
      {
        id: "gen_sunset",
        region: "south" as const,
        name: `Sunset Viewpoint (${destination})`,
        query: `Best sunset viewpoint ${destination}`,
        lat: fallbackLat + 0.004,
        lng: fallbackLng - 0.009,
        desc: `Golden hour skyline, waterfront, or cliffside panorama`,
        type: "s" as const,
        diet: "none" as const
      },
      {
        id: "gen_night",
        region: "south" as const,
        name: `Evening Cocktail / Rooftop Bar`,
        query: `Best rooftop cocktail bar ${destination}`,
        lat: fallbackLat - 0.005,
        lng: fallbackLng - 0.004,
        desc: `Nighttime drinks, live music, or vibrant late hangout`,
        type: "p" as const,
        diet: "none" as const
      }
    ];
  }, [isSriLanka, region, destination, fallbackLat, fallbackLng]);

  const handleAddGem = (gem: (typeof sortedGems)[number]) => {
    const stop: StopItem = {
      id: `gem_${gem.id}_${Date.now()}`,
      name: gem.name,
      query: gem.query,
      lat: gem.lat,
      lng: gem.lng,
      desc: gem.desc,
      type: gem.type,
      diet: gem.diet,
      tier: gem.type === "p" ? "alt_party" : "core",
      defaultPick: true,
      custom: true
    };
    onAddStop(selectedDay, stop);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Add place to ${dayPlan.title}`}
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sand-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white truncate">
              Add Place to {dayPlan.code}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {destination} · {dayPlan.shortDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[38px] min-h-[38px] rounded-xl bg-sand-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sand-200/70 dark:hover:bg-slate-700 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-sand-100 dark:bg-slate-800 border border-sand-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMode("maps")}
              className={`min-h-[38px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                mode === "maps"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>From Google Maps</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("gems")}
              className={`min-h-[38px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                mode === "gems"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSriLanka ? `Bonus Ideas (${sortedGems.length})` : "Quick Templates"}</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {mode === "maps" ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label htmlFor="gmapsLinkInput" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Google Maps Link or Place Search
                  </label>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Browse Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  id="gmapsLinkInput"
                  type="text"
                  value={mapsInput}
                  onChange={(e) => handleMapsInputChange(e.target.value)}
                  placeholder={`Paste Google Maps link or type spot in ${destination}`}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
                />
                {mapsInput.trim() && (
                  <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {parsed.hasExactCoords
                      ? `GPS pin detected (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`
                      : "Will open in Google Maps search & place pin near day area"}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="placeNameInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Place Name *
                </label>
                <input
                  id="placeNameInput"
                  type="text"
                  required
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g. Shibuya Sky / Colosseum / Central Cafe"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="placeTypeSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Type
                  </label>
                  <select
                    id="placeTypeSelect"
                    value={type}
                    onChange={(e) => setType(e.target.value as StopType)}
                    className="w-full min-h-[42px] px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {Object.entries(STOP_TYPES).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="placeDietSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Food Option
                  </label>
                  <select
                    id="placeDietSelect"
                    value={diet}
                    onChange={(e) => setDiet(e.target.value as DietType)}
                    className="w-full min-h-[42px] px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="none">Not Food</option>
                    <option value="veg">100% Veg</option>
                    <option value="both">Veg + Local</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="placeTierSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Section
                  </label>
                  <select
                    id="placeTierSelect"
                    value={tier}
                    onChange={(e) => setTier(e.target.value as TierType)}
                    className="w-full min-h-[42px] px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="core">Core Route</option>
                    <option value="alt_food">Alt Food</option>
                    <option value="alt_party">Nightlife</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="placeDescInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Quick Note / Why Visit
                </label>
                <input
                  id="placeDescInput"
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Book timed entry, sunset view, must-try ramen"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <button
                type="submit"
                disabled={!placeName.trim()}
                className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-display font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add to {dayPlan.code}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSriLanka ? "Handpicked suggestions for Sri Lanka" : `Quick activity templates for ${destination}`}. Tap
                to add straight to {dayPlan.code}.
              </p>
              {sortedGems.map((gem) => {
                const alreadyAdded = existingIds.has(gem.id) || existingNames.has(gem.name.toLowerCase());
                const meta = STOP_TYPES[gem.type];
                return (
                  <div
                    key={gem.id}
                    className="p-3.5 rounded-2xl border border-sand-200 dark:border-slate-800 bg-sand-50/70 dark:bg-slate-950/60 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`font-semibold ${meta.textClass}`}>{meta.label}</span>
                      </div>
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                        {gem.name}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{gem.desc}</p>
                    </div>

                    <button
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddGem(gem)}
                      className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                        alreadyAdded
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                          : "bg-brand-600 hover:bg-brand-700 text-white"
                      }`}
                    >
                      {alreadyAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
