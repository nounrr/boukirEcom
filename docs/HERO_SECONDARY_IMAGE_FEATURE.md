# Hero Secondary Image Feature

**Date:** January 29, 2026  
**Status:** Ready for Backend Implementation

## Overview

This document describes the new **secondary image** feature for hero slides, which allows displaying a featured product or promotional image alongside the hero text and CTAs.

## Frontend Implementation

The frontend has been updated to support an optional secondary image that appears on the right side of the hero slide (on desktop/tablet), while the text content and CTAs remain on the left.

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  Background Image (covers full area)                │
│  ┌─────────────────┐     ┌──────────────────┐      │
│  │   Text Content  │     │  Secondary Image │      │
│  │   - Badge       │     │   (Featured)     │      │
│  │   - Title       │     │                  │      │
│  │   - Subtitle    │     │                  │      │
│  │   - CTAs        │     │                  │      │
│  └─────────────────┘     └──────────────────┘      │
└─────────────────────────────────────────────────────┘
```

### Changes Made

1. **Type Definition** ([home-hero.tsx](../src/components/home/home-hero.tsx)):
   - Added `secondaryImageSrc?: string`
   - Added `secondaryImageAlt?: string`

2. **API Type** ([hero-slides.ts](../src/types/api/hero-slides.ts)):
   - Updated `HeroSlideMediaApi` interface:
     ```typescript
     export interface HeroSlideMediaApi {
       image_url: string
       image_alt?: string | null
       secondary_image_url?: string | null
       secondary_image_alt?: string | null
     }
     ```

3. **Layout**:
   - When `secondaryImageSrc` is provided:
     - Grid layout: 2 columns on desktop (lg breakpoint)
     - Text content takes left column
     - Secondary image takes right column with `object-contain` to preserve aspect ratio
   - When `secondaryImageSrc` is not provided:
     - Single column layout (backward compatible)
   - Mobile: secondary image is hidden to ensure text readability

## Backend Implementation Required

### Database Schema Updates

Add these fields to your `hero_slides` table (or equivalent):

```sql
ALTER TABLE hero_slides 
ADD COLUMN secondary_image_url VARCHAR(500) NULL,
ADD COLUMN secondary_image_alt VARCHAR(255) NULL;
```

Or in Prisma:

```prisma
model HeroSlide {
  // ... existing fields
  
  secondary_image_url String?  @db.VarChar(500)
  secondary_image_alt String?  @db.VarChar(255)
}
```

### API Response Updates

Update the `GET /api/hero-slides` endpoint to include the new fields in the `media` object:

**Before:**
```json
{
  "media": {
    "image_url": "https://cdn.example.com/hero/hero-1.jpg",
    "image_alt": "Ciment blanc Boukir"
  }
}
```

**After:**
```json
{
  "media": {
    "image_url": "https://cdn.example.com/hero/hero-1.jpg",
    "image_alt": "Ciment blanc Boukir",
    "secondary_image_url": "https://cdn.example.com/hero/featured-product.webp",
    "secondary_image_alt": "Featured product image"
  }
}
```

### Backoffice UI Updates

Add form fields to the hero slide editor:

1. **Secondary Image Upload**
   - Field type: Image upload
   - Label: "Secondary Image (Optional)"
   - Help text: "Featured product or promotional image that appears alongside the text"
   - Accept: PNG, WebP, JPG
   - Recommended size: 500-800px width

2. **Secondary Image Alt Text**
   - Field type: Text input
   - Label: "Secondary Image Alt Text"
   - Help text: "Accessible description of the secondary image"
   - Max length: 255 characters

### Image Recommendations

**Secondary Image Guidelines:**
- **Format:** PNG or WebP (for transparency support)
- **Dimensions:** 500-800px width recommended
- **Aspect Ratio:** Portrait (3:4) or square (1:1) works best
- **Background:** Transparent PNG or WebP preferred, or use a color that matches the hero background
- **File Size:** Keep under 500KB for optimal loading

**Good Use Cases:**
- Product showcase with transparent background
- Brand logos or mascots
- Promotional graphics
- Featured collection items
- Campaign-specific visuals

## Testing

A test slide has been added to the homepage with:
- Background: `/hero/hero-1.jpg`
- Secondary image: `/hero/blal.webp` (tools/helmet image)
- Title: "New brand arrive"
- Subtitle: "Let's checkout these"

To test the backend integration:
1. Add the database fields
2. Update the API endpoint to return the new fields
3. Upload a test image via backoffice
4. Verify the slide displays correctly on the frontend
5. Test with and without secondary images (backward compatibility)

## Backward Compatibility

✅ **Fully backward compatible**
- Existing slides without `secondary_image_url` will display normally
- The feature is purely additive
- No breaking changes to existing API or components

## Next Steps

1. ✅ Frontend implementation complete
2. ⏳ Backend database schema update
3. ⏳ Backend API endpoint update
4. ⏳ Backoffice UI implementation
5. ⏳ Upload test images and verify

## Questions?

Contact the frontend team for any clarifications about the implementation or visual requirements.
