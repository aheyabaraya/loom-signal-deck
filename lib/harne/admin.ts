import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getHarneAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  const origin = new URL(url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if ((origin.protocol !== "https:" && !(origin.protocol === "http:" && local)) ||
      origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
    throw new Error("Supabase server URL is invalid.");
  }
  return createClient(url, serviceRoleKey, {
    global: { fetch: (input, init) => fetch(input, { ...init, redirect: "error" }) },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
