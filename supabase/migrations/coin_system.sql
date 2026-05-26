-- =============================================
-- HỆ THỐNG XU (COIN SYSTEM) - Migration
-- =============================================

-- 1. Thêm cột coin_balance vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS coin_balance INTEGER DEFAULT 0;

-- 2. Thêm cột giá xu cho sách
ALTER TABLE books ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT 50;
-- coin_price = giá xu cho mỗi chương (sách chữ) hoặc toàn bộ sách (PDF)
-- Mặc định: 50 xu/chương, admin có thể đặt 0 = miễn phí toàn bộ

-- 3. Bảng lịch sử giao dịch xu
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL, -- dương = nạp, âm = tiêu
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'PURCHASE_CHAPTER', 'PURCHASE_PDF', 'REFUND', 'BONUS', 'ADMIN_GRANT')),
    description TEXT,
    book_id UUID REFERENCES books(book_id) ON DELETE SET NULL,
    chapter_number INTEGER, -- null cho PDF
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bảng lưu chương/sách đã mở khóa
CREATE TABLE IF NOT EXISTS user_unlocked_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES books(book_id) ON DELETE CASCADE NOT NULL,
    chapter_number INTEGER, -- null = mở khóa toàn bộ sách PDF
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, book_id, chapter_number)
);

-- 5. Bảng gói nạp xu
CREATE TABLE IF NOT EXISTS coin_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    coin_amount INTEGER NOT NULL,
    price_vnd INTEGER NOT NULL,
    bonus_coins INTEGER DEFAULT 0,
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created ON coin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unlocked_content_user_book ON user_unlocked_content(user_id, book_id);

-- Insert default coin packages
INSERT INTO coin_packages (name, coin_amount, price_vnd, bonus_coins, sort_order) VALUES
    ('Gói Khởi Đầu', 50, 10000, 0, 1),
    ('Gói Tiết Kiệm', 200, 35000, 20, 2),
    ('Gói Đại Gia', 500, 80000, 70, 3)
ON CONFLICT DO NOTHING;

