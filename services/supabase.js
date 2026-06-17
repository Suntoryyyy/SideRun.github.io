/**
 * supabase.js — compatibility shim.
 *
 * The hosted Supabase/MemFire backend is no longer rented, and the app must
 * run entirely offline for local + multi-device demos. To avoid touching every
 * screen, we keep this module's public surface identical (`export const supabase`)
 * but back it with a fully local, AsyncStorage-based client.
 *
 * See services/localClient.js for the implementation and the seeded demo
 * accounts. To restore a real cloud backend later, swap this re-export back to
 * a `createClient(...)` call.
 */
export { supabase, default } from './localClient';
