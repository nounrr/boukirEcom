# Boukir E‑Commerce — Architecture & Flows (Current Knowledge)

> Date: 2026‑01‑19
>
> This document summarizes the architecture and the “behind the scenes” behavior we’ve implemented/observed so far in this workspace.

## 1) Tech stack (what you’re running)

- **Framework**: Next.js (App Router) + TypeScript + React
- **Routing**: Locale segment `app/[locale]/...` (via `next-intl`)
- **State & data**: Redux Toolkit + **RTK Query** (API slices in `src/state/api/*`)
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod (checkout validation)

## 2) High-level folder map (how to navigate the repo)

### App Router pages

- `app/[locale]/layout.tsx`: Locale layout shell.
- `app/[locale]/page.tsx`: Locale landing page (home).
- `app/[locale]/(shop)/*`: Shop experience (listing, product, cart, checkout, wishlist, orders).
- `app/[locale]/(auth)/*`: Auth pages (login, register, forgot-password).

### Shared UI

- `src/components/layout/*`: Header, breadcrumbs, cart popover, page layouts.
- `src/components/shop/*`: Product card, product gallery, filters, suggestions, variant selector, order card.
- `src/components/auth/*`: Auth dialogs/forms and user initializers.

### State & API

- `src/state/store.ts`, `src/state/StoreProvider.tsx`: Redux store wiring.
- `src/state/api/*-api-slice.ts`: RTK Query endpoints.
- `src/state/slices/*`: Local Redux slices (if any; depends on current repo state).

### Types

- `src/types/api/*`: API-shaped contracts + UI filter state helpers.
- `src/types/*`: Domain types (auth/cart/order/product/etc.).

## 3) Core data flow pattern (RTK Query)

### Pattern used

1. UI pages/components keep a small local UI state (filters, steps, open/close).
2. They call RTK Query hooks like `useGetProductsQuery(filters)`.
3. API slices translate filter state into query params and normalize / map response fields when needed.

### Example: products list

- UI state type: `FilterState` in `src/types/api/products.ts`
- Conversion helper: `filterStateToApiRequest(state)` maps UI state to `ProductFiltersRequest`.
- API slice: `src/state/api/products-api-slice.ts`
  - Converts arrays to comma-separated strings for `category_id`, `brand_id`, `color`, `unit`.

**Why this matters**: if you want URL-driven filtering, you can map URL → `FilterState` → `filterStateToApiRequest` → API.

## 4) Shop page architecture (current)

File: `app/[locale]/(shop)/shop/page.tsx`

- Holds `filterState` (categories, brands, priceRange, colors, units, search, inStock, sort, page/per_page).
- Builds `apiFilters = filterStateToApiRequest(filterState)`.
- Calls `useGetProductsQuery(apiFilters)`.
- Gets filter metadata from the response (`data.filters.categories`, `brands`, etc.) and passes it to `ProductFilters`.
- Passes products & pagination to `ProductsList`.

### Filter sidebar

Component: `src/components/shop/product-filters.tsx`

- Internally maintains its own filter state (`filters`) and notifies parent with `onFilterChange`.
- Debounces search and batches rapid changes.

**Important note**: Because `ProductFilters` owns its own internal `filters` state, it currently behaves like an “uncontrolled” component.

If you want **Home → Shop with preselected filters**, you’ll want one of these:

- Option A (recommended): Add an `initialFilters?: Partial<FilterState>` prop to `ProductFilters`, apply it on mount, then notify parent.
- Option B: Make `ProductFilters` fully controlled (`filters` prop + `onChange`).

## 5) “Marjane Mall” inspiration mapping (behavior, not copying)

From observation:

- They let users enter the catalog by clicking a **category tile** or **brand tile**.
- Categories often go to a **category landing page** (URL path contains a slug, e.g. `/electromenager`).
- Brands go to a **brand storefront path**, e.g. `/boutique-officielle/adidas`, with optional query params for sorting.

### How to translate this into *your* Next.js app

You can achieve the same UX with either:

1. **Query-param filtering on a single shop page**
   - Example: `/fr/shop?category=12` or `/fr/shop?brand=5`
   - Pros: simplest, one page.
   - Cons: URL less “pretty” than slugs.

2. **Pretty URLs + redirect to shop page**
   - Example: `/fr/categorie/electromenager` → redirects to `/fr/shop?category=12`.
   - Example: `/fr/marque/adidas` → redirects to `/fr/shop?brand=5`.
   - Pros: SEO-friendly and matches Marjane-like mental model.
   - Cons: needs a slug→id mapping strategy.

