const fs = require('fs');

let supabaseCode = fs.readFileSync('services/supabase.js', 'utf-8');

supabaseCode = supabaseCode.replace(
  "const memfireUrl = 'https://YOUR_MEMFIRE_PROJECT.supabase.co'\\;",
  "const memfireUrl = 'https://YOUR_MEMFIRE_PROJECT.supabase.co';"
);

fs.writeFileSync('services/supabase.js', supabaseCode);
