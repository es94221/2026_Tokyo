import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { tripConfig } from "./config";

let client: SupabaseClient | null = null;

function getProjectUrl() {
  return tripConfig.supabase.projectUrl.replace(".supabase.cos", ".supabase.co");
}

/** Normalize dashboard copy-paste (legacy anon JWT or sb_publishable_*). */
export function normalizePublishableKey(key: string) {
  const trimmed = key.trim();
  if (trimmed.startsWith("b_publishable_")) return `s${trimmed}`;
  return trimmed;
}

function getPublishableKey() {
  return normalizePublishableKey(tripConfig.supabase.publishableKey);
}

export function getSupabaseClient() {
  if (!tripConfig.supabase.enabled || !tripConfig.supabase.projectUrl) return null;
  if (!client) {
    client = createClient(getProjectUrl(), getPublishableKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    });
  }
  return client;
}

export function resetSupabaseClientForTests() {
  client = null;
}
