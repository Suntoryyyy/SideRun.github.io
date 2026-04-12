import 'react-native-url-polyfill/auto'; // Polyfill required for React Native + Supabase
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// MemFire Cloud credentials (Supabase SDK)
// Replace these with your actual Memfire Cloud Project URL and anon key from your dashboard
const memfireUrl = 'https://YOUR_MEMFIRE_PROJECT.supabase.co'; // e.g., https://xxx.memfire.com
const memfireAnonKey = 'YOUR_MEMFIRE_ANON_KEY';

export const supabase = createClient(memfireUrl, memfireAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
