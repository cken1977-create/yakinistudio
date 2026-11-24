# Kit photos for later kits

Approved sample photos for the kits that don't exist yet (Phase 8). Each folder has, per photo, a
1280×720 JPEG (every browser), a WebP of the same size and a 640-wide WebP (`-sm`), and a
`manifest.json` with the key, alt text and the photo's number in the approved set.

When a kit is built: move its folder to `public/kit-samples/<kit>/` and list each photo with
`photoSample(...)` in the kit (see `packages/kits/src/food-truck.ts`).

These photos contain no faces in focus, no logos and no readable text. Left out of the approved
set of 60: #04, #11, #18, #33, #35, #36 (reasons in `OPEN_QUESTIONS.md`, Phase 2 item 5).
