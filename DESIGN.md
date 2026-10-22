# Design System: Global Chess Academy

Design system reference for Stitch screen generation. Every value here is derived from
the shipped tokens in `src/styles/global.css` and the markup in `src/pages` and
`src/components` so new screens stay consistent with the live site.

Two constraints are non-negotiable and override anything below:

1. **Language is Vietnamese.** All copy, labels, headings and button text are written
   in Vietnamese. Fonts must ship the Vietnamese subset.
2. **Nothing false may be invented.** No fabricated testimonials, ratings, student
   counts, awards, or generic placeholder people/companies. If real content does not
   exist yet, render an explicit TODO block instead.

---

## 1. Visual Theme & Atmosphere

A warm, civic-trust education brand: the calm of a well-run classroom crossed with the
discipline of a chess board. Clinical navy structure carries the authority; warm cream
paper and a single amber accent keep it friendly for parents of 4–12 year old children.

- **Density:** 4 / 10 — Daily App Balanced. Generous section padding (16 = 4rem vertical
  rhythm), relaxed card interiors, nothing cramped. Pricing is the one denser surface.
- **Variance:** 6 / 10 — Offset Asymmetric. Hero is a deliberate 7/5 split, the branch
  grid is bento (first card spans two columns), the operating points grid runs the
  7-5-5-7 rhythm on 12 columns. No three-equal-cards rows.
- **Motion:** 3 / 10 — Static Restrained. The site informs; it does not perform. Motion is
  limited to CSS `transition`, tactile `active:scale`, and one `animate-pulse` on a
  form error. No scroll-jacking, no parallax, no entrance choreography.

The signature move is **geometry for atmosphere, real photos for proof**: the hero
builds depth from a perspective-rotated chessboard plane, a warm/cool radial mesh and a
fine SVG grain; the `#hinh-anh` gallery then shows only real center photos, used with
parents' consent. Never stock photos or AI-generated children.

---

## 2. Color Palette & Roles

One accent only. Saturation stays below 80%. No purple, no neon, no glow.

**Brand navy — structure, authority, every dark surface**
Derived from the actual logo (`#184268` = brand-800). Use this scale instead of Slate
for any dark block so the UI matches the real logo.

- **Ink Night** (`#0b2136`, brand-950) — modal overlay backdrop, deepest text
- **Deep Navy** (`#123350`, brand-900) — inset shadow accents, board cell color
- **Brand Navy** (`#184268`, brand-800) — primary dark section background, primary button fill, icon tiles
- **Barrel Blue** (`#1b4a76`, brand-700) — inner panels on navy, button hover
- **Slate Blue** (`#1f5285`, brand-600) — hairline dividers on navy
- **Sky Tint** (`#b6d0e8`, brand-200) — body copy on brand-800
- **Pale Sky** (`#d9e8f5`, brand-100) — top bar text on brand-800
- **Fog Blue** (`#eef5fb`, brand-50) — hero mesh highlight only

Text rule: on `brand-800` and darker, only brand-100…300 or white is legible. Never
place `slate-600` on navy.

**Warm page surface**

- **Warm Paper** (`#faf8f5`, `--color-cream`) — global body background and the sticky header (at 95% with `backdrop-blur-md`). One token for every light surface, including the 404 page.
- **Pure Surface** (`#ffffff`) — alternating white sections, cards that must lift off cream, form fields, modal body.
- **Soft Amber Wash** (`#fffbeb` / `amber-50`) — callout panels, ticket-style side notes, selected-input tint at 40%.

**Neutrals**

- **Slate Ink** (`#0f172a`, `slate-900`) — headings and primary text on light surfaces
- **Slate Body** (`#475569`, `slate-600`) — body copy, descriptions, metadata
- **Slate Hairline** (`#e2e8f0`, `slate-200` at 80–90% alpha) — 1px borders, section dividers
- Pure black `#000000` is never used.

**Accent — the single accent color, amber/gold**

