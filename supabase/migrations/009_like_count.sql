-- =============================================================================
-- NeuwGenX — Migration 009: Like counter
-- =============================================================================
-- Run order: 9
-- Description:
--   Adds a denormalized like_count to resources plus atomic increment/decrement
--   RPCs (SECURITY DEFINER) so anonymous users can like/unlike published
--   resources without direct UPDATE rights. Mirrors the view/copy counter
--   pattern. The 'like' event_type already exists (migration 001).
--   Additive and non-breaking.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS like_count BIGINT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'resources_like_count_pos'
  ) THEN
    ALTER TABLE resources
      ADD CONSTRAINT resources_like_count_pos CHECK (like_count >= 0);
  END IF;
END $$;

COMMENT ON COLUMN resources.like_count IS
  'Denormalized counter. Updated ONLY via increment_like_count() / '
  'decrement_like_count() RPCs. Never UPDATE this column directly.';

-- Most-liked feed (published only, newest tiebreak).
CREATE INDEX IF NOT EXISTS idx_resources_like_count
  ON resources (like_count DESC)
  WHERE status = 'published';

-- ---------------------------------------------------------------------------
-- RPC: increment_like_count
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_like_count(
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
  SET like_count = like_count + 1
  WHERE id = p_resource_id
    AND status = 'published';

  INSERT INTO resource_events (
    resource_id, event_type, session_id, ip_hash, country_code
  ) VALUES (
    p_resource_id, 'like', p_session_id, p_ip_hash, p_country_code
  );

EXCEPTION WHEN OTHERS THEN
  -- Swallow analytics errors; the counter update already committed.
  NULL;
END;
$$;

COMMENT ON FUNCTION increment_like_count IS
  'Atomically increments like_count for a published resource and logs a like '
  'event. SECURITY DEFINER — anonymous callers may call this without UPDATE '
  'on resources.';

-- ---------------------------------------------------------------------------
-- RPC: decrement_like_count (for unlike / toggle off)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION decrement_like_count(
  p_resource_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- GREATEST guards the non-negative CHECK constraint.
  UPDATE resources
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = p_resource_id
    AND status = 'published';
END;
$$;

COMMENT ON FUNCTION decrement_like_count IS
  'Atomically decrements like_count for a published resource (floored at 0). '
  'SECURITY DEFINER — used for anonymous unlike/toggle-off.';
