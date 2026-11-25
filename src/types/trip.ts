export type StopType = "v" | "f" | "s" | "p" | "b";
export type DietType = "veg" | "both" | "none";
export type TierType = "core" | "alt_food" | "alt_party";
export type TabId = "plan" | "fly" | "money" | "gallery" | "tools";
export type ThemeMode = "system" | "light" | "dark";
export type ItineraryFilter = "all" | "shortlisted" | "veg";

export interface StopItem {
  id: string;
  name: string;
  query: string;
  lat: number;
  lng: number;
  desc: string;
  type: StopType;
  diet: DietType;
  tier: TierType;
  defaultPick: boolean;
  custom?: boolean;
  mapsUrl?: string;
}

export interface DayPlan {
  code: string;
  shortDate: string;
  title: string;
  summary: string;
  legs: [number, number][];
  items: StopItem[];
}

export interface HotelStay {
  id: string;
  name: string;
  query?: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
}

export interface TripFlight {
  id: string;
  header: string;
  airline: string;
  flightNo: string;
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  pnr: string;
  travelDate: string; // YYYY-MM-DD
  arrivalDate?: string; // YYYY-MM-DD
  depTime: string;
  arrTime: string;
  travelerNames?: string[]; // empty or undefined = all travelers
  fr24?: string;
  fa?: string;
  note?: string;
}

export interface TripMilestone {
  id: string;
  dateTime: string;
  label: string;
}

export interface ExpenseItem {
  id: string;
  desc: string;
  cat: string;
  cur: string;
  amt: number;
  by: number;
  splitAmong?: number[]; // traveler indices; undefined/empty = all members
}

export interface ChecklistItem {
  id: string;
  cat: string;
  text: string;
  done: boolean;
  custom?: boolean;
}

export interface TripPhrase {
  id: string;
  phrase: string;
  meaning: string;
  note?: string;
}

export interface EmergencyContact {
  label: string;
  number: string;
}

export interface TripCurrencyConfig {
  home: string;
  local: string;
  homeToLocal: number;
  usdToHome: number;
}

export interface GalleryPhoto {
  id: string;
  tripId: string;
  dataUrl: string;
  caption: string;
  dayIndex: number;
  location: string;
  createdAt: string;
}

export interface TripPlan {
  id: string;
  name: string;
  destination: string;
  travelersLabel: string;
  startDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  hotelName: string;
  hotelStays: HotelStay[];
  currency: TripCurrencyConfig;
  days: DayPlan[];
  shortlist: Record<string, boolean>;
  dayOrder: Record<number, string[]>;
  notes: Record<number, string>;
  flights: TripFlight[];
  milestones: TripMilestone[];
  members: string[];
  expenses: ExpenseItem[];
  checklist: ChecklistItem[];
  phrases: TripPhrase[];
  tips: string[];
  emergencyContacts: EmergencyContact[];
}

export interface TripollaExportPayload {
  app: "Tripolla";
  version: 2;
  exportedAt: string;
  trip: TripPlan;
  gallery?: GalleryPhoto[];
}
