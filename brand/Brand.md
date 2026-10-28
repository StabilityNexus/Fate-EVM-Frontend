# Fate Protocol Brand Kit

This folder is the canonical source for **Fate Protocol's own** visual identity: logo, favicons and
icons, colour palette, and typography. Those assets live here, and the copies under `public/` are
what the deployed application serves; the two are kept identical.

The Stability Nexus organisation logo is **not** a Fate asset and is deliberately not duplicated
here. It is referenced from `public/` where the application uses it, and the organisation owns the
canonical copy.

## Logo

| Asset | File |
| --- | --- |
| Fate Protocol mark (SVG) | [`logo.svg`](./logo.svg) |
| Stability Nexus org logo (animated GIF) | [`../public/Animated/logo-animated.gif`](../public/Animated/logo-animated.gif) |

The mark is a hexagonal badge containing two animals in profile: a pale bear above and a dark bull
below, representing the bearCoin and bullCoin sides of every prediction pool. The hexagon is filled
dark and outlined with a heavy dark stroke.

`logo.svg` is a `0 0 1230 1280` viewBox built from 14 paths in five fixed greys. It carries no
`currentColor` and no animation, so it renders identically in every context.

### Using the mark on a background

The mark is **two-tone with a dark silhouette**, which constrains what it can sit on. Measured
contrast of the mark's own values against candidate grounds:

| Ground | vs `#121212` (hex fill) | vs `#F1F1F1` (bear) |
| --- | --- | --- |
| `#0A0A0A` near-black | 1.06 : 1 | 17.53 : 1 |
| `#6B6B6B` mid grey | 3.52 : 1 | 4.72 : 1 |
| `#FFFFFF` white | 18.73 : 1 | 1.13 : 1 |

- **Prefer light or mid grounds.** On white the pale bear is low-contrast in isolation but stays
  legible because it is *contained* by the dark hexagon fill, so the badge reads as a whole.
- **Avoid near-black grounds.** At 1.06 : 1 the hexagon's silhouette dissolves and only the bear
  remains visible. The mark still appears in the app's dark navbar, which is an accepted trade-off,
  but new placements should not repeat it.
- This is why the social preview card (`public/og-image.png`) uses a light `#F7F8FA` ground rather
  than matching the app's dark theme.

One asset serves both light and dark themes. A dark-specific variant was evaluated and deliberately
declined, to keep a single canonical mark.

## Favicons & Icons

Generated from `logo.svg` at the sizes browsers and mobile platforms actually request:

| File | Size | Use |
| --- | --- | --- |
| [`favicon.ico`](./favicon.ico) | 16 / 32 / 48 (multi-res) | Classic browser favicon |
| [`apple-touch-icon.png`](./apple-touch-icon.png) | 180×180 | iOS home screen |
| [`icon-192.png`](./icon-192.png) | 192×192 | PWA manifest, Android |
| [`icon-512.png`](./icon-512.png) | 512×512 | PWA manifest, splash |
| [`icon-maskable-512.png`](./icon-maskable-512.png) | 512×512 | PWA maskable icon, safe-zone padded |

`favicon.ico` is a genuine three-entry ICO container. Chrome requires both a 192 and a 512 PNG for
installability, so those two are not optional and must not be collapsed into the SVG.

`icon-maskable-512.png` is declared with `"purpose": "maskable"` in `public/manifest.json`. The mark
sits inside the central safe zone, so Android can crop it to any shape.

The ICO frames are cut with **zero padding**. The inked mark is taller than it is wide, so height is
the binding dimension and any inset costs visible size at 16px.

## Colour Palette

### Mark palette

Sourced directly from `logo.svg`. The mark is deliberately achromatic so it never competes with the
semantic colours below.

| Swatch | Name | Hex | Usage in mark |
| --- | --- | --- | --- |
| ⬛ | Ink | `#121212` | Hexagon fill, bull body |
| ⬛ | Ink Light | `#242424` | Hexagon stroke |
| ⬛ | Graphite | `#444444` | Bull shading, interior detail |
| ⬜ | Silver | `#C0C0C0` | Bear shading |
| ⬜ | Bone | `#F1F1F1` | Bear body |

### Application palette

What the interface actually renders. Colour here is **semantic, not decorative**: green and red
carry directional meaning and must not be used for ornament.

| Swatch | Role | Light | Dark |
| --- | --- | --- | --- |
| 🟩 | Bull, gains, upward movement | `#16a34a` (green-600) | `#4ade80` (green-400) |
| 🟥 | Bear, losses, downward movement | `#ef4444` (red-500) | `#f87171` (red-400) |
| 🟨 | Accent, active state, warnings | `#eab308` (yellow-500) | `#eab308` |
| ⬜ | Page background | `#FFFFFF` | `#0A0A0A` |
| ⬛ | Body text | `#171717` | `#EDEDED` |
| ⬛ | Mobile navigation bar | `#1A1B1F` | `#1A1B1F` |

Surfaces, borders and secondary text use Tailwind's `gray` and `neutral` scales (Tailwind v3.4
defaults). Both scales are currently in use across the codebase; new work should prefer `neutral`
and existing `gray` usage should migrate as files are touched.

### Organisation accents

Inherited from Stability Nexus and used where Fate appears as part of the wider organisation, such
as the README badge and the social preview rule.

| Swatch | Name | Hex |
| --- | --- | --- |
| 🟨 | Stability Gold | `#FFC517` |
| 🟩 | Forest Green | `#228B22` |

### Contrast requirement

All text pairings must meet WCAG 2.1 AA, 4.5 : 1 for body text and 3 : 1 for large text and
non-text indicators. `#171717` on `#FFFFFF` gives 17.93 : 1 and `#EDEDED` on `#0A0A0A` gives
16.91 : 1, so both defaults have ample headroom. Take care with the yellow accent: `#eab308` on
white is only 1.92 : 1, so it must be reserved for icons, borders and fills, never for small text on
a light ground.

## Typography

**Brand typeface: Geist.** Loaded through `next/font/google` in `src/app/layout.tsx`, which exposes
it as the CSS variable `--font-geist-sans`. `src/app/globals.css` applies it to `body`.

| Role | Face | Use |
| --- | --- | --- |
| Interface | Geist | All UI text, headings, body, labels |
| Numeric and code | System monospace (Tailwind `font-mono`) | Addresses, hashes, contract values |
| Fallback stack | `Arial, Helvetica, sans-serif` | When Geist is unavailable |

Guidance: headings bold and tight; body regular; monospace with tabular figures for any column of
token amounts or prices, so digits align.

The wordmark on the social preview card is set in Arial Bold, chosen for guaranteed availability in
the image-generation step rather than as a brand choice. Now that the app renders Geist, the card
can be regenerated in Geist.
