# Kits progress

The owner asked for every kind of business to be covered and for the kits to be fully built.
Plan, one pull request each, nothing merged or deployed without Clarence's word:

1. [✓ PR open] `feat/builder-industries`: general "Business and services" kit, industry list (173), color sets, restaurant-fallback fix, button contrast fix.
2. [ ] Landlord kit (photos in `kit-photos/landlord`)
3. [ ] Real estate kit (`kit-photos/real-estate`)
4. [ ] Tree and lawn kit (`kit-photos/tree-lawn`)
5. [ ] Nonprofit kit (`kit-photos/nonprofit`)
6. [ ] Training school kit (`kit-photos/training-school`)
7. [ ] Trucking kit (`kit-photos/trucking`)
8. [ ] Oilfield kit (`kit-photos/oilfield`)

Each kit: move its photos to `public/kit-samples/<kit>/` with 960 px WebP copies, write the kit
(pages, sections, tone, palette, Today kinds), register it in `BUILDER_KITS`; the industry list
then sends its industries to it automatically. Tests in `packages/kits`, a browser test drafting
one business of that kind, and screenshots at 390 and 1280.

Not planned yet (no approved photos): specialized operations, cannabis, home health care, reentry.
Those industries keep using the general kit.
