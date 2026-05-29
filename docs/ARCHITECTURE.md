# NewGenPlus — Technical Architecture Document

**Version:** 1.0
**Status:** Foundational Architecture (Pre-Implementation)
**Author:** Principal Architecture
**Scope:** Production-ready AI Prompt Discovery Platform

---

## 1. Executive Summary

NewGenPlus is a free, admin-curated AI prompt discovery platform with a Pinterest-style visual discovery experience and Apple-level interaction simplicity. It is explicitly **not** a marketplace: there are no transactions, no seller accounts, and no public uploads in V1. The platform optimizes for three things above all else: **speed**, **SEO discoverability**, and **frictionless copying**.

The architecture is built on a content-read-heavy model. The vast majority of traffic is anonymous read traffic (browsing, searching, copying), while writes are limited to admin content management and lightly-throttled anonymous review submissions. This asymmetry drives every architectural decision below — aggressive static generation, edge caching, denormalized read counters, and a thin write path.

---

## 2. Product Architecture

### 2.1 Architectural Style

A **server-first, statically-biased Next.js application** backed by Supabase as a managed Postgres + Auth + Storage backend, deployed on Vercel's edge network.

```
┌─────────────────────────────────────────────────────────────┐
│                         END USERS                            │
│         (Anonymous browsers · Mobile-first · SEO bots)       │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
        Read (95%)                      Write (5%)
                │                             │
┌───────────────▼─────────────────────────────▼───────────────┐
│                      VERCEL EDGE NETWORK                     │
│   CDN cache · Image optimization · ISR · Edge middleware     │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
┌───────────────▼─────────────────────────────▼───────────────┐
│                  NEXT.JS 15 (App Router)                    │
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Public RSC Pages │  │ Server Actions│  │  Admin Console │  │
│  │ (SSG/ISR)        │  │ (mutations)  │  │  (protected)   │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
┌───────────────▼─────────────────────────────▼───────────────┐
│                          SUPABASE                           │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Postgres │  │   Auth   │  │ Storage  │  │ Edge Funcs   │  │
│  │  + RLS   │  │ (admin)  │  │ (images) │  │ (optional)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Core Architectural Principles

1. **Read path is sacred.** Public pages are statically generated or incrementally regenerated. They never block on a live DB query in the critical render path where it can be avoided.
2. **Anonymous by default.** No auth, cookies, or session is required to browse, search, copy, or submit a review. Auth exists only for the admin perimeter.
3. **Admin is the only privileged writer.** Content (prompts, categories, models, images) flows exclusively through the admin console. RLS enforces this at the database layer, not just the UI.
4. **Denormalize for speed.** View counts, copy counts, average ratings, and review counts are stored as columns on the prompt row, updated via atomic increments, not computed via joins at read time.
5. **The database is the source of truth; the edge is the source of speed.** Every cached artifact has a clear invalidation trigger tied to a write event.

### 2.3 Rendering Strategy Matrix

| Surface | Strategy | Rationale |
|---|---|---|
| Homepage (initial grid) | ISR (short revalidate) + client infinite scroll | SEO + freshness, then client-side pagination |
| Prompt detail page | SSG via `generateStaticParams` + ISR | Max SEO, max speed; regenerated on edit |
| Category pages | ISR | SEO landing pages per category |
| Model pages | ISR | SEO landing pages per model |
| Search results | Client-side / dynamic RSC | Query-dependent, not cacheable per-term |
| Admin console | Fully dynamic, no cache, auth-gated | Always live data |

---

## 3. Folder Structure

A feature-oriented structure inside the App Router, with shared primitives separated from feature modules.

```
newgenplus/
├── public/                      # Static assets, favicons, robots, og defaults
├── src/
│   ├── app/                     # Next.js App Router (routes only)
│   │   ├── (public)/            # Public route group
│   │   ├── (admin)/             # Admin route group (protected)
│   │   ├── api/                 # Route handlers (webhooks, sitemap, og)
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── manifest.ts
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (generated)
│   │   ├── layout/              # Header, footer, shells, nav
│   │   ├── prompt/              # PromptCard, PromptGrid, CopyButton, etc.
│   │   ├── review/              # ReviewForm, ReviewList
│   │   ├── filters/             # CategoryFilter, ModelFilter, SearchBar
│   │   └── shared/              # Generic composed components
│   │
│   ├── features/                # Domain logic grouped by feature
│   │   ├── prompts/
│   │   │   ├── actions/         # Server actions (mutations)
│   │   │   ├── queries/         # Data-fetching functions (read)
│   │   │   ├── schemas/         # Zod validation schemas
│   │   │   └── types.ts
│   │   ├── reviews/
│   │   ├── categories/
│   │   ├── models/
│   │   └── admin/
│   │
│   ├── lib/
│   │   ├── supabase/            # Client factories (browser, server, admin)
│   │   ├── seo/                 # Metadata builders, JSON-LD helpers
│   │   ├── analytics/           # Analytics client + event definitions
│   │   ├── utils/               # Pure helpers (cn, formatters, slugify)
│   │   └── constants/           # Brand tokens, route map, config
│   │
│   ├── hooks/                   # Client React hooks
│   ├── types/                   # Global + generated DB types
│   ├── config/                  # Site config, navigation, env schema
│   └── middleware.ts            # Admin auth gate + edge logic
│
├── supabase/
│   ├── migrations/              # Versioned SQL migrations
│   ├── seed/                    # Seed data for local dev
│   └── config.toml
│
├── .env.local                   # Local secrets (gitignored)
├── components.json              # shadcn config
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

