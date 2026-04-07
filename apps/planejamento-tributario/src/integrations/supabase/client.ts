import { getSupabaseClient, type SupabaseClient } from "@socios/auth";
import type { Database } from "./types";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = getSupabaseClient() as SupabaseClient<Database>;
