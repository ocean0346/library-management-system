-- 1. Update books table
ALTER TABLE books
DROP CONSTRAINT check_available_copies;

ALTER TABLE books
DROP COLUMN total_copies,
DROP COLUMN available_copies,
DROP COLUMN location;

ALTER TABLE books
ADD COLUMN file_url TEXT,
ADD COLUMN file_size_bytes BIGINT,
ADD COLUMN file_type VARCHAR(50);

-- 2. Drop reservations table
DROP TABLE reservations CASCADE;

-- 3. Transition loans to access_logs
ALTER TABLE loans RENAME TO access_logs;
ALTER TABLE access_logs RENAME COLUMN loan_id TO log_id;
ALTER TABLE access_logs RENAME COLUMN checkout_date TO access_date;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loans_pkey') THEN
        ALTER TABLE access_logs RENAME CONSTRAINT loans_pkey TO access_logs_pkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'loans_pkey') THEN
        ALTER INDEX loans_pkey RENAME TO access_logs_pkey;
    END IF;
END $$;

-- Try renaming indexes safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_loans_user') THEN
        ALTER INDEX idx_loans_user RENAME TO idx_access_logs_user;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_loans_book') THEN
        ALTER INDEX idx_loans_book RENAME TO idx_access_logs_book;
    END IF;
END $$;

ALTER TABLE access_logs 
DROP COLUMN due_date,
DROP COLUMN return_date,
DROP COLUMN status,
DROP COLUMN fine_amount;

-- 4. Replace stored procedures
-- Drop old procedures
DROP FUNCTION IF EXISTS borrow_book(UUID, UUID, UUID, DATE);
DROP FUNCTION IF EXISTS borrow_book(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS return_book(UUID, UUID);
DROP FUNCTION IF EXISTS reserve_book(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS reserve_book(INTEGER, TEXT);

-- Create new function to log access
CREATE OR REPLACE FUNCTION record_document_access(
    p_organization_id UUID,
    p_book_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_is_member BOOLEAN;
    v_is_active BOOLEAN;
    v_log_id UUID;
BEGIN
    -- Check if user is member
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_organization_id
        AND user_id = p_user_id
        AND status = 'active'
    ) INTO v_is_member;

    IF NOT v_is_member THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_member');
    END IF;

    -- Check if subscription is active
    SELECT is_org_subscription_active(p_organization_id) INTO v_is_active;
    IF NOT v_is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'subscription_inactive');
    END IF;

    -- Log access
    INSERT INTO access_logs (user_id, book_id, organization_id)
    VALUES (p_user_id, p_book_id, p_organization_id)
    RETURNING log_id INTO v_log_id;

    RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions before redefining return type
DROP FUNCTION IF EXISTS get_user_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS get_user_dashboard_stats(UUID, UUID);

-- Update get_user_dashboard_stats to use access_logs
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_organization_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_books BIGINT;
    v_downloads BIGINT;
    v_recent_access BIGINT;
BEGIN
    -- Total active books in org
    SELECT COUNT(*)::BIGINT INTO v_total_books
    FROM books
    WHERE organization_id = p_organization_id;

    -- User's total document downloads
    SELECT COUNT(*)::BIGINT INTO v_downloads
    FROM access_logs
    WHERE user_id = p_user_id AND organization_id = p_organization_id;

    -- User's recent access (last 30 days)
    SELECT COUNT(*)::BIGINT INTO v_recent_access
    FROM access_logs
    WHERE user_id = p_user_id 
    AND organization_id = p_organization_id
    AND access_date >= CURRENT_DATE - INTERVAL '30 days';

    RETURN jsonb_build_object(
        'totalbooks', v_total_books,
        'borrowedbooks', v_downloads, -- Reusing borrowedbooks key for compatibility if needed, or update frontend
        'overduebooks', v_recent_access -- Reusing key again
    );
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions before redefining return type
DROP FUNCTION IF EXISTS get_loan_trends(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_loan_trends(UUID);

-- Update get_loan_trends
CREATE OR REPLACE FUNCTION get_loan_trends(p_organization_id UUID, p_days INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', TO_CHAR(al.access_date, 'YYYY-MM-DD'),
            'loans', COUNT(al.log_id)
        )
    ) INTO v_result
    FROM access_logs al
    WHERE al.organization_id = p_organization_id
    AND al.access_date >= CURRENT_DATE - p_days
    GROUP BY TO_CHAR(al.access_date, 'YYYY-MM-DD')
    ORDER BY TO_CHAR(al.access_date, 'YYYY-MM-DD');

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions before redefining return type
DROP FUNCTION IF EXISTS get_popular_books(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_popular_books(UUID);

-- Update get_popular_books
CREATE OR REPLACE FUNCTION get_popular_books(p_organization_id UUID, p_limit INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', b.title,
            'loan_count', COUNT(al.log_id)
        )
    ) INTO v_result
    FROM books b
    LEFT JOIN access_logs al ON b.book_id = al.book_id
    WHERE b.organization_id = p_organization_id
    GROUP BY b.book_id, b.title
    ORDER BY COUNT(al.log_id) DESC, b.title ASC
    LIMIT p_limit;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
