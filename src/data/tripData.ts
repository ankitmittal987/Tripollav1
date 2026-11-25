import type { ChecklistItem, DayPlan, StopItem, StopType } from "../types/trip";

export interface LegacyFlightInfo {
  key: "o" | "r";
  header: string;
  airline: string;
  flightNo: string;
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  pnr: string;
  query: string;
  fr24: string;
  fa: string;
  defaultDep: string;
  defaultArr: string;
  note: string;
}

export const SOMAR = "Somar Ahangama Sri Lanka";
export const AIRPORT = "Bandaranaike International Airport Colombo";

export const DAYS_DATA: DayPlan[] = [
  {
    code: "D1 · 12 Dec",
    shortDate: "Sat 12",
    title: "Day 1 · Sat 12 Dec",
    summary: "Airport straight to Somar, sunset & Saturday night beach bars",
    legs: [
      [145, 225],
      [2, 6],
      [3, 8],
      [2, 6]
    ],
    items: [
      {
        id: "d1_1",
        name: "Colombo Airport (CMB)",
        query: AIRPORT,
        lat: 7.18,
        lng: 79.884,
        desc: "Land ~9:00am (6E 1185), drive straight to Somar via Southern Expressway",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d1_2",
        name: "Somar Ahangama + Veda Café Lunch",
        query: SOMAR,
        lat: 5.968,
        lng: 80.364,
        desc: "Check-in ~1pm. Lunch right next door at Veda Café (famous veg rice & curry buffet)",
        type: "b",
        diet: "veg",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d1_3",
        name: "Kabalana Beach (The Rock)",
        query: "Kabalana Beach Ahangama",
        lat: 5.973,
        lng: 80.352,
        desc: "Golden sunset on the surf beach (~6pm)",
        type: "s",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d1_4",
        name: "TIFFINS The Dosa Kade",
        query: "TIFFINS The Dosa Kade Ahangama",
        lat: 5.969,
        lng: 80.368,
        desc: "Authentic South Indian vegetarian dosas, idlis & thali dinner",
        type: "f",
        diet: "veg",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d1_5",
        name: "Ahangama Beach Bars",
        query: "Ahangama Beach Sri Lanka",
        lat: 5.971,
        lng: 80.357,
        desc: "Easy first-night drinks near Somar; check out the Saturday party options below",
        type: "p",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d1_f1",
        name: "The Kip",
        query: "The Kip Ahangama",
        lat: 5.9675,
        lng: 80.366,
        desc: "Iconic lush tropical garden cafe — smoothie bowls, sourdough, great veg & brunch",
        type: "f",
        diet: "veg",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d1_f2",
        name: "Cactus Ahangama",
        query: "Cactus Ahangama",
        lat: 5.9688,
        lng: 80.3652,
        desc: "Trendy coastal cafe famous for tacos, poke bowls, smoothies & coffee",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d1_f3",
        name: "Maru",
        query: "Maru Ahangama",
        lat: 5.9702,
        lng: 80.3615,
        desc: "Famous Japanese & fresh seafood spot in Ahangama (tuna tataki, ramen, veg rolls)",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d1_f4",
        name: "East Falafel",
        query: "East Falafel Ahangama",
        lat: 5.9685,
        lng: 80.3672,
        desc: "Top-rated Middle Eastern falafel wraps, hummus platters & mezze",
        type: "f",
        diet: "veg",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d1_f5",
        name: "Kurumba Bay",
        query: "Kurumba Bay Ahangama",
        lat: 5.9722,
        lng: 80.3545,
        desc: "Beachfront Sri Lankan seafood curries, grilled prawns & cocktails",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d1_p1",
        name: "Trax Ahangama (Saturday Night Party)",
        query: "Trax Ahangama",
        lat: 5.9705,
        lng: 80.3635,
        desc: "THE most famous Saturday night open-air jungle party in Ahangama — techno, house & live DJs",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d1_p2",
        name: "Swell Ahangama",
        query: "Swell Ahangama",
        lat: 5.9718,
        lng: 80.3562,
        desc: "Lively beachfront surf pub with live bands, cocktails & late-night crowd",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d1_p3",
        name: "Kabalana Beach Club",
        query: "Kabalana Beach Club Ahangama",
        lat: 5.9735,
        lng: 80.3515,
        desc: "Sunset-to-night beach lounge with DJ sets and craft cocktails",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d1_p4",
        name: "Lunu Mirisa",
        query: "Lunu Mirisa Ahangama",
        lat: 5.9695,
        lng: 80.3642,
        desc: "Popular rooftop/garden bar & Sri Lankan tapas spot with weekend music",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      }
    ]
  },
  {
    code: "D2 · 13 Dec",
    shortDate: "Sun 13",
    title: "Day 2 · Sun 13 Dec",
    summary: "Peace Pagoda, palm rope swing, Galle Fort & Sunday beach parties",
    legs: [
      [28, 35],
      [4, 10],
      [7, 20],
      [1, 6],
      [1, 5],
      [1, 5],
      [26, 40]
    ],
    items: [
      {
        id: "d2_1",
        name: "Somar Ahangama (Depart 8:00am)",
        query: SOMAR,
        lat: 5.968,
        lng: 80.364,
        desc: "Leave early at 8:00am heading west toward Unawatuna & Galle",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d2_2",
        name: "Japanese Peace Pagoda",
        query: "Japanese Peace Pagoda Unawatuna",
        lat: 6.0142,
        lng: 80.2425,
        desc: "Morning hilltop stupa climb, shoes off, panoramic Unawatuna & Galle bay views",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d2_3",
        name: "Dalawella Beach Palm Rope Swing",
        query: "Dalawella Beach Palm Tree Swing Unawatuna",
        lat: 6.007,
        lng: 80.261,
        desc: "Iconic ocean rope swing at Dream Cabana — go early to beat queues",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d2_4",
        name: "Galle Fort & Pedlar’s Inn Café",
        query: "Pedlars Inn Cafe Galle Fort",
        lat: 6.0267,
        lng: 80.217,
        desc: "Lunch at Pedlar’s Inn Café. Explore Dutch colonial streets, Laksala & boutiques",
        type: "v",
        diet: "both",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d2_5",
        name: "Galle Lighthouse & Ramparts",
        query: "Galle Lighthouse",
        lat: 6.0243,
        lng: 80.2158,
        desc: "Golden hour walk along the Fort walls — arrive by 5:15pm for sunset",
        type: "s",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d2_6",
        name: "The Fort Printers",
        query: "The Fort Printers Galle Fort",
        lat: 6.0265,
        lng: 80.217,
        desc: "Upscale courtyard dinner inside a heritage mansion — wood-fired pizzas, seafood & veg dishes",
        type: "f",
        diet: "both",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d2_7",
        name: "Ropewalk (Galle Fort Hotel)",
        query: "Ropewalk Galle Fort Hotel",
        lat: 6.0278,
        lng: 80.2171,
        desc: "Sri Lanka’s first arrack-specialty cocktail bar with tapas & great vibe",
        type: "p",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d2_8",
        name: "Return to Somar Ahangama",
        query: SOMAR,
        lat: 5.968,
        lng: 80.364,
        desc: "Licensed taxi back along coast (~40 min)",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d2_f1",
        name: "A Minute by Tuk Tuk",
        query: "A Minute by Tuk Tuk Galle Fort",
        lat: 6.0258,
        lng: 80.2185,
        desc: "Famous Dutch Hospital ocean-facing restaurant — crab curry, seafood platters & cocktails",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d2_f2",
        name: "Chambers Restaurant",
        query: "Chambers Restaurant Galle Fort",
        lat: 6.0272,
        lng: 80.2165,
        desc: "Iconic Moroccan & Middle Eastern dining inside Galle Fort (amazing tagines & mezze)",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d2_f3",
        name: "Coconut Sambol",
        query: "Coconut Sambol Galle Fort",
        lat: 6.0262,
        lng: 80.2162,
        desc: "Beloved family-run spot for authentic home-style Sri Lankan rice & curry buffet",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d2_f4",
        name: "Poonie's Kitchen",
        query: "Poonies Kitchen Galle Fort",
        lat: 6.0275,
        lng: 80.2175,
        desc: "Hidden courtyard cafe famous for colourful salad thali bowls & iced teas",
        type: "f",
        diet: "veg",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d2_f5",
        name: "Wijeya Beach Restaurant",
        query: "Wijeya Beach Restaurant Unawatuna",
        lat: 6.0065,
        lng: 80.262,
        desc: "Right next to Dalawella swing — legendary wood-fired pizzas & grilled seafood on the beach",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d2_f6",
        name: "Isle of Gelato",
        query: "Isle of Gelato Galle Fort",
        lat: 6.0268,
        lng: 80.2173,
        desc: "Must-try artisanal gelato in Galle Fort (passionfruit, pistachio, salted caramel)",
        type: "f",
        diet: "veg",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d2_p1",
        name: "Taphouse by R&B (Dutch Hospital)",
        query: "Taphouse by R&B Galle Fort",
        lat: 6.0256,
        lng: 80.2188,
        desc: "Lively pub in the Old Dutch Hospital courtyard with live bands, draught beer & cocktails",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d2_p2",
        name: "Charlie’s Bar & Bistro",
        query: "Charlies Bar Galle Fort",
        lat: 6.0271,
        lng: 80.2168,
        desc: "Cozy Galle Fort cocktail bar with indie playlists & late-night drinks",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d2_p3",
        name: "Kingfisher Unawatuna (Sunday Beach Party)",
        query: "Kingfisher Unawatuna",
        lat: 6.0095,
        lng: 80.2485,
        desc: "Famous Unawatuna beach club & restaurant hosting energetic Sunday night DJ beach parties",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d2_p4",
        name: "Happy Banana Unawatuna",
        query: "Happy Banana Unawatuna",
        lat: 6.0092,
        lng: 80.2492,
        desc: "Iconic sand-floor beach party bar with fire shows, DJs & dancing right by the waves",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      }
    ]
  },
  {
    code: "D3 · 14 Dec",
    shortDate: "Mon 14",
    title: "Day 3 · Mon 14 Dec",
    summary: "Koggala Lake, White Tea Estate, painted temple & Monday beach parties",
    legs: [
      [9, 15],
      [6, 12],
      [10, 18],
      [4, 10],
      [5, 12],
      [6, 12],
      [6, 12]
    ],
    items: [
      {
        id: "d3_1",
        name: "Somar Ahangama (Depart 9:00am)",
        query: SOMAR,
        lat: 5.968,
        lng: 80.364,
        desc: "Relaxed 9:00am start for inland lake & tea plantations",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d3_2",
        name: "Koggala Lake Boat Safari",
        query: "Koggala Lake boat ride Sri Lanka",
        lat: 5.995,
        lng: 80.32,
        desc: "Scenic boat ride visiting Cinnamon Island, bird sanctuaries & spice garden",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d3_3",
        name: "Handunugoda Tea Estate",
        query: "Handunugoda Tea Estate Koggala",
        lat: 5.985,
        lng: 80.305,
        desc: "Home of world-famous Virgin White Tea — guided factory tour, tea tasting & coconut oil",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d3_4",
        name: "Kathaluwa Purvarama Temple",
        query: "Kathaluwa Purvarama Maha Viharaya Ahangama",
        lat: 5.97,
        lng: 80.38,
        desc: "Historic 19th-century Buddhist temple with rare Kandyan & European-style murals",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d3_5",
        name: "Matara Road Cafes (The Kip / Fruit Café / Sliders)",
        query: "Fruit Cafe Ahangama",
        lat: 5.968,
        lng: 80.364,
        desc: "Lunch at The Kip (veg), then cafe-hop Matara Rd: Cactus, Fruit Café (vegan) & Ceylon Sliders",
        type: "f",
        diet: "veg",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d3_6",
        name: "Midigama Beach Sunset",
        query: "Midigama Beach",
        lat: 5.964,
        lng: 80.398,
        desc: "Sunset (~6pm) watching surfers at Lazy Left & Rams surf breaks",
        type: "s",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d3_7",
        name: "Maria Bonita Ahangama",
        query: "Maria Bonita Ahangama",
        lat: 5.968,
        lng: 80.368,
        desc: "Vibrant Mexican & vegetarian/vegan tacos, burritos, nachos & margaritas",
        type: "f",
        diet: "both",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d3_8",
        name: "Ahangama–Midigama Night Bars",
        query: "Midigama Beach Sri Lanka",
        lat: 5.966,
        lng: 80.39,
        desc: "Monday night surf-town drinks; pick from the famous Monday party spots below",
        type: "p",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d3_f1",
        name: "Follow The White Rabbit",
        query: "Follow The White Rabbit Midigama",
        lat: 5.9645,
        lng: 80.3965,
        desc: "Iconic Midigama beachfront hangout — burgers, seafood grill, cold beers & sunset view",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d3_f2",
        name: "Soul & Surf Rooftop Cafe",
        query: "Soul and Surf Sri Lanka Ahangama",
        lat: 5.9665,
        lng: 80.385,
        desc: "Cliff-top ocean-view cafe famous for wood-fired pizzas, healthy bowls & sunset acoustics",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d3_f3",
        name: "Black Honey Cafe",
        query: "Black Honey Cafe Ahangama",
        lat: 5.976,
        lng: 80.369,
        desc: "Hidden jungle-chic cafe in the paddy fields — specialty coffee, shakshuka & brunch",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d3_f4",
        name: "Crust Ahangama",
        query: "Crust Ahangama",
        lat: 5.9692,
        lng: 80.3655,
        desc: "Famous artisan sourdough wood-fired pizzeria with great vegetarian & meat toppings",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d3_p1",
        name: "Cheeky Monkey Midigama (Monday Night Party)",
        query: "Cheeky Monkey Midigama",
        lat: 5.9638,
        lng: 80.399,
        desc: "THE legendary Midigama surfer bar — packed Monday night DJ sessions, pool table & cheap cocktails",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d3_p2",
        name: "The Doctor's House (Madiha)",
        query: "The Doctors House Madiha",
        lat: 5.9395,
        lng: 80.518,
        desc: "Iconic 200-year-old converted Dutch hospital beach bar (~20m east) — huge open-air garden parties & live music",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d3_p3",
        name: "La Luna Midigama",
        query: "La Luna Midigama",
        lat: 5.9642,
        lng: 80.3972,
        desc: "Chilled beachfront cocktail & pizza bar with acoustic sets & late drinks",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d3_p4",
        name: "Mello Hostel Bar",
        query: "Mello Hostel Ahangama",
        lat: 5.9672,
        lng: 80.376,
        desc: "Social backpacker/surfer bar with rooftop sunset sessions & beer pong",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      }
    ]
  },
  {
    code: "D4 · 15 Dec",
    shortDate: "Tue 15",
    title: "Day 4 · Tue 15 Dec",
    summary: "Weligama cafes, Coconut Tree Hill, Mirissa sunset & Tuesday nightlife",
    legs: [
      [16, 25],
      [7, 15],
      [1, 5],
      [6, 12],
      [1, 3],
      [16, 25]
    ],
    items: [
      {
        id: "d4_1",
        name: "Somar Ahangama (Depart 9:30am)",
        query: SOMAR,
        lat: 5.968,
        lng: 80.364,
        desc: "Leave 9:30am heading east to Weligama & Mirissa",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d4_2",
        name: "Nomad Café & Boutique, Weligama",
        query: "Nomad Cafe Boutique Weligama",
        lat: 5.974,
        lng: 80.43,
        desc: "100% vegetarian/vegan brunch (avo toast, smoothie bowls). Nearby: Plan B & Moochie’s",
        type: "f",
        diet: "veg",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d4_3",
        name: "Coconut Tree Hill, Mirissa",
        query: "Coconut Tree Hill Mirissa",
        lat: 5.94,
        lng: 80.463,
        desc: "Famous red-cliff palm grove overlooking the turquoise bay + Mirissa beach time",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d4_4",
        name: "Parrot Rock, Mirissa",
        query: "Parrot Rock Mirissa",
        lat: 5.943,
        lng: 80.459,
        desc: "Walk across the sandbar and climb Parrot Rock for 5:45pm sunset",
        type: "s",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d4_5",
        name: "Ceylon Sliders, Weligama",
        query: "Ceylon Sliders Weligama",
        lat: 5.973,
        lng: 80.428,
        desc: "Dinner: falafel bowls, vegan rainbow bowls, gourmet burgers & fresh fish",
        type: "f",
        diet: "both",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d4_6",
        name: "Locale Weligama / Zephyr Mirissa",
        query: "Locale Weligama",
        lat: 5.972,
        lng: 80.427,
        desc: "Gastro bar (happy hour 5–7pm) or stay in Mirissa at Zephyr for beachfront party vibes",
        type: "p",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d4_7",
        name: "Return to Somar Ahangama",
        query: SOMAR,
        lat: 5.968,
        lng: 80.364,
        desc: "Taxi back ~25 min",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d4_f1",
        name: "No. 1 Dewmini Roti Shop",
        query: "No 1 Dewmini Roti Shop Mirissa",
        lat: 5.9465,
        lng: 80.4565,
        desc: "World-famous Mirissa institution for Sri Lankan cheese-avocado rotis, kottu & chocolate rotis",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d4_f2",
        name: "Shady Lane Mirissa",
        query: "Shady Lane Mirissa",
        lat: 5.948,
        lng: 80.454,
        desc: "Instagram-famous brunch cafe tucked in palms — smoothie bowls, bagels & iced lattes",
        type: "f",
        diet: "veg",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d4_f3",
        name: "Petti Petti Mirissa",
        query: "Petti Petti Mirissa",
        lat: 5.9415,
        lng: 80.461,
        desc: "Chic beachfront infinity-pool club & restaurant serving Asian fusion, sushi & cocktails",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d4_f4",
        name: "Plan B Weligama",
        query: "Plan B Weligama",
        lat: 5.9735,
        lng: 80.429,
        desc: "Popular Weligama cafe for gourmet burgers, wraps, shakes & vegetarian plates",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d4_f5",
        name: "Moochie’s Weligama",
        query: "Moochies Weligama",
        lat: 5.9738,
        lng: 80.4295,
        desc: "Great brunch & lunch spot known for loaded wraps, smoothie bowls & coffee",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d4_p1",
        name: "Zephyr Restaurant & Bar (Mirissa)",
        query: "Zephyr Restaurant and Bar Mirissa",
        lat: 5.9445,
        lng: 80.4575,
        desc: "THE iconic Mirissa beachfront party bar — craft cocktails, DJs & dancing right on the sand",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d4_p2",
        name: "Salt Mirissa",
        query: "Salt Mirissa",
        lat: 5.945,
        lng: 80.4568,
        desc: "Lively beachfront lounge & restaurant with Tuesday night music, shisha & cocktails",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d4_p3",
        name: "Tiki Cliff Top Restaurant & Bar",
        query: "Tiki Cliff Top Restaurant and Bar Weligama",
        lat: 5.963,
        lng: 80.424,
        desc: "Dramatic cliff-edge Tiki bar overlooking Weligama bay — sunset to late-night party",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d4_p4",
        name: "Hangtime Rooftop Weligama",
        query: "Hangtime Hostel Weligama",
        lat: 5.9715,
        lng: 80.4265,
        desc: "Famous surfer rooftop bar across the beach with live acoustic/DJ nights & cold beers",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d4_p5",
        name: "Beats & Barrels Weligama",
        query: "Beats and Barrels Weligama",
        lat: 5.9725,
        lng: 80.4275,
        desc: "Energetic pub with live music, cocktails & party crowd in central Weligama",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      }
    ]
  },
  {
    code: "D5 · 16 Dec",
    shortDate: "Wed 16",
    title: "Day 5 · Wed 16 Dec",
    summary: "Expressway to Granbell Hotel (luggage drop), Colombo sightseeing, Galle Face sunset & rooftop clubs",
    legs: [
      [140, 170],
      [4, 15],
      [5, 20],
      [4, 15],
      [3, 12],
      [2, 10]
    ],
    items: [
      {
        id: "d5_1",
        name: "Somar Ahangama (Leave 10:00am)",
        query: SOMAR,
        lat: 5.968,
        lng: 80.364,
        desc: "Check out with luggage & drive ~2h 45m north to Granbell Hotel Colombo via Southern Expressway",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d5_hotel",
        name: "Granbell Hotel Colombo (Luggage Drop / Check-in)",
        query: "Granbell Hotel Colombo",
        lat: 6.9125,
        lng: 79.8495,
        desc: "Arrive ~12:45pm, drop luggage / check in at Kollupitiya before heading out for Colombo sightseeing",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d5_2",
        name: "Pettah Market",
        query: "Pettah Market Colombo",
        lat: 6.938,
        lng: 79.853,
        desc: "Bustling Colombo bazaar — cheapest wholesale shopping, electronics & spices (haggle!)",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d5_3",
        name: "Odel Alexandra Place & Laksala",
        query: "ODEL Alexandra Place Colombo",
        lat: 6.9073,
        lng: 79.8667,
        desc: "Flagship department store for fashion & souvenirs + Laksala state handicraft emporium",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d5_4",
        name: "Galle Face Green Sunset",
        query: "Galle Face Green Colombo",
        lat: 6.927,
        lng: 79.845,
        desc: "Oceanfront promenade sunset (~6pm) — try crispy prawn/lentil isso wade & kottu",
        type: "s",
        diet: "both",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d5_5",
        name: "Barefoot Garden Café",
        query: "Barefoot Garden Cafe Colombo",
        lat: 6.914,
        lng: 79.849,
        desc: "Iconic courtyard dining & handloom gallery — black pork curry, spinach quiche & veg options",
        type: "f",
        diet: "both",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d5_6",
        name: "Botanik Rooftop Bistro & Bar",
        query: "Botanik Rooftop Bistro Colombo",
        lat: 6.918,
        lng: 79.85,
        desc: "Award-winning Colombo rooftop cocktail lounge & dining with skyline views",
        type: "p",
        diet: "both",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d5_f1",
        name: "Ministry of Crab (Dutch Hospital)",
        query: "Ministry of Crab Colombo",
        lat: 6.9335,
        lng: 79.8435,
        desc: "Asia’s 50 Best Restaurants icon — legendary garlic chilli Sri Lankan mud crab & king prawns (book ahead!)",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d5_f2",
        name: "Nuga Gama (Cinnamon Grand)",
        query: "Nuga Gama Colombo",
        lat: 6.9178,
        lng: 79.8485,
        desc: "Magical open-air banyan tree village serving an authentic clay-pot Sri Lankan buffet & hoppers",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d5_f3",
        name: "Upali’s by Nawaloka",
        query: "Upalis by Nawaloka Colombo",
        lat: 6.9125,
        lng: 79.8625,
        desc: "Colombo’s most famous spot for authentic Sri Lankan curries, pol sambol, hoppers & jaggery dessert",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d5_f4",
        name: "Kaema Sutra (Shangri-La)",
        query: "Kaema Sutra Colombo",
        lat: 6.9285,
        lng: 79.8445,
        desc: "Contemporary Sri Lankan gastronomy & arrack cocktails by Chef Dharshan Munidasa",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d5_f5",
        name: "Galle Face Hotel Verandah",
        query: "The Verandah Galle Face Hotel Colombo",
        lat: 6.9202,
        lng: 79.8462,
        desc: "Historic 1864 colonial oceanfront terrace — iconic for sunset cocktails or high tea",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d5_p1",
        name: "CÉ LA VI Colombo (The Kingsbury)",
        query: "CE LA VI Colombo",
        lat: 6.9328,
        lng: 79.8422,
        desc: "High-energy rooftop lounge & club overlooking the Indian Ocean & Port City — DJs & cocktails",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d5_p2",
        name: "W Lounge / Ask for Fern",
        query: "Ask for Fern Colombo",
        lat: 6.9165,
        lng: 79.8515,
        desc: "Colombo’s coolest hidden speakeasy cocktail bar & late-night lounge",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d5_p3",
        name: "ON14 Rooftop Lounge & Bar",
        query: "ON14 Rooftop Lounge Colombo",
        lat: 6.9045,
        lng: 79.852,
        desc: "Poolside rooftop bar at OZO Colombo with ocean views, DJ sets & Ladies Night Wednesday vibes",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d5_p4",
        name: "Cleopatra Nightclub",
        query: "Cleopatra Nightclub Colombo",
        lat: 6.9175,
        lng: 79.8475,
        desc: "Classic Colombo late-night dance club open into the early hours",
        type: "p",
        diet: "none",
        tier: "alt_party",
        defaultPick: false
      },
      {
        id: "d5_p5",
        name: "Playtrix Sports Bar & Cafe",
        query: "Playtrix Colombo City Centre",
        lat: 6.9177,
        lng: 79.855,
        desc: "Lively pub at Colombo City Centre with live bands, draught beer & pub grub",
        type: "p",
        diet: "both",
        tier: "alt_party",
        defaultPick: false
      }
    ]
  },
  {
    code: "D6 · 17 Dec",
    shortDate: "Thu 17",
    title: "Day 6 · Thu 17 Dec",
    summary: "Colombo temples, last-minute shopping, lunch & evening flight home",
    legs: [
      [3, 15],
      [3, 15],
      [3, 12],
      [35, 75]
    ],
    items: [
      {
        id: "d6_1",
        name: "Granbell Hotel Colombo",
        query: "Granbell Hotel Colombo",
        lat: 6.9125,
        lng: 79.8495,
        desc: "Check out with luggage before morning temples, shopping & lunch (editable below)",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d6_2",
        name: "Gangaramaya Temple & Seema Malaka",
        query: "Gangaramaya Temple Colombo",
        lat: 6.9168,
        lng: 79.8564,
        desc: "Colombo’s most iconic Buddhist temple complex & Beira Lake meditation pavilion",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d6_3",
        name: "Independence Square & Arcade",
        query: "Independence Memorial Hall Colombo",
        lat: 6.9025,
        lng: 79.8683,
        desc: "Monument walk + last-minute shopping at Odel, Laksala & Arcade boutiques",
        type: "v",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d6_4",
        name: "Paradise Road The Gallery Café",
        query: "Paradise Road Gallery Cafe Colombo",
        lat: 6.906,
        lng: 79.853,
        desc: "Former studio of Geoffrey Bawa — iconic black-prawn curry, veg dishes & jaggery crème brûlée",
        type: "f",
        diet: "both",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d6_5",
        name: "Colombo Airport (CMB) · Leave ~12:15pm",
        query: AIRPORT,
        lat: 7.18,
        lng: 79.884,
        desc: "Head to CMB via Airport Expressway by 12:15pm. SriLankan UL 143 departs ~5:05pm",
        type: "b",
        diet: "none",
        tier: "core",
        defaultPick: true
      },
      {
        id: "d6_f1",
        name: "Seed Cafe",
        query: "Seed Cafe Colombo",
        lat: 6.9045,
        lng: 79.864,
        desc: "Gorgeously restored colonial house cafe near Independence Square — healthy brunch & coffee",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d6_f2",
        name: "Kiku Colombo",
        query: "Kiku Colombo",
        lat: 6.9055,
        lng: 79.858,
        desc: "Trendy Japanese-inspired brunch & lunch spot (katsu sandos, donburi bowls & matcha)",
        type: "f",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      },
      {
        id: "d6_f3",
        name: "One Galle Face Mall & Spa Ceylon",
        query: "One Galle Face Mall Colombo",
        lat: 6.9272,
        lng: 79.8448,
        desc: "Luxury oceanfront mall — pick up Spa Ceylon Ayurvedic gifts, Dilmah tea & quick lunch",
        type: "v",
        diet: "both",
        tier: "alt_food",
        defaultPick: false
      }
    ]
  }
];

