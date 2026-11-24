# Phase 3 evidence

Screenshots from the browser tests (`tests/e2e/publish.spec.ts`) at phone 390 and desktop 1280, test mode.
CI saves the same set on every run (artifact `builder-screenshots`, files `phase3-*`).

## Lighthouse (local, mobile preset, 3 runs each, Lighthouse 12.8.2)
Sample sites: the food-truck and restaurant kits, published on a paid plan with indexing on.

| Page | Performance (median, runs) | Accessibility | SEO |
|---|---|---|---|
| mesa-street-tacos/home | 91 (96, 91, 88) | 96 | 100 |
| mesa-street-tacos/menu | 94 (92, 96, 94) | 96 | 100 |
| mesa-street-tacos/contact | 93 (93, 93, 94) | 100 | 100 |
| casa-lupita-kitchen/home | 96 (90, 96, 96) | 100 | 100 |
| casa-lupita-kitchen/menu | 93 (94, 88, 93) | 96 | 100 |
| casa-lupita-kitchen/contact | 92 (92, 95, 86) | 100 | 100 |

Best practices is 79 locally only because the test server is plain http (`is-on-https`, `redirects-http`);
client sites are served over https. Scores move a few points run to run because the server and the
browser share one machine; CI or a deployed preview gives steadier numbers.

How to rerun: build, start `BUILDER_TEST_MODE=1 npx next start -p 3110`, publish the `kit-ready` and
`restaurant-ready` fixtures (see PHASE3_PROGRESS.md), then run Lighthouse against
`http://<slug>.yakini.digital:3110` from a Chromium started with
`--host-resolver-rules="MAP *.yakini.digital 127.0.0.1"`.
