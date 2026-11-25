import type {
  ChecklistItem,
  DayPlan,
  ExpenseItem,
  GalleryPhoto,
  HotelStay,
  StopItem,
  TripCurrencyConfig,
  TripFlight,
  TripMilestone,
  TripPhrase,
  TripPlan
} from "../types/trip";
import {
  DAYS_DATA,
  DEFAULT_PACKING_CHECKLIST,
  FLIGHTS,
  LOCAL_TIPS,
  MILESTONES,
  SINHALA_PHRASES,
  getDefaultShortlist
} from "./tripData";
import { generateSuggestionsForDay, getDayDateString } from "./destinationSuggestions";

export interface CurrencyPreset {
  code: string;
  label: string;
  symbol: string;
  perUsd: number;
}

export const WORLD_CURRENCIES: CurrencyPreset[] = [
  { code: "INR", label: "Indian Rupee", symbol: "₹", perUsd: 84.5 },
  { code: "USD", label: "US Dollar", symbol: "$", perUsd: 1 },
  { code: "EUR", label: "Euro", symbol: "€", perUsd: 0.92 },
  { code: "GBP", label: "British Pound", symbol: "£", perUsd: 0.79 },
  { code: "JPY", label: "Japanese Yen", symbol: "¥", perUsd: 152 },
  { code: "THB", label: "Thai Baht", symbol: "฿", perUsd: 34.5 },
  { code: "IDR", label: "Indonesian Rupiah", symbol: "Rp", perUsd: 15800 },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", perUsd: 1.34 },
  { code: "AED", label: "UAE Dirham", symbol: "AED", perUsd: 3.67 },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", perUsd: 1.53 },
  { code: "LKR", label: "Sri Lankan Rupee", symbol: "Rs", perUsd: 300 },
  { code: "VND", label: "Vietnamese Dong", symbol: "₫", perUsd: 25300 },
  { code: "MYR", label: "Malaysian Ringgit", symbol: "RM", perUsd: 4.45 },
  { code: "KRW", label: "South Korean Won", symbol: "₩", perUsd: 1390 },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF", perUsd: 0.88 },
  { code: "TRY", label: "Turkish Lira", symbol: "₺", perUsd: 34.5 }
];

export function getCurrencySymbol(code: string): string {
  const found = WORLD_CURRENCIES.find((c) => c.code === code.toUpperCase());
  return found ? found.symbol : code.toUpperCase();
}

export function formatMoney(amount: number, code: string, decimals = 0): string {
  const upper = code.toUpperCase();
  const sym = getCurrencySymbol(upper);
  const locale = upper === "INR" ? "en-IN" : "en-US";
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return sym.length <= 2 ? `${sym}${formatted}` : `${sym} ${formatted}`;
}

export function suggestCurrencyConfig(homeCode: string, localCode: string): TripCurrencyConfig {
  const home = homeCode.toUpperCase() || "USD";
  const local = localCode.toUpperCase() || "EUR";
  const homePerUsd = WORLD_CURRENCIES.find((c) => c.code === home)?.perUsd ?? 1;
  const localPerUsd = WORLD_CURRENCIES.find((c) => c.code === local)?.perUsd ?? 1;
  const rawHomeToLocal = localPerUsd / homePerUsd;
  const homeToLocal =
    rawHomeToLocal >= 100
      ? Math.round(rawHomeToLocal)
      : Math.round(rawHomeToLocal * 100) / 100;
  return {
    home,
    local,
    homeToLocal: homeToLocal > 0 ? homeToLocal : 1,
    usdToHome: homePerUsd > 0 ? Math.round(homePerUsd * 100) / 100 : 1
  };
}

