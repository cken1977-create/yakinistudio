# Kits progress

The owner asked for every kind of business to be covered and for the kits to be fully built.
Plan (the seven kits went into one pull request, `feat/builder-kits`, one commit), nothing merged or deployed without Clarence's word:

1. [✓ merged, PR #125] `feat/builder-industries`: general "Business and services" kit, industry list (173), color sets, restaurant-fallback fix, button contrast fix.
2. [✓ `feat/builder-kits`] Landlord kit (photos in `kit-photos/landlord`)
3. [✓ `feat/builder-kits`] Real estate kit (`kit-photos/real-estate`)
4. [✓ `feat/builder-kits`] Tree and lawn kit (`kit-photos/tree-lawn`)
5. [✓ `feat/builder-kits`] Nonprofit kit (`kit-photos/nonprofit`)
6. [✓ `feat/builder-kits`] Training school kit (`kit-photos/training-school`)
7. [✓ `feat/builder-kits`] Trucking kit (`kit-photos/trucking`)
8. [✓ `feat/builder-kits`] Oilfield kit (`kit-photos/oilfield`)

Each kit: move its photos to `public/kit-samples/<kit>/` with 960 px WebP copies, write the kit
(pages, sections, tone, palette, Today kinds), register it in `BUILDER_KITS`; the industry list
then sends its industries to it automatically. Tests in `packages/kits`, a browser test drafting
one business of that kind, and screenshots at 390 and 1280.

Not planned yet (no approved photos): specialized operations, cannabis, home health care, reentry.
Those industries keep using the general kit.