**Key decision:** `app/` holds routing concerns only (pages, layouts, loading/error boundaries). All domain logic lives in `features/`, keeping route files thin and testable logic colocated by domain.

---

## 4. Route Structure

### 4.1 Public Routes (`(public)` group)

| Route | Page | Rendering | Notes |
|---|---|---|---|
| `/` | Homepage | ISR | Hero, search, filters, masonry grid, infinite scroll |
| `/prompt/[slug]` | Prompt detail | SSG + ISR | Canonical content page, JSON-LD |
| `/category/[slug]` | Category landing | ISR | Filtered grid, SEO copy |
| `/model/[slug]` | Model landing | ISR | Filtered grid, SEO copy |
| `/search` | Search results | Dynamic | Query param driven |
| `/about` | Static page | SSG | Brand, mission |
| `/privacy`, `/terms` | Legal | SSG | Required for production |

### 4.2 Admin Routes (`(admin)` group — protected)

| Route | Page | Notes |
|---|---|---|
| `/admin` | Login / dashboard | Redirects to login if unauthenticated |
| `/admin/login` | Supabase Auth login | Email allowlist enforced |
| `/admin/prompts` | Prompt list + CRUD | Create, edit, archive |
| `/admin/prompts/new` | Create prompt | Upload image, set metadata |
| `/admin/prompts/[id]` | Edit prompt | |
| `/admin/categories` | Manage categories | |
| `/admin/models` | Manage models | |
| `/admin/reviews` | Review moderation queue | Approve / reject |
| `/admin/settings` | Platform settings | |

The `/admin` route is "hidden" in the sense that it is not linked from public navigation, not indexed (`robots: noindex`), and gated by middleware + RLS. It is not security-through-obscurity alone — real enforcement is at the auth and DB layers.

### 4.3 API / Route Handlers (`app/api`)

| Route | Purpose |
|---|---|
| `/api/og/[slug]` | Dynamic Open Graph image generation |
| `/sitemap.xml` | Generated from published prompts/categories/models |
| `/robots.txt` | Crawl rules; disallow `/admin` |
| `/api/revalidate` | Optional on-demand ISR revalidation hook |

**Note:** Mutations do **not** live in API routes. They use Server Actions (see §9). Route handlers are reserved for non-form integrations (sitemap, OG, webhooks).

---

## 5. Database Schema

Postgres via Supabase. All tables use `uuid` primary keys (default `gen_random_uuid()`), `created_at`/`updated_at` timestamps, and soft-delete via `status` where relevant. Slugs are unique and indexed for SEO routing.

