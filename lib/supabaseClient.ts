import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) throw new Error("❌ Missing Supabase env");

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
