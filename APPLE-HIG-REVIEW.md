# Apple HIG review: Global Chess Academy landing page

Reviewed 2026-10-28 against the local Apple HIG references (`accessibility.md`, `color.md`, `typography.md`, `branding.md`, `motion.md`, `entering-data.md`, `text-fields.md`, `design-principles.md`). No files were changed except this one.

## Scope and limits

- **This is a web page** (Astro + React islands, Tailwind, Vietnamese). Apple's *platform conventions* (tab bar, toolbar, sheets, Liquid Glass, iPhone Duo) do not apply. What applies is the principles plus the foundations: accessibility, color, typography, layout, motion, writing, data entry.
- **Reviewed from source**, not from screenshots: `index.astro`, `Layout.astro`, `SiteHeader`, `SiteFooter`, `MobileContactBar`, `global.css`, and the form/modal/lightbox code. `CurriculumExplorer.tsx` and the pricing rows in `PricingAndCheckout.tsx` were only scanned, not read line by line.
- **Contrast ratios are computed**, but from Tailwind's hex approximations (Tailwind v4 defines these colors in oklch, so real values can differ by a small amount). Anything within about 0.1 of a threshold is marked "borderline".
- Apple's "pt" is treated as roughly equal to a CSS px.
- Not tested in a browser: Vietnamese text at 200% zoom, a screen reader pass, keyboard-only pass.

## Summary

**Rating: Good.** Nothing breaks the accessibility floor outright. The page has a real point of view: chessboard geometry, "move" buttons (label left, destination square right), an interactive puzzle, and real consented photos. The craft is carried by the interactive puzzle in the hero and the move-style buttons, and that suits the product. The weaknesses are small contrast and headroom misses (one borderline fail, one weak focus ring), amber used for too many jobs, no support for dark mode or other display preferences, and some naming/capitalization inconsistency in the copy.

No Critical findings. Four High, the rest Medium/Low.

## Critical

None found.

## Improvements

### High

**H1. The focus ring is only 2.0:1 against the page.**
- **What**: `:focus-visible` is `2px solid amber-500` (`#f59e0b`). On cream (`#faf8f5`) that is **2.03:1**; on white **2.15:1**. It is the only keyboard-focus indicator for the whole site (`global.css`, base layer).
- **Why**: `accessibility.md › Color and effects`: "Convey information with more than color alone", and the contrast table asks 3:1 for anything non-text-and-large. A focus ring on a light surface at about 2:1 is easy to lose, and keyboard users depend on it. (The 3:1 for UI components is WCAG 1.4.11, my addition; the HIG table only lists text.)
- **Fix**: use a ring that clears 3:1 on both cream and white, for example `brand-800` (`#184268`, about 10:1) or `amber-700` (`#b45309`, 4.7:1), with `outline-offset: 2px`. On navy sections keep amber-400 (6.2:1 on `#184268`). Do that with one `:focus-visible` rule plus a navy-section override.

**H2. Small gray text on cream drops just under 4.5:1.**
- **What**: the gallery consent note (`index.astro:428`) is `text-xs text-slate-500` (12 px) on the cream `#hinh-anh` section: **4.49:1**, borderline fail. The same color passes on white (4.76:1), so it is a section-background mismatch rather than a wrong token. Other `slate-500` text sits on white (modal labels, hotline text) or on a background I did not verify (`CurriculumExplorer.tsx:184, 219`).
- **Why**: `accessibility.md › Color and effects`: text up to 17 pt needs 4.5:1.
- **Fix**: use `text-slate-600` (7.15:1 on cream) for any gray body/metadata text that can land on cream. Simplest rule: `slate-500` is allowed only on `#fff`.

**H3. Amber carries too many jobs.**
- **What**: amber-500/600/700/400 is used for the primary CTA fill, the focus ring, every section eyebrow and its dash, the H1's second line, FAQ icons, map/phone icons, the "most popular" ribbon, and the hero stat row accents. `DESIGN.md` says "one accent only", which is true of the hue, but the *roles* are not one: interactive, decorative, emphasis, and status all share it.
- **Why**: `branding.md › Best practices`: "Apply your app's accent color judiciously. Using your brand color too broadly can overwhelm your interface and dilute its impact … use it intentionally for primary actions or status indicators". Also `color.md`: "Avoid using the same color to mean different things".
- **Fix**: reserve amber for (1) the primary action and (2) the "most popular / selected" state. Make eyebrows `slate-600` or `brand-800`, keep the dash if you like the tick, and drop amber from the FAQ and map/phone icons (use `slate-500`/`brand-700`). Amber then reads as "do this" again.