export const STOP_TYPES: Record<StopType, { label: string; color: string; textClass: string }> = {
  v: { label: "Visit", color: "#0e7c7b", textClass: "text-teal-700 dark:text-teal-300" },
  f: { label: "Eat", color: "#d97706", textClass: "text-amber-700 dark:text-amber-300" },
  s: { label: "Sunset", color: "#e11d48", textClass: "text-rose-700 dark:text-rose-300" },
  p: { label: "Party / Pub", color: "#7c3aed", textClass: "text-purple-700 dark:text-purple-300" },
  b: { label: "Base / Move", color: "#475569", textClass: "text-slate-600 dark:text-slate-300" }
};

export const MILESTONES: [string, string][] = [
  ["2026-12-12T09:00", "Land in Colombo · 6E 1185"],
  ["2026-12-13T08:00", "Leave for Peace Pagoda"],
  ["2026-12-13T17:15", "Sunset at Galle ramparts"],
  ["2026-12-14T17:45", "Sunset at Midigama"],
  ["2026-12-15T17:15", "Sunset at Parrot Rock"],
  ["2026-12-16T10:00", "Leave Somar for Granbell Hotel Colombo"],
  ["2026-12-16T17:45", "Sunset at Galle Face"],
  ["2026-12-17T12:15", "Leave for the airport"],
  ["2026-12-17T17:05", "UL 143 departs (confirm time)"]
];

