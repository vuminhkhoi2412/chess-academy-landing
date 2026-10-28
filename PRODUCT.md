# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Parents of children aged 4–12 in TP.HCM, most often browsing on a phone while comparing
chess classes near home. Their job: judge whether Global Chess is a serious, conveniently
located class for their child, then pick a campus and enrol. A secondary audience is the
centre's own staff, who read the same page for schedules, tuition and branch addresses, and
send it to parents over Zalo.

## Product Purpose

A single Vietnamese landing page for Global Chess, a chess centre with five TP.HCM campuses.
It exists to turn a browsing parent into an enrolled student: it explains the curriculum,
shows real classes, lists tuition per level, and collects an enrolment form for the chosen
class. Success means an enrolment submitted to the centre's Google Sheet so staff can call the
parent back — the page itself takes no payment.

## Positioning

A standardised curriculum system delivered consistently across five campuses: every level is
24 sessions with its own printed book and stated outcomes.
A neighbouring centre can copy the marketing, not the published level-by-level syllabus and
tuition grid.

## Operating Context

- Vietnamese-facing, TP.HCM only. Families choose a campus by district, then a weekly slot.
- Schedule slots: a weekday evening slot (Mon–Fri) and three weekend slots (Sat/Sun morning,
  afternoon, evening). The page states no clock times; none are in the code or the sources.
- Enrolment is a form on the page. It calculates an estimated tuition, then POSTs the answers
  to a Google Apps Script web app that appends one row to the centre's Google Sheet; the parent
  sees a confirmation that the centre will contact them soon. There is no payment of any kind,
  no account, no server of our own.
- Contact channels: two central hotlines and one Zalo number (0789.059.440, 0963.848.430,
  Zalo 0789059440), plus one direct phone per campus (listed on each branch card and in the
  schema.org `department` data).
- Five campuses, each with its own phone and Google Maps link in `BRANCHES`:
  811 Hậu Giang, P. Bình Phú (Q.6) · 55 Tên Lửa, P. An Lạc (Bình Tân) ·
  52 đường T6, P. Tây Thạnh (Tân Phú) · 152 Nguyễn Sơn, P. Phú Thọ Hoà (Tân Phú) ·
  26 Manhattan, Vinhomes Grand Park, P. Long Bình (TP. Thủ Đức).
- The page is also the destination for the centre's Facebook/Zalo links, so it must read
  correctly on a phone with no app installed.
- Global Chess also teaches robotics at the same campuses, but no robotics curriculum,
  pricing or schedule has been supplied. Only chess may be designed for until the centre
  provides those details.

## Capabilities and Constraints

- Scope today: one landing page plus a 404, a privacy policy and a terms page. No blog, no
  per-course or per-campus pages. Multi-page expansion is not planned yet.
- Static Astro 7 build with three hydrated React islands (puzzle board, curriculum explorer,
  pricing + checkout); Tailwind CSS 4 via Vite; intended for Vercel. No server, no database.
- Content is data-driven: `src/data/courses.ts` holds brand strings, branches (address, phone,
  Maps link), the three curriculum programmes, the seven tuition levels, the interactive puzzle, parent
  quotes and FAQs.
- Curriculum: Happy Chess 72 sessions (3 levels × 24), Global Chess Sơ cấp 48 (2 × 24),
  Global Chess Trung cấp 48 (2 × 24). Sessions run 60–90 minutes. Happy Chess takes children
  from age 4; Sơ cấp and Trung cấp from age 7. Placement follows actual ability, not age.
- Tuition is official and locked by tests: seven levels (HC1–HC3, SC1–SC2, TC1–TC2) each with
  a 12-session group price, a 24-session group price, and per-session 1:1 and 1:2 rates.
  Books (50.000đ / 90.000đ), uniform (150.000đ), tournament set (250.000đ) and clock
  (400.000đ) are sold separately — tuition does not include them. Global Chess 9–10
  (Chuyên nghiệp) is priced by title and is deliberately absent from the form.
