-- 1. Updates to record_document_access to allow public/anonymous usage
DROP FUNCTION IF EXISTS record_document_access(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS record_document_access(UUID, UUID);

CREATE OR REPLACE FUNCTION record_document_access(
    p_organization_id UUID,
    p_book_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- For public access, we skip checking is_org_member and subscription limits
    -- Just insert the log directly for statistics
    INSERT INTO access_logs (user_id, book_id, organization_id)
    VALUES (p_user_id, p_book_id, p_organization_id)
    RETURNING log_id INTO v_log_id;

    RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$ LANGUAGE plpgsql;

-- 2. Ensure RLS policies allow anonymous insert to access_logs if necessary
-- Wait, RPC functions bypass RLS if they are SECURITY DEFINER, but let's make it explicitly SECURITY DEFINER.
CREATE OR REPLACE FUNCTION record_document_access(
    p_organization_id UUID,
    p_book_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO access_logs (user_id, book_id, organization_id)
    VALUES (p_user_id, p_book_id, p_organization_id)
    RETURNING log_id INTO v_log_id;

    RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
