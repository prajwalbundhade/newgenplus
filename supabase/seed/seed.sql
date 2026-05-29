-- =============================================================================
-- NewGenPlus — Seed Data (Local Development Only)
-- =============================================================================
-- WARNING: Do NOT run this in production.
-- Provides realistic seed data for local development and testing.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

INSERT INTO categories (id, name, slug, description, icon, sort_order, status) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Portrait',        'portrait',        'Stunning AI portrait prompts for realistic and artistic human subjects.',    'user',          1, 'published'),
  ('11111111-0000-0000-0000-000000000002', 'Architecture',    'architecture',    'Architectural visualization prompts for buildings, interiors, and spaces.',  'building',      2, 'published'),
  ('11111111-0000-0000-0000-000000000003', 'Nature',          'nature',          'Breathtaking nature and landscape prompts.',                                 'tree',          3, 'published'),
  ('11111111-0000-0000-0000-000000000004', 'Abstract',        'abstract',        'Creative abstract and conceptual art prompts.',                              'sparkles',      4, 'published'),
  ('11111111-0000-0000-0000-000000000005', 'Logo Design',     'logo-design',     'Professional logo and brand identity prompts.',                              'pen-tool',      5, 'published'),
  ('11111111-0000-0000-0000-000000000006', 'Product Design',  'product-design',  'Product visualization and industrial design prompts.',                       'box',           6, 'published'),
  ('11111111-0000-0000-0000-000000000007', 'Fantasy',         'fantasy',         'Epic fantasy world and character prompts.',                                  'wand',          7, 'published'),
  ('11111111-0000-0000-0000-000000000008', 'Cinematic',       'cinematic',       'Film-quality cinematic scene and lighting prompts.',                         'film',          8, 'published')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Models
-- ---------------------------------------------------------------------------

INSERT INTO models (id, name, slug, description, provider, status) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Midjourney v6',   'midjourney-v6',   'The latest Midjourney model with photorealistic quality.',    'Midjourney',    'published'),
  ('22222222-0000-0000-0000-000000000002', 'DALL-E 3',        'dall-e-3',        'OpenAI DALL-E 3 with precise prompt adherence.',              'OpenAI',        'published'),
  ('22222222-0000-0000-0000-000000000003', 'Stable Diffusion XL', 'sdxl',        'Open-source SDXL for high-resolution image generation.',     'Stability AI',  'published'),
  ('22222222-0000-0000-0000-000000000004', 'Adobe Firefly',   'adobe-firefly',   'Adobe Firefly for commercially safe AI image generation.',    'Adobe',         'published'),
  ('22222222-0000-0000-0000-000000000005', 'Ideogram v2',     'ideogram-v2',     'Ideogram v2 with superior text rendering in images.',         'Ideogram',      'published'),
  ('22222222-0000-0000-0000-000000000006', 'Flux Pro',        'flux-pro',        'Black Forest Labs Flux Pro for photorealistic outputs.',      'Black Forest Labs', 'published')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Sample Resources (image type)
-- ---------------------------------------------------------------------------

INSERT INTO resources (
  id, resource_type, title, slug, description, prompt_text,
  creator_name, category_id, model_id, tags, status, published_at,
  view_count, copy_count
) VALUES
(
  '33333333-0000-0000-0000-000000000001',
  'image',
  'Golden Hour Portrait — Cinematic Realism',
  'golden-hour-portrait-cinematic-realism',
  'A breathtaking golden hour portrait with cinematic depth of field and warm tones.',
  'Portrait of a woman at golden hour, cinematic lighting, shallow depth of field, warm amber tones, film grain, 85mm lens, photorealistic, highly detailed skin texture, bokeh background, --ar 4:5 --v 6',
  'NewGenPlus',
  '11111111-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000001',
  ARRAY['portrait', 'golden-hour', 'cinematic', 'photorealistic', 'woman'],
  'published',
  NOW() - INTERVAL '5 days',
  1240, 387
),
(
  '33333333-0000-0000-0000-000000000002',
  'image',
  'Brutalist Architecture — Dramatic Sky',
  'brutalist-architecture-dramatic-sky',
  'Imposing brutalist concrete architecture under a dramatic stormy sky.',
  'Brutalist concrete building, dramatic stormy sky, low angle shot, harsh shadows, monochromatic tones, architectural photography, ultra wide lens, 8K resolution, --ar 16:9 --v 6',
  'NewGenPlus',
  '11111111-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000001',
  ARRAY['architecture', 'brutalist', 'dramatic', 'concrete', 'stormy'],
  'published',
  NOW() - INTERVAL '3 days',
  890, 201
),
(
  '33333333-0000-0000-0000-000000000003',
  'image',
  'Enchanted Forest — Fantasy Atmosphere',
  'enchanted-forest-fantasy-atmosphere',
  'A mystical enchanted forest with glowing flora and ethereal light rays.',
  'Enchanted forest, glowing mushrooms, ethereal light rays through ancient trees, mystical fog, fantasy atmosphere, vibrant greens and purples, highly detailed, cinematic composition, --ar 3:4 --v 6',
  'NewGenPlus',
  '11111111-0000-0000-0000-000000000007',
  '22222222-0000-0000-0000-000000000001',
  ARRAY['fantasy', 'forest', 'enchanted', 'mystical', 'nature'],
  'published',
  NOW() - INTERVAL '1 day',
  2100, 654
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Sample Approved Reviews
-- ---------------------------------------------------------------------------

INSERT INTO reviews (
  id, resource_id, reviewer_name, reviewer_email,
  rating, body, status, approved_at
) VALUES
(
  '44444444-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000001',
  'Alex M.',
  'alex@example.com',
  5,
  'This prompt is incredible. Got stunning results on the first try with Midjourney v6. The golden hour lighting came out exactly as described.',
  'approved',
  NOW() - INTERVAL '4 days'
),
(
  '44444444-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000001',
  'Sarah K.',
  'sarah@example.com',
  4,
  'Really solid prompt. I tweaked the aspect ratio to 1:1 for Instagram and it worked beautifully. Highly recommend.',
  'approved',
  NOW() - INTERVAL '2 days'
),
(
  '44444444-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000003',
  'Jordan T.',
  'jordan@example.com',
  5,
  'The enchanted forest prompt is pure magic. Used it for a book cover project and the client loved it.',
  'approved',
  NOW() - INTERVAL '12 hours'
)
ON CONFLICT (id) DO NOTHING;
