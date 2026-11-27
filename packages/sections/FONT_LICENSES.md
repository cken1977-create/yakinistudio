# Font licences (R2: self-hosted, no font CDNs)

Every font a client site uses is served from the site itself through `@fontsource` packages. All of
them are under the SIL Open Font License 1.1, which allows bundling and serving them with a website.
The full licence text ships in each package's `LICENSE` file.

| Font | Package | Used for | Licence |
|---|---|---|---|
| Fraunces | @fontsource-variable/fraunces | editorial display | OFL-1.1 |
| Source Sans 3 | @fontsource-variable/source-sans-3 | editorial body | OFL-1.1 |
| Inter | @fontsource-variable/inter | modern pair; Signature body | OFL-1.1 |
| Nunito | @fontsource-variable/nunito | friendly pair | OFL-1.1 |
| Playfair Display | @fontsource-variable/playfair-display | classic display | OFL-1.1 |
| Lora | @fontsource-variable/lora | classic body | OFL-1.1 |
| Cormorant Garamond (roman + italic) | @fontsource-variable/cormorant-garamond | Signature display and accent phrase | OFL-1.1, © 2015 The Cormorant Project Authors |
| JetBrains Mono | @fontsource-variable/jetbrains-mono | Signature labels | OFL-1.1, © 2020 The JetBrains Mono Project Authors |

Checked 2026-11-27 against each package's `license` field and LICENSE file.

## Published sites: subset fonts and size-matched fallbacks (2026-11-27)

- **Budget:** a published site downloads at most 100 KB of fonts for an English page. The site build
  (`apps/builder/scripts/build-site-css.mjs`) cuts each font's Latin file to the weights the site
  styles use and to its own Latin characters (subsetting is allowed by the OFL), and the build fails
  if any font pair goes over. Sizes per pair are written to `public/_site-assets/manifest.json`.
- **No layout shift while fonts load:** `src/fonts.css` gives every web font two local fallbacks
  (Arial/Times/Courier and their metric twins Liberation, Arimo, Tinos and Cousine; then DejaVu),
  resized with `size-adjust` and `ascent-override`/`descent-override` so text takes the same
  space before and after the web font arrives. Each has a regular face and bold faces for three
  weight bands (600, 700, and the pair's heading weight).
- **How the numbers are worked out** (redo it if a font changes): in a browser, draw the sites' own
  text (from the rich design fixtures, grouped by font and weight band) in the web font and in the
  local font; `size-adjust` is the ratio of the two widths. Each vertical override is the web font's
  ascent, descent or line gap (from its tables, at that weight) divided by `size-adjust`. Digit faces
  use the ratio of the two fonts' "0" widths, because CSS `ch` units are measured on "0".
- **Preload:** each published page preloads its own pair's Latin files (`apps/builder/lib/site/font-files.json`),
  so on a normal connection the web fonts are ready before the first paint and the fallbacks never show.
