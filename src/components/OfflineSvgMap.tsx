import { useMemo, useState } from "react";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import type { StopItem } from "../types/trip";
import { COASTLINE, STOP_TYPES, getStopMapsUrl, gmapsMultiRouteUrl, legSpeedStyle } from "../data/tripData";

interface OfflineSvgMapProps {
  destination: string;
  coreStops: StopItem[];
  legs: [number, number][];
  shortlistedAlts: StopItem[];
  shortlist: Record<string, boolean>;
  routeItemsToLaunch: StopItem[];
  hotelName: string;
}

const SL_TOWN_LABELS: { name: string; lat: number; lng: number }[] = [
  { name: "Colombo", lat: 6.927, lng: 79.86 },
  { name: "Galle", lat: 6.03, lng: 80.215 },
  { name: "Unawatuna", lat: 6.01, lng: 80.25 },
  { name: "Ahangama", lat: 5.97, lng: 80.365 },
  { name: "Weligama", lat: 5.974, lng: 80.43 },
  { name: "Mirissa", lat: 5.943, lng: 80.46 }
];

export function OfflineSvgMap({
  destination,
  coreStops,
  legs,
  shortlistedAlts,
  shortlist,
  routeItemsToLaunch,
  hotelName
}: OfflineSvgMapProps) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const allMapPoints = useMemo(() => [...coreStops, ...shortlistedAlts], [coreStops, shortlistedAlts]);

  const mapGeometry = useMemo(() => {
    const W = 380;
    const H = 240;
    const PAD = 34;

    if (!allMapPoints.length) {
      return {
        W,
        H,
        spanLat: 0,
        isSriLankaArea: false,
        landPath: "",
        displayPts: [] as [number, number][],
        townLabels: [] as { name: string; x: number; y: number }[]
      };
    }

    const lats = allMapPoints.map((s) => s.lat);
    const lngs = allMapPoints.map((s) => s.lng);
    const midLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const midLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    const isSriLankaArea = midLat >= 5.6 && midLat <= 7.6 && midLng >= 79.4 && midLng <= 81.8;
    const cosLat = Math.max(0.2, Math.cos((midLat * Math.PI) / 180));

    const minLng = Math.min(...lngs);
    const minLat = Math.min(...lats);
    const spanLng = Math.max(...lngs) - minLng || 0.012;
    const spanLat = Math.max(...lats) - minLat || 0.012;

    const scale = Math.min((W - 2 * PAD) / (spanLng * cosLat), (H - 2 * PAD) / spanLat);
    const offsetX = (W - spanLng * cosLat * scale) / 2;
    const offsetY = (H - spanLat * scale) / 2;

    const project = (lat: number, lng: number): [number, number] => [
      offsetX + (lng - minLng) * cosLat * scale,
      H - offsetY - (lat - minLat) * scale
    ];

    const rawPts = allMapPoints.map((s) => project(s.lat, s.lng));
    const displayPts: [number, number][] = rawPts.map((p) => [p[0], p[1]]);
    const visited = new Array<boolean>(rawPts.length).fill(false);

    for (let i = 0; i < rawPts.length; i++) {
      if (visited[i]) continue;
      const cluster = [i];
      visited[i] = true;
      for (let j = i + 1; j < rawPts.length; j++) {
        if (visited[j]) continue;
        const dist = Math.hypot(rawPts[i][0] - rawPts[j][0], rawPts[i][1] - rawPts[j][1]);
        if (dist < 17) {
          cluster.push(j);
          visited[j] = true;
        }
      }
      if (cluster.length > 1) {
        const radius = cluster.length === 2 ? 10.5 : 14;
        cluster.forEach((idx, k) => {
          const angle = (2 * Math.PI * k) / cluster.length - Math.PI / 4;
          displayPts[idx][0] = Math.max(16, Math.min(W - 16, rawPts[idx][0] + Math.cos(angle) * radius));
          displayPts[idx][1] = Math.max(16, Math.min(H - 16, rawPts[idx][1] + Math.sin(angle) * radius));
        });
      }
    }

    const landPath =
      isSriLankaArea && spanLat > 0.22
        ? COASTLINE.map((c) => project(c[0], c[1]).map((n) => n.toFixed(1)).join(",")).join(" ")
        : "";

    const townLabels = isSriLankaArea
      ? SL_TOWN_LABELS.map((t) => {
          const [x, y] = project(t.lat, t.lng);
          return { name: t.name, x, y };
        }).filter((t) => t.x > 28 && t.x < W - 28 && t.y > 24 && t.y < H - 18)
      : [];

    return { W, H, spanLat, isSriLankaArea, landPath, displayPts, townLabels };
  }, [allMapPoints]);

  const activePin = useMemo(
    () => allMapPoints.find((p) => p.id === selectedPinId) ?? null,
    [allMapPoints, selectedPinId]
  );

  const baseHotel = hotelName || "Primary Hotel";
  const hotelQuery = `${baseHotel} ${destination}`.trim();
  const getDisplayName = (item: StopItem) =>
    item.id === "d6_1"
      ? baseHotel
      : item.id === "d5_hotel"
        ? `${baseHotel} (Luggage Drop / Check-in)`
        : item.name;
  const getDisplayQuery = (item: StopItem) =>
    item.id === "d6_1" || item.id === "d5_hotel" ? hotelQuery : item.query;

  return (
    <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
            Offline Route Map
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
          {allMapPoints.length > 0 ? "Tap pins to inspect" : destination}
        </span>
      </div>

      {/* Cartographic SVG Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-sand-200 dark:border-slate-800 bg-gradient-to-br from-[#d5e9f0] to-[#cbe2ec] dark:from-[#102026] dark:to-[#0c181d]">
        {allMapPoints.length > 0 ? (
          <svg
            viewBox={`0 0 ${mapGeometry.W} ${mapGeometry.H}`}
            className="w-full h-auto block select-none"
            role="img"
            aria-label="Offline route map with clickable stops"
          >
            {/* Subtle Nautical Grid Lines */}
            <g className="stroke-slate-500/10 dark:stroke-slate-400/10" strokeWidth="1" strokeDasharray="3 4">
              <line x1="0" y1={mapGeometry.H * 0.33} x2={mapGeometry.W} y2={mapGeometry.H * 0.33} />
              <line x1="0" y1={mapGeometry.H * 0.66} x2={mapGeometry.W} y2={mapGeometry.H * 0.66} />
              <line x1={mapGeometry.W * 0.33} y1="0" x2={mapGeometry.W * 0.33} y2={mapGeometry.H} />
              <line x1={mapGeometry.W * 0.66} y1="0" x2={mapGeometry.W * 0.66} y2={mapGeometry.H} />
            </g>

            {mapGeometry.isSriLankaArea && mapGeometry.spanLat > 0.22 && mapGeometry.landPath ? (
              <polygon
                points={mapGeometry.landPath}
                className="fill-[#ebe4d1] dark:fill-[#1d2b29] stroke-[#8ca0b0] dark:stroke-[#475569]"
                strokeWidth="1.3"
              />
            ) : (
              <circle
                cx={mapGeometry.W * 0.58}
                cy={mapGeometry.H * 0.45}
                r="145"
                className="fill-[#efe9da]/55 dark:fill-[#1a2726]/65"
              />
            )}

            {/* Minimalist Town Reference Labels */}
            {mapGeometry.townLabels.map((t) => (
              <text
                key={t.name}
                x={t.x}
                y={t.y + 19}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="700"
                fontFamily="DM Sans, sans-serif"
                className="fill-slate-600/75 dark:fill-slate-400/75 pointer-events-none"
              >
                {t.name}
              </text>
            ))}

            {/* Compass Rose (Top-Left) */}
            <g transform="translate(22, 22)" className="pointer-events-none opacity-60">
              <circle cx="0" cy="0" r="10" className="fill-white/70 dark:fill-slate-900/70 stroke-slate-400/50" strokeWidth="1" />
              <path d="M0 -7 L2.5 0 L0 -1.5 L-2.5 0 Z" className="fill-brand-700 dark:fill-brand-400" />
              <text
                x="0"
                y="7.5"
                textAnchor="middle"
                fontSize="6"
                fontWeight="800"
                fontFamily="Plus Jakarta Sans, sans-serif"
                className="fill-slate-700 dark:fill-slate-300"
              >
                N
              </text>
            </g>

            {/* Driving Legs */}
            {legs.map((leg, i) => {
              const p1 = mapGeometry.displayPts[i];
              const p2 = mapGeometry.displayPts[i + 1];
              if (!p1 || !p2) return null;
              const color = legSpeedStyle(leg[1]).hex;
              return (
                <line
                  key={`leg-${i}`}
                  x1={p1[0].toFixed(1)}
                  y1={p1[1].toFixed(1)}
                  x2={p2[0].toFixed(1)}
                  y2={p2[1].toFixed(1)}
                  stroke={color}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeOpacity="0.92"
                />
              );
            })}

            {/* Pins */}
            {mapGeometry.displayPts.map((pt, i) => {
              const item = allMapPoints[i];
              if (!item) return null;
              const isCore = i < coreStops.length;
              const fill = STOP_TYPES[item.type]?.color || "#0e7c7b";
              const label = isCore ? `${i + 1}` : "★";
              const isSelected = selectedPinId === item.id;
              const opacity = isCore && !shortlist[item.id] ? 0.45 : 1;

              return (
                <g
                  key={item.id}
                  opacity={opacity}
                  onClick={() => setSelectedPinId(isSelected ? null : item.id)}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect ${getDisplayName(item)}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPinId(isSelected ? null : item.id);
                    }
                  }}
                >
                  {isSelected && (
                    <circle
                      cx={pt[0]}
                      cy={pt[1]}
                      r={16}
                      fill={fill}
                      fillOpacity="0.2"
                      stroke={fill}
                      strokeWidth="2"
                    />
                  )}
                  <circle
                    cx={pt[0]}
                    cy={pt[1]}
                    r={isCore ? 11 : 9.5}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? "2.4" : "1.8"}
                  />
                  <text
                    x={pt[0]}
                    y={pt[1] + 3.5}
                    fill="#ffffff"
                    fontSize={isCore ? 10 : 9}
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="h-[180px] flex flex-col items-center justify-center p-5 text-center">
            <MapPin className="w-6 h-6 text-brand-700 dark:text-brand-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              No stops pinned for this day yet
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Tap Add Place to pin restaurants, sights, or Google Maps links.
            </p>
          </div>
        )}
      </div>

      {/* Selected Pin Quick Inspector */}
      {activePin && (
        <div className="mt-3 p-3 rounded-2xl bg-sand-50 dark:bg-slate-800/80 border border-sand-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {getDisplayName(activePin)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{activePin.desc}</p>
          </div>
          <a
            href={getStopMapsUrl(activePin, getDisplayQuery(activePin))}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <span>Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Map Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0e7c7b]" />
            Visit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
            Eat
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
            Sunset
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
            Party
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
            Base
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-1 rounded-full bg-emerald-600" />
            &lt;30m
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-1 rounded-full bg-amber-600" />
            30–90m
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-1 rounded-full bg-rose-600" />
            90m+
          </span>
        </div>
      </div>

      {/* Primary Multi-Stop Google Maps Launch */}
      {routeItemsToLaunch.length > 0 && (
        <a
          href={gmapsMultiRouteUrl(routeItemsToLaunch)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Navigation className="w-4 h-4 shrink-0" />
          <span className="truncate">
            Open Shortlisted Route ({Math.min(10, routeItemsToLaunch.length)} stops) in Maps
          </span>
        </a>
      )}

      <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        <strong className="font-semibold text-slate-800 dark:text-slate-200">Offline tip:</strong> Download{" "}
        {destination} inside Google Maps before flying so tapping any stop launches offline navigation.
      </p>
    </section>
  );
}
