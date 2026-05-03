const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cqqqysizowcelahzyzcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcXF5c2l6b3djZWxhaHp5emNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0MTU5NSwiZXhwIjoyMDkxODE3NTk1fQ.26UrLGXfyT9lMB7IHlmaZCqH-182575sSsNySTMj-WQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrls() {
    const { data, error } = await supabase.from('books').select('title, file_url').ilike('title', '%đắc%');
    console.log("Đắc Nhân Tâm:", data);

    const { data: data2 } = await supabase.from('books').select('title, file_url').ilike('title', '%hoa vàng%');
    console.log("Hoa vàng:", data2);
}

checkUrls();
