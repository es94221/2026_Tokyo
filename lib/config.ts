import type { Order, TripDay, TripSettings, Wish } from "./types";

export const dayColorPalette = [
  "#d8c79d",
  "#b9b98d",
  "#a8b596",
  "#d6bd80",
  "#cfc5a5",
  "#8f9b73",
];

export const defaultTripSettings: TripSettings = {
  startDate: "2026-06-22",
  dayCount: 6,
};

export const defaultDays: TripDay[] = [
  { title: "", date: "7/18 Sat", color: "#d8c79d", summary: "", city: "", stay: "", timeline: [] },
  { title: "", date: "7/19 Sun", color: "#b9b98d", summary: "", city: "", stay: "", timeline: [] },
  { title: "", date: "7/20 Mon", color: "#a8b596", summary: "", city: "", stay: "", timeline: [] },
  { title: "", date: "7/21 Tue", color: "#d6bd80", summary: "", city: "", stay: "", timeline: [] },
];

export const defaultOrders: Order[] = [
  {
    type: "hotel",
    name: "Day 1-2 湖邊小屋住宿確認信",
    url: "https://mail.google.com/mail/u/0/#search/lake+house+booking",
  },
  {
    type: "car",
    name: "機場接送與 Day 3 包車",
    url: "https://mail.google.com/mail/u/0/#search/car+reservation",
  },
  {
    type: "activity",
    name: "Day 3 自然導覽活動預約",
    url: "https://mail.google.com/mail/u/0/#search/tour+confirmation",
  },
];

export const defaultWishes: Wish[] = [
  { person: "媽媽", place: "有漂亮花園的咖啡店", day: "Day 2", done: false },
];

export const tripConfig = {
  map: {
    query: process.env.NEXT_PUBLIC_MAP_QUERY ?? "Tokyo, Japan",
    zoom: Number(process.env.NEXT_PUBLIC_MAP_ZOOM ?? 12),
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  },
  supabase: {
    enabled: process.env.NEXT_PUBLIC_SUPABASE_ENABLED !== "false",
    projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "",
    tableName: process.env.NEXT_PUBLIC_SUPABASE_TABLE ?? "trip_state",
    rowId: process.env.NEXT_PUBLIC_SUPABASE_ROW_ID ?? "family-trip",
  },
};
