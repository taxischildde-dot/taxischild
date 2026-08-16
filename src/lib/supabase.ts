import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(configuredUrl && configuredAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables are missing; cloud mode is unavailable until configured.');
}

// Keep the app renderable when a deployment was built without its environment values.
// Auth and data actions remain disabled by AuthContext until real values are provided.
export const supabase = createClient(
  configuredUrl ?? 'https://placeholder.supabase.co',
  configuredAnonKey ?? 'placeholder-anon-key',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