### 5.1 Entity Relationship Overview

```
categories ──┐
             ├──< prompts >──── models
             │       │
             │       ├──< reviews
             │       └──< prompt_events (analytics, optional)
admin_users (mirrors auth.users, allowlist)
```

### 5.2 Tables

**`categories`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | Display name |
| slug | text (unique) | SEO route key |
| description | text | SEO landing copy |
| icon | text | Icon identifier |
| sort_order | int | Manual ordering |
| status | enum(`published`,`hidden`) | |
| created_at / updated_at | timestamptz | |

**`models`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Midjourney v6", "GPT-4o" |
| slug | text (unique) | |
| description | text | |
| logo_url | text | |
| status | enum(`published`,`hidden`) | |
| created_at / updated_at | timestamptz | |

**`prompts`** (core entity)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| title | text | |
| slug | text (unique) | SEO route key |
| prompt_text | text | The copyable content |
| description | text | Supporting copy / SEO |
| image_path | text | Storage object path |
| image_width / image_height | int | For masonry layout (avoids CLS) |
| blur_data_url | text | LQIP placeholder |
| creator_name | text | Attribution (not a user account) |
| category_id | uuid (FK → categories) | |
| model_id | uuid (FK → models) | |
| tags | text[] | For search/related |
| view_count | bigint (default 0) | Denormalized counter |
| copy_count | bigint (default 0) | Denormalized counter |
| review_count | int (default 0) | Denormalized counter |
| avg_rating | numeric(2,1) | Denormalized average |
| status | enum(`draft`,`published`,`archived`) | |
| published_at | timestamptz | For ordering + sitemap |
| created_at / updated_at | timestamptz | |

**`reviews`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| prompt_id | uuid (FK → prompts) | |
| reviewer_name | text | No account required |
| reviewer_email | text | Stored, never publicly exposed |
| rating | int (1–5) | Optional star rating |
| body | text | Review content |
| status | enum(`pending`,`approved`,`rejected`) | Default `pending` |
| created_at | timestamptz | |
| approved_at | timestamptz | |

**`admin_users`** (allowlist mirror)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, = auth.users.id) | |
| email | text (unique) | Must match approved allowlist |
| role | enum(`admin`,`super_admin`) | |
| created_at | timestamptz | |

### 5.3 Indexing Strategy

- Unique indexes on every `slug` column.
- B-tree on `prompts(status, published_at DESC)` for the homepage feed and pagination.
- B-tree on `prompts(category_id)` and `prompts(model_id)` for filtered landing pages.
- GIN index on `prompts(tags)` and on a full-text `tsvector` column over `title + description + prompt_text` for search.
- Index on `reviews(prompt_id, status)` for the moderation queue and approved-review fetch.

### 5.4 Counter Integrity

`view_count` and `copy_count` are incremented through dedicated Postgres functions (RPC) using atomic `UPDATE ... SET col = col + 1`, preventing race conditions and avoiding read-modify-write round trips. `avg_rating` and `review_count` are recomputed by a trigger whenever a review transitions to `approved`.

---

## 6. Storage Architecture

Supabase Storage holds all prompt imagery.

### 6.1 Bucket Design

| Bucket | Visibility | Contents |
|---|---|---|
| `prompt-images` | Public read | Original uploaded prompt images |
| `model-logos` | Public read | Model/brand logos |
| `og-cache` | Public read | Optionally cached generated OG images |

### 6.2 Object Path Convention

```
prompt-images/{prompt_id}/{size}.{ext}
model-logos/{model_id}/logo.{ext}
```

### 6.3 Image Pipeline

1. Admin uploads original via the admin console (write restricted to authenticated admins).
2. On upload, dimensions are captured and stored on the prompt row (`image_width`, `image_height`) to reserve layout space and eliminate cumulative layout shift in the masonry grid.
3. A low-quality blur placeholder (`blur_data_url`) is generated and stored for instant perceived load.
4. Public delivery goes through **Next.js Image Optimization** (or Supabase image transformation) for responsive `srcset`, WebP/AVIF negotiation, and CDN caching.

### 6.4 Access Control

