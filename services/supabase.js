import 'react-native-url-polyfill/auto'; // Polyfill required for React Native + Supabase
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Read from env (Expo exposes any EXPO_PUBLIC_* var to the client bundle).
// Define them in a local `.env` file at the project root — see `.env.example`.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_MEMFIRE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_MEMFIRE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly during dev, but don't crash the bundle so Expo can still boot.
  console.error(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your project credentials.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
