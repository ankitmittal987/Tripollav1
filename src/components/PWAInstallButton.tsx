import { useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWA";

interface PWAInstallButtonProps {
  variant?: "header" | "card";
  onDownloadOfflinePack?: () => void;
}

export function PWAInstallButton({ variant = "header", onDownloadOfflinePack }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === "header"
            ? "min-h-[40px] px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all"
            : "w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install Offline App</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className={
          variant === "header"
            ? "min-h-[40px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 backdrop-blur-xs whitespace-nowrap shrink-0 transition-colors"
            : "w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-sand-200 dark:border-slate-700 bg-sand-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold inline-flex items-center justify-center gap-2 hover:border-brand-600/40 transition-colors"
        }
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>{isIOS ? "Install on iPhone" : "Install Offline App"}</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install Tripolla Offline"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-800 p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Save Tripolla for Offline Use
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install guide"
                className="min-w-[34px] min-h-[34px] rounded-xl bg-sand-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>
                  Open Tripolla directly in <strong>Safari</strong>.
                </li>
                <li>
                  Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
              </ol>
            ) : (
              <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>
                  Open Tripolla directly in <strong>Chrome or Edge</strong> (outside any embedded preview).
                </li>
                <li>
                  Tap the browser menu (⋮) → <strong>Install app</strong> / <strong>Add to Home screen</strong>.
                </li>
                <li>
                  Or download your complete trip as a standalone <strong>Offline HTML file</strong> below.
                </li>
              </ol>
            )}

            {onDownloadOfflinePack && (
              <button
                type="button"
                onClick={() => {
                  onDownloadOfflinePack();
                  setShowGuide(false);
                }}
                className="w-full min-h-[44px] rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Offline Trip (.html)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