- Public buckets serve read-only optimized images to anonymous users.
- Write/delete on all buckets is restricted via Storage RLS policies to authenticated admin identities only.
- No signed URLs are needed for the public read path (content is intentionally public); signed URLs are reserved for any future private assets.

---

## 7. Authentication Architecture

Authentication exists **solely for the admin perimeter**. The public experience is fully anonymous.

### 7.1 Admin Auth Flow

1. Admin visits `/admin` → middleware checks for a valid Supabase session.
2. No session → redirect to `/admin/login`.
3. Login via Supabase Auth (email magic link or email+password — magic link recommended for fewer credentials to manage).
4. On successful auth, the user's email is validated against the `admin_users` allowlist (enforced both in middleware and via RLS).
5. Non-allowlisted authenticated users are rejected and signed out — being authenticated is necessary but not sufficient; being on the allowlist is required.

### 7.2 Session Management

- Supabase SSR cookies, managed via the `@supabase/ssr` pattern with three distinct client factories:
  - **Browser client** — client components.
  - **Server client** — RSC and server actions, reads cookies.
  - **Admin/service client** — server-only, uses the service role key for privileged operations (never exposed to the browser, never imported into client bundles).
- Middleware refreshes sessions on admin routes only.

### 7.3 Allowlist Strategy

The approved admin email list is enforced at three layers (defense in depth):
1. **Middleware** — fast rejection at the edge.
2. **Server actions** — re-verify identity before any mutation.
3. **RLS policies** — final authority; even a leaked client cannot write without an allowlisted JWT.

---

## 8. Row Level Security (RLS) Strategy

RLS is enabled on **every** table. The default posture is deny-all; access is granted explicitly.

### 8.1 Policy Matrix

| Table | Anonymous (public) | Admin |
|---|---|---|
| `prompts` | SELECT where `status = 'published'` | Full CRUD |
| `categories` | SELECT where `status = 'published'` | Full CRUD |
| `models` | SELECT where `status = 'published'` | Full CRUD |
| `reviews` | SELECT where `status = 'approved'`; INSERT (status forced to `pending`) | Full CRUD + moderation |
| `admin_users` | No access | SELECT/manage (super_admin) |

### 8.2 Key Policy Rules

- **Public read is filtered by status.** Anonymous users can never see drafts, hidden categories, archived prompts, or unapproved reviews.
- **Anonymous review insert is constrained.** Anonymous users may insert a review, but the policy forces `status = 'pending'`. They cannot self-approve, cannot set ratings on others' behalf, and cannot read pending/rejected reviews.
- **Admin identity is verified by an `is_admin()` helper function** that checks the requesting JWT's email/uid against `admin_users`. All admin write policies depend on this function.
- **Counter RPCs run as `security definer`** with tightly scoped logic so anonymous users can increment `view_count`/`copy_count` without being granted general UPDATE on the prompts table.

### 8.3 Abuse Mitigation on Anonymous Writes

Because review insertion and counter increments are open to anonymous users:
- Rate limiting at the edge (per IP) on review submission and increment endpoints.
- Lightweight bot mitigation (honeypot field, optional invisible CAPTCHA) on the review form.
- Server-side Zod validation and length caps before insert.
- All reviews land in `pending` and require explicit admin approval before public visibility — the moderation gate is the primary defense.

---

## 9. Server Action Architecture

All mutations use **Next.js Server Actions**, never client-side direct DB writes. This keeps the service role and validation logic server-only.

### 9.1 Action Layering

```
Client Component (form)
        │  invokes
        ▼
Server Action  ──►  1. Authn/identity check (admin actions)
                    2. Zod schema validation
                    3. Authorization (allowlist / RLS context)
                    4. Supabase mutation (correct client)
                    5. Cache revalidation (revalidatePath/Tag)
                    6. Typed result { ok, data | error }
```

### 9.2 Action Inventory

**Public (anonymous-capable):**
- `submitReview` — validates, inserts as `pending`, rate-limited.
- `incrementView` — RPC increment, fire-and-forget, debounced client-side.
- `incrementCopy` — RPC increment on copy-button click.

