-- =============================================================================
-- NeuwGenX — Migration 004: Functions & Triggers
-- =============================================================================
-- Run order: 4 of 5
-- Description:
--   - updated_at auto-maintenance trigger
--   - Atomic counter increment RPCs (view, copy)
--   - Review approval trigger (recomputes avg_rating + review_count)
--   - is_admin() helper used by RLS policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: updated_at auto-maintenance
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_resource_media_updated_at
  BEFORE UPDATE ON resource_media
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is_admin()
-- ---------------------------------------------------------------------------
-- Used by all RLS admin-write policies.
-- Checks auth.uid() against the admin_users allowlist.
-- Runs as SECURITY DEFINER so it can read admin_users regardless of caller RLS.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
  );
$$;

COMMENT ON FUNCTION is_admin() IS
  'Returns TRUE if the current JWT belongs to an allowlisted admin. '
  'Used in all admin-write RLS policies. SECURITY DEFINER — do not expose to public.';

-- ---------------------------------------------------------------------------
-- Helper: is_super_admin()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
      AND role = 'super_admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC: increment_view_count(resource_id UUID)
-- ---------------------------------------------------------------------------
-- Atomically increments view_count on a published resource.
-- Runs as SECURITY DEFINER so anonymous callers can increment without
-- being granted general UPDATE on the resources table.
-- Also inserts a resource_events row for analytics.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_view_count(
  p_resource_id  UUID,
  p_session_id   TEXT    DEFAULT NULL,
  p_ip_hash      TEXT    DEFAULT NULL,
  p_referrer     TEXT    DEFAULT NULL,
  p_country_code CHAR(2) DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only increment for published resources
  UPDATE resources
  SET view_count = view_count + 1
  WHERE id = p_resource_id
    AND status = 'published';

  -- Log analytics event (best-effort; failure does not roll back the counter)
  INSERT INTO resource_events (
    resource_id,
    event_type,
    session_id,
    ip_hash,
    referrer,
    country_code
  ) VALUES (
    p_resource_id,
    'view',
    p_session_id,
    p_ip_hash,
    LEFT(p_referrer, 500),  -- enforce referrer length limit
    p_country_code
  );

EXCEPTION WHEN OTHERS THEN
  -- Swallow analytics errors; counter increment already committed
  NULL;
END;
$$;

COMMENT ON FUNCTION increment_view_count IS
  'Atomically increments view_count for a published resource and logs an analytics event. '
  'SECURITY DEFINER — anonymous callers may call this without UPDATE on resources.';

-- ---------------------------------------------------------------------------
-- RPC: increment_copy_count(resource_id UUID)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_copy_count(
  p_resource_id  UUID,
  p_session_id   TEXT    DEFAULT NULL,
  p_ip_hash      TEXT    DEFAULT NULL,
  p_country_code CHAR(2) DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE resources
  SET copy_count = copy_count + 1
  WHERE id = p_resource_id
    AND status = 'published';

  INSERT INTO resource_events (
    resource_id,
    event_type,
    session_id,
    ip_hash,
    country_code
  ) VALUES (
    p_resource_id,
    'copy',
    p_session_id,
    p_ip_hash,
    p_country_code
  );

EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

COMMENT ON FUNCTION increment_copy_count IS
  'Atomically increments copy_count for a published resource and logs an analytics event. '
  'SECURITY DEFINER — anonymous callers may call this without UPDATE on resources.';

-- ---------------------------------------------------------------------------
-- Trigger: recompute_resource_rating()
-- ---------------------------------------------------------------------------
-- Fires AFTER INSERT or UPDATE on reviews.
-- Recomputes avg_rating and review_count on the parent resource whenever
-- a review changes status (pending → approved, approved → rejected, etc.).
-- This keeps denormalized columns accurate without any application-layer logic.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION recompute_resource_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resource_id UUID;
  v_avg_rating  NUMERIC(2,1);
  v_count       INT;
BEGIN
  -- Determine which resource_id to recompute
  IF TG_OP = 'DELETE' THEN
    v_resource_id := OLD.resource_id;
  ELSE
    v_resource_id := NEW.resource_id;
  END IF;

  -- Aggregate approved reviews for this resource
  SELECT
    ROUND(AVG(rating)::NUMERIC, 1),
    COUNT(*)
  INTO v_avg_rating, v_count
  FROM reviews
  WHERE resource_id = v_resource_id
    AND status = 'approved'
    AND rating IS NOT NULL;

  -- Update denormalized columns atomically
  UPDATE resources
  SET
    avg_rating   = v_avg_rating,
    review_count = v_count
  WHERE id = v_resource_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_recompute_rating
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION recompute_resource_rating();

COMMENT ON FUNCTION recompute_resource_rating IS
  'Recomputes avg_rating and review_count on resources whenever a review '
  'changes status. Keeps denormalized columns accurate without app-layer logic.';

-- ---------------------------------------------------------------------------
-- Trigger: enforce_published_at()
-- ---------------------------------------------------------------------------
-- Automatically sets published_at when a resource transitions to published,
-- and clears it if archived/drafted (preserving original if re-published).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set published_at on first publish
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = COALESCE(NEW.published_at, NOW());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_resources_published_at
  BEFORE UPDATE OF status ON resources
  FOR EACH ROW
  EXECUTE FUNCTION enforce_published_at();
