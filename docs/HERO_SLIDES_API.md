# Hero Slides API (Backoffice → Frontend)

**Project:** Boukir e-commerce

This document defines the API contract and rules for the **Home Hero carousel** (dynamic slides managed in backoffice).

**Latest Update:** Added support for optional secondary images (see Section 4.2)

Goals:

- Support 4 slide types: **category**, **brand**, **campaign**, **product**
- Keep the hero **image-first** with short text
- Support optional secondary featured images alongside content
- Enforce **max 2 CTAs**
- Support scheduling (start/end)
- Ensure safe fallbacks (e.g. product out of stock)
- Keep payload small + cacheable

**See also:** [Hero Secondary Image Feature Guide](./HERO_SECONDARY_IMAGE_FEATURE.md) for implementation details.

---

## 1) Endpoint

### 1.1 Read slides

**GET** `/api/hero-slides`

Query params:

- `locale`: `fr | ar` (required)
- `limit`: number (optional, default `4`, max recommended `8`)
- `now`: ISO datetime (optional; useful for testing schedules)

Example:

- `/api/hero-slides?locale=fr&limit=4`

Response status:

- `200 OK` (success)
- `400 Bad Request` (invalid params)

Caching (recommended):

- CDN: `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- ETag enabled if possible

---

## 2) Response shape

### 2.1 Response (normalized)

```json
{
  "locale": "fr",
  "generated_at": "2026-01-26T10:20:00Z",
  "slides": [
    {
      "id": "hs_01J2ABC...",
      "type": "category",
      "status": "published",
      "priority": 100,
      "schedule": {
        "starts_at": "2026-01-01T00:00:00Z",
        "ends_at": null
      },
      "media": {
        "image_url": "https://cdn.example.com/hero/hero-1.jpg",
        "image_alt": "Ciment blanc Boukir",
        "secondary_image_url": "https://cdn.example.com/hero/featured-product.webp",
        "secondary_image_alt": "Featured product image"
      },
      "content": {
        "title": "Ciment blanc pour vos chantiers",
        "subtitle": "Qualité pro, livraison rapide"
      },
      "target": {
        "category_id": 23
      },
      "ctas": [
        {
          "label": "Acheter maintenant",
          "style": "primary",
          "action": "navigate",
          "href": "/{locale}/shop?category_id=23"
        },
        {
          "label": "Voir promos",
          "style": "secondary",
          "action": "navigate",
          "href": "/{locale}/shop?sort=promo"
        }
      ]
    }
  ]
}
```

Notes:

- `{locale}` is a placeholder. Backend may either:
  - return `href` with `/{locale}` placeholders (frontend replaces), **or**
  - return fully-localized paths (preferred): `/fr/shop?...` or `/ar/shop?...`
- `slides` order must already be final (sorted by priority, time rules, etc.)

---

## 3) Slide types and targets

`type` is one of:

- `category` → navigates to shop page filtered by category
- `brand` → navigates to shop page filtered by brand
- `campaign` → navigates to a campaign page or shop query representing the campaign
- `product` → navigates to a product page

### 3.1 Target object

Depending on `type`, **exactly one** of these must be provided:

- `category`:
  - `target.category_id: number`

- `brand`:
  - `target.brand_id: number`

- `product`:
  - `target.product_id: number`
  - optional `target.variant_id: number`

- `campaign`:
  - `target.campaign_id: number`

If a type is missing its required target, backend must not publish that slide.

---

## 4) Media and images

### 4.1 Background image (required)

Every slide must have a background image:

- `media.image_url: string` (required)
- `media.image_alt: string` (optional)

This image covers the entire hero area and serves as the backdrop.

### 4.2 Secondary image (optional)

Slides can optionally include a secondary featured image that appears alongside the text content:

- `media.secondary_image_url: string` (optional)
- `media.secondary_image_alt: string` (optional)

When provided, the frontend will:
- Display the content (text + CTAs) on the left side
- Show the secondary image on the right side (on desktop/tablet)
- Hide the secondary image on mobile to maintain readability

**Use cases:**
- Product showcase: feature a specific product image next to the campaign text
- Brand highlight: show brand logo or representative product
- Campaign visuals: display promotional graphics or featured items

**Image requirements:**
- Format: PNG or WebP recommended for transparency support
- Size: 500-800px width recommended
- Aspect ratio: Portrait or square works best (1:1 or 3:4)
- Background: Transparent or matching the hero background

---

## 5) CTA rules

Hero is designed to be minimal:

- `ctas` length must be **0, 1, or 2**
- Each CTA must have:
  - `label: string` (short)
  - `style: "primary" | "secondary"`
  - `action: "navigate"` (keep it simple for now)
  - `href: string`

Frontend behavior:

- First CTA is treated as primary button.
- Second CTA (if provided) becomes outline/secondary button.

Backend should validate:

- max 2 CTAs
- no empty labels
- `href` must be a relative path starting with `/`

---

## 6) Scheduling and publishing

### 5.1 Status

- `draft`: exists in backoffice but not served
- `published`: eligible to be served (subject to schedule rules)
- `archived`: not served

### 5.2 Schedule rules

`starts_at` and `ends_at` are optional.

- If `starts_at` is set → must be `<= now` to be served
- If `ends_at` is set → must be `>= now` to be served
- If both are set → `ends_at` must be after `starts_at`

---

## 7) Runtime eligibility rules (recommended)

To keep the homepage hero “trustworthy”:

### 7.1 Product slide eligibility

If `type=product`:

- If product does not exist → skip slide
- If product is not visible → skip slide
- If product is out of stock (or `in_stock=false`) → skip slide
- Optional: if `variant_id` exists, ensure variant is available

If skipped, backend may:

- return fewer slides, or
- fallback to a safe slide (category/brand/campaign)

### 7.2 Category / brand

These can be served even if they currently have 0 products, but recommended to keep them meaningful.

---

## 8) Sorting / selection strategy

Recommended selection logic in backend:

1. Filter: `locale`, `status=published`
2. Filter by schedule: `starts_at <= now` AND (`ends_at is null` OR `ends_at >= now`)
3. Sort: `priority DESC`, then `updated_at DESC`
4. Apply runtime checks (product stock rules)
5. Return up to `limit`

---

## 9) Localization strategy

Two good approaches:

### A) Store per-locale slides (simple, explicit)

- Each slide row has `locale` (`fr` or `ar`) and localized title/subtitle

### B) Store one slide with translations

- Use a `translations` object with `fr` and `ar`

Example:

```json
{
  "content": {
    "title": { "fr": "...", "ar": "..." },
    "subtitle": { "fr": "...", "ar": "..." }
  }
}
```

Approach A is simpler for backoffice UI.

---

## 10) Database schema (Prisma example)

This is a suggested schema that matches the contract.

```prisma
model HeroSlide {
  id          String   @id @default(cuid())
  type        HeroSlideType
  status      HeroSlideStatus @default(DRAFT)
  priority    Int      @default(0)

  locale      String   // 'fr' | 'ar'

  startsAt    DateTime?
  endsAt      DateTime?

  imageUrl    String
  imageAlt    String

  title       String
  subtitle    String?

  categoryId  Int?
  brandId     Int?
  productId   Int?
  variantId   Int?
  campaignId  Int?

  ctas        Json

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([locale, status, priority])
  @@index([type, locale])
}

enum HeroSlideType {
  CATEGORY
  BRAND
  CAMPAIGN
  PRODUCT
}

enum HeroSlideStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## 10) Frontend compatibility notes

Frontend currently supports:

- Building shop URLs with query params:
  - `category_id=23`
  - `brand_id=1`
  - `sort=promo`

So the backend can either:

- Provide `target` fields only, and frontend will build URLs, **or**
- Provide `href` in CTAs already computed.

Recommended: keep `href` in CTAs for backoffice control and future flexibility.

---

## 11) Error response (optional)

If backend wants structured errors:

```json
{
  "error": {
    "code": "INVALID_LOCALE",
    "message": "locale must be one of: fr, ar"
  }
}
```

---

## 12) Checklist for backend implementation

- [ ] Validate locale and limit
- [ ] Enforce max 2 CTAs
- [ ] Enforce type-specific target requirements
- [ ] Apply schedule rules
- [ ] Apply product stock/visibility rules for product slides
- [ ] Return slides ordered by priority
- [ ] Cache response (short TTL + SWR)