**Admin (allowlist-gated):**
- `createPrompt`, `updatePrompt`, `archivePrompt`
- `createCategory`, `updateCategory`
- `createModel`, `updateModel`
- `approveReview`, `rejectReview`
- `uploadPromptImage` (handles storage + dimension capture)

### 9.3 Conventions

- Every action returns a **typed discriminated result** (`{ ok: true, data }` | `{ ok: false, error }`) — no throwing across the boundary for expected failures.
- Validation is centralized in `features/<domain>/schemas` using **Zod**; the same schema types the form.
- After a successful content mutation, the action calls `revalidatePath` / `revalidateTag` to invalidate exactly the affected ISR pages (e.g., editing a prompt revalidates `/prompt/[slug]`, its category, model, and homepage).
- Admin actions always use the server-only Supabase client; the service role key is never referenced in client code.

---

## 10. SEO Strategy

SEO is a first-class architectural concern, not an afterthought.

### 10.1 Rendering for Crawlers

- Prompt, category, and model pages are statically generated (`generateStaticParams`) so crawlers receive fully-rendered HTML with zero client dependency.
- ISR keeps content fresh without sacrificing static delivery.

### 10.2 Metadata

- Per-page `generateMetadata` produces unique `title`, `description`, canonical URL, and Open Graph / Twitter card tags.
- Dynamic OG images per prompt via `/api/og/[slug]` (or build-time generation), giving every shared link a rich, branded preview.

### 10.3 Structured Data (JSON-LD)

- Prompt pages emit `CreativeWork` (or `ImageObject`) schema with `aggregateRating` derived from approved reviews, plus `Review` entities.
- Category/model pages emit `CollectionPage` / `BreadcrumbList`.
- Site-level `Organization` and `WebSite` (with `SearchAction`) schema.

### 10.4 Technical SEO

- Auto-generated `sitemap.xml` from published content, segmented if it grows large.
- `robots.txt` disallows `/admin` and `/api`; allows everything public.
- Canonical URLs on every page to prevent duplicate-content from query params.
- Clean, human-readable slugs for all entities.
- Mobile-first responsive layout (a direct ranking factor) and Core Web Vitals optimization (LCP via image priority + blur placeholder, CLS via stored image dimensions, INP via minimal client JS).

### 10.5 Content SEO

- Category and model pages double as keyword-rich landing pages with descriptive copy, internal linking to related prompts, and breadcrumb navigation to strengthen internal link graph.

---

## 11. Analytics Strategy

A two-tier approach: privacy-friendly product analytics plus first-party engagement counters.

### 11.1 First-Party Engagement Metrics (in-DB)

- `view_count` and `copy_count` stored per prompt, incremented via RPC. These power "trending" sorting and are displayed publicly. They are the canonical engagement signals.
- View increments are debounced client-side and deduplicated to avoid inflation from re-renders.

### 11.2 Product Analytics (external)

- A privacy-respecting analytics provider (e.g., Vercel Analytics / Plausible-style) for traffic, referrers, and Core Web Vitals — no cookies, no PII, GDPR-friendly given the anonymous audience.
- A typed event layer in `lib/analytics` defines a fixed event vocabulary: `prompt_view`, `prompt_copy`, `search_performed`, `filter_applied`, `review_submitted`. This prevents ad-hoc event sprawl.

### 11.3 Admin Insights (future)

- An admin dashboard surfaces top prompts by copy/view, search terms with no results (content gap discovery), and review moderation throughput. Backed by `prompt_events` aggregation if/when granular event logging is introduced.

### 11.4 Privacy Posture

- No public user accounts means minimal PII. Reviewer email is the only PII collected; it is never exposed publicly, used only for moderation/contact, and covered by the privacy policy.

---

## 12. Future Scalability Plan

The schema and architecture are designed so V2+ features slot in without rewrites.

