import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;

// Vite inlines import.meta.env.VITE_* values at BUILD time. On Vercel these must be
// declared in Project Settings -> Environment Variables, otherwise they are
// undefined inside the deployed bundle (even if .env.local works locally).
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * False when the production build had no Supabase credentials.
 *
 * createClient() throws "supabaseUrl is required." the moment this module is
 * evaluated. Because App.tsx imports this file at the top level, that exception
 * aborts the whole bundle before React can mount, which shows up as a blank
 * white page. Using inert placeholders keeps the app rendering so the missing
 * configuration is visible/debuggable instead of silent.
 */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl || 'https://not-configured.supabase.co',
  supabaseKey || 'not-configured-key',
);
