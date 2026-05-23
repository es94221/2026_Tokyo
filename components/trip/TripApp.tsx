"use client";

import { useCallback, useState } from "react";
import { AuthScreenShell } from "@/components/trip/AuthScreenShell";
import { TripHub } from "@/components/trip/TripHub";
import { TripPlanner } from "@/components/trip/TripPlanner";
import { useTripRegistry } from "@/hooks/useTripRegistry";
import { useLocale } from "@/contexts/LocaleContext";

function updateTripQuery(tripId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (tripId) {
    url.searchParams.set("trip", tripId);
  } else {
    url.searchParams.delete("trip");
  }
  window.history.replaceState({}, "", url.toString());
}

function readTripQuery() {
  if (typeof window === "undefined") return null;
  return new URL(window.location.href).searchParams.get("trip");
}

export function TripApp() {
  const { t } = useLocale();
  const registry = useTripRegistry();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(() => readTripQuery());

  const openTrip = useCallback((tripId: string) => {
    setSelectedTripId(tripId);
    updateTripQuery(tripId);
  }, []);

  const backToHub = useCallback(() => {
    setSelectedTripId(null);
    updateTripQuery(null);
  }, []);

  const handleCreateTrip = useCallback(
    async (name: string) => {
      const meta = await registry.createTrip(name);
      openTrip(meta.id);
    },
    [registry, openTrip],
  );

  if (!registry.hydrated) {
    return (
      <AuthScreenShell>
        <p>{t("auth.loading")}</p>
      </AuthScreenShell>
    );
  }

  if (selectedTripId) {
    const meta = registry.getTrip(selectedTripId);
    return (
      <TripPlanner
        tripId={selectedTripId}
        tripName={meta?.name ?? t("hub.untitledTrip")}
        tripStatus={meta?.status}
        onBackToHub={backToHub}
      />
    );
  }

  return (
    <AuthScreenShell>
      <TripHub
        activeTrip={registry.activeTrip}
        planningTrips={registry.planningTrips}
        pastTrips={registry.pastTrips}
        onOpenTrip={openTrip}
        onCreateTrip={handleCreateTrip}
        onSetActive={(id) => void registry.activateTrip(id)}
        onMarkPast={(id) => void registry.updateTripStatus(id, "past")}
      />
    </AuthScreenShell>
  );
}