export const FLIGHTS: LegacyFlightInfo[] = [
  {
    key: "o",
    header: "Outbound · Sat 12 Dec",
    airline: "IndiGo",
    flightNo: "6E 1185",
    fromCode: "BOM",
    fromCity: "Mumbai",
    toCode: "CMB",
    toCity: "Colombo",
    pnr: "YE2NYT",
    query: "6E 1185 flight status",
    fr24: "6e1185",
    fa: "IGO1185",
    defaultDep: "06:15",
    defaultArr: "09:00",
    note: "You plan to land ~9:00am. Confirm exact times on your ticket."
  },
  {
    key: "r",
    header: "Return · Thu 17 Dec",
    airline: "SriLankan Airlines",
    flightNo: "UL 143",
    fromCode: "CMB",
    fromCity: "Colombo",
    toCode: "BOM",
    toCity: "Mumbai",
    pnr: "EOI9NT",
    query: "UL 143 flight status",
    fr24: "ul143",
    fa: "ALK143",
    defaultDep: "17:05",
    defaultArr: "19:45",
    note: "Usually leaves ~5:05–5:15pm and lands ~7:45pm. Confirm on your ticket."
  }
];

export const COASTLINE: [number, number][] = [
  [7.4, 79.8],
  [7.21, 79.83],
  [7.0, 79.84],
  [6.93, 79.845],
  [6.83, 79.857],
  [6.58, 79.96],
  [6.42, 79.995],
  [6.14, 80.1],
  [6.03, 80.2],
  [5.99, 80.32],
  [5.955, 80.43],
  [5.93, 80.56],
  [5.88, 80.7],
  [5.8, 81.5],
  [7.4, 81.5]
];

