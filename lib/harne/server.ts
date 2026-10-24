import { HARNE_EXPECTED_USER_HEADER } from "./contracts";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/env";

export async function getHarneServerContext() {
  if (!isSupabaseConfigured()) {
    return { supabase: null, user: null, error: new Error("Supabase is not configured.") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return { supabase, user: data.user, error };
}

// A hint only restricts this verified context; it never selects/authenticates a user.
async function getHarneBoundContext(request: Request, requireExpectedUser: boolean) {
  const expectedUserId = request.headers.get(HARNE_EXPECTED_USER_HEADER);
  const context = await getHarneServerContext();
  const validExpectedUser = typeof expectedUserId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(expectedUserId);
  if (context.error || !context.user || ((requireExpectedUser || expectedUserId !== null) &&
      (!validExpectedUser || expectedUserId !== context.user.id))) {
    return { ...context, user: null, error: new Error("Harne account changed or could not be verified.") };
  }
  return context;
}

export async function getHarneMutationContext(request: Request) {
  return getHarneBoundContext(request, true);
}

export async function getHarneReadContext(request: Request) {
  // Legacy authenticated GET callers without hints retain their read contract.
  // New UI reads always bind the expected user, including A -> B -> A races.
  return getHarneBoundContext(request, false);
}
