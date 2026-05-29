const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('books').select('title, tags').or('category_id.eq.3fba9397-2a44-4b57-a006-258162235cf5,tags.cs.{"Lịch sử"}').then(res => {
  console.log('Result:', res);
});
