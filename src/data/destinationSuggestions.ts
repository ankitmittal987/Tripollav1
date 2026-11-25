import type { DietType, HotelStay, StopItem, StopType } from "../types/trip";

export interface LanguageOption {
  code: string;
  label: string;
  bcp47: string;
}

export const WORLD_LANGUAGES: LanguageOption[] = [
  { code: "si", label: "Sinhala (Sri Lanka)", bcp47: "si-LK" },
  { code: "ja", label: "Japanese (Japan)", bcp47: "ja-JP" },
  { code: "fr", label: "French (France / Canada)", bcp47: "fr-FR" },
  { code: "es", label: "Spanish (Spain / LatAm)", bcp47: "es-ES" },
  { code: "it", label: "Italian (Italy)", bcp47: "it-IT" },
  { code: "de", label: "German (Germany / Swiss)", bcp47: "de-DE" },
  { code: "th", label: "Thai (Thailand)", bcp47: "th-TH" },
  { code: "id", label: "Indonesian (Bali / Indonesia)", bcp47: "id-ID" },
  { code: "vi", label: "Vietnamese (Vietnam)", bcp47: "vi-VN" },
  { code: "ko", label: "Korean (South Korea)", bcp47: "ko-KR" },
  { code: "ar", label: "Arabic (UAE / Egypt)", bcp47: "ar-AE" },
  { code: "tr", label: "Turkish (Turkey)", bcp47: "tr-TR" },
  { code: "pt", label: "Portuguese (Portugal / Brazil)", bcp47: "pt-PT" },
  { code: "el", label: "Greek (Greece)", bcp47: "el-GR" },
  { code: "nl", label: "Dutch (Netherlands)", bcp47: "nl-NL" },
  { code: "zh-CN", label: "Mandarin Chinese", bcp47: "zh-CN" },
  { code: "ms", label: "Malay (Malaysia)", bcp47: "ms-MY" },
  { code: "hi", label: "Hindi (India)", bcp47: "hi-IN" },
  { code: "en", label: "English", bcp47: "en-US" }
];

export function detectDestinationLanguage(destination: string): LanguageOption {
  const d = destination.toLowerCase();
  const rules: [RegExp, string][] = [
    [/sri lanka|colombo|galle|ahangama|kandy|ella/, "si"],
    [/japan|tokyo|kyoto|osaka|sapporo|fukuoka|hakone/, "ja"],
    [/france|paris|nice|lyon|marseille|riviera/, "fr"],
    [/spain|barcelona|madrid|seville|valencia|mexico|peru|argentina|colombia|chile/, "es"],
    [/italy|rome|florence|venice|milan|amalfi|naples/, "it"],
    [/germany|berlin|munich|frankfurt|austria|vienna|salzburg|zurich|switzerland/, "de"],
    [/thailand|bangkok|phuket|chiang mai|krabi|samui/, "th"],
    [/bali|indonesia|jakarta|ubud|lombok/, "id"],
    [/vietnam|hanoi|ho chi minh|saigon|da nang|hoi an/, "vi"],
    [/korea|seoul|busan|jeju/, "ko"],
    [/dubai|abu dhabi|uae|qatar|doha|egypt|cairo|oman|saudi|morocco/, "ar"],
    [/turkey|istanbul|cappadocia|antalya/, "tr"],
    [/portugal|lisbon|porto|brazil|rio/, "pt"],
    [/greece|athens|santorini|mykonos/, "el"],
    [/netherlands|amsterdam|rotterdam/, "nl"],
    [/china|beijing|shanghai|taiwan|taipei|hong kong/, "zh-CN"],
    [/malaysia|kuala lumpur|langkawi|penang/, "ms"],
    [/india|goa|jaipur|mumbai|delhi|kerala|udaipur/, "hi"]
  ];

  for (const [regex, code] of rules) {
    if (regex.test(d)) {
      return WORLD_LANGUAGES.find((l) => l.code === code) ?? WORLD_LANGUAGES[0];
    }
  }
  return WORLD_LANGUAGES.find((l) => l.code === "es") ?? WORLD_LANGUAGES[0];
}

