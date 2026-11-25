import type { GalleryPhoto, TripPlan } from "../types/trip";
import { getDayDateString, resolveHotelForDay } from "../data/destinationSuggestions";
import { computeExpenseSettlements, formatMoney, formatTripDateRange } from "../data/tripBuilder";
import { getStopMapsUrl } from "../data/tripData";

export const SHARED_PUBLIC_APP_URL =
  "https://ais-pre-hmd535anyfsjbd46dndmfc-1000880265566.asia-east1.run.app";

export function resolveFinalApkUrl(): string {
  if (typeof window === "undefined") return SHARED_PUBLIC_APP_URL;
  const origin = window.location.origin;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return SHARED_PUBLIC_APP_URL;
  }
  if (origin.includes("ais-dev-")) {
    return origin.replace("ais-dev-", "ais-pre-");
  }
  return origin;
}

function esc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadWebManifestFile(appOrigin?: string) {
  const cleanOrigin = (appOrigin || resolveFinalApkUrl()).replace(/\/+$/, "");
  const manifestObj = {
    id: "/",
    name: "Tripolla · Universal Trip Planner",
    short_name: "Tripolla",
    description:
      "Offline-ready travel planner for any country or city — itineraries, route maps, flights, multi-currency expense splitter, photo gallery, and checklists.",
    start_url: `${cleanOrigin}/`,
    scope: `${cleanOrigin}/`,
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#0e7c7b",
    background_color: "#faf8f4",
    lang: "en",
    dir: "ltr",
    categories: ["travel", "navigation", "productivity"],
    prefer_related_applications: false,
    icons: [
      {
        src: `${cleanOrigin}/pwa-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: `${cleanOrigin}/pwa-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: `${cleanOrigin}/pwa-maskable-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: `${cleanOrigin}/screenshot-mobile.png`,
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: "Tripolla mobile countdown, itinerary, and offline route map"
      },
      {
        src: `${cleanOrigin}/screenshot-desktop.png`,
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Tripolla desktop trip planner, hotel stays, and offline map"
      }
    ]
  };

  triggerDownload("manifest.json", JSON.stringify(manifestObj, null, 2), "application/manifest+json");
}

export function downloadOfflineTripHtml(trip: TripPlan, gallery: GalleryPhoto[]) {
  const dateRange = formatTripDateRange(trip.startDate, trip.days.length);
  const settlements = computeExpenseSettlements(trip.members, trip.expenses, trip.currency);
  const totalHome = settlements.paidTotals.reduce((a, b) => a + b, 0);

  const hotelsHtml = (trip.hotelStays || [])
    .slice()
    .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
    .map(
      (h) => `
      <div class="card">
        <strong>${esc(h.name)}</strong>
        <div class="meta">Check-in: ${esc(h.checkInDate)} · Check-out: ${esc(h.checkOutDate)}</div>
      </div>`
    )
    .join("");

  const daysHtml = trip.days
    .map((d, idx) => {
      const dayDate = getDayDateString(trip.startDate, idx);
      const resolved = resolveHotelForDay(trip.hotelStays || [], dayDate, trip.hotelName);
      const picked = d.items.filter((item) => trip.shortlist[item.id] || item.tier === "core");
      const stopsHtml = picked
        .map(
          (item, sIdx) => `
          <li>
            <div class="stop-row">
              <strong>${sIdx + 1}. ${esc(item.name)}</strong>
              <a href="${esc(getStopMapsUrl(item, item.query))}" target="_blank" rel="noopener">Maps</a>
            </div>
            <div class="desc">${esc(item.desc)}</div>
          </li>`
        )
        .join("");

      const noteHtml = trip.notes[idx]
        ? `<div class="note"><strong>Notes:</strong> ${esc(trip.notes[idx])}</div>`
        : "";

      return `
      <section class="day-card">
        <h3>${esc(d.title)}</h3>
        <div class="meta">${esc(resolved.summaryText)} · ${esc(d.summary)}</div>
        <ol class="stops">${stopsHtml || "<li>No stops planned yet</li>"}</ol>
        ${noteHtml}
      </section>`;
    })
    .join("");

  const flightsHtml = trip.flights
    .map(
      (f) => `
      <div class="card">
        <div><strong>${esc(f.airline)} ${esc(f.flightNo)}</strong> · ${esc(f.fromCode)} → ${esc(f.toCode)}</div>
        <div class="meta">Date: ${esc(f.travelDate || trip.startDate)} · ${esc(f.depTime)} → ${esc(
          f.arrTime
        )} · PNR: <code>${esc(f.pnr)}</code></div>
        <div class="meta">Travelers: ${esc(
          f.travelerNames?.length ? f.travelerNames.join(", ") : trip.members.join(", ")
        )}</div>
      </div>`
    )
    .join("");

  const transferLines =
    settlements.transfers.length === 0
      ? `<p class="meta">All settled up (${esc(trip.currency.home)})</p>`
      : `<ul>${settlements.transfers
          .map(
            (t) =>
              `<li>${esc(t.from)} owes ${esc(t.to)}: <strong>${esc(
                formatMoney(t.amount, trip.currency.home, 2)
              )}</strong></li>`
          )
          .join("")}</ul>`;

  const checklistHtml = trip.checklist
    .map(
      (c) =>
        `<li>${c.done ? "☑" : "☐"} ${esc(c.text)} <span class="meta">(${esc(c.cat)})</span></li>`
    )
    .join("");

  const phrasesHtml = trip.phrases
    .map((p) => `<li><strong>${esc(p.phrase)}</strong> — ${esc(p.meaning)}</li>`)
    .join("");

  const emergencyHtml = trip.emergencyContacts
    .map((e) => `<li><strong>${esc(e.label)}:</strong> ${esc(e.number)}</li>`)
    .join("");

  const photosHtml = gallery.length
    ? `<section><h2>Offline Photo Memories (${gallery.length})</h2><div class="photos">${gallery
        .map(
          (p) => `
        <figure class="photo-card">
          <img src="${esc(p.dataUrl)}" alt="${esc(p.caption || "Trip photo")}" />
          <figcaption>${esc(p.caption || "Memory")} ${p.location ? `· ${esc(p.location)}` : ""}</figcaption>
        </figure>`
        )
        .join("")}</div></section>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(trip.name)} · Tripolla Offline Pack</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #faf8f4; color: #0f172a; line-height: 1.5; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f1616; color: #f1f5f9; }
      .card, .day-card, .photo-card { background: #162020 !important; border-color: #263535 !important; }
      .meta, .desc { color: #94a3b8 !important; }
    }
    .wrap { max-width: 860px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #0e7c7b, #0f4c5c); color: #fff; padding: 24px; border-radius: 20px; margin-bottom: 20px; }
    header h1 { margin: 0 0 6px; font-size: 26px; }
    h2 { font-size: 18px; margin: 24px 0 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
    h3 { margin: 0 0 6px; font-size: 16px; color: #0e7c7b; }
    .card, .day-card { background: #fff; border: 1px solid #e7e1d5; border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; }
    .meta { font-size: 13px; color: #475569; }
    .desc { font-size: 13px; color: #475569; margin-top: 2px; }
    .stops { padding-left: 18px; margin: 10px 0 0; }
    .stops li { margin-bottom: 8px; }
    .stop-row { display: flex; justify-content: space-between; gap: 10px; }
    .note { margin-top: 10px; padding: 10px; border-radius: 10px; background: rgba(14,124,123,0.08); font-size: 13px; }
    a { color: #0e7c7b; font-weight: 600; text-decoration: none; }
    .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .photo-card { background: #fff; border: 1px solid #e7e1d5; border-radius: 12px; overflow: hidden; margin: 0; }
    .photo-card img { width: 100%; height: 150px; object-fit: cover; display: block; }
    .photo-card figcaption { padding: 8px; font-size: 12px; }
    ul { padding-left: 18px; }
    @media print { body { background: #fff; } header { color: #000; background: #e2e8f0; } }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${esc(trip.name)}</h1>
      <div>${esc(trip.destination)} · ${esc(dateRange)} (${trip.days.length} days)</div>
      <div style="font-size:13px;opacity:.9;margin-top:6px;">Travelers: ${esc(trip.members.join(", "))} · Generated by Tripolla (100% Offline File)</div>
    </header>

    <section>
      <h2>Base Hotels (Check-in / Check-out)</h2>
      ${hotelsHtml || `<div class="card">${esc(trip.hotelName)}</div>`}
    </section>

    <section>
      <h2>Day-by-Day Itinerary</h2>
      ${daysHtml}
    </section>

    <section>
      <h2>Flights &amp; PNRs</h2>
      ${flightsHtml || '<p class="meta">No flights logged.</p>'}
    </section>

    <section>
      <h2>Expenses Summary (${esc(formatMoney(Math.round(totalHome), trip.currency.home))})</h2>
      <div class="card">
        ${transferLines}
      </div>
    </section>

    <section>
      <h2>Checklist &amp; Essential Phrases</h2>
      <div class="card">
        <ul>${checklistHtml}</ul>
        ${phrasesHtml ? `<h4>Local Phrases</h4><ul>${phrasesHtml}</ul>` : ""}
        ${emergencyHtml ? `<h4>Emergency Numbers</h4><ul>${emergencyHtml}</ul>` : ""}
      </div>
    </section>

    ${photosHtml}
  </div>
</body>
</html>`;

  const slug = trip.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "tripolla-trip";
  triggerDownload(`tripolla-${slug}-offline.html`, html, "text/html;charset=utf-8");
}

export async function warmOfflineAppCache(): Promise<{ ok: boolean; cachedCount: number }> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return { ok: false, cachedCount: 0 };
  }
  const urls = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/manifest.json",
    "/icon.svg",
    "/pwa-192x192.png",
    "/pwa-512x512.png",
    "/pwa-maskable-512x512.png",
    "/apple-touch-icon.png"
  ];
  try {
    const cache = await caches.open("tripolla-offline-shell-v1");
    let count = 0;
    await Promise.all(
      urls.map(async (u) => {
        try {
          const res = await fetch(u, { cache: "no-cache" });
          if (res.ok) {
            await cache.put(u, res);
            count++;
          }
        } catch {
          // Ignore individual offline/optional misses
        }
      })
    );
    return { ok: count > 0, cachedCount: count };
  } catch {
    return { ok: false, cachedCount: 0 };
  }
}