export function convertToHomeCurrency(amt: number, cur: string, cfg: TripCurrencyConfig): number {
  const code = cur.toUpperCase();
  const home = cfg.home.toUpperCase();
  const local = cfg.local.toUpperCase();
  const homeToLocal = cfg.homeToLocal > 0 ? cfg.homeToLocal : 1;
  const usdToHome = cfg.usdToHome > 0 ? cfg.usdToHome : 1;

  if (code === home) return amt;
  if (code === "USD") return amt * usdToHome;
  if (code === local) return amt / homeToLocal;
  const preset = WORLD_CURRENCIES.find((c) => c.code === code);
  if (preset && preset.perUsd > 0) {
    return (amt / preset.perUsd) * usdToHome;
  }
  return amt;
}

export function convertBetweenCurrencies(
  amt: number,
  fromCur: string,
  toCur: string,
  cfg: TripCurrencyConfig
): number {
  const homeVal = convertToHomeCurrency(amt, fromCur, cfg);
  const target = toCur.toUpperCase();
  const home = cfg.home.toUpperCase();
  const local = cfg.local.toUpperCase();
  if (target === home) return homeVal;
  if (target === "USD") return homeVal / (cfg.usdToHome > 0 ? cfg.usdToHome : 1);
  if (target === local) return homeVal * (cfg.homeToLocal > 0 ? cfg.homeToLocal : 1);
  return homeVal;
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
}

export function computeExpenseSettlements(
  members: string[],
  expenses: ExpenseItem[],
  currency: TripCurrencyConfig
): { paidTotals: number[]; shareTotals: number[]; transfers: SettlementTransfer[] } {
  const count = members.length;
  const paidTotals = new Array<number>(count).fill(0);
  const shareTotals = new Array<number>(count).fill(0);

  if (count === 0) {
    return { paidTotals, shareTotals, transfers: [] };
  }

  expenses.forEach((item) => {
    const valHome = convertToHomeCurrency(Number(item.amt) || 0, item.cur, currency);
    if (valHome <= 0) return;

    const payerIdx = item.by >= 0 && item.by < count ? item.by : 0;
    paidTotals[payerIdx] += valHome;

    const validParticipants =
      Array.isArray(item.splitAmong) && item.splitAmong.length > 0
        ? Array.from(new Set(item.splitAmong.filter((idx) => idx >= 0 && idx < count)))
        : members.map((_, idx) => idx);

    const activeParticipants = validParticipants.length > 0 ? validParticipants : members.map((_, idx) => idx);
    const perPerson = valHome / activeParticipants.length;
    activeParticipants.forEach((pIdx) => {
      shareTotals[pIdx] += perPerson;
    });
  });

  const debtors: { name: string; owes: number }[] = [];
  const creditors: { name: string; owed: number }[] = [];

  members.forEach((name, idx) => {
    const net = paidTotals[idx] - shareTotals[idx];
    if (net < -0.5) debtors.push({ name: name || `Traveler ${idx + 1}`, owes: -net });
    else if (net > 0.5) creditors.push({ name: name || `Traveler ${idx + 1}`, owed: net });
  });

  debtors.sort((a, b) => b.owes - a.owes);
  creditors.sort((a, b) => b.owed - a.owed);

  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].owes, creditors[j].owed);
    if (amt >= 0.5) {
      transfers.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: amt
      });
    }
    debtors[i].owes -= amt;
    creditors[j].owed -= amt;
    if (debtors[i].owes < 0.5) i++;
    if (creditors[j].owed < 0.5) j++;
  }

  return { paidTotals, shareTotals, transfers };
}

