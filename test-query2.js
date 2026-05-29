const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const q = `category_id.eq.2,tags.cs.{"Lịch sử"}`;
supabase.from('books').select('title, tags').or(q).then(res => {
  console.log('Result:', JSON.stringify(res.error || res.data));
});
