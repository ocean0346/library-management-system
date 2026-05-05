-- ============================================
-- Migration: Chuyển is_admin sang hệ thống Role
-- Roles: 'SUPER_ADMIN', 'ADMIN', 'READER'
-- ============================================

-- 1. Thêm cột role
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'READER';

-- 2. Di chuyển dữ liệu từ is_admin sang role
UPDATE public.users SET role = 'ADMIN' WHERE is_admin = true;
UPDATE public.users SET role = 'READER' WHERE is_admin = false OR is_admin IS NULL;

-- 3. Tạo index cho cột role
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 4. Cập nhật hàm check_is_admin() để sử dụng cột role thay vì is_admin
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
DECLARE
    user_role VARCHAR(20);
BEGIN
    SELECT role INTO user_role FROM public.users WHERE user_id = auth.uid();
    RETURN user_role IN ('ADMIN', 'SUPER_ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. (Tùy chọn) Xóa cột is_admin cũ sau khi đã xác nhận mọi thứ hoạt động
-- ALTER TABLE public.users DROP COLUMN IF EXISTS is_admin;