export const DEFAULT_PACKING_CHECKLIST: ChecklistItem[] = [
  { id: "eta", cat: "Documents", text: "Sri Lanka ETA / Visa approval printout & digital copy", done: false },
  { id: "pass", cat: "Documents", text: "Passports for Ankit, Jeenat, Laxit & Sayali (valid 6+ months)", done: false },
  { id: "tix", cat: "Documents", text: "Flight tickets (PNRs: YE2NYT & EOI9NT) + Somar Ahangama & Granbell Hotel bookings", done: false },
  { id: "gmap_off", cat: "Offline Maps", text: "Google Maps → Profile → Offline Maps → Verify South & West Sri Lanka downloaded", done: true },
  { id: "forex", cat: "Money & Apps", text: "Zero-markup Forex card + INR/USD cash to exchange at CMB airport", done: false },
  { id: "apps", cat: "Money & Apps", text: "Install & verify PickMe and Uber Sri Lanka apps before flying", done: false },
  { id: "sim", cat: "Money & Apps", text: "Dialog / Mobitel tourist eSIM or airport SIM card", done: false },
  { id: "plug", cat: "Gear & Clothing", text: "Universal travel adapter (Sri Lanka uses Type D & Type G)", done: false },
  { id: "temple", cat: "Gear & Clothing", text: "Modest clothing covering shoulders & knees for temples", done: false },
  { id: "sun", cat: "Gear & Clothing", text: "Reef-safe sunscreen, sunglasses, party outfits & beachwear", done: false }
];

