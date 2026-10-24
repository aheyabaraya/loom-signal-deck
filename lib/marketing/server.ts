import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/env";

export async function getMarketingServerContext() {
  if (!isSupabaseConfigured()) {
    return { supabase: null, user: null, error: new Error("Supabase is not configured.") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return { supabase, user: data.user, error };
}
