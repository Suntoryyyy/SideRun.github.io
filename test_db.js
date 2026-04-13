const { createClient } = require('@supabase/supabase-js');
const memfireUrl = 'https://d7ef9e8g91hmdup7u4e0.baseapi.memfiredb.com'\;
const memfireAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImV4cCI6MzM1Mjg4ODI0OSwiaWF0IjoxNzc2MDg4MjQ5LCJpc3MiOiJzdXBhYmFzZSJ9.foErpts0bF8t69SNOZRFmxekClOYIoKQxkOnDO-qqm4';

const supabase = createClient(memfireUrl, memfireAnonKey);

async function test() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log("DB Test:", { data, error });
}
test();
