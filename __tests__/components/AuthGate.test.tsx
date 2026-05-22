import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthGate } from "@/components/trip/AuthGate";
import { renderWithLocale } from "@/test/render";

vi.mock("@/lib/config", () => ({
  tripConfig: { supabase: { enabled: false, projectUrl: "" } },
}));

describe("AuthGate", () => {
  it("renders children when auth is not required", async () => {
    await renderWithLocale(
      <AuthGate>
        <p>Trip content</p>
      </AuthGate>,
    );
    expect(screen.getByText("Trip content")).toBeInTheDocument();
  });
});
