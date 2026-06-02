# NeuwGenX — Database Design Document

**Version:** 1.0  
**Engineer:** Senior Backend (Supabase / PostgreSQL)  
**Scope:** Production-ready database foundation with future-proof scalability

---

## 1. Design Philosophy

### Why a Unified `resources` Table?

The core architectural decision is a **polymorphic `resources` table** keyed by `resource_type` instead of separate tables per content type (`image_prompts`, `video_prompts`, etc.).

**Rationale:**

| Concern | Separate Tables | Unified `resources` |
|---|---|---|
| Adding new content types | New migration, new RLS, new indexes | Add enum value, done |
| Cross-type queries (trending, search) | UNION across tables, expensive | Single query |
| Shared metadata (tags, views, copies) | Duplicated columns everywhere | Defined once |
| Category/model associations | FK on every table | FK on one table |
| RLS policies | Duplicated per table | One policy set |
| Future bookmarks/likes/collections | FK to every content table | FK to `resources.id` |

The tradeoff is that type-specific columns (e.g., `video_duration`, `kit_file_url`) live in **extension tables** (`resource_media`, `resource_kit_meta`) joined only when needed. This keeps the hot read path lean while supporting type-specific data without nullable column sprawl.

### Counter Strategy: Columns vs. Separate Table

**Decision: Denormalized columns on `resources` + a `resource_events` table for analytics.**

- `view_count` and `copy_count` are **columns** on `resources`, incremented atomically via Postgres RPC (`UPDATE ... SET col = col + 1`). This makes the hot read path (homepage grid, detail page) a single-table scan with no joins.
- A separate `resource_events` table logs individual events (`view`, `copy`, `review_submit`) for time-series analytics, content gap discovery, and future personalization. It is append-only and never read on the public critical path.
- `avg_rating` and `review_count` are also denormalized columns, recomputed by a trigger on review approval — never calculated at read time.

**Why not a separate `counters` table?**  
A separate counters table adds a join to every card render. At scale (thousands of cards per page load), that join cost compounds. Atomic column increments via `security definer` RPC give the same concurrency safety without the join penalty.

---

## 2. ERD Diagram (ASCII)

```
┌─────────────────┐         ┌──────────────────────────────────────────────┐
│  admin_users    │         │                  resources                    │
│─────────────────│         │──────────────────────────────────────────────│
│ id (PK)         │         │ id (PK)                                       │
│ email           │         │ resource_type  [image|video|website-kit|      │
│ role            │         │                 workflow]                     │
│ created_at      │         │ title                                         │
└─────────────────┘         │ slug (unique)                                 │
                            │ description                                   │
                            │ prompt_text                                   │
┌─────────────────┐         │ creator_name                                  │
│  categories     │◄────────│ category_id (FK)                              │
│─────────────────│         │ model_id (FK) ──────────────────────────────┐ │
│ id (PK)         │         │ tags (text[])                                │ │
│ name            │         │ status [draft|published|archived]            │ │
│ slug (unique)   │         │ view_count                                   │ │
│ description     │         │ copy_count                                   │ │
│ icon            │         │ review_count                                 │ │
│ sort_order      │         │ avg_rating                                   │ │
│ status          │         │ published_at                                 │ │
│ created_at      │         │ created_at / updated_at                      │ │
│ updated_at      │         └──────────────────────────────────────────────┘ │
└─────────────────┘                    │                                     │
                                       │ 1:1 (optional)                      │
                            ┌──────────▼──────────┐                         │
                            │  resource_media      │                         │
                            │─────────────────────│                         │
                            │ id (PK)              │                         │
                            │ resource_id (FK,uniq)│                         │
                            │ storage_path         │                         │
                            │ width / height       │                         │
                            │ blur_data_url        │                         │
                            │ duration_seconds     │  (video only)           │
                            │ mime_type            │                         │
                            │ file_size_bytes      │                         │
                            │ created_at           │                         │
                            └─────────────────────┘                         │
                                                                             │
                            ┌─────────────────────┐                         │
                            │      models          │◄────────────────────────┘
                            │─────────────────────│
                            │ id (PK)              │
                            │ name                 │
                            │ slug (unique)        │
                            │ description          │
                            │ logo_path            │
                            │ provider             │
                            │ status               │
                            │ created_at           │
                            │ updated_at           │
                            └─────────────────────┘

                            ┌─────────────────────┐
                            │      reviews         │
                            │─────────────────────│
                            │ id (PK)              │
                            │ resource_id (FK) ────┤──► resources.id
                            │ reviewer_name        │
                            │ reviewer_email       │
                            │ rating (1-5)         │
                            │ body                 │
                            │ status               │
                            │ ip_hash              │
                            │ created_at           │
                            │ approved_at          │
                            └─────────────────────┘

                            ┌─────────────────────┐
                            │  resource_events     │  (analytics, append-only)
                            │─────────────────────│
                            │ id (PK)              │
                            │ resource_id (FK)     │
                            │ event_type           │
                            │ session_id           │
                            │ ip_hash              │
                            │ referrer             │
                            │ user_agent_hash      │
                            │ created_at           │
                            └─────────────────────┘

  ── Future tables (schema-ready hooks) ──────────────────────────

  profiles          bookmarks          collections        collection_items
  (user accounts)   resource_id FK     user_id FK         collection_id FK
                    user_id FK         name               resource_id FK
```

---

## 3. Storage Bucket Design

| Bucket | Access | Purpose |
|---|---|---|
| `resource-images` | Public read | Prompt/resource cover images |
| `resource-videos` | Public read | Video prompt files |
| `resource-kits` | Public read | Website kit preview images |
| `model-logos` | Public read | AI model brand logos |
| `category-icons` | Public read | Category icon assets |
| `og-images` | Public read | Cached Open Graph images |
| `admin-uploads` | Private (admin only) | Staging area before processing |

**Path conventions:**
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

---

## 4. Analytics Design Decision

### Recommendation: Hybrid (Denormalized Columns + Events Table)

**Denormalized counters on `resources`:**
- `view_count BIGINT DEFAULT 0`
- `copy_count BIGINT DEFAULT 0`
- `review_count INT DEFAULT 0`
- `avg_rating NUMERIC(2,1)`

Updated via atomic RPC functions (`security definer`) — safe for concurrent anonymous traffic.

**`resource_events` table (append-only):**
- Logs individual `view`, `copy`, `review_submit` events with timestamp, session, referrer.
- Never queried on the public read path.
- Powers admin analytics: trending over time, referrer breakdown, search-term gaps.
- Can be partitioned by month as volume grows.
- Can be offloaded to a time-series store (TimescaleDB, ClickHouse) in V3+ without changing the public API.

**Why not events-only?**  
Aggregating `COUNT(*) WHERE event_type = 'view' AND resource_id = X` on every card render is a full table scan at scale. Denormalized columns make card rendering O(1) per resource.

**Why not columns-only?**  
Columns give totals but no time-series, no referrer data, no trend analysis. The events table is the analytics foundation without impacting read performance.
