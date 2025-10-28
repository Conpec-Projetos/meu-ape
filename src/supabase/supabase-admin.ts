import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/types";

// Note: This client is intended for server-side use only.
// It uses the service role key to bypass Row Level Security.
// NEVER expose this client or its key to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_PROJECT_URL");
}
if (!supabaseSecretKey) {
    throw new Error("Missing env.SUPABASE_SECRET_KEY");
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
        // It's good practice to disable auto-refreshing tokens for server-side clients
        autoRefreshToken: false,
        persistSession: false,
    },
});
