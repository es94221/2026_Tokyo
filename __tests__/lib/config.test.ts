import { describe, expect, it } from "vitest";
import {
  dayColorPalette,
  defaultDays,
  defaultOrders,
  defaultTripSettings,
  defaultWishes,
  tripConfig,
} from "@/lib/config";

describe("config defaults", () => {
  it("exports trip settings", () => {
    expect(defaultTripSettings.startDate).toBeTruthy();
    expect(defaultTripSettings.dayCount).toBeGreaterThan(0);
  });

  it("exports seeded content", () => {
    expect(defaultDays.length).toBeGreaterThan(0);
    expect(defaultOrders.length).toBeGreaterThan(0);
    expect(defaultWishes.length).toBeGreaterThan(0);
    expect(dayColorPalette.length).toBeGreaterThan(0);
  });

  it("reads map, supabase, and storage config from env with fallbacks", () => {
    expect(tripConfig.map.query).toBeTruthy();
    expect(tripConfig.supabase.tableName).toBeTruthy();
    expect(typeof tripConfig.supabase.enabled).toBe("boolean");
    expect(tripConfig.storage.bucket).toBeTruthy();
    expect(typeof tripConfig.storage.enabled).toBe("boolean");
  });
});
