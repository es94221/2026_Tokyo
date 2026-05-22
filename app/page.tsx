"use client";

import { AuthGate } from "@/components/trip/AuthGate";
import { TripPlanner } from "@/components/trip/TripPlanner";

export default function HomePage() {
  return (
    <AuthGate>
      <TripPlanner />
    </AuthGate>
  );
}