export function getDefaultShortlist(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  DAYS_DATA.forEach((day) => {
    day.items.forEach((item) => {
      map[item.id] = !!item.defaultPick;
    });
  });
  return map;
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (h > 0 ? `${h}h ` : "") + (m > 0 ? `${m}m` : h === 0 ? "0m" : "");
}

export function legSpeedStyle(mins: number): { hex: string; textClass: string } {
  if (mins < 30) {
    return { hex: "#16a34a", textClass: "text-emerald-700 dark:text-emerald-400" };
  }
  if (mins < 90) {
    return { hex: "#d97706", textClass: "text-amber-700 dark:text-amber-400" };
  }
  return { hex: "#dc2626", textClass: "text-rose-700 dark:text-rose-400" };
}

export function gmapsPlaceUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getStopMapsUrl(item: StopItem, overrideQuery?: string): string {
  if (item.mapsUrl && /^https?:\/\//i.test(item.mapsUrl)) {
    return item.mapsUrl;
  }
  return gmapsPlaceUrl(overrideQuery ?? item.query);
}

export function gmapsMultiRouteUrl(items: StopItem[]): string {
  if (!items.length) return "https://www.google.com/maps";
  if (items.length === 1) return getStopMapsUrl(items[0]);
  const capped = items.slice(0, 10);
  const origin = encodeURIComponent(capped[0].query);
  const dest = encodeURIComponent(capped[capped.length - 1].query);
  const waypoints =
    capped.length > 2
      ? `&waypoints=${encodeURIComponent(
          capped
            .slice(1, -1)
            .map((x) => x.query)
            .join("|")
        )}`
      : "";
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${origin}&destination=${dest}${waypoints}`;
}

export function convertToInr(amt: number, cur: string, inrToLkr: number, usdToInr: number): number {
  const lkrRate = inrToLkr > 0 ? inrToLkr : 3.55;
  const usdRate = usdToInr > 0 ? usdToInr : 84.5;
  if (cur === "INR") return amt;
  if (cur === "USD") return amt * usdRate;
  return amt / lkrRate;
}

export function parseGoogleMapsInput(
  rawInput: string,
  fallbackLat: number,
  fallbackLng: number,
  destinationHint?: string
): { name: string; query: string; lat: number; lng: number; mapsUrl?: string; hasExactCoords: boolean } {
  const input = rawInput.trim();
  if (!input) {
    return { name: "", query: "", lat: fallbackLat, lng: fallbackLng, hasExactCoords: false };
  }

  const hint = (destinationHint || "").trim();
  const appendHint = (base: string) => {
    if (!hint) return base;
    const firstWord = hint.split(/[,\s]+/)[0]?.toLowerCase() || "";
    if (firstWord && base.toLowerCase().includes(firstWord)) return base;
    return `${base} ${hint}`;
  };

  const isUrl = /^https?:\/\//i.test(input) || input.includes("google.com/maps") || input.includes("maps.app.goo.gl");
  let lat = fallbackLat;
  let lng = fallbackLng;
  let hasExactCoords = false;
  let name = "";
  let query = input;

  if (isUrl) {
    const bangMatch = input.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    const atMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const qCoordMatch = input.match(/[?&](?:q|ll|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);

    if (bangMatch) {
      lat = parseFloat(bangMatch[1]);
      lng = parseFloat(bangMatch[2]);
      hasExactCoords = true;
    } else if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
      hasExactCoords = true;
    } else if (qCoordMatch) {
      lat = parseFloat(qCoordMatch[1]);
      lng = parseFloat(qCoordMatch[2]);
      hasExactCoords = true;
    }

    const placeMatch = input.match(/\/maps\/place\/([^/@?]+)/);
    if (placeMatch && placeMatch[1]) {
      try {
        name = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
      } catch {
        name = placeMatch[1].replace(/\+/g, " ").trim();
      }
    } else {
      try {
        const parsed = new URL(input.startsWith("http") ? input : `https://${input}`);
        const qParam = parsed.searchParams.get("q") || parsed.searchParams.get("query");
        if (qParam && !/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(qParam.trim())) {
          name = qParam.trim();
        }
      } catch {
        // Ignore invalid URL parse
      }
    }

    if (name) {
      query = appendHint(name);
    } else if (hasExactCoords) {
      query = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    }

    return {
      name,
      query,
      lat,
      lng,
      mapsUrl: input.startsWith("http") ? input : `https://${input}`,
      hasExactCoords
    };
  }

  return {
    name: input,
    query: appendHint(input),
    lat,
    lng,
    hasExactCoords: false
  };
}

