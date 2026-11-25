import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  ImagePlus,
  MapPin,
  Trash2,
  X
} from "lucide-react";
import type { GalleryPhoto, TripPlan } from "../types/trip";
import { getStoredBytesUsage } from "../utils/storage";

interface GalleryTabProps {
  trip: TripPlan;
  photos: GalleryPhoto[];
  onAddPhotos: (newPhotos: GalleryPhoto[]) => boolean;
  onUpdatePhoto: (id: string, updates: Partial<Pick<GalleryPhoto, "caption" | "dayIndex" | "location">>) => void;
  onDeletePhoto: (id: string) => void;
  onNotify: (msg: string) => void;
}

async function compressImageFile(file: File, maxDim = 960, quality = 0.72): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode image"));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.drawImage(img, 0, 0, width, height);
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length > 260_000) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.56);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function GalleryTab({
  trip,
  photos,
  onAddPhotos,
  onUpdatePhoto,
  onDeletePhoto,
  onNotify
}: GalleryTabProps) {
  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [uploadDay, setUploadDay] = useState<number>(0);
  const [uploadLocation, setUploadLocation] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const safeUploadDay = Math.min(uploadDay, Math.max(0, trip.days.length - 1));
  const dayLocationSuggestions = useMemo(
    () => trip.days[safeUploadDay]?.items.map((i) => i.name) ?? [],
    [trip.days, safeUploadDay]
  );

  const visiblePhotos = useMemo(() => {
    if (dayFilter === "all") return photos;
    return photos.filter((p) => p.dayIndex === dayFilter);
  }, [photos, dayFilter]);

  const activeLightboxIndex = useMemo(
    () => (lightboxId ? visiblePhotos.findIndex((p) => p.id === lightboxId) : -1),
    [visiblePhotos, lightboxId]
  );
  const activePhoto = activeLightboxIndex >= 0 ? visiblePhotos[activeLightboxIndex] : null;

  useEffect(() => {
    if (!activePhoto) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxId(null);
      } else if (e.key === "ArrowLeft" && activeLightboxIndex > 0) {
        setLightboxId(visiblePhotos[activeLightboxIndex - 1].id);
      } else if (e.key === "ArrowRight" && activeLightboxIndex < visiblePhotos.length - 1) {
        setLightboxId(visiblePhotos[activeLightboxIndex + 1].id);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activePhoto, activeLightboxIndex, visiblePhotos]);

  const storageMb = useMemo(() => {
    const bytes = getStoredBytesUsage();
    return (bytes / (1024 * 1024)).toFixed(2);
  }, [photos]);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    try {
      const created: GalleryPhoto[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const dataUrl = await compressImageFile(file);
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
          created.push({
            id: `pic_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            tripId: trip.id,
            dataUrl,
            caption: uploadCaption.trim() || cleanName || `${trip.destination} memory`,
            dayIndex: safeUploadDay,
            location: uploadLocation.trim() || trip.days[safeUploadDay]?.shortDate || trip.destination,
            createdAt: new Date().toISOString()
          });
        } catch {
          onNotify(`Skipped unreadable image: ${file.name}`);
        }
      }

      if (created.length > 0) {
        const saved = onAddPhotos(created);
        if (saved) {
          setUploadCaption("");
          setUploadLocation("");
          if (dayFilter !== "all" && dayFilter !== safeUploadDay) {
            setDayFilter(safeUploadDay);
          }
          onNotify(`Saved ${created.length} ${created.length === 1 ? "photo" : "photos"} offline`);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPhoto = (photo: GalleryPhoto) => {
    const a = document.createElement("a");
    a.href = photo.dataUrl;
    const slug = (photo.caption || "tripolla-memory").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.download = `${slug || "memory"}.jpg`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
            {trip.name} Gallery
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Add photos from {trip.destination} — compressed &amp; stored locally in your browser for offline viewing.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
          {photos.length} {photos.length === 1 ? "photo" : "photos"} · {storageMb} MB used offline
        </div>
      </div>

      {/* Upload & Tagging Card */}
      <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-3">
            <label htmlFor="galleryUploadDay" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Trip Day
            </label>
            <select
              id="galleryUploadDay"
              value={safeUploadDay}
              onChange={(e) => setUploadDay(Number(e.target.value))}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            >
              {trip.days.map((d, idx) => (
                <option key={`${d.code}_${idx}`} value={idx}>
                  {d.code} ({d.shortDate})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="galleryUploadLoc" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Place / Spot (optional)
            </label>
            <input
              id="galleryUploadLoc"
              type="text"
              list="gallery-spot-suggestions"
              value={uploadLocation}
              onChange={(e) => setUploadLocation(e.target.value)}
              placeholder={`Spot in ${trip.destination}`}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
            <datalist id="gallery-spot-suggestions">
              {dayLocationSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-5">
            <label htmlFor="galleryUploadCaption" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Caption (optional)
            </label>
            <input
              id="galleryUploadCaption"
              type="text"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              placeholder="Sunset view, dinner, street market..."
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Photos are auto-resized offline (~960px JPEG) so you can store 40+ memories without hitting browser limits.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-display font-bold text-sm inline-flex items-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <ImagePlus className="w-4 h-4" />
            <span>{isProcessing ? "Compressing..." : "Add Photos"}</span>
          </button>
        </div>
      </section>

      {/* Day Filter Strip */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          type="button"
          onClick={() => setDayFilter("all")}
          className={`shrink-0 min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
            dayFilter === "all"
              ? "bg-brand-600 text-white border-brand-600"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-sand-200 dark:border-slate-800 hover:border-brand-600/40"
          }`}
        >
          All Days ({photos.length})
        </button>
        {trip.days.map((d, idx) => {
          const count = photos.filter((p) => p.dayIndex === idx).length;
          const active = dayFilter === idx;
          return (
            <button
              key={`${d.code}_${idx}`}
              type="button"
              onClick={() => setDayFilter(idx)}
              className={`shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap tabular-nums ${
                active
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-sand-200 dark:border-slate-800 hover:border-brand-600/40"
              }`}
            >
              {d.code} ({count})
            </button>
          );
        })}
      </div>

      {/* Photo Grid or Empty State */}
      {visiblePhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {visiblePhotos.map((photo) => {
            const dayLabel = trip.days[photo.dayIndex]?.code ?? "Trip";
            return (
              <figure
                key={photo.id}
                className="group rounded-2xl overflow-hidden border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => setLightboxId(photo.id)}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-sand-100 dark:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  aria-label={`View photo: ${photo.caption || photo.location}`}
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.caption || photo.location || "Trip memory"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>
                <figcaption className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {photo.caption || "Trip memory"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      <span>{dayLabel}</span>
                      {photo.location && (
                        <>
                          <span aria-hidden="true" className="mx-1">
                            ·
                          </span>
                          <span>{photo.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(photo.id)}
                    aria-label={`Delete photo ${photo.caption}`}
                    className="min-w-[34px] min-h-[34px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-sand-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              {photos.length === 0 ? `Capture your ${trip.destination} moments` : "No photos tagged for this day yet"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload photos from your trip. Everything stays private on this device and opens even with zero internet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-display font-bold text-sm inline-flex items-center gap-2 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Upload First Photo</span>
          </button>
        </section>
      )}

      {/* Fullscreen Lightbox Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo details"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxId(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-sand-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                {activeLightboxIndex + 1} of {visiblePhotos.length} ·{" "}
                {trip.days[activePhoto.dayIndex]?.title ?? "Trip"}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDownloadPhoto(activePhoto)}
                  aria-label="Download photo"
                  className="min-w-[38px] min-h-[38px] rounded-xl bg-sand-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sand-200/70 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = activePhoto.id;
                    const nextCandidate =
                      visiblePhotos[activeLightboxIndex + 1]?.id ??
                      visiblePhotos[activeLightboxIndex - 1]?.id ??
                      null;
                    onDeletePhoto(idToDelete);
                    setLightboxId(nextCandidate);
                  }}
                  aria-label="Delete photo"
                  className="min-w-[38px] min-h-[38px] rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxId(null)}
                  aria-label="Close photo viewer"
                  className="min-w-[38px] min-h-[38px] rounded-xl bg-sand-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sand-200/70 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-0 bg-slate-950 flex items-center justify-center">
              <img
                src={activePhoto.dataUrl}
                alt={activePhoto.caption || activePhoto.location}
                className="max-h-[56vh] w-auto object-contain"
              />
              {activeLightboxIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setLightboxId(visiblePhotos[activeLightboxIndex - 1].id)}
                  aria-label="Previous photo"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {activeLightboxIndex < visiblePhotos.length - 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxId(visiblePhotos[activeLightboxIndex + 1].id)}
                  aria-label="Next photo"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5 border-t border-sand-200 dark:border-slate-800">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  value={activePhoto.caption}
                  onChange={(e) => onUpdatePhoto(activePhoto.id, { caption: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Spot
                  </span>
                </label>
                <input
                  type="text"
                  value={activePhoto.location}
                  onChange={(e) => onUpdatePhoto(activePhoto.id, { location: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Day
                </label>
                <select
                  value={activePhoto.dayIndex}
                  onChange={(e) => onUpdatePhoto(activePhoto.id, { dayIndex: Number(e.target.value) })}
                  className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl text-sm font-semibold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {trip.days.map((d, idx) => (
                    <option key={`${d.code}_${idx}`} value={idx}>
                      {d.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
