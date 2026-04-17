const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  console.log('Buckets list:', buckets.map(b => b.name), bucketsErr);

  const fileBlob = new Blob(['helloworld'], { type: 'text/plain' });
  const { data, error } = await supabase.storage.from('media').upload('test.txt', fileBlob, { upsert: true });
  console.log('Upload result:', data, error);
}

testUpload();
