const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const query = supabase.from('books').select(`*, categories(name)`, { count: 'exact' });
query.or(`category_id.eq.4,tags.cs.{"Lịch sử"}`).then(res => {
  console.log('Result:', JSON.stringify(res.error || res.data));
});
