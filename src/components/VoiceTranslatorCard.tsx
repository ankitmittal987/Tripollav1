import { useEffect, useRef, useState } from "react";
import { ExternalLink, Languages, Mic, MicOff, Volume2 } from "lucide-react";
import { WORLD_LANGUAGES, detectDestinationLanguage } from "../data/destinationSuggestions";

interface VoiceTranslatorCardProps {
  destination: string;
  baseHotel?: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function VoiceTranslatorCard({ destination, baseHotel }: VoiceTranslatorCardProps) {
  const detected = detectDestinationLanguage(destination);
  const [targetLang, setTargetLang] = useState<string>(detected.code);
  const [text, setText] = useState<string>("");
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setTargetLang(detectDestinationLanguage(destination).code);
  }, [destination]);

  const langObj = WORLD_LANGUAGES.find((l) => l.code === targetLang) ?? detected;

  const speechSupported =
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition
    );

  const toggleMic = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      setMicNote("Voice mic is unavailable in this browser — type a phrase below or open Google Translate directly.");
      return;
    }

    try {
      const rec = new Rec();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (e: SpeechRecognitionEventLike) => {
        const parts: string[] = [];
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i]?.[0]?.transcript;
          if (t) parts.push(t);
        }
        setText(parts.join(" ").trim());
      };
      rec.onerror = () => {
        setListening(false);
        setMicNote("Could not capture audio (check mic permissions or internet).");
      };
      rec.onend = () => {
        setListening(false);
      };
      recognitionRef.current = rec;
      setMicNote(null);
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setMicNote("Could not start microphone.");
    }
  };

  const handleSpeakAloud = () => {
    if (!text.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.trim());
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  };

  const quickPrompts = [
    "No meat please, vegetarian only",
    "How much is this?",
    `Please take me to ${baseHotel || "my hotel"}`,
    "Where is the nearest station?"
  ];

  const translateUrl = `https://translate.google.com/?sl=auto&tl=${encodeURIComponent(
    targetLang
  )}&text=${encodeURIComponent(text.trim())}&op=translate`;

  const voiceAppUrl = `https://translate.google.com/?sl=en&tl=${encodeURIComponent(targetLang)}&op=translate`;

  return (
    <section className="rounded-3xl border border-sand-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Google Translate &amp; Voice Mic
          </h3>
        </div>
        <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
          {langObj.label.split("(")[0].trim()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <div className="sm:col-span-5">
          <label htmlFor="translateTargetLang" className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Destination Language
          </label>
          <select
            id="translateTargetLang"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            {WORLD_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-7 flex items-end gap-2">
          <button
            type="button"
            onClick={toggleMic}
            className={`flex-1 min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors ${
              listening
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-brand-600 hover:bg-brand-700 text-white"
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{listening ? "Stop Listening" : speechSupported ? "Speak with Mic" : "Voice Input"}</span>
          </button>

          {text.trim() && (
            <button
              type="button"
              onClick={handleSpeakAloud}
              aria-label="Read phrase aloud"
              className="min-w-[42px] min-h-[42px] rounded-xl border border-sand-200 dark:border-slate-700 bg-sand-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tap Speak with Mic or type what you want to say to a driver, waiter, or shopkeeper..."
          aria-label="Phrase to translate"
          className="w-full p-3 rounded-2xl text-sm bg-sand-50 dark:bg-slate-950 border border-sand-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600 resize-none"
        />
        {micNote && <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">{micNote}</p>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {quickPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setText(p)}
            className="px-2.5 py-1.5 rounded-xl bg-sand-100 dark:bg-slate-800 hover:bg-sand-200/80 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors text-left"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <a
          href={translateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Translate in Google Translate</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href={voiceAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] py-2.5 px-4 rounded-2xl bg-sand-100 dark:bg-slate-800 hover:bg-sand-200/70 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Mic className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Open Live Mic Mode</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
}
