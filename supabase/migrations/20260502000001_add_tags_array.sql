-- Migration to add tags array to books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];
