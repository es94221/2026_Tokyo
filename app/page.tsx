"use client";

import { AuthGate } from "@/components/trip/AuthGate";
import { TripApp } from "@/components/trip/TripApp";

export default function HomePage() {
  return (
    <AuthGate>
      <TripApp />
    </AuthGate>
  );
}
