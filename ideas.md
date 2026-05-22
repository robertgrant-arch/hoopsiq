# HoopsIQ Docs — Design Brainstorm

<response>
<text>
**Direction: "Stripe Docs × Linear × Courtside"**

Design Movement: Precision technical-documentation aesthetic (Stripe Docs, Linear Method, Vercel Guide) fused with an athletic, half-court energy. Treat the docs like an engineering product — fast, dense, keyboard-first — but brand it with the HoopsIQ amber accent and Oswald display type established in the design-system spec.

Core Principles:
1. Three-column layout: persistent left sidebar (chapter tree), center prose column with 720px max-width, right in-page TOC anchor list.
2. Dense, respectful typography — body text Inter 15.5px / 1.65 line-height, generous rhythm but never breezy.
3. Amber (#F59E0B) used exclusively for active state, link hover underline, and "currently viewing" bookmark. Indigo (#6D28D9) reserved for premium/marketplace references.
4. Zero gradients, zero glassmorphism — just flat zinc-950 dark surface, a hairline 1px `oklch(1 0 0 / 8%)` border, and careful type hierarchy.

Color Philosophy: Dark-first canvas (zinc-950) evoking a coach's late-night film session, with high-contrast off-white prose (zinc-100) and a single amber accent. It reads as a serious engineering artifact, not a marketing brochure.

Layout Paradigm: Fixed three-column docs shell. Left sidebar is the canonical table of contents organized into five chapters (Foundation, Product, Experiences, Commerce & Growth, Platform Ops). Main column is the rendered markdown. Right column is the auto-generated H2 in-page TOC with a scroll-spy active indicator.

Signature Elements:
- Monospace "PROMPT 01 → 18" pill in the top-right of each doc page (JetBrains Mono, zinc-400 on zinc-900).
- Amber bookmark bar on the active sidebar entry (3px left border).
- Inline `code` in amber-on-zinc-900 chips, code blocks in a dedicated zinc-900 panel with a copy button.

Interaction Philosophy: Keyboard-first. ⌘K command palette opens a fuzzy search across all 17 docs. Arrow keys navigate sidebar. "E" opens the edit-in-markdown drawer. Clicking any H2 anchors the URL hash.

Animation: Subtle. 150ms cubic-bezier(0.2, 0.8, 0.2, 1) on sidebar hover, active-state transitions, and page fade-ins. No scroll-jacking, no parallax, no Lottie.

Typography System:
- Display: Oswald 600 (uppercase, wide tracking, used for H1 page titles and sidebar chapter headers)
- Body: Inter 400/500 (15.5px body, 17px H3, 22px H2, 36px H1 uppercase)
- Mono: JetBrains Mono (inline code, prompt pill, URL paths)
</text>
<probability>0.07</probability>
</response>

---

**Selected: Direction 1 — "Stripe Docs × Linear × Courtside."**

This direction gives the 17 specs the gravity and scan-ability they deserve. It treats docs as a product, not a landing page. Amber + Oswald keeps the HoopsIQ brand signature without slipping into marketing-site theatrics.