-- RPC: Mở khóa chương bằng xu (atomic transaction)
CREATE OR REPLACE FUNCTION unlock_chapter_with_coins(
    p_user_id UUID,
    p_book_id UUID,
    p_chapter_number INTEGER,
    p_coin_cost INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_already_unlocked BOOLEAN;
    v_book_title TEXT;
BEGIN
    -- Check if already unlocked
    SELECT EXISTS(
        SELECT 1 FROM user_unlocked_content
        WHERE user_id = p_user_id AND book_id = p_book_id AND chapter_number = p_chapter_number
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN jsonb_build_object('success', true, 'message', 'Chương đã được mở khóa trước đó');
    END IF;

    -- Get current balance
    SELECT coin_balance INTO v_balance FROM users WHERE user_id = p_user_id;

    IF v_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy người dùng');
    END IF;

    IF v_balance < p_coin_cost THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không đủ xu. Bạn cần ' || p_coin_cost || ' xu nhưng chỉ có ' || v_balance || ' xu', 'balance', v_balance, 'required', p_coin_cost);
    END IF;

    -- Get book title
    SELECT title INTO v_book_title FROM books WHERE book_id = p_book_id;

    -- Deduct coins
    UPDATE users SET coin_balance = coin_balance - p_coin_cost WHERE user_id = p_user_id;

    -- Record transaction
    INSERT INTO coin_transactions (user_id, amount, type, description, book_id, chapter_number)
    VALUES (p_user_id, -p_coin_cost, 'PURCHASE_CHAPTER', 'Mở khóa Chương ' || p_chapter_number || ' - ' || COALESCE(v_book_title, ''), p_book_id, p_chapter_number);

    -- Unlock chapter
    INSERT INTO user_unlocked_content (user_id, book_id, chapter_number)
    VALUES (p_user_id, p_book_id, p_chapter_number);

    RETURN jsonb_build_object('success', true, 'message', 'Mở khóa thành công!', 'new_balance', v_balance - p_coin_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Mở khóa sách PDF bằng xu
CREATE OR REPLACE FUNCTION unlock_pdf_with_coins(
    p_user_id UUID,
    p_book_id UUID,
    p_coin_cost INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_already_unlocked BOOLEAN;
    v_book_title TEXT;
BEGIN
    -- Check if already unlocked (chapter_number IS NULL = toàn bộ PDF)
    SELECT EXISTS(
        SELECT 1 FROM user_unlocked_content
        WHERE user_id = p_user_id AND book_id = p_book_id AND chapter_number IS NULL
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN jsonb_build_object('success', true, 'message', 'Sách đã được mở khóa trước đó');
    END IF;

    -- Get current balance
    SELECT coin_balance INTO v_balance FROM users WHERE user_id = p_user_id;

    IF v_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy người dùng');
    END IF;

    IF v_balance < p_coin_cost THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không đủ xu. Bạn cần ' || p_coin_cost || ' xu nhưng chỉ có ' || v_balance || ' xu', 'balance', v_balance, 'required', p_coin_cost);
    END IF;

    -- Get book title
    SELECT title INTO v_book_title FROM books WHERE book_id = p_book_id;

    -- Deduct coins
    UPDATE users SET coin_balance = coin_balance - p_coin_cost WHERE user_id = p_user_id;

    -- Record transaction
    INSERT INTO coin_transactions (user_id, amount, type, description, book_id)
    VALUES (p_user_id, -p_coin_cost, 'PURCHASE_PDF', 'Mở khóa sách PDF - ' || COALESCE(v_book_title, ''), p_book_id);

    -- Unlock entire PDF (chapter_number = NULL)
    INSERT INTO user_unlocked_content (user_id, book_id, chapter_number)
    VALUES (p_user_id, p_book_id, NULL);

    RETURN jsonb_build_object('success', true, 'message', 'Mở khóa thành công!', 'new_balance', v_balance - p_coin_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Nạp xu cho user (gọi từ webhook hoặc admin)
CREATE OR REPLACE FUNCTION add_coins_to_user(
    p_user_id UUID,
    p_amount INTEGER,
    p_type TEXT DEFAULT 'DEPOSIT',
    p_description TEXT DEFAULT 'Nạp xu',
    p_stripe_session_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Add coins
    UPDATE users SET coin_balance = coin_balance + p_amount WHERE user_id = p_user_id
    RETURNING coin_balance INTO v_new_balance;

    IF v_new_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy người dùng');
    END IF;

    -- Record transaction
    INSERT INTO coin_transactions (user_id, amount, type, description, stripe_session_id)
    VALUES (p_user_id, p_amount, p_type, p_description, p_stripe_session_id);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tặng 50 xu cho user mới: Trigger trên bảng users
CREATE OR REPLACE FUNCTION grant_signup_bonus() RETURNS TRIGGER AS $$
BEGIN
    -- Set initial balance to 50
    NEW.coin_balance := 50;
    
    -- Record the bonus transaction
    INSERT INTO coin_transactions (user_id, amount, type, description)
    VALUES (NEW.user_id, 50, 'BONUS', 'Xu chào mừng thành viên mới! 🎉');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_signup_bonus ON users;
CREATE TRIGGER trigger_signup_bonus
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION grant_signup_bonus();

-- RLS Policies
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_unlocked_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_packages ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can view own transactions" ON coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own unlocked content
CREATE POLICY "Users can view own unlocked content" ON user_unlocked_content
    FOR SELECT USING (auth.uid() = user_id);

-- Everyone can read active coin packages
CREATE POLICY "Anyone can view active packages" ON coin_packages
    FOR SELECT USING (is_active = true);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access transactions" ON coin_transactions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access unlocked" ON user_unlocked_content
    FOR ALL USING (true) WITH CHECK (true);
