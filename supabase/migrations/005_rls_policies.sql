-- =============================================================================
-- NeuwGenX — Migration 005: Row Level Security Policies
-- =============================================================================
-- Run order: 5 of 5
-- Description:
--   Enable RLS on all tables. Default posture: DENY ALL.
--   Access is granted explicitly per role (anonymous public / admin).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables (deny-by-default)
-- ---------------------------------------------------------------------------

ALTER TABLE admin_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE models          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_media  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_events ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (prevents accidental bypass)
ALTER TABLE admin_users     FORCE ROW LEVEL SECURITY;
ALTER TABLE categories      FORCE ROW LEVEL SECURITY;
ALTER TABLE models          FORCE ROW LEVEL SECURITY;
ALTER TABLE resources       FORCE ROW LEVEL SECURITY;
ALTER TABLE resource_media  FORCE ROW LEVEL SECURITY;
ALTER TABLE reviews         FORCE ROW LEVEL SECURITY;
ALTER TABLE resource_events FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- admin_users policies
-- =============================================================================
-- Public: NO access (not even read — email addresses must never leak)
-- Admin:  SELECT own row
-- Super admin: full CRUD

CREATE POLICY "admin_users: admins can read own row"
  ON admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "admin_users: super_admin can read all"
  ON admin_users FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "admin_users: super_admin can insert"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "admin_users: super_admin can update"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "admin_users: super_admin can delete"
  ON admin_users FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- =============================================================================
-- categories policies
-- =============================================================================

-- Public: read published categories only
CREATE POLICY "categories: public can read published"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admin: read all (including hidden/draft)
CREATE POLICY "categories: admin can read all"
  ON categories FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "categories: admin can insert"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "categories: admin can update"
  ON categories FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "categories: admin can delete"
  ON categories FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- models policies
-- =============================================================================

CREATE POLICY "models: public can read published"
  ON models FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "models: admin can read all"
  ON models FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "models: admin can insert"
  ON models FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "models: admin can update"
  ON models FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "models: admin can delete"
  ON models FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- resources policies
-- =============================================================================

-- Public: read published resources only
CREATE POLICY "resources: public can read published"
  ON resources FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admin: read all statuses (draft, published, archived)
CREATE POLICY "resources: admin can read all"
  ON resources FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "resources: admin can insert"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "resources: admin can update"
  ON resources FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Soft-delete only: admin can archive but not hard-delete
-- Hard delete requires super_admin
CREATE POLICY "resources: admin can archive (soft delete)"
  ON resources FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin() AND NEW.status = 'archived');

CREATE POLICY "resources: super_admin can hard delete"
  ON resources FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- =============================================================================
-- resource_media policies
-- =============================================================================

-- Public: read media for published resources only
CREATE POLICY "resource_media: public can read published"
  ON resource_media FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resources r
      WHERE r.id = resource_media.resource_id
        AND r.status = 'published'
    )
  );

-- Admin: read all media
CREATE POLICY "resource_media: admin can read all"
  ON resource_media FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "resource_media: admin can insert"
  ON resource_media FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "resource_media: admin can update"
  ON resource_media FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "resource_media: admin can delete"
  ON resource_media FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- reviews policies
-- =============================================================================

-- Public: read approved reviews only (reviewer_email is never in SELECT)
CREATE POLICY "reviews: public can read approved"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Public: anonymous users can submit reviews
-- Policy forces status = 'pending' — they cannot self-approve
CREATE POLICY "reviews: public can insert (pending only)"
  ON reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND char_length(reviewer_name) BETWEEN 1 AND 100
    AND reviewer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(body) BETWEEN 10 AND 2000
    AND (rating IS NULL OR rating BETWEEN 1 AND 5)
  );

-- Admin: read all reviews (including pending/rejected — for moderation queue)
CREATE POLICY "reviews: admin can read all"
  ON reviews FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin: update (approve/reject)
CREATE POLICY "reviews: admin can update"
  ON reviews FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin: delete (hard delete for spam/abuse)
CREATE POLICY "reviews: admin can delete"
  ON reviews FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- resource_events policies
-- =============================================================================
-- Public: NO direct read access (analytics data is admin-only)
-- Public: INSERT via SECURITY DEFINER RPCs only (not direct table access)
-- Admin: full read for analytics dashboard

CREATE POLICY "resource_events: admin can read all"
  ON resource_events FOR SELECT
  TO authenticated
  USING (is_admin());

-- Note: Public INSERT to resource_events is handled exclusively through
-- the increment_view_count() and increment_copy_count() SECURITY DEFINER
-- functions. No direct INSERT policy is granted to anon/authenticated roles.
-- This prevents analytics data manipulation.

CREATE POLICY "resource_events: admin can delete old events"
  ON resource_events FOR DELETE
  TO authenticated
  USING (is_admin());
