-- Create a new bucket named 'media' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- IMPORTANT: Storage RLS policies for 'media' bucket

-- 1. Allow public read access to all files inside 'media'
CREATE POLICY "Public media access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

-- 2. Allow authenticated users to upload files
CREATE POLICY "Auth users can upload media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- 3. Allow authenticated users to update their own files
CREATE POLICY "Auth users can update media" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- 4. Allow authenticated users to delete their own files
CREATE POLICY "Auth users can delete media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media' AND auth.role() = 'authenticated');