- **Amber Gold** (`#f59e0b`, `amber-500`) — primary CTA fill (filled button on the header and in the mobile menu uses amber-500 with `slate-950` text), focus-visible outline, eyebrow tick mark, the "Most popular" ribbon
- **Amber Deep** (`#b45309`, `amber-700`) — inline text links on light surfaces, eyebrow label text, icons
- **Amber Bright** (`#fbbf24`, `amber-400`) — accent text and icons on navy surfaces, icon color inside navy tiles, CTA arrow glyph
- **Amber Wash** (`#fef3c7` / `#fffbeb`, amber-100/50) — badge fills, selected pricing card border glow

Two amber roles must not be confused: **amber-400 on navy**, **amber-700 on cream**.
Amber-500 is reserved for the button fill and the focus ring.

**Status color — used sparingly, meaning-carrying only**

- **Emerald** (`#059669` / `#047857`) — "đang tuyển sinh" live dot, payment success panel, "copy account number" action. Never decorative.

**Elevation tint.** Every shadow is warm, carrying the hue of the cream page
(`rgb(68 55 43 / …)`) rather than cool slate, so elevation reads as warm light:

- `--shadow-soft` — `0 1px 2px rgb(68 55 43 / 0.04), 0 8px 24px -12px rgb(68 55 43 / 0.16)` — cards, small CTAs
- `--shadow-lifted` — `0 2px 4px rgb(68 55 43 / 0.05), 0 20px 44px -16px rgb(68 55 43 / 0.22)` — hero island, active pricing card, modal-adjacent surfaces

---

## 3. Typography Rules

Deliberate two-font pairing. Both faces must ship a Vietnamese subset with full
diacritic coverage — a hard requirement, not a preference.

- **Display:** `Bricolage Grotesque` (`--font-display`, optical size 12–96, weights 400–800). Used for `h1`–`h4`. Track-tight, controlled scale, weight-driven hierarchy. Headlines carry `text-wrap: balance`.
- **Body:** `Be Vietnam Pro` (`--font-sans`, 400/500/600/700). Body copy, labels, buttons, numerals. Paragraphs and list items carry `text-wrap: pretty`.
- **Mono:** system mono / `font-mono`. Only for code-like tokens: bank account numbers, inline `code` references, branch ids. High-density numbers use `tabular-nums`.

Scale (Tailwind steps, as shipped):

| Role | Size |
|---|---|
| Hero H1 | `text-5xl sm:text-6xl lg:text-7xl xl:text-8xl`, `leading-[1.08]`, `font-extrabold`, `tracking-tight` |
| Section H2 | `text-3xl md:text-4xl lg:text-5xl`, `font-extrabold`, tracking `-0.02em`, line-height `1.08` |
| Card H3 | `text-base`–`text-lg`, `font-bold` |
| Body | `text-base`, `leading-relaxed`, `text-slate-600` |
| Small / metadata | `text-sm`, `leading-relaxed` |
| Micro label | `text-xs`, `font-semibold`–`font-extrabold` |

Rules:

- Hierarchy comes from size + weight + color, not from all-caps. Uppercase is reserved for micro-labels only: `text-xs` (or `text-[11px]`) combined with `tracking-wide`/`tracking-wider`, used on card group labels, the logo slogan, "cập nhật lần cuối" stamps, and the pricing ribbon. Never uppercase a heading, body copy, button, or an eyebrow label.
- Body measure caps at `max-w-prose` / `max-w-xl` (≈65ch). Never a full-width paragraph on a wide screen.
- Eyebrow labels: `0.9375rem`, `font-semibold`, `tracking-[-0.005em]`, amber-700 on light and amber-400 on navy, prefixed by a 1.75rem × 2px amber dash. Sentence case — never uppercase on light surfaces.
- Numbers in stats and prices use `tabular-nums` with `whitespace-nowrap`; a value like `48 Buổi` must never break across lines.
- Banned fonts: `Inter`, `Times New Roman`, `Georgia`, `Garamond`, `Palatino`, and any generic system serif. Bricolage Grotesque is the only display face that satisfies the Vietnamese requirement in this set.