| Future Feature | Architectural Hook |
|---|---|
| **User profiles** | Supabase Auth already present; extend `auth.users` with a `profiles` table; relax RLS to add an authenticated-user role tier alongside admin. |
| **User submissions** | `prompts` already has `status` (`draft`/`published`) and `creator_name`; add `submitted_by` FK + a `submitted` status feeding the existing moderation pattern (mirrors review approval). |
| **Video prompts** | Add a `media_type` enum to `prompts` and a `prompt_media` table; storage gains a `prompt-videos` bucket; the masonry grid already handles variable aspect ratios. |
| **Website kits / AI resources** | New content types share the category/model/tag/slug/SEO pattern; introduce a polymorphic `content_type` or sibling tables reusing the same query/SEO layer. |
| **Personalization / collections** | Requires accounts; built on the future `profiles` layer with a `collections`/`saved_prompts` join table. |
| **Search at scale** | Start with Postgres full-text search; graduate to a dedicated search service (e.g., Typesense/Algolia) behind the same `features/search` query interface — callers don't change. |
| **Read scale** | Edge caching + ISR absorb most load; add Postgres read replicas and connection pooling (Supavisor) as write/concurrent load grows. |
| **Global performance** | Already on Vercel edge + CDN; add multi-region image delivery as traffic globalizes. |

The decoupling of `app/` (routing) from `features/` (logic) and the typed query/action interfaces mean backend swaps (e.g., search engine, storage CDN) are localized changes.

---

## 13. Development Phases

**Phase 0 — Foundation (Week 1)**
Project scaffold, Tailwind + shadcn/ui setup, brand token system, Supabase project, schema migrations, RLS policies, typed DB client factories, env schema validation.

**Phase 1 — Public Read Experience (Weeks 2–3)**
Homepage hero + masonry grid + infinite scroll, prompt detail page, copy button with counter, category/model landing pages, search. Full SEO layer (metadata, sitemap, JSON-LD, OG images). This is the SEO-critical core and ships first.

**Phase 2 — Reviews (Week 4)**
Anonymous review submission (validation, rate limiting, bot mitigation), approved-review display, aggregate rating rollups, review JSON-LD.

**Phase 3 — Admin Console (Weeks 5–6)**
Supabase Auth + allowlist gating, prompt/category/model CRUD, image upload pipeline (dimensions + blur placeholder), review moderation queue, on-demand revalidation.

**Phase 4 — Hardening & Launch (Week 7)**
Performance pass (Core Web Vitals), accessibility audit (WCAG-oriented), analytics wiring, security review (RLS, service-role isolation, rate limits), legal pages, production deploy + monitoring.

**Phase 5+ — Future modules**
Per §12, prioritized by product need.

---

## 14. Recommended Package Structure

| Concern | Package | Rationale |
|---|---|---|
| Framework | `next` (15, App Router) | Server-first, ISR, image optimization |
| Language | `typescript` | Type safety end-to-end |
| Styling | `tailwindcss` | Utility-first, mobile-first |
| Components | `shadcn/ui` (Radix-based) | Accessible, owned-in-repo primitives |
| Backend SDK | `@supabase/supabase-js`, `@supabase/ssr` | DB, Auth, Storage + SSR cookie handling |
| Validation | `zod` | Shared schemas for forms + server actions |
| Forms | `react-hook-form` + `@hookform/resolvers` | Performant forms, Zod integration |
| Data fetching (client) | `@tanstack/react-query` | Infinite scroll, caching for client lists |
| Masonry layout | lightweight CSS columns / masonry lib | Pinterest-style grid without heavy JS |
| Icons | `lucide-react` | Consistent with shadcn |
| Analytics | privacy-first provider SDK | Cookieless metrics |
| Linting/format | `eslint`, `prettier` | Code consistency |
| Testing | `vitest` + `@testing-library/react`, `playwright` | Unit + E2E |
| DB types | Supabase type generation | End-to-end DB type safety |

Keep the dependency surface intentionally small. Every dependency is a performance and security liability on a speed-critical, public platform.

---

