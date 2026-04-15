-- Create a security definer function to check admin status without infinite recursion
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
DECLARE
    is_admin_flag boolean;
BEGIN
    SELECT is_admin INTO is_admin_flag FROM public.users WHERE user_id = auth.uid();
    RETURN COALESCE(is_admin_flag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS on tables if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- users table policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

CREATE POLICY "Users can read own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins can update users" ON users FOR UPDATE TO authenticated USING (public.check_is_admin());

-- reviews table policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete any reviews" ON reviews;

CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any reviews" ON reviews FOR DELETE TO authenticated USING (public.check_is_admin());

-- categories table policies
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (public.check_is_admin());
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE TO authenticated USING (public.check_is_admin());
