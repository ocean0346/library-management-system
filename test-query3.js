const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const q1 = `title.ilike.%a%,author.ilike.%a%`;
const q2 = `category_id.eq.2,tags.cs.{"Lịch sử"}`;
supabase.from('books').select('title').or(q1).or(q2).then(res => {
  console.log('Result:', JSON.stringify(res.error || res.data));
});