## 6) Recommended URL schema for your shop filters

Because your backend already expects `category_id` and `brand_id`, the cleanest schema is to reuse those names:

- `/[locale]/shop?category_id=12`
- `/[locale]/shop?brand_id=5`
- Multiple values:
  - `/[locale]/shop?category_id=12,14&brand_id=5,9`

Other filters:

- `search=...`
- `color=red,blue`
- `unit=kg,m`
- `min_price=10&max_price=500`
- `in_stock_only=true`
- `sort=newest|price_asc|price_desc|promo|popular`
- Pagination: `page=2&per_page=20`

### Mapping rules (URL → FilterState)

- `category_id` → `FilterState.categories: number[]`
- `brand_id` → `FilterState.brands: number[]`
- `color` → `FilterState.colors: string[]`
- `unit` → `FilterState.units: string[]`
- `search` → `FilterState.search`
- `min_price/max_price` → `FilterState.priceRange`
- `in_stock_only` → `FilterState.inStock`
- `sort` → `FilterState.sort`
- `page/per_page` → `FilterState.page/per_page`

### Mapping rules (FilterState → URL)

- Keep URLs shareable and bookmarkable by reflecting active filters.
- Use `router.replace()` (not push) on filter toggles to avoid polluting history.

## 7) Cart + checkout behavior (what’s already implemented)

### Guest vs authenticated cart

- **Guest**: cart is hydrated from `localStorage`.
- **Authenticated**: cart comes from API (RTK Query slice).

We already fixed a scenario where the UI looked empty while a quantity existed by ensuring the guest cart reads from `localStorage` correctly.

### Checkout without login (guest checkout)

- Checkout flow was adjusted so users can place an order without being logged in.

### Promo code

- Promo code input is shown **only on the final checkout step**.b
- There is a promo validation endpoint in the promo API slice.
- Valid promo affects totals calculation.

## 8) Orders (what exists today)

### Orders list page

- Page: `app/[locale]/(shop)/orders/page.tsx`
- Component: `src/components/shop/order-card.tsx`

This renders an “Amazon-like” order summary card:

- Header (order id/date/status)
- Items list with images
- Actions like “buy again” / “view product” / “track package” (UI hooks; tracking logic can be extended)

### Snake_case → camelCase mapping

Backend returns `items[].image_url`.
Frontend uses `imageUrl`.
We updated mapping in `src/state/api/orders-api-slice.ts` and types in `src/types/order.ts` to ensure images render.

## 9) Product card & product page behavior (variants + promo UI)

### Product card

Component: `src/components/shop/product-card.tsx`

- Image hover zoom (`group-hover:scale-...`).
- Variant selection updates:
  - **current price**
  - **main image** when a variant has an image
- Promo display matches desired layout:
  - Price aligned with promo badge
  - Original price displayed below
  - The old top-left “hanging promo tag” overlay was removed

### Product detail page

Page: `app/[locale]/(shop)/product/[id]/page.tsx`

- Promo price layout matches card.
- Variant selector and unit/options buttons show pointer cursor and update the shown price/image.

## 10) What’s still missing / recommended next steps

### A) URL-driven shop filters (not implemented yet)

Goal:

- From Home: click category/brand tile → navigate to `/[locale]/shop?...` with filter applied.

Work needed:

1. Parse URL params inside `app/[locale]/(shop)/shop/page.tsx`.
2. Initialize `filterState` from URL.
3. Keep URL synced with filter state.
4. Update `ProductFilters` so it can accept initial selected categories/brands.

### B) Nice “Marjane-like” landing routes

Optional:

- `/[locale]/categorie/[slug]` → redirect to shop with category_id.
- `/[locale]/marque/[slug]` → redirect to shop with brand_id.

Needs:

- a slug field from API or a slug generator + stable mapping.

### C) Orders details page

- `/[locale]/orders/[id]` details and possible invoice/track pages.

---

## Quick mental model (one paragraph)

The shop is a single listing page driven by a `FilterState` object. That state is converted to backend query params via `filterStateToApiRequest`, then RTK Query fetches products and returns both items and filter metadata. The rest of the app (cart/checkout/orders) follows the same pattern: UI state + RTK Query endpoints, with small mapping layers where the backend uses snake_case.