---

## 4. Component Stylings

**Buttons**

- Primary on light: `bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold`, `rounded-control`, `px-4 py-2.5`, `text-xs md:text-sm`, `shadow-soft`.
- Primary on navy: `bg-brand-800 hover:bg-brand-700 active:bg-brand-900 text-white font-bold`, `px-6 py-3.5`, `shadow-lifted`, with the trailing arrow glyph in `amber-400`.
- Secondary: `bg-white/80 hover:bg-white backdrop-blur-sm border border-slate-300 text-slate-800 font-semibold`, `shadow-soft`.
- Tertiary: text link in `amber-700 hover:amber-800 hover:underline`, with a `group-hover:translate-x-0.5` arrow.
- All buttons: `active:scale-[0.98]` (or `0.99` on full width, `0.95` on icon-only). No outer glow ever.
- Minimum tap target 44px on mobile; the header CTA hides below `sm` rather than shrinking.

**Cards**

- `rounded-card` (1.125rem) outer container, `rounded-control` (0.75rem) for inner controls, badges and inputs. Small badges may drop to `rounded-md`.
- Light card: `bg-cream` or `bg-white` + `border border-slate-200/90` + `p-5`–`p-6`. Shadow appears only when the card must lift off a cream section (`shadow-soft` / `shadow-lifted`).
- Navy card: `bg-brand-800 text-white p-5 rounded-card`; inner sub-panels use `bg-brand-700/60 border border-brand-600`.
- Icon tile: `bg-brand-800 text-amber-400`, `w-9 h-9` (compact) or `w-11 h-11` (wide), `rounded-control`, no shadow.
- On hover a card may change border to `amber-400` and gain `shadow-soft`. No translate, no lift.
- Bento is preferred over equal grids: the first branch card spans two columns and carries a faded chessboard circle at 6% opacity as its badge of rank.

**Gallery**

- `#hinh-anh` is a two-column offset collage: left column is lead → classroom → coach,
  right column starts lower (`md:pt-12`) with practice → tournament → branches note.
  Mobile stacks to one column.
- Figures: `rounded-card overflow-hidden bg-slate-100 ring-1 ring-slate-900/5`; images are
  `w-full h-auto`. No text overlay, tilt, hover zoom or fake polaroid frame.
- Only real photos from the center, with consent. Alt text describes what is visible;
  never invent a branch name, student name, event result or award.

**Inputs and forms**

- Label above the control, `text-xs`–`text-sm`, neutral weight; helper or error text below in `text-sm`.
- Field: `w-full px-3 py-2 text-sm border border-slate-300 rounded-control bg-white outline-none focus:ring-2 focus:ring-amber-500`.
- Selected / validated field: `border-amber-400 bg-amber-50/40 font-semibold`.
- Invalid: red text plus a `bg-red-50` inline message. A `text-red-600 animate-pulse motion-reduce:animate-none` warning is reserved for the one blocking payment error.
- No floating labels. No placeholder-only forms.

**Loaders, empty and error states**

- Skeletons must match the exact dimensions of the content they replace. No circular spinner.
- When `TESTIMONIALS` is empty, the testimonial section renders a heavy dashed `border-2 border-dashed border-amber-400` TODO panel with three skeleton quote slots, each showing `Tên phụ huynh: TODO` / `Cơ sở: TODO`. This is intentional design, not a temporary hack. With real quotes present, it switches to filled cards automatically.
- Error pages reuse the same cream + navy + amber vocabulary: the 404 shows a navy chessboard motif and a filled amber or navy return button.

**Modal**

- `fixed inset-0 z-50 bg-brand-950/85 backdrop-blur-sm`, content `bg-white rounded-card max-w-xl w-full p-6 md:p-8 shadow-2xl my-8`. Close button top-right, `active:scale-95`, hover `bg-slate-100`.

**Sticky chrome**