export function estimateLegKmAndMins(a: StopItem, b: StopItem): [number, number] {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  const straightKm = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  const roadKm = Math.max(1, Math.round(straightKm * 1.28));
  const avgKmh = roadKm > 60 ? 52 : roadKm > 15 ? 36 : 24;
  const mins = Math.max(4, Math.round((roadKm / avgKmh) * 60));
  return [roadKm, mins];
}

export const SUGGESTED_GEMS: {
  id: string;
  region: "south" | "colombo";
  name: string;
  query: string;
  lat: number;
  lng: number;
  desc: string;
  type: "v" | "f" | "s" | "p";
  diet: "veg" | "both" | "none";
}[] = [
  {
    id: "gem_secret_beach",
    region: "south",
    name: "Secret Beach Mirissa",
    query: "Secret Beach Mirissa Sri Lanka",
    lat: 5.9472,
    lng: 80.4454,
    desc: "Secluded hidden cove with natural rock pool & beach shack — great morning swim or sunset",
    type: "s",
    diet: "none"
  },
  {
    id: "gem_stilt_fishermen",
    region: "south",
    name: "Koggala Stilt Fishermen",
    query: "Stilt Fishermen Koggala Sri Lanka",
    lat: 5.9912,
    lng: 80.3264,
    desc: "Traditional Sri Lankan stilt fishermen along the reef between Unawatuna & Ahangama",
    type: "v",
    diet: "none"
  },
  {
    id: "gem_weligama_surf",
    region: "south",
    name: "Weligama Bay Surf Lesson",
    query: "Weligama Beach Surf School Sri Lanka",
    lat: 5.9732,
    lng: 80.4278,
    desc: "Gentle sandy beginner-friendly surf waves — 90-min board + instructor session",
    type: "v",
    diet: "none"
  },
  {
    id: "gem_dondra",
    region: "south",
    name: "Dondra Head Lighthouse",
    query: "Dondra Head Lighthouse Matara Sri Lanka",
    lat: 5.9225,
    lng: 80.5906,
    desc: "Southernmost tip of Sri Lanka with towering 1890 white lighthouse & dramatic ocean cliffs",
    type: "v",
    diet: "none"
  },
  {
    id: "gem_lotus_tower",
    region: "colombo",
    name: "Colombo Lotus Tower (Observation Deck)",
    query: "Colombo Lotus Tower Sri Lanka",
    lat: 6.9271,
    lng: 79.8584,
    desc: "South Asia’s tallest tower — 360° sunset skyline views & revolving restaurant",
    type: "s",
    diet: "none"
  },
  {
    id: "gem_red_mosque",
    region: "colombo",
    name: "Jami Ul-Alfar (Red Mosque)",
    query: "Jami Ul-Alfar Mosque Pettah Colombo",
    lat: 6.9386,
    lng: 79.8515,
    desc: "Iconic red-and-white candy-striped 1909 mosque right inside Pettah Market",
    type: "v",
    diet: "none"
  },
  {
    id: "gem_viharamahadevi",
    region: "colombo",
    name: "Viharamahadevi Park & Nelum Pokuna",
    query: "Viharamahadevi Park Colombo",
    lat: 6.9138,
    lng: 79.8615,
    desc: "Colombo’s grand shaded botanical park opposite the Town Hall & Lotus Pond Theatre",
    type: "v",
    diet: "none"
  },
  {
    id: "gem_good_market",
    region: "colombo",
    name: "The Good Market (Racecourse)",
    query: "Good Market Colombo Racecourse",
    lat: 6.9061,
    lng: 79.8654,
    desc: "Curated Sri Lankan organic teas, spices, handloom souvenirs & artisan cafes",
    type: "f",
    diet: "veg"
  }
];

export const SINHALA_PHRASES: { phrase: string; meaning: string; note: string }[] = [
  { phrase: "Ayubowan", meaning: "Hello / Welcome", note: "Formal & warm greeting" },
  { phrase: "Istuti", meaning: "Thank you", note: "Useful everywhere" },
  { phrase: "Gana kiyada?", meaning: "How much is this?", note: "Tuk-tuks & Pettah Market" },
  { phrase: "Nawaththanna", meaning: "Stop here", note: "For drivers & tuk-tuks" },
  { phrase: "Hari / Epa", meaning: "Okay / No thank you", note: "Politely decline street pitches" }
];

export const LOCAL_TIPS: string[] = [
  "Tuk-tuks: Expect ~100–150 LKR/km on the South Coast; agree on fare upfront or use PickMe/Uber in Galle & Colombo.",
  "Cash & Small Bills: Keep 100, 500, and 1,000 LKR notes handy for beach shacks, temple shoe storage, and expressway tolls (~900–1,200 LKR).",
  "Temple Etiquette: Remove shoes & hats before entering stupas (Peace Pagoda, Gangaramaya) and cover shoulders and knees.",
  "December Coast Weather: Peak dry sunny season (27–31°C); sunset hits right around 5:50–6:05pm."
];

