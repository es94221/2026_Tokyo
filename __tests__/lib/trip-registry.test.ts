import { describe, expect, it } from "vitest";
import {
  addTrip,
  createEmptyRegistry,
  createTripMeta,
  seedLegacyTrip,
  setActiveTrip,
  setTripStatus,
} from "@/lib/trip-registry";

describe("trip-registry", () => {
  it("seeds legacy trip when registry is empty", () => {
    const next = seedLegacyTrip(createEmptyRegistry(), "Tokyo 2026");
    expect(next.trips).toHaveLength(1);
    expect(next.activeTripId).toBe("family-trip");
    expect(next.trips[0].status).toBe("active");
  });

  it("creates planning trip meta", () => {
    const meta = createTripMeta("Kyoto");
    expect(meta.name).toBe("Kyoto");
    expect(meta.status).toBe("planning");
  });

  it("sets one active trip at a time", () => {
    const a = createTripMeta("A");
    const b = createTripMeta("B");
    let registry = addTrip(addTrip(createEmptyRegistry(), a), b);
    registry = setActiveTrip(registry, a.id);
    registry = setActiveTrip(registry, b.id);
    expect(registry.activeTripId).toBe(b.id);
    expect(registry.trips.find((t) => t.id === a.id)?.status).toBe("planning");
    expect(registry.trips.find((t) => t.id === b.id)?.status).toBe("active");
  });

  it("marks trip as past and clears active id", () => {
    const meta = createTripMeta("Old");
    let registry = addTrip(createEmptyRegistry(), meta);
    registry = setActiveTrip(registry, meta.id);
    registry = setTripStatus(registry, meta.id, "past");
    expect(registry.activeTripId).toBeNull();
    expect(registry.trips[0].status).toBe("past");
  });
});