**H4. No answer for dark mode or the other display preferences.**
- **What**: `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-transparency` and `forced-colors` appear **0 times** in `src/`. Reduced motion is handled well (see What works). `backdrop-blur-md` on the sticky header and bottom contact bar has no reduced-transparency fallback, and neither has a dark appearance. `<meta name="theme-color">` is a single navy value.
- **Why**: `dark-mode.md` and `accessibility.md`: people expect the interface to follow their appearance and contrast settings. For a landing page aimed at parents on phones, many will browse in dark mode at night (evening classes, evening browsing).
- **Fix**, in this order: (1) `@media (prefers-reduced-transparency: reduce)` to make the header/bar solid; (2) `@media (prefers-contrast: more)` to darken `slate-500/600` text and thicken borders; (3) a dark palette through the existing tokens (`--color-cream` and brand scale are already variables) plus `color-scheme: light dark`. (3) is the biggest job; it is fine to ship (1) and (2) first and say dark mode is deferred.

### Medium

**M1. Text size is small and partly fixed in px.**
- **What**: body copy is 16 px (`text-base`), card/meta text is 14 px (`text-sm`), and a lot of supporting text is 12 px (`text-xs`): hero stat labels, top bar, field errors, "Đã nhận", footer, gallery note. Five sizes are fixed in px (`text-[11px]` ×2, `[13px]`, `[15px]` ×2), which ignore the browser's font-size setting; the rest is rem and scales.
- **Why**: `typography.md › Platform considerations`: default 17 pt, minimum 11 pt on iOS. Nothing is below the minimum (the two 11 px items sit exactly on it), but 12 px is thin for the main audience, parents.
- **Fix**: move the five px values to rem; raise `text-xs` content that parents must read (field errors, stat labels, consent note) to `text-sm`; keep 12 px only for truly secondary tags.

**M2. Form errors appear only after submit.**
- **What**: `handleSubmit` sets `nameError`/`parentError`/`phoneError`; there is no blur/change validation. The phone field has `type="tel"` and `inputMode="tel"`, which is good, and `autoComplete` is present (5 uses).
- **Why**: `entering-data.md`: "Dynamically validate field values … verify values as soon as people enter them".
- **Fix**: validate the phone on blur (digits count, `0` prefix) and clear each error on change. Keep `role="alert"` and `aria-describedby` as they are. Also consider 14 px for error text instead of 12 px.

**M3. The main call to action does not do what it says.**
- **What**: "Đăng ký tư vấn" (hero, header, mobile menu) scrolls to `#pricing`, not to a form. Branch cards say "Chọn cơ sở này" and also go to `#pricing`; the nav says "Đăng ký & học phí"; the dialog is titled "Đăng ký cơ sở & khung giờ học". Four names for one flow.
- **Why**: `writing.md`: labels should say what happens, and an action should keep one name through the flow.
- **Fix**: pick one verb for the whole path. For example every entry point says "Đăng ký học thử" (or whatever the real offer is), and the dialog title repeats it. If the CTA really is a consultation request, open the dialog directly instead of scrolling past the price list.

**M4. Capitalization is mixed.**
- **What**: hero uses Title Case ("Một Nước Đi, Mở Tư Duy", "48 Buổi", "5 Địa Điểm"); section titles and buttons use sentence case ("Hệ thống các cơ sở", "Đăng ký tư vấn"). Normal Vietnamese practice is sentence case.
- **Why**: `writing.md`: apply one capitalization convention consistently (the HIG itself does not rule on Vietnamese; this one is my judgment).
- **Fix**: sentence case everywhere ("Một nước đi, mở tư duy", "48 buổi", "5 địa điểm"), or keep Title Case only for the H1 as a deliberate brand moment.

**M5. Small pointer targets in the footer and document pages.**
- **What**: footer links are `min-h-11` on mobile but `md:min-h-0` on desktop, at 12 px, so the hit area is roughly 16 px tall. "Về trang chủ" on the three document pages (`px-2 py-1.5`, 14 px) is about 32 px tall. Everything else I checked is 44 px or larger (menu toggle, bottom bar, phone links, FAQ summaries, lightbox close).
- **Why**: `accessibility.md › Controls`: desktop default 28×28, minimum 20×20; mobile default 44×44.
- **Fix**: keep `min-h-7` (28 px) on desktop footer links and `py-2.5` on "Về trang chủ".

