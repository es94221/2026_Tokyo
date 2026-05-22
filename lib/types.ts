export type OrderTypeKey = "hotel" | "car" | "activity" | "restaurant" | "transport";

export type LocaleCode = "zh" | "en";

export type SyncStatusKind = "local" | "cloud" | "syncing" | "error";

export type SyncMessageKey =
  | "local"
  | "localPendingCloud"
  | "cloud"
  | "syncing"
  | "connecting"
  | "cloudSyncFailed"
  | "cloudConnectFailed"
  | "supabaseNotLoaded";

export interface TripSettings {
  startDate: string;
  dayCount: number;
}

export interface TripDay {
  title: string;
  date: string;
  color: string;
  summary: string;
  city: string;
  stay: string;
  timeline: [string, string][];
}

export interface Order {
  type: string;
  name: string;
  url: string;
}

export interface Wish {
  person: string;
  place: string;
  day: string;
  done: boolean;
}

export type LocaleMessages = Record<string, unknown>;
