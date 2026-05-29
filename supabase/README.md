# NewGenPlus — Supabase Database

## Migration Run Order

Apply migrations in this exact order against a fresh Supabase project:

```
001_extensions_and_types.sql   — Extensions (pgcrypto, unaccent, pg_trgm) + enums
002_core_tables.sql            — All domain tables
003_indexes.sql                — All indexes (including full-text search vector)
004_functions_and_triggers.sql — RPCs, triggers, is_admin() helper
005_rls_policies.sql           — Row Level Security (all tables)
006_storage.sql                — Storage buckets + storage RLS
007_future_schema_stubs.sql    — Commented-out V2+ schema (reference only)
```

For local dev, also run:
```
seed/seed.sql                  — Sample categories, models, resources, reviews
```

## Local Development

```bash
# Start local Supabase stack
supabase start

# Apply migrations
supabase db reset   # applies all migrations + seed in order

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.types.ts
```

## Adding an Admin User

After creating a user via Supabase Auth (magic link or email/password):

```sql
INSERT INTO admin_users (id, email, role)
VALUES ('<auth.users uuid>', 'admin@yourdomain.com', 'admin');
```

Only `super_admin` role can insert additional admin users via the app.

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Unified `resources` table with `resource_type` | Avoids table proliferation as content types grow; single RLS policy set; cross-type queries are trivial |
| `resource_media` as 1:1 extension | Keeps hot-path `resources` table lean; media metadata only joined when needed |
| Denormalized counters + `resource_events` | O(1) counter reads on every card; time-series analytics without impacting read performance |
| `SECURITY DEFINER` RPCs for counters | Anonymous users can increment counts without UPDATE grant on `resources` |
| `is_admin()` helper function | Single source of truth for admin identity check; used by all write policies |
| `FORCE ROW LEVEL SECURITY` | Prevents accidental bypass even by table owner role |
| Soft-delete via `status = 'archived'` | Preserves SEO history; hard delete requires `super_admin` |

## Storage Bucket Summary

| Bucket | Public | Max Size | Types |
|---|---|---|---|
| `resource-images` | ✅ | 10 MB | jpg, png, webp, avif, gif |
| `resource-videos` | ✅ | 500 MB | mp4, webm, mov |
| `resource-kits` | ✅ | 100 MB | zip, jpg, png, webp |
| `model-logos` | ✅ | 2 MB | jpg, png, webp, svg |
| `category-icons` | ✅ | 1 MB | jpg, png, webp, svg |
| `og-images` | ✅ | 2 MB | png, jpg |
| `admin-uploads` | ❌ | 500 MB | all above types |

## Storage Path Conventions

```
resource-images/{resource_id}/cover.{ext}
resource-images/{resource_id}/thumb.{ext}
resource-videos/{resource_id}/video.{ext}
resource-videos/{resource_id}/thumbnail.{ext}
model-logos/{model_id}/logo.{ext}
category-icons/{category_id}/icon.{ext}
og-images/{resource_slug}.png
admin-uploads/{upload_session_id}/{filename}
```