export function getDayDateString(startDate: string, dayIdx: number): string {
  const base = startDate ? new Date(`${startDate}T12:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  const d = new Date(base.getTime() + dayIdx * 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface ResolvedDayHotel {
  dateStr: string;
  overnightStay: HotelStay | null;
  checkInStay: HotelStay | null;
  checkOutStay: HotelStay | null;
  baseName: string;
  baseQuery: string;
  summaryText: string;
}

export function resolveHotelForDay(
  hotelStays: HotelStay[],
  dateStr: string,
  fallbackHotel: string
): ResolvedDayHotel {
  const sorted = [...hotelStays].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  const checkInStay = sorted.find((h) => h.checkInDate === dateStr) ?? null;
  const checkOutStay = sorted.find((h) => h.checkOutDate === dateStr) ?? null;
  const overnightStay =
    sorted.find((h) => h.checkInDate <= dateStr && dateStr < h.checkOutDate) ?? null;

  const primary = checkInStay ?? overnightStay ?? checkOutStay;
  const baseName = primary?.name || fallbackHotel || "Primary Stay";
  const baseQuery = primary?.query || baseName;

  let summaryText = `Base: ${baseName}`;
  if (checkOutStay && checkInStay && checkOutStay.id !== checkInStay.id) {
    summaryText = `Check-out ${checkOutStay.name} → Check-in ${checkInStay.name}`;
  } else if (checkInStay) {
    summaryText = `Check-in: ${checkInStay.name}`;
  } else if (overnightStay) {
    summaryText = `Staying at ${overnightStay.name}`;
  } else if (checkOutStay) {
    summaryText = `Check-out: ${checkOutStay.name}`;
  }

  return {
    dateStr,
    overnightStay,
    checkInStay,
    checkOutStay,
    baseName,
    baseQuery,
    summaryText
  };
}

interface CuratedSpotTemplate {
  name: string;
  desc: string;
  lat: number;
  lng: number;
  type: StopType;
  diet?: DietType;
}

interface CuratedDestinationGuide {
  keywords: RegExp;
  centerLat: number;
  centerLng: number;
  days: CuratedSpotTemplate[][];
}

const CURATED_GUIDES: CuratedDestinationGuide[] = [
  {
    keywords: /tokyo|japan|kyoto|osaka/i,
    centerLat: 35.6762,
    centerLng: 139.6503,
    days: [
      [
        { name: "Senso-ji Temple & Nakamise Street", desc: "Tokyo's oldest temple gate, incense hall & street snacks", lat: 35.7148, lng: 139.7967, type: "v" },
        { name: "Ichiran / Tsukiji Outer Market Lunch", desc: "Fresh sushi bowls, tamagoyaki & ramen spots", lat: 35.6655, lng: 139.7707, type: "f", diet: "both" },
        { name: "Shibuya Sky Observation Deck", desc: "360° golden-hour skyline views over Shibuya Scramble", lat: 35.658, lng: 139.7022, type: "s" },
        { name: "Omoide Yokocho / Golden Gai", desc: "Atmospheric lantern alleys with tiny izakayas & bars", lat: 35.693, lng: 139.6995, type: "p" }
      ],
      [
        { name: "Meiji Jingu Shrine & Yoyogi Park", desc: "Forested Shinto shrine oasis next to Harajuku", lat: 35.6764, lng: 139.6993, type: "v" },
        { name: "Omotesando & Cat Street Cafes", desc: "Specialty matcha, fluffy pancakes & boutique shopping", lat: 35.6652, lng: 139.7095, type: "f", diet: "both" },
        { name: "teamLab Planets / Tokyo Bay Sunset", desc: "Immersive digital art museum + waterfront promenade", lat: 35.6491, lng: 139.7897, type: "s" }
      ],
      [
        { name: "Fushimi Inari Taisha (Kyoto)", desc: "Iconic thousands of vermilion torii gates up Mt. Inari", lat: 34.9671, lng: 135.7727, type: "v" },
        { name: "Nishiki Market Food Crawl", desc: "Covered culinary alley for matcha sweets, skewers & tofu", lat: 35.005, lng: 135.7649, type: "f", diet: "both" },
        { name: "Kiyomizu-dera & Higashiyama Sunset", desc: "Wooden hillside temple & lantern-lit stone streets", lat: 34.9949, lng: 135.785, type: "s" },
        { name: "Pontocho Alley Evening Dining", desc: "Riverside wooden teahouses & evening cocktails", lat: 35.0065, lng: 135.771, type: "p" }
      ],
      [
        { name: "Arashiyama Bamboo Grove & River", desc: "Early morning bamboo forest walk & Togetsukyo Bridge", lat: 35.0168, lng: 135.6713, type: "v" },
        { name: "Dotonbori Neon Canal (Osaka)", desc: "Takoyaki, okonomiyaki & iconic neon street food evening", lat: 34.6687, lng: 135.5013, type: "f", diet: "both" }
      ]
    ]
  },
  {
    keywords: /paris|france/i,
    centerLat: 48.8566,
    centerLng: 2.3522,
    days: [
      [
        { name: "Louvre Museum & Tuileries Garden", desc: "Morning courtyard & iconic gallery highlights", lat: 48.8606, lng: 2.3376, type: "v" },
        { name: "Le Marais Cafes & Rue des Rosiers", desc: "Artisan croissants, falafel & boutique alleys", lat: 48.8575, lng: 2.3584, type: "f", diet: "both" },
        { name: "Trocadéro & Eiffel Tower Sunset", desc: "Best view as the tower sparkles at dusk", lat: 48.8584, lng: 2.2945, type: "s" }
      ],
      [
        { name: "Montmartre & Sacré-Cœur Basilica", desc: "Cobblestone hilltop artists' square & city panorama", lat: 48.8867, lng: 2.3431, type: "v" },
        { name: "Café de Flore / Saint-Germain Lunch", desc: "Classic Parisian sidewalk bistro experience", lat: 48.854, lng: 2.3326, type: "f", diet: "both" },
        { name: "Seine River Sunset Cruise", desc: "Golden hour boat ride passing Notre-Dame & bridges", lat: 48.853, lng: 2.3499, type: "s" }
      ],
      [
        { name: "Musée d'Orsay & Latin Quarter", desc: "Impressionist masterpieces inside a grand Beaux-Arts station", lat: 48.86, lng: 2.3266, type: "v" },
        { name: "Champs-Élysées & Arc de Triomphe", desc: "Rooftop terrace views & evening shopping", lat: 48.8738, lng: 2.295, type: "s" }
      ]
    ]
  },
  {
    keywords: /bali|indonesia|ubud|seminyak|canggu/i,
    centerLat: -8.5069,
    centerLng: 115.2625,
    days: [
      [
        { name: "Tegallalang Rice Terraces, Ubud", desc: "Morning walk through lush emerald stepped paddies", lat: -8.4312, lng: 115.2792, type: "v" },
        { name: "Clear Café / Alchemy Ubud", desc: "Fresh smoothie bowls, tropical brunch & Indonesian plates", lat: -8.506, lng: 115.261, type: "f", diet: "veg" },
        { name: "Campuhan Ridge Sunset Walk", desc: "Scenic breezy ridge path overlooking palm valleys", lat: -8.5037, lng: 115.2547, type: "s" }
      ],
      [
        { name: "Tegenungan / Kanto Lampo Waterfall", desc: "Refreshing jungle waterfall dip before noon crowds", lat: -8.5754, lng: 115.2886, type: "v" },
        { name: "La Brisa Beach Club, Canggu", desc: "Reclaimed-wood beachfront sunset cocktails & DJs", lat: -8.6608, lng: 115.1342, type: "p" }
      ],
      [
        { name: "Uluwatu Cliff Temple", desc: "Dramatic ocean cliffs + 6pm Kecak fire dance at sunset", lat: -8.8291, lng: 115.0849, type: "s" },
        { name: "Jimbaran Bay Beachfront Dinner", desc: "Candlelit seafood & grilled corn right on the sand", lat: -8.7749, lng: 115.1665, type: "f", diet: "both" }
      ]
    ]
  },
  {
    keywords: /thailand|bangkok|phuket|krabi|chiang mai/i,
    centerLat: 13.7563,
    centerLng: 100.5018,
    days: [
      [
        { name: "Grand Palace & Wat Pho", desc: "Gilded royal complex & Giant Reclining Buddha", lat: 13.75, lng: 100.4913, type: "v" },
        { name: "Wat Arun Riverside Sunset", desc: "Porcelain spire temple glowing across the Chao Phraya", lat: 13.7437, lng: 100.4889, type: "s" },
        { name: "Yaowarat (Chinatown) Night Market", desc: "Legendary street food stalls, mango sticky rice & noodles", lat: 13.7412, lng: 100.5082, type: "f", diet: "both" }
      ],
      [
        { name: "Chatuchak Market / Siam Discovery", desc: "Artisan souvenirs, local boutiques & street iced tea", lat: 13.7999, lng: 100.5509, type: "v" },
        { name: "Tichuca / Sky Bar Rooftop", desc: "High-altitude Bangkok skyline cocktails", lat: 13.7235, lng: 100.5784, type: "p" }
      ]
    ]
  },
  {
    keywords: /dubai|uae|abu dhabi/i,
    centerLat: 25.2048,
    centerLng: 55.2708,
    days: [
      [
        { name: "Old Dubai & Al Fahidi Historical District", desc: "Wind-tower lanes, Dubai Creek abra boat & spice souk", lat: 25.2636, lng: 55.2972, type: "v" },
        { name: "Arabian Tea House", desc: "Courtyard Emirati breakfast, falafel & mint lemonade", lat: 25.2634, lng: 55.2995, type: "f", diet: "both" },
        { name: "Burj Khalifa & Dubai Fountain Sunset", desc: "Observation deck + evening choreographed fountain show", lat: 25.1972, lng: 55.2744, type: "s" }
      ],
      [
        { name: "Palm Jumeirah & Kite Beach", desc: "Morning beach stroll & coastal cafes", lat: 25.1544, lng: 55.202, type: "v" },
        { name: "Desert Safari & Sunset Dunes", desc: "Golden dune bashing, BBQ dinner & stargazing", lat: 24.98, lng: 55.61, type: "s" }
      ]
    ]
  },
  {
    keywords: /italy|rome|florence|venice|milan|amalfi/i,
    centerLat: 41.9028,
    centerLng: 12.4964,
    days: [
      [
        { name: "Colosseum & Roman Forum", desc: "Ancient gladiatorial arena & imperial ruins", lat: 41.8902, lng: 12.4922, type: "v" },
        { name: "Trastevere Trattoria & Gelato", desc: "Handmade cacio e pepe, supplì & artisan gelato", lat: 41.8894, lng: 12.4706, type: "f", diet: "both" },
        { name: "Piazza Navona & Trevi Fountain Evening", desc: "Illuminated baroque fountains & evening passeggiata", lat: 41.9009, lng: 12.4833, type: "s" }
      ],
      [
        { name: "Vatican Museums & St. Peter's Basilica", desc: "Sistine Chapel & sweeping dome views over Rome", lat: 41.9029, lng: 12.4534, type: "v" },
        { name: "Pantheon & Campo de' Fiori", desc: "Historic market square & espresso bars", lat: 41.8986, lng: 12.4769, type: "f", diet: "both" }
      ]
    ]
  },
  {
    keywords: /london|uk|england/i,
    centerLat: 51.5072,
    centerLng: -0.1276,
    days: [
      [
        { name: "Westminster, Big Ben & Buckingham Palace", desc: "Classic royal landmarks & St James's Park walk", lat: 51.5007, lng: -0.1246, type: "v" },
        { name: "Borough Market Lunch", desc: "Iconic artisan food hall — raclette, pastries & street bites", lat: 51.5055, lng: -0.091, type: "f", diet: "both" },
        { name: "South Bank & Tower Bridge Sunset", desc: "Thames riverside promenade & illuminated skyline", lat: 51.5055, lng: -0.0754, type: "s" }
      ],
      [
        { name: "British Museum & Covent Garden", desc: "World antiquities + lively piazza street performers", lat: 51.5194, lng: -0.127, type: "v" },
        { name: "Soho / Dishoom Dinner & West End", desc: "Atmospheric dining & evening theatre or pub crawl", lat: 51.5136, lng: -0.1365, type: "p", diet: "both" }
      ]
    ]
  },
  {
    keywords: /singapore/i,
    centerLat: 1.3521,
    centerLng: 103.8198,
    days: [
      [
        { name: "Gardens by the Bay & Cloud Forest", desc: "Misty indoor waterfall dome & Supertree Grove", lat: 1.2816, lng: 103.8636, type: "v" },
        { name: "Maxwell / Lau Pa Sat Hawker Centre", desc: "Michelin-recognized hawker stalls & satay street", lat: 1.2804, lng: 103.8504, type: "f", diet: "both" },
        { name: "Marina Bay Sands Light Show & Sunset", desc: "Waterfront skyline glow at 7:30pm", lat: 1.2834, lng: 103.8607, type: "s" }
      ],
      [
        { name: "Haji Lane & Kampong Glam", desc: "Colorful street murals, Arab Street cafes & boutiques", lat: 1.3008, lng: 103.859, type: "v" },
        { name: "Clarke Quay Riverside Nightlife", desc: "Breezy riverfront bars & live music", lat: 1.2906, lng: 103.8465, type: "p" }
      ]
    ]
  },
  {
    keywords: /switzerland|zurich|interlaken|lucerne|geneva/i,
    centerLat: 46.8182,
    centerLng: 8.2275,
    days: [
      [
        { name: "Old Town & Lake Promenade Walk", desc: "Timber bridges, medieval alleys & crystal alpine lake views", lat: 47.0502, lng: 8.3093, type: "v" },
        { name: "Swiss Fondue & Alpine Bakery Lunch", desc: "Artisan chocolate tasting & warm cheese fondue", lat: 47.052, lng: 8.306, type: "f", diet: "veg" },
        { name: "Harder Kulm / Mountain Sunset", desc: "Funicular up to panoramic sunset alpine ridge", lat: 46.6986, lng: 7.8511, type: "s" }
      ],
      [
        { name: "Jungfraujoch / Lauterbrunnen Valley", desc: "Glacier trains, 72 waterfalls & alpine villages", lat: 46.5935, lng: 7.9091, type: "v" }
      ]
    ]
  }
];

function buildGenericTemplatesForDay(destination: string, dayIdx: number, totalDays: number, centerLat: number, centerLng: number): CuratedSpotTemplate[] {
  const city = destination.split(",")[0].trim() || destination || "City";

  if (dayIdx === totalDays - 1 && totalDays > 1) {
    return [
      {
        name: `${city} Local Market & Souvenir Walk`,
        desc: `Last-morning artisan crafts, coffee & local gifts in ${city}`,
        lat: centerLat + 0.009,
        lng: centerLng - 0.007,
        type: "v"
      },
      {
        name: `Farewell Brunch in ${city}`,
        desc: `Relaxed final meal before heading to the airport / station`,
        lat: centerLat - 0.006,
        lng: centerLng + 0.008,
        type: "f",
        diet: "both"
      }
    ];
  }

  const themes: CuratedSpotTemplate[][] = [
    [
      {
        name: `${city} Historic Old Town & Central Square`,
        desc: `Orientation walk through ${city}'s most iconic heritage streets`,
        lat: centerLat + 0.008,
        lng: centerLng + 0.006,
        type: "v"
      },
      {
        name: `Top Local Food Market / Bistro (${city})`,
        desc: `Sample signature local dishes & street specialties`,
        lat: centerLat - 0.007,
        lng: centerLng + 0.009,
        type: "f",
        diet: "both"
      },
      {
        name: `${city} Golden Hour Viewpoint`,
        desc: `Scenic waterfront, hilltop, or skyline terrace for sunset`,
        lat: centerLat + 0.011,
        lng: centerLng - 0.01,
        type: "s"
      }
    ],
    [
      {
        name: `${city} Premier Museum & Cultural Quarter`,
        desc: `Morning visit to top galleries, architecture & local boutiques`,
        lat: centerLat - 0.011,
        lng: centerLng - 0.008,
        type: "v"
      },
      {
        name: `Specialty Coffee & Neighborhood Lunch`,
        desc: `Trendy local cafe district with vegetarian & classic picks`,
        lat: centerLat + 0.005,
        lng: centerLng - 0.012,
        type: "f",
        diet: "both"
      },
      {
        name: `${city} Rooftop Bar / Nightlife District`,
        desc: `Evening cocktails, live music & late-night vibe`,
        lat: centerLat - 0.004,
        lng: centerLng + 0.012,
        type: "p"
      }
    ],
    [
      {
        name: `${city} Botanical Park / Waterfront Trail`,
        desc: `Morning nature stroll, scenic views & local atmosphere`,
        lat: centerLat + 0.014,
        lng: centerLng + 0.003,
        type: "v"
      },
      {
        name: `Authentic Dinner Spot in ${city}`,
        desc: `Top-rated evening restaurant loved by locals & travelers`,
        lat: centerLat - 0.009,
        lng: centerLng - 0.004,
        type: "f",
        diet: "both"
      }
    ]
  ];

  return themes[dayIdx % themes.length];
}

export function generateSuggestionsForDay(
  destination: string,
  dayIdx: number,
  totalDays: number,
  fallbackLat = 0,
  fallbackLng = 0
): StopItem[] {
  const matchedGuide = CURATED_GUIDES.find((g) => g.keywords.test(destination));
  const baseLat = matchedGuide ? matchedGuide.centerLat : fallbackLat || 48.8566;
  const baseLng = matchedGuide ? matchedGuide.centerLng : fallbackLng || 2.3522;

  let templates: CuratedSpotTemplate[] | undefined;
  if (matchedGuide && dayIdx < matchedGuide.days.length) {
    templates = matchedGuide.days[dayIdx];
  } else {
    templates = buildGenericTemplatesForDay(destination, dayIdx, totalDays, baseLat, baseLng);
  }

  return templates.map((tpl, idx) => ({
    id: `sug_${Date.now().toString(36)}_${dayIdx}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
    name: tpl.name,
    query: `${tpl.name} ${destination}`.trim(),
    lat: tpl.lat,
    lng: tpl.lng,
    desc: tpl.desc,
    type: tpl.type,
    diet: tpl.diet ?? "none",
    tier: "core",
    defaultPick: true,
    custom: true
  }));
}
