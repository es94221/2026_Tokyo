import type { SupabaseClient } from "@supabase/supabase-js";
import { tripConfig } from "@/lib/config";

export function isAuthRequired() {
  return tripConfig.supabase.enabled && Boolean(tripConfig.supabase.projectUrl.trim());
}

export function getAuthRedirectUrl() {
  if (typeof window === "undefined") return "";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalizedBase = basePath.replace(/\/$/, "");
  return `${window.location.origin}${normalizedBase}/auth/callback`;
}

export async function checkAllowlist(client: SupabaseClient, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const { data, error } = await client
    .from("allowed_emails")
    .select("email")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    console.warn("Allowlist check failed:", error);
    return false;
  }

  return Boolean(data);
}
