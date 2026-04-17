-- Thêm bảng theo dõi tiến độ đọc của người dùng
CREATE TABLE IF NOT EXISTS public.user_reading_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(book_id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, book_id)
);

-- Bảo mật thông tin chỉ người đó đọc được
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own progress" 
ON public.user_reading_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress" 
ON public.user_reading_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_reading_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- Thêm các cột theo dõi chỉ số cho sách
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0.0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Cập nhật Function RPC tự động cộng dồn Views khi đọc truyện
CREATE OR REPLACE FUNCTION public.increment_book_views(p_book_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.books
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE book_id = p_book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hàm tự động tính sao trung bình (Trigger function)
CREATE OR REPLACE FUNCTION public.update_book_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.books
    SET 
        average_rating = (
            SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0) 
            FROM public.reviews 
            WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM public.reviews 
            WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
        )
    WHERE book_id = COALESCE(NEW.book_id, OLD.book_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Gắn Trigger vào bảng đánh giá (Reviews)
DROP TRIGGER IF EXISTS update_book_ratings_trigger ON public.reviews;

CREATE TRIGGER update_book_ratings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_book_ratings();
