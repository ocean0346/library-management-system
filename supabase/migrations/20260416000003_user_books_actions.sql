-- Create table for User Favorites
CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(book_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, book_id)
);

-- Create table for User Saved Books
CREATE TABLE IF NOT EXISTS public.user_saved_books (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(book_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, book_id)
);

-- Set Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_books ENABLE ROW LEVEL SECURITY;

-- Set up RLS Policies for user_favorites
CREATE POLICY "Users can insert their own favorites" 
ON public.user_favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all favorites" 
ON public.user_favorites FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites FOR DELETE 
USING (auth.uid() = user_id);

-- Set up RLS Policies for user_saved_books
CREATE POLICY "Users can insert their own saved books" 
ON public.user_saved_books FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved books" 
ON public.user_saved_books FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved books" 
ON public.user_saved_books FOR DELETE 
USING (auth.uid() = user_id);