## 15. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Folders | kebab-case | `prompt-detail/` |
| React components | PascalCase | `PromptCard.tsx` |
| Hooks | camelCase, `use` prefix | `useInfinitePrompts.ts` |
| Server actions | camelCase, verb-first | `submitReview.ts` |
| Query functions | camelCase, `get`/`list` prefix | `getPromptBySlug` |
| Zod schemas | PascalCase, `Schema` suffix | `ReviewSchema` |
| Types/Interfaces | PascalCase | `Prompt`, `ReviewStatus` |
| DB tables | snake_case, plural | `prompt_events` |
| DB columns | snake_case | `copy_count` |
| Enums (DB) | snake_case values | `published`, `pending` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_REVIEW_LENGTH` |
| Routes/slugs | kebab-case | `/category/photo-realistic` |
| Env vars | SCREAMING_SNAKE_CASE; `NEXT_PUBLIC_` only for safe client values | `SUPABASE_SERVICE_ROLE_KEY` |
| CSS tokens | semantic, brand-mapped | `--color-primary` |

**Brand tokens** are defined once as Tailwind theme extensions and CSS variables, never hardcoded hex values in components:

| Token | Value |
|---|---|
| `--color-primary` | `#FF6B35` |
| `--color-secondary` | `#FF8A4C` |
| `--color-accent` | `#FFB26B` |
| `--color-background` | `#FFF9F5` |
| `--color-card` | `#FFFFFF` |
| `--color-text` | `#111111` |

---

## 16. Production Best Practices

**Security**
- Service role key is server-only; enforced by keeping it out of any `NEXT_PUBLIC_` var and out of client-imported modules. **Note:** any network-exposed mutation (review submission, counters) ships with rate limiting and validation from day one — these are anonymous write endpoints and are the platform's primary abuse surface.
- RLS enabled on all tables with deny-by-default; the UI is never the only gate.
- Env vars validated at boot via a Zod schema; the app refuses to start with missing/invalid config.
- `/admin` is `noindex`, middleware-gated, and allowlist-enforced at three layers.

**Performance**
- Static/ISR rendering for all public content; minimal client JS shipped.
- Image dimensions stored to eliminate CLS; blur placeholders for perceived speed; AVIF/WebP via the image optimizer.
- Denormalized counters and aggregates avoid expensive joins on the hot read path.
- Targeted cache invalidation (`revalidateTag`/`revalidatePath`) tied to specific write events.

**Reliability & Observability**
- Typed action results; no unhandled throws across the server/client boundary.
- Error boundaries and `loading.tsx` skeletons per route segment.
- Structured logging on server actions; error monitoring (e.g., Sentry) in production.
- Database migrations are versioned in `supabase/migrations` and applied via CI — no manual schema drift.

**Quality**
- Strict TypeScript (`strict: true`), no implicit `any`.
- CI pipeline: typecheck → lint → test → build before deploy.
- Accessibility baked in via shadcn/Radix primitives; semantic HTML and keyboard support verified. Full WCAG conformance requires manual testing with assistive technologies and expert review beyond automated checks.
- Conventional commits + protected `main`; deploys via Vercel preview → production promotion.

**Data Integrity**
- Atomic counter increments via RPC (no read-modify-write races).
- Aggregate ratings recomputed by trigger on review approval — never trusted from the client.
- Soft-delete via `status` (`archived`) preserves SEO history and allows recovery.

---

## 17. Architectural Decision Summary

| Decision | Choice | Why |
|---|---|---|
| Rendering | Server-first, SSG/ISR for public | Speed + SEO are top product goals |
| Mutations | Server Actions only | Keeps secrets/validation server-side |
| Auth scope | Admin perimeter only | Public is anonymous by design |
| Authorization | RLS + allowlist (defense in depth) | DB is the final authority |
| Counters | Denormalized + RPC increments | Hot-path read performance |
| Reviews | Anonymous insert → admin approval | Frictionless UX + quality control |
| Logic placement | `features/` separate from `app/` | Thin routes, testable, swappable backends |
| Theme | Light-only, tokenized brand | Brand consistency, simpler surface |

---

This document is the authoritative architectural reference for NewGenPlus V1 and the foundation for subsequent feature phases. Implementation should proceed phase-by-phase per §13, with each phase validated against the performance, SEO, and security best practices in §16 before progressing.