- Header: `sticky top-0 z-40 h-16 bg-cream/95 backdrop-blur-md border-b border-slate-200/80`. Active nav item is marked with an underline in `decoration-amber-500 decoration-2` — never a filled pill.
- Mobile: a bottom contact bar sits below the fold limit with `pb-[calc(4.75rem+env(safe-area-inset-bottom))]` clearance on the page. Every floating bar must respect safe-area insets.
- Skip-to-content link is always present and becomes visible on focus.

---

## 5. Layout Principles

- Max-width containment: `max-w-6xl mx-auto px-4` for marketing sections. Document pages narrow to `max-w-3xl`.
- **Grid-first.** Use CSS Grid with the 12-column or fractional track syntax. Never `calc()` percentage math, never flexbox width games.
- Section rhythm: `py-16` for standard sections, `py-20` for the pricing band, `py-14 md:py-20` for the hero. Sections alternate `bg-cream` / `bg-white`, separated by `border-t border-slate-200`.
- **Asymmetry is required.** Hero is `md:grid-cols-12` split 7/5. Operating points run `lg:grid-cols-12` as 7-5-5-7. Branch grid is `sm:grid-cols-2 lg:grid-cols-4` bento with a 2-column lead card and a 2-column navy hotline card closing the row. The photo gallery is a two-column offset collage, not an equal grid.
- Banned: three equal cards in a row; centered hero (this is a variance-6 system, the hero stays left-aligned with the board island on the right).
- Even centered headings are paired with a left-aligned eyebrow or a stat row so the composition never reads as a flat stack.
- Depth layers sit behind content on `-z-10` with `pointer-events-none` and an `aria-hidden` attribute, and must fade out before the section edge (`mask-image: linear-gradient(to bottom, #000 58%, transparent 100%)`) so no hard band appears where the next section begins.
- Full-height surfaces use `min-h-dvh` (or `min-h-[100dvh]`), never `h-screen`.

---

## 6. Motion & Interaction

Motion is CSS-native and restrained. There is no spring-physics library on this site, and
none should be introduced for a marketing page.

- Transitions: `transition` at Tailwind default (~150ms) on color, border, shadow, and transform. Easing stays default ease; no bounce, no overshoot.
- Tactile feedback is the core interaction language: `active:scale-[0.98]` on buttons, `active:scale-95` on icon buttons, `group-hover:translate-x-0.5` on arrows.
- The only looping animation is `animate-pulse` on a blocking form error, always paired with `motion-reduce:animate-none`.
- Board-notation texture, the perspective chessboard plane and hover states must not animate on `top`, `left`, `width` or `height`. Transform and opacity only.
- The decorative grain runs on a fixed pseudo-element/absolute layer at 4.5% opacity — never on a scrolling wrapper.
- Cheap interactive islands (puzzle board, curriculum explorer, pricing checkout) are hydrated individually; decoration stays server-rendered.
- Honor `prefers-reduced-motion`: `scroll-behavior: auto` replaces smooth scroll, and any added animation must be gated.

---

## 7. Responsive Rules

- **Mobile-first collapse below 768px.** All multi-column layouts become a single column. No exceptions.
- No horizontal scroll at any viewport width — a scrollbar on mobile is a failure, not a nit. Long values (`48 Buổi`, account numbers) get `whitespace-nowrap` plus a track that can absorb them.
- Headlines scale, they do not shrink-wrap: `text-5xl` → `lg:text-7xl` → `xl:text-8xl`. Body text never drops below `1rem` (`text-sm` only for metadata and labels, never for a paragraph a parent must read).
- Touch targets: minimum 44px. Header icon button is `h-11 w-11`; mobile menu rows are `min-h-[3rem]`.
- Desktop nav collapses below `md` into a toggle menu that closes on Escape, on outside click, and on link selection, and re-syncs `aria-expanded` when the viewport crosses 768px.
- The branch grid goes 1 → 2 (`sm`) → 4-bento (`lg`). The operating-points grid goes 1 → 2 (`sm`) → 12-column asymmetric (`lg`); the horizontal icon-beside-text layout switches on only at `lg`, when the card is genuinely wide.
- Hero board island stacks below the headline on mobile and keeps its shadow ground plane.
- Section gaps compress via `py-14 md:py-20` patterns; padding never collapses to zero.
- Anchors use `scroll-padding-top: 5rem` to clear the 4rem sticky header.