export function buildDayLabels(startDate: string, dayIdx: number): { code: string; shortDate: string; title: string } {
  const base = startDate ? new Date(`${startDate}T12:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) {
    return {
      code: `D${dayIdx + 1}`,
      shortDate: `Day ${dayIdx + 1}`,
      title: `Day ${dayIdx + 1}`
    };
  }
  const d = new Date(base.getTime() + dayIdx * 86400000);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return {
    code: `D${dayIdx + 1} · ${dayNum} ${month}`,
    shortDate: `${weekday} ${dayNum}`,
    title: `Day ${dayIdx + 1} · ${weekday} ${dayNum} ${month}`
  };
}

export function formatTripDateRange(startDate: string, numDays: number): string {
  const base = startDate ? new Date(`${startDate}T12:00:00`) : null;
  if (!base || Number.isNaN(base.getTime())) return `${numDays} Days`;
  const end = new Date(base.getTime() + Math.max(0, numDays - 1) * 86400000);
  const startMonth = base.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const year = end.getFullYear();
  if (numDays <= 1) return `${base.getDate()} ${startMonth} ${year}`;
  if (startMonth === endMonth && base.getFullYear() === end.getFullYear()) {
    return `${base.getDate()}–${end.getDate()} ${startMonth} ${year}`;
  }
  return `${base.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${year}`;
}

export interface DestinationTemplate {
  id: string;
  label: string;
  name: string;
  destination: string;
  daysCount: number;
  hotelName: string;
  localCurrency: string;
  centerLat: number;
  centerLng: number;
  airportName: string;
  airportCode: string;
  phrases: TripPhrase[];
  tips: string[];
  emergencyContacts: { label: string; number: string }[];
}

export const DESTINATION_TEMPLATES: DestinationTemplate[] = [
  {
    id: "custom",
    label: "Any Custom Country or City (Auto-Suggested)",
    name: "My Custom Trip",
    destination: "",
    daysCount: 5,
    hotelName: "Central Hotel",
    localCurrency: "USD",
    centerLat: 48.8566,
    centerLng: 2.3522,
    airportName: "Arrival Airport",
    airportCode: "ARR",
    phrases: [
      { id: "p1", phrase: "Hello / Please / Thank you", meaning: "Local polite essentials", note: "Tap Voice Translator below" }
    ],
    tips: [
      "Download your destination's Offline Map inside Google Maps before departing.",
      "Keep small local currency notes handy for street markets, transit, and tips.",
      "Save digital copies of passports, visas, and hotel bookings offline."
    ],
    emergencyContacts: [{ label: "Emergency", number: "112" }]
  },
  {
    id: "japan",
    label: "Tokyo & Kyoto, Japan",
    name: "Japan Highlights",
    destination: "Tokyo & Kyoto, Japan",
    daysCount: 5,
    hotelName: "Shinjuku Prince Hotel",
    localCurrency: "JPY",
    centerLat: 35.6762,
    centerLng: 139.6503,
    airportName: "Haneda / Narita Airport (TYO)",
    airportCode: "HND",
    phrases: [
      { id: "jp1", phrase: "Sumimasen", meaning: "Excuse me / Sorry", note: "Restaurants & stations" },
      { id: "jp2", phrase: "Arigato gozaimasu", meaning: "Thank you very much", note: "Polite everyday" },
      { id: "jp3", phrase: "Ikura desu ka?", meaning: "How much is this?", note: "Markets & shops" },
      { id: "jp4", phrase: "Oishii!", meaning: "Delicious!", note: "Compliment chefs" }
    ],
    tips: [
      "Add a digital Suica/PASMO IC card to Apple Wallet or grab a Welcome Suica at the airport for trains & konbini.",
      "Carry a coin pouch + cash — many ramen shops and temples are cash-only.",
      "Book Shinkansen seats on the right (E seat) for Mt. Fuji views between Tokyo and Kyoto."
    ],
    emergencyContacts: [
      { label: "Police", number: "110" },
      { label: "Ambulance / Fire", number: "119" }
    ]
  },
  {
    id: "bali",
    label: "Bali, Indonesia",
    name: "Bali Island Escape",
    destination: "Bali, Indonesia",
    daysCount: 5,
    hotelName: "Ubud & Seminyak Villa",
    localCurrency: "IDR",
    centerLat: -8.5069,
    centerLng: 115.2625,
    airportName: "Ngurah Rai Airport (DPS)",
    airportCode: "DPS",
    phrases: [
      { id: "id1", phrase: "Terima kasih", meaning: "Thank you", note: "Used everywhere" },
      { id: "id2", phrase: "Permisi", meaning: "Excuse me", note: "Polite passing" },
      { id: "id3", phrase: "Berapa harganya?", meaning: "How much?", note: "Art markets" }
    ],
    tips: [
      "Install Grab & Gojek for scooters, cars, and food delivery across Canggu, Seminyak & Ubud.",
      "Drink only bottled or filtered water and carry reef-safe sunscreen.",
      "Wear a sarong & sash when entering Hindu temples (usually provided at temple gates)."
    ],
    emergencyContacts: [
      { label: "Emergency", number: "112" },
      { label: "Tourist Police", number: "+62361224111" }
    ]
  },
  {
    id: "thailand",
    label: "Bangkok & Islands, Thailand",
    name: "Thailand Explorer",
    destination: "Bangkok & Phuket, Thailand",
    daysCount: 5,
    hotelName: "Sukhumvit Hotel",
    localCurrency: "THB",
    centerLat: 13.7563,
    centerLng: 100.5018,
    airportName: "Suvarnabhumi Airport (BKK)",
    airportCode: "BKK",
    phrases: [
      { id: "th1", phrase: "Sawadee khrap / kha", meaning: "Hello / Goodbye", note: "khrap (m) / kha (f)" },
      { id: "th2", phrase: "Khop khun khrap / kha", meaning: "Thank you", note: "Everyday polite" },
      { id: "th3", phrase: "Mai phet", meaning: "Not spicy", note: "Street food lifesaver" }
    ],
    tips: [
      "Use BTS Skytrain, MRT, and Grab in Bangkok to skip heavy rush-hour traffic.",
      "Keep 20, 100 & 500 THB notes for night markets and tuk-tuks.",
      "Grand Palace requires covered shoulders & full-length pants/skirts."
    ],
    emergencyContacts: [
      { label: "Tourist Police", number: "1155" },
      { label: "Emergency", number: "191" }
    ]
  },
  {
    id: "europe",
    label: "Paris, France",
    name: "Paris City Break",
    destination: "Paris, France",
    daysCount: 4,
    hotelName: "Le Marais Boutique Hotel",
    localCurrency: "EUR",
    centerLat: 48.8566,
    centerLng: 2.3522,
    airportName: "Charles de Gaulle Airport (CDG)",
    airportCode: "CDG",
    phrases: [
      { id: "fr1", phrase: "Bonjour", meaning: "Hello / Good day", note: "Always greet before asking" },
      { id: "fr2", phrase: "Merci beaucoup", meaning: "Thank you very much", note: "Cafes & shops" },
      { id: "fr3", phrase: "L'addition, s'il vous plaît", meaning: "The bill, please", note: "Restaurants" }
    ],
    tips: [
      "Tap-to-pay works nearly everywhere; load Navigo Easy on your phone for Metro & RER.",
      "Book timed entry tickets early for Louvre, Eiffel Tower, and Musée d'Orsay.",
      "Ask for 'une carafe d'eau' for complimentary tap water at restaurants."
    ],
    emergencyContacts: [
      { label: "EU Emergency", number: "112" },
      { label: "Police", number: "17" }
    ]
  }
];

export function createUniversalChecklist(destination: string, hotelName: string): ChecklistItem[] {
  const destLabel = destination.trim() || "your destination";
  return [
    { id: "u_pass", cat: "Documents", text: "Passports / IDs (valid 6+ months) & visa / entry approval", done: false },
    { id: "u_tix", cat: "Documents", text: `Flight tickets + ${hotelName || "hotel"} check-in confirmations`, done: false },
    { id: "u_gmap", cat: "Offline Maps", text: `Google Maps → Offline Maps → Download ${destLabel} region`, done: false },
    { id: "u_money", cat: "Money & Apps", text: "Zero-forex card + backup local currency cash", done: false },
    { id: "u_sim", cat: "Money & Apps", text: "Travel eSIM / roaming + local ride-hailing app (Uber / Grab / Bolt)", done: false },
    { id: "u_plug", cat: "Gear", text: "Universal power adapter, power bank & charging cables", done: false },
    { id: "u_med", cat: "Gear", text: "Personal medicines, sunscreen & weather-ready layers", done: false }
  ];
}

export function createNewTripPlan(opts: {
  templateId: string;
  name: string;
  destination: string;
  travelersLabel?: string;
  startDate: string;
  departureTime: string;
  daysCount: number;
  hotelName: string;
  homeCurrency: string;
  localCurrency: string;
  members: string[];
  flights?: Omit<TripFlight, "id">[];
}): TripPlan {
  if (opts.templateId === "sri_lanka") {
    return createSriLankaTripPlan({
      name: opts.name,
      travelersLabel: opts.members.join(", "),
      startDate: opts.startDate,
      hotelName: opts.hotelName,
      members: opts.members
    });
  }

  const tpl = DESTINATION_TEMPLATES.find((t) => t.id === opts.templateId) ?? DESTINATION_TEMPLATES[0];
  const dest = opts.destination.trim() || tpl.destination || "My Destination";
  const hotel = opts.hotelName.trim() || tpl.hotelName || "Primary Hotel";
  const count = Math.min(14, Math.max(1, Math.round(opts.daysCount) || 5));
  const idPrefix = `t_${Date.now().toString(36)}`;
  const checkOutDate = getDayDateString(opts.startDate, count - 1) || opts.startDate;

  const hotelStays: HotelStay[] = [
    {
      id: `${idPrefix}_h1`,
      name: hotel,
      query: `${hotel} ${dest}`,
      checkInDate: opts.startDate,
      checkOutDate
    }
  ];

  const days: DayPlan[] = [];
  const shortlist: Record<string, boolean> = {};

  for (let i = 0; i < count; i++) {
    const labels = buildDayLabels(opts.startDate, i);
    const items: StopItem[] = [];

    if (i === 0) {
      const arrId = `${idPrefix}_d0_arr`;
      items.push({
        id: arrId,
        name: tpl.id !== "custom" ? tpl.airportName : `${dest} Arrival`,
        query: tpl.id !== "custom" ? `${tpl.airportName} ${dest}` : `${dest} Airport`,
        lat: tpl.centerLat + 0.035,
        lng: tpl.centerLng - 0.035,
        desc: `Arrive in ${dest} and transfer to ${hotel}`,
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      });
      shortlist[arrId] = true;
    }

    const suggestions = generateSuggestionsForDay(dest, i, count, tpl.centerLat, tpl.centerLng);
    suggestions.forEach((s) => {
      items.push(s);
      shortlist[s.id] = true;
    });

    days.push({
      code: labels.code,
      shortDate: labels.shortDate,
      title: labels.title,
      summary:
        i === 0
          ? `Arrival in ${dest}, check-in & first highlights`
          : i === count - 1
            ? `Final morning in ${dest} & departure`
            : `Suggested ${dest} highlights — customize, reorder, or add Google Maps spots`,
      legs: [],
      items
    });
  }

  const members = opts.members.length >= 1 ? opts.members : ["Traveler 1", "Traveler 2"];

  const flights: TripFlight[] =
    opts.flights && opts.flights.length > 0
      ? opts.flights.map((f, idx) => ({ ...f, id: `${idPrefix}_fl_${idx}` }))
      : [
          {
            id: `${idPrefix}_fl_out`,
            header: `Outbound · ${days[0]?.shortDate || "Day 1"}`,
            airline: "Airline",
            flightNo: "FLT 101",
            fromCode: "ORG",
            fromCity: "Home City",
            toCode: tpl.airportCode || "DST",
            toCity: dest.split(",")[0].trim(),
            pnr: "ABC123",
            travelDate: opts.startDate,
            depTime: opts.departureTime || "08:00",
            arrTime: "12:00",
            travelerNames: [],
            fr24: "",
            fa: "",
            note: "Tap edit to customize airline, flight number, PNR, and assigned travelers."
          }
        ];

  const milestones: TripMilestone[] = [
    {
      id: `${idPrefix}_ms_1`,
      dateTime: `${opts.startDate}T${opts.departureTime || "08:00"}`,
      label: `Depart for ${dest}`
    }
  ];

  return {
    id: idPrefix,
    name: opts.name.trim() || `${dest} Trip`,
    destination: dest,
    travelersLabel: opts.travelersLabel?.trim() || members.join(", "),
    startDate: opts.startDate,
    departureTime: opts.departureTime || "08:00",
    hotelName: hotel,
    hotelStays,
    currency: suggestCurrencyConfig(opts.homeCurrency, opts.localCurrency),
    days,
    shortlist,
    dayOrder: {},
    notes: {},
    flights,
    milestones,
    members,
    expenses: [],
    checklist: createUniversalChecklist(dest, hotel),
    phrases: tpl.phrases,
    tips: tpl.tips,
    emergencyContacts: tpl.emergencyContacts
  };
}

export function createSriLankaTripPlan(overrides?: {
  name?: string;
  travelersLabel?: string;
  startDate?: string;
  hotelName?: string;
  shortlist?: Record<string, boolean>;
  customStops?: Record<number, StopItem[]>;
  dayOrder?: Record<number, string[]>;
  notes?: Record<number, string>;
  flightTimes?: Record<string, string>;
  members?: string[];
  inrToLkr?: number;
  usdToInr?: number;
  expenses?: ExpenseItem[];
  checklist?: ChecklistItem[];
}): TripPlan {
  const customStops = overrides?.customStops || {};
  const days: DayPlan[] = DAYS_DATA.map((d, idx) => ({
    ...d,
    items: [...d.items, ...(customStops[idx] || [])]
  }));

  const flights: TripFlight[] = FLIGHTS.map((f, idx) => ({
    id: `sl_${f.key}`,
    header: f.header,
    airline: f.airline,
    flightNo: f.flightNo,
    fromCode: f.fromCode,
    fromCity: f.fromCity,
    toCode: f.toCode,
    toCity: f.toCity,
    pnr: f.pnr,
    travelDate: idx === 0 ? "2026-12-12" : "2026-12-17",
    depTime: overrides?.flightTimes?.[f.key + "d"] ?? f.defaultDep,
    arrTime: overrides?.flightTimes?.[f.key + "a"] ?? f.defaultArr,
    travelerNames: [],
    fr24: f.fr24,
    fa: f.fa,
    note: f.note
  }));

  const milestones: TripMilestone[] = MILESTONES.map(([dateTime, label], idx) => ({
    id: `sl_ms_${idx}`,
    dateTime,
    label
  }));

  const phrases: TripPhrase[] = SINHALA_PHRASES.map((p, idx) => ({
    id: `sl_ph_${idx}`,
    phrase: p.phrase,
    meaning: p.meaning,
    note: p.note
  }));

  const colomboHotel = overrides?.hotelName || "Granbell Hotel Colombo";
  const hotelStays: HotelStay[] = [
    {
      id: "sl_stay_somar",
      name: "Somar Ahangama",
      query: "Somar Ahangama Sri Lanka",
      checkInDate: "2026-12-12",
      checkOutDate: "2026-12-16"
    },
    {
      id: "sl_stay_colombo",
      name: colomboHotel,
      query: `${colomboHotel} Colombo`,
      checkInDate: "2026-12-16",
      checkOutDate: "2026-12-17"
    }
  ];

  const members = overrides?.members && overrides.members.length >= 2
    ? overrides.members
    : ["Ankit", "Jeenat", "Laxit", "Sayali"];

  return {
    id: "trip_sri_lanka_2026",
    name: overrides?.name || "Sri Lanka Coastal Escape",
    destination: "Ahangama & Colombo, Sri Lanka",
    travelersLabel: overrides?.travelersLabel || members.join(", "),
    startDate: overrides?.startDate || "2026-12-12",
    departureTime: "06:15",
    hotelName: colomboHotel,
    hotelStays,
    currency: {
      home: "INR",
      local: "LKR",
      homeToLocal: overrides?.inrToLkr || 3.55,
      usdToHome: overrides?.usdToInr || 84.5
    },
    days,
    shortlist: overrides?.shortlist ? { ...getDefaultShortlist(), ...overrides.shortlist } : getDefaultShortlist(),
    dayOrder: overrides?.dayOrder || {},
    notes: overrides?.notes || {},
    flights,
    milestones,
    members,
    expenses: overrides?.expenses || [],
    checklist: overrides?.checklist || DEFAULT_PACKING_CHECKLIST,
    phrases,
    tips: LOCAL_TIPS,
    emergencyContacts: [
      { label: "Tourist Police", number: "1912" },
      { label: "Emergency", number: "119" }
    ]
  };
}

export function migrateLegacyStorage(): {
  trips: TripPlan[];
  activeTripId: string;
  gallery: GalleryPhoto[];
} | null {
  try {
    const prefix = "sl26_v2_";
    let hasLegacy = false;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith(prefix)) {
        hasLegacy = true;
        break;
      }
    }
    if (!hasLegacy) return null;

    const readLegacy = <T>(k: string, fb: T): T => {
      try {
        const raw = localStorage.getItem(prefix + k);
        return raw !== null ? (JSON.parse(raw) as T) : fb;
      } catch {
        return fb;
      }
    };

    const hotelSaved = readLegacy<string>("hotel_name", "Granbell Hotel Colombo");
    const hotelName = !hotelSaved || hotelSaved === "Galle Face (hotel area)" ? "Granbell Hotel Colombo" : hotelSaved;

    const legacyExpRaw = readLegacy<unknown>("exp", []);
    const expenses: ExpenseItem[] = Array.isArray(legacyExpRaw)
      ? legacyExpRaw.map((item, idx) => {
          const obj = item as Partial<ExpenseItem>;
          return {
            id: obj.id || `exp_${idx}_${Date.now()}`,
            desc: obj.desc || "Shared Expense",
            cat: obj.cat || "Food",
            cur: obj.cur || "LKR",
            amt: Number(obj.amt) || 0,
            by: typeof obj.by === "number" ? obj.by : 0
          };
        })
      : [];

    const legacyNames = readLegacy<[string, string]>("names", ["Ankit Jeenat", "Laxit Sayali"]);

    const trip = createSriLankaTripPlan({
      hotelName,
      shortlist: readLegacy<Record<string, boolean>>("shortlist", {}),
      customStops: readLegacy<Record<number, StopItem[]>>("custom_stops", {}),
      dayOrder: readLegacy<Record<number, string[]>>("day_order", {}),
      notes: readLegacy<Record<number, string>>("notes", {}),
      flightTimes: readLegacy<Record<string, string>>("ft", {}),
      members: [legacyNames[0], legacyNames[1]],
      inrToLkr: readLegacy<number>("inr_to_lkr", 3.55),
      usdToInr: readLegacy<number>("usd_to_inr", 84.5),
      expenses,
      checklist: readLegacy<ChecklistItem[]>("checklist", DEFAULT_PACKING_CHECKLIST)
    });

    const rawGallery = readLegacy<Omit<GalleryPhoto, "tripId">[]>("gallery", []);
    const gallery: GalleryPhoto[] = Array.isArray(rawGallery)
      ? rawGallery.map((g) => ({ ...g, tripId: trip.id }))
      : [];

    return {
      trips: [trip],
      activeTripId: trip.id,
      gallery
    };
  } catch {
    return null;
  }
}