**M6. The chat-bubble testimonials carry a fake delivery receipt.**
- **What**: each quote ends with a double-tick and "Đã nhận". It's a UI metaphor that says nothing true about the content, and it adds a 12 px line per card.
- **Why**: design-principles › Simplicity ("has every element earned its place?") and the page's own rule in `DESIGN.md` that nothing false may be invented. The bubble itself is a fair framing; the receipt is the accessory.
- **Fix**: remove the "Đã nhận" line. If the chat metaphor is to stay, let it carry real information instead, for example the branch or the month the parent wrote.

### Low

- **L1. H1 second line is borderline.** `amber-600` on cream is about 3.0:1. It passes the 3:1 large-text rule (the text is far above 18 pt) with no headroom, and the Tailwind approximation could put it under. Use `amber-700` (4.74:1) to be safe.
- **L2. `aria-current="true"` on in-page nav links** (`SiteHeader.astro`): use `aria-current="location"` for a section anchor.
- **L3. Hero stat row** (big bold number over small label) is a very common landing pattern. Fine, but it is the least specific thing on the page. The numbers are true and useful; consider setting them as a sentence ("48 buổi, 60–90 phút mỗi buổi, 5 cơ sở") if the row ever feels like filler.
- **L4. `white on emerald-600`** (Zalo confirmation button) is about 3.8:1. It passes only through the bold-text allowance (3:1 for bold); darken to `emerald-700` (5.5:1) for real headroom.
- **L5. Section eyebrows** repeat on every section (6+). Some add real information, some restate the heading. Keep the ones that do work.

## Craft notes

- **Thesis**: *a school for children that treats a lesson like a move.* Memorable thing: the playable chess puzzle in the hero, plus the "move" button shape (label left, destination square right).
- **Point of view**: real. This is not one of the three template looks: it is navy and cream, not cream+terracotta serif, not near-black with acid accent, not a hairline broadsheet. The palette comes from the logo (`#184268`).
- **Boldness is spent in two places** (the puzzle, the buttons) and the rest is quiet. Good. The hero board plane at 7.5% opacity is so faint it is mostly invisible; either commit to it or cut it.
- **Typography**: Bricolage Grotesque for headings with Be Vietnam Pro for body is a sensible pair with full Vietnamese coverage. `branding.md` says a brand font is fine if it stays legible at all sizes and respects text-size settings, which is the M1 point.
- **One thing to remove**: the "Đã nhận" receipt (M6). Then the amber on eyebrows and icons (H3).

## What works

- **Reduced motion is respected everywhere I looked**: smooth scroll, FAQ animation, hero entrance, puzzle motion, and `animate-pulse` all sit behind `prefers-reduced-motion`. Matches `motion.md › Best practices`: "Make motion optional".
- **Checkout dialog is excellent**: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape to close, focus returned to the trigger, a pinned header with a 44 px close button, a scrolling body, and focus moved to the result on success or error.
- **Lightbox** uses native `<dialog>`: Escape, focus return, backdrop click and a 44 px labelled close button for free. Without JS the photo link still opens the large image.
- **Landmarks and skip link**: `lang="vi"`, "Bỏ qua điều hướng" link, `<main id="main">`, labelled `<nav>`s, `scroll-padding-top` so anchors clear the sticky header. The viewport does not block zoom.
- **FAQ uses native `<details>`**, so keyboard, screen reader and find-in-page just work.
- **Touch targets**: nearly every control is `min-h-11` (44 px) or larger; the mobile contact bar respects `env(safe-area-inset-bottom)` and the body reserves room for it.
- **Errors are text, not color alone**: `aria-invalid`, `aria-describedby`, `role="alert"`.
- **Honest content**: real, consented photos with descriptive alt text; verbatim parent quotes; the page build fails if testimonials are empty.
- **Blur is used only on the functional layer** (sticky header, bottom bar), not on content, in line with `materials.md`.
- **Contrast of the core text is strong**: slate-600 on cream 7.15:1, amber-700 on cream 4.74:1, amber-400 on navy 6.23:1, brand-200 on navy 6.53:1.

## Suggested order of work (for the redesign phase)

1. **Accessibility**: H1 (focus ring), H2 (gray text on cream), L1/L4 (headroom).
2. **Preferences**: H4 (reduced transparency and increased contrast first, dark mode after).
3. **Clarity**: M3 (one name for the registration flow), M4 (capitalization), M2 (blur validation).
4. **Craft**: H3 (amber discipline), M6 (receipt), M1 (type sizes in rem), M5 (footer targets).