---

## 8. Copy & Content Rules

- Vietnamese, with correct diacritics, throughout. Never ship diacritic-stripped or English placeholder text.
- Tone: plain, factual, addressing a parent. Explain operational reality (session counts, schedules, branch addresses, how to pay) instead of praising the school.
- Real numbers only: 72 sessions, 48 sessions, 60–90 minutes, 5 campuses, two hotlines. Prices are VND amounts as integers.
- Banned wording: "Elevate", "Seamless", "Unleash", "Next-Gen", "transform your child", "world-class", "best in Vietnam", self-awarded superlatives, invented awards, invented alumni outcomes.
- Banned filler UI text: "Scroll to explore", "Swipe down", "Learn more" as a lonely secondary link, bouncing chevrons, scroll arrows.
- No generic placeholder identities: no "John Doe", "Acme", "Nexus", "Lorem ipsum" in visible copy. Placeholder slots are labeled TODO in Vietnamese instead.
- Brand strings are fixed: name `GLOBAL CHESS`, `Một nước đi, mở tư duy`, `Học cờ rèn tư duy vững tương lai!`.
- Every interactive element needs an accessible name; icon-only buttons carry an `aria-label` in Vietnamese.

---

## 9. Anti-Patterns (Banned)

- No emojis anywhere in the UI.
- No `Inter` font; no generic serif (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`).
- No pure black `#000000` — use `slate-950`, `brand-950`, or `brand-800`.
- No second accent color. Amber is the only accent; navy and cream are structure.
- No purple/blue neon, no gradient button fills, no outer glow shadows.
- No fabric gradient text on large headers — headline color may differentiate lines (slate-900 / amber-600), nothing shinier.
- No custom mouse cursors.
- No overlapping elements; no absolutely-positioned content stacking on top of text.
- No three-equal-card rows; no centered hero.
- No stock or AI photography of classrooms or children, and no fake image links. Only real center photos with parents' consent, in the `#hinh-anh` gallery; never invent captions, branch names or results. Where imagery is missing, draw geometry (chessboard plane, mesh, grain) or leave a labeled TODO.
- No fabricated testimonials, ratings, student counts, or awards.
- No `h-screen`; no `calc()` percentage layout hacks; no animating layout properties.
- No emoji, no decorative confetti, no bouncing arrows.
- No English placeholder copy, and no Vietnamese copy without diacritics.

---

## 10. Token Reference (authoritative values)

```
--font-sans:     "Be Vietnam Pro", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif
--font-display:  "Bricolage Grotesque", "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif

--color-brand-50:  #eef5fb   --color-brand-100: #d9e8f5   --color-brand-200: #b6d0e8
--color-brand-300: #8fb4d6   --color-brand-400: #5b8ec0   --color-brand-500: #2f6ba3
--color-brand-600: #1f5285   --color-brand-700: #1b4a76   --color-brand-800: #184268
--color-brand-900: #123350   --color-brand-950: #0b2136

--color-cream: #faf8f5

--radius-card:    1.125rem
--radius-control: 0.75rem

--shadow-soft:   0 1px 2px rgb(68 55 43 / 0.04), 0 8px 24px -12px rgb(68 55 43 / 0.16)
--shadow-lifted: 0 2px 4px rgb(68 55 43 / 0.05), 0 20px 44px -16px rgb(68 55 43 / 0.22)

Accent:  amber-500 #f59e0b  (button fill, focus ring)
         amber-700 #b45309  (text/icons on light)
         amber-400 #fbbf24  (text/icons on navy)
Status:  emerald-600 #059669 / emerald-700 #047857
Neutral: slate-900 #0f172a, slate-600 #475569, slate-200 #e2e8f0
Focus:   outline 2px solid var(--color-amber-500), offset 2px
```