- Changing tuition means editing `TUITION_LEVELS` and `tests/tuition.test.mjs` together;
  changing the puzzle in `INTERACTIVE_PUZZLE` means re-running `npm test`.
- The build fails when `PUBLIC_GOOGLE_SHEETS_ENDPOINT` is unset, so a dead form is never
  deployed. `PUBLIC_*` values are inlined into the browser bundle, so the endpoint URL is
  visible to anyone; a honeypot field (`_hp`) deflects naive bots, and the sheet owner deletes
  junk rows. The Apps Script source is `google-apps-script/Code.gs`; setup is in
  `docs/google-sheets-setup.md`.
- The production domain is still unconfirmed (`site` in `astro.config.mjs` is
  `https://globalchess.vn`, marked TODO);
  canonical URLs, `robots.txt`, `og:url` and the sitemap all derive from it.
- Vietnamese only, with correct diacritics everywhere. Fonts must ship a Vietnamese subset.

## Brand Commitments

- Name: `GLOBAL CHESS`. Fixed lines: `Một nước đi, mở tư duy` and
  `Học cờ rèn tư duy vững tương lai!`.
- Voice: plain, factual, addressed to a parent. Explain operational reality — session counts,
  schedules, addresses, how to pay — instead of praising the school. No self-awarded
  superlatives, no "elevate/seamless/world-class", no invented awards or alumni outcomes.
- The logo is the real centre mark (shield); source file is `assets/logo.jpg`, never published
  as-is. This is the only brand mark; no new logo concepts.
- Real photography only: the five classroom photos with parent consent (gallery) and one real
  photo per campus (branch cards), never stock or AI images of children or classrooms.
  Consent is recorded only for the five gallery photos; the branch photos have no consent
  note yet.

## Evidence on Hand

- `assets/nguon/bang-hoc-phi-global-chess.pdf` — official tuition sheet; the only price source.
- `docs/lo_trinh_hoc.md` — the centre's own curriculum document (levels, lessons, outcomes).
- `assets/nguon/trichdan.txt` — three real parent quotes, used verbatim with the child's first
  name and branch label; do not edit, extend or reword them.
- `assets/nguon/hinh-anh/` — five original photos plus `NGUON.md` recording Drive IDs and the
  consent confirmation dated 2026-10-22; cropped copies live in `src/assets/images/`.
- `src/assets/images/branch_images/` — one photo per campus, shown on the branch cards.
  Their source and consent are not documented.
- `assets/logo.jpg` — source logo (920×813, white background, no alpha).
- Absent, and therefore not to be fabricated: student counts, ratings or review scores,
  awards or tournament results, teacher/coach bios or credentials, campus exterior photos,
  usable horizontal video, online reviews, and any robotics material.

## Product Principles

1. **Verifiable facts or a labelled TODO.** Every number, quote and address traces to a source
   file the centre supplied. Where truth is missing, show an explicit Vietnamese TODO block;
   never a plausible placeholder, stock photo or invented statistic.
2. **Operational clarity beats persuasion.** A parent decides with tuition, session count,
   schedule, address and enrolment steps. Superlatives are treated as defects.
3. **The curriculum is the proof.** Depth of syllabus and outcome per level carries the
   argument; imagery and motion support it, never replace it.
4. **One page, one decision.** The page stays a single linear path from "is this for my child"
   to a filled enrolment form; extra pages are added only when asked.
5. **The parent's phone is the real viewport.** Every change must survive a mid-range Android
   on mobile data, in Vietnamese, with tap targets a parent can hit.

## Accessibility & Inclusion

No formal accessibility standard has been confirmed. The shipped page already assumes
keyboard use (skip link, visible focus, Escape-closing mobile menu) and 44px minimum touch
targets; future work must not regress that. Vietnamese diacritics and readable type sizes for
parents matter more than decorative polish.
