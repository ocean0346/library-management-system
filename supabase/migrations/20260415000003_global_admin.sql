-- Add is_admin flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Give global admins permissions on books
DROP POLICY IF EXISTS "Librarians can insert books" ON books;
DROP POLICY IF EXISTS "Librarians can update books" ON books;
DROP POLICY IF EXISTS "Admins can delete books" ON books;

CREATE POLICY "Global admins can insert books" ON books FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Global admins can update books" ON books FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Global admins can delete books" ON books FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));

-- Give global admins permissions on categories
DROP POLICY IF EXISTS "Librarians can create org categories" ON categories;
DROP POLICY IF EXISTS "Librarians can update org categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete org categories" ON categories;

CREATE POLICY "Global admins can create categories" ON categories FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Global admins can update categories" ON categories FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Global admins can delete categories" ON categories FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = true));
