import 'react-native-url-polyfill/auto'; // Polyfill required for React Native + Supabase
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// MemFire Cloud credentials (Supabase SDK)
// Replace these with your actual Memfire Cloud Project URL and anon key from your dashboard
const memfireUrl = 'https://d7ef9e8g91hmdup7u4e0.baseapi.memfiredb.com'; // e.g., https://xxx.memfire.com
const memfireAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImV4cCI6MzM1Mjg4ODI0OSwiaWF0IjoxNzc2MDg4MjQ5LCJpc3MiOiJzdXBhYmFzZSJ9.foErpts0bF8t69SNOZRFmxekClOYIoKQxkOnDO-qqm4';

export const supabase = createClient(memfireUrl, memfireAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
