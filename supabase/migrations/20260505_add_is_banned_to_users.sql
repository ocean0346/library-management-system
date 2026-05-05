-- Bổ sung cột is_banned để quản lý trạng thái khóa tài khoản
ALTER TABLE public.users
ADD COLUMN is_banned BOOLEAN DEFAULT false;

-- Tạo index để truy vấn nhanh trạng thái khóa
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON public.users(is_banned);
