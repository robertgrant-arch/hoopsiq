# HoopsIQ: Marketing Site Architecture & Scaffolding

This document outlines the public marketing presence for HoopsIQ. It translates the premium, cinematic brand energy into a high-converting web surface, differentiating the value proposition for athletes, coaches, teams, and experts.

## 1. Messaging Architecture

### Value Proposition
**The unified basketball development operating system.**
HoopsIQ replaces the fragmented mess of YouTube drills, text message assignments, and scattered film links with a single, elite platform. It is MasterClass-quality instruction meets Peloton-level momentum, built on a professional coaching foundation.

### Audience-Specific Hooks
*   **Athletes:** "Stop guessing. Execute daily WODs, get AI feedback on your mechanics, and train with the world's best."
*   **Coaches:** "Your entire program, centralized. Assign film, telestrate breakdowns, build animated playbooks, and track compliance instantly."
*   **Teams/Orgs:** "Standardize excellence. Equip every coach with elite tools and give every athlete a 50% discount on their personal development."
*   **Experts:** "Monetize your mastery. Sell courses, host live clinics, and provide 1:1 film reviews to a captive, global audience of serious players."

### Objection Handling
*   *Objection:* "It's too expensive for my high school team."
    *   *Rebuttal:* The Team Plan is a flat rate for coaches. Athletes on your roster automatically unlock a 50% lifetime discount on their individual Player App subscription.
*   *Objection:* "AI can't replace a real coach."
    *   *Rebuttal:* It doesn't. AI handles the baseline mechanics (posture, shot angle) so coaches can focus on high-level basketball IQ and situational decision-making.

## 2. Page-by-Page Wireframes (Real Copy)

### `/` (Homepage)
*   **Cinematic Hero:** Full-bleed dark video background (Mux playlist). Slow-motion, high-contrast shot of a player executing a drill, overlaid with a coach's telestration.
    *   *Headline:* THE UNIFIED BASKETBALL IQ.
    *   *Subhead:* Elite instruction. AI-powered mechanics. Professional film tools. One platform to build your game or run your program.
    *   *Dual CTA:* [ Start Training (Primary) ] [ Explore Coach HQ (Secondary) ]
*   **Audience Pivot:** Three massive `MediaCard` blocks side-by-side.
    *   *For Players:* "Execute Daily WODs. Track XP. Level Up."
    *   *For Coaches:* "Assign Film. Draw Plays. Demand Accountability."
    *   *For Experts:* "Teach the World. Build Your Business."
*   **Feature Split (AI Feedback):** Left: Video of a jump shot with AI skeleton overlay. Right: "Don't just rep. Rep right. Our AI engine analyzes your shot arc, base width, and release point in seconds."
*   **Live Class Teaser:** A horizontal scrolling shelf of `ClassCard`s showing upcoming sessions. "Train live with NBA trainers and Division 1 coaches."

### `/players`
*   **Hero:** "Your Daily Blueprint for Greatness."
*   **Feature Grid:**
    *   *Daily WODs:* "Wake up. Open the app. Execute the day's program."
    *   *AI Mechanics:* "Upload your film. Get instant, objective feedback on your form."
    *   *Gamification:* "Build your streak. Earn XP. Unlock elite skill tracks."
*   **Price Anchor:** "Player Core: $19.99/mo. *Play for a HoopsIQ Team? Get 50% off for life.*"

### `/coaches`
*   **Hero:** "The Command Center for Elite Programs."
*   **Feature Showcase:**
    *   *Film Room:* "Upload game tape. Add timestamped comments. Draw directly on the frame."
    *   *Playbook Studio:* "Ditch the whiteboard marker. Build animated plays and test your roster's comprehension with quizzes."
    *   *Compliance Dashboard:* "Know exactly who watched the film and who skipped the workout."
*   **CTA:** [ Start Your 14-Day Coach Trial ]

### `/teams`
*   **Hero:** "Standardize Excellence Across Your Organization."
*   **Value Prop:** "Equip your entire coaching staff with professional tools, and give every athlete in your program a massive advantage."
*   **The 50% Rule:** A visual diagram showing how buying a Team Plan instantly triggers a 50% discount for every athlete on the roster.
*   **CTA:** [ Request a Demo ] (Opens a lead capture form).

### `/experts`
*   **Hero:** "Monetize Your Basketball Mind."
*   **Showcase:** A grid of `ExpertProfileHero` cards featuring current top earners.
*   **How it Works:** "1. Apply and verify your credentials. 2. Set your rates for 1:1 film reviews and live classes. 3. Get paid automatically via Stripe."
*   **CTA:** [ Apply to Teach ]

### `/pricing`
*   **Matrix:** Three distinct columns (Player Core, Coach Core, Team Pro).
*   **Add-Ons:** A section below for "Premium Expert Content (Priced a la carte)".
*   **FAQ Drawer:** Accordions addressing the team discount, cancellation policies, and parent-child billing.

### `/live`
*   **Hero:** "The Global Hardwood. Live."
*   **Grid:** `LiveClassPoster` components. Filterable by "Upcoming", "Free for Members", "Premium".
*   **Countdown:** A prominent ticker for the next major MasterClass event.

## 3. Conversion Strategy

*   **Primary CTAs:** Always solid Amber (`bg-primary`). Direct to the Clerk sign-up flow with role pre-selection.
*   **Secondary CTAs:** Zinc-800 (`bg-secondary`). Direct to feature deep-dives or demo requests.
*   **Micro-Conversions:**
    *   *Join Waitlist:* On `/live` for upcoming premium classes.
    *   *Download Playbook:* On `/coaches`, a lead-magnet offering a free PDF of animated plays in exchange for an email.
    *   *Parent Link:* On `/pricing`, a clear path for parents to create an account and buy a sub for their child without cluttering their own profile.

## 4. Component Structure (Marketing)

The marketing site relies on a set of reusable Server Components built on top of the design system.

*   `CinematicHero`: A full-width section taking a `videoUrl` (Mux MP4 fallback), a massive `headline` (Oswald), `subhead`, and `children` (for CTAs). It applies the `bg-black/60` gradient overlay.
*   `FeatureSplit`: A standard alternating left/right layout. Takes `media` (video/image) and `content`. Uses `motion.div` for scroll-linked fade-ins.
*   `AudiencePivot`: A 3-column grid specifically for the Player/Coach/Expert routing on the homepage. Uses `MediaCard` variants.
*   `PricingMatrix`: A highly structured table component. Takes a JSON array of plans and features, rendering checkmarks or limits. Includes the toggle for Monthly/Annual.
*   `ExpertShowcase`: A horizontal scrolling carousel of `ExpertProfileHero` cards.

## 5. High-Fidelity Frontend Scaffolding (Next.js)

Below is the foundational code for the `(marketing)` route group, establishing the layout shell and the cinematic homepage.

### `src/app/(marketing)/layout.tsx`

```tsx
import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HoopsLogo } from "@/components/brand/logo";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground dark">
      {/* Forced dark mode for the marketing shell to maintain cinematic feel */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 blur-glass">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <HoopsLogo className="h-8 w-8 text-primary" />
            <span className="font-heading text-xl tracking-tight uppercase">HoopsIQ</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/players" className="hover:text-white transition-colors">Players</Link>
            <Link href="/coaches" className="hover:text-white transition-colors">Coaches</Link>
            <Link href="/teams" className="hover:text-white transition-colors">Teams</Link>
            <Link href="/experts" className="hover:text-white transition-colors">Experts</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="default" className="shadow-glow-primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-white/10 bg-zinc-950 py-12">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-muted-foreground">
          <div>
            <h4 className="font-heading text-white text-lg mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/players" className="hover:text-primary">Player App</Link></li>
              <li><Link href="/coaches" className="hover:text-primary">Coach HQ</Link></li>
              <li><Link href="/live" className="hover:text-primary">Live Classes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-white text-lg mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact Sales</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-white text-lg mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/legal/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/legal/youth" className="hover:text-primary text-primary/80">Youth Privacy (COPPA)</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

### `src/app/(marketing)/page.tsx`

```tsx
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CinematicHero } from "@/components/marketing/cinematic-hero";
import { AudiencePivot } from "@/components/marketing/audience-pivot";
import { FeatureSplit } from "@/components/marketing/feature-split";

export const metadata: Metadata = {
  title: "HoopsIQ | The Unified Basketball Development OS",
  description: "Elite instruction. AI-powered mechanics. Professional film tools. One platform to build your game or run your program.",
};

export default function HomePage() {
  return (
    <>
      <CinematicHero 
        videoUrl="https://stream.mux.com/YOUR_MUX_PLAYBACK_ID/high.mp4"
        headline="THE UNIFIED BASKETBALL IQ"
        subhead="Elite instruction. AI-powered mechanics. Professional film tools. One platform to build your game or run your program."
      >
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/sign-up?role=athlete">
            <Button size="lg" className="w-full sm:w-auto shadow-glow-primary text-lg">
              Start Training
            </Button>
          </Link>
          <Link href="/coaches">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg border border-white/20">
              Explore Coach HQ
            </Button>
          </Link>
        </div>
      </CinematicHero>

      <section className="py-24 container">
        <h2 className="text-center font-heading text-h2 mb-16 uppercase tracking-tight">
          Built for every level of the game
        </h2>
        <AudiencePivot />
      </section>

      <section className="py-24 bg-zinc-950 border-y border-white/5">
        <div className="container">
          <FeatureSplit 
            alignment="left"
            mediaType="video"
            mediaSrc="/assets/ai-demo.mp4"
            tagline="AI Mechanics Engine"
            headline="Don't just rep. Rep right."
            description="Our proprietary AI engine analyzes your shot arc, base width, and release point in seconds. Get objective feedback on your form before you build bad habits."
            ctaText="See how it works"
            ctaHref="/players#ai"
          />
        </div>
      </section>
    </>
  );
}
```

## 6. SEO & Metadata Strategy

HoopsIQ utilizes Next.js App Router's native Metadata API to ensure high visibility and rich social sharing cards.

### Metadata Patterns
*   **Title Template:** `%s | HoopsIQ`
*   **OG Image Pattern:** Dynamic Open Graph images generated via `@vercel/og`.
    *   *Default:* The HoopsIQ logo centered on a dark hardwood texture.
    *   *Expert Profile:* The expert's avatar on the left, their name and "HoopsIQ Expert" on the right.
    *   *Live Class:* The class title, date, and instructor avatar.

### JSON-LD Structured Data
JSON-LD is injected into the `<head>` of specific pages to secure rich snippets in Google search results.

*   **Homepage (`/`)**: `Organization` and `SoftwareApplication` schemas.
*   **Pricing (`/pricing`)**: `Product` schema with `offers` (prices and currencies).
*   **Live Classes (`/live/[id]`)**: `Event` schema (including `startDate`, `endDate`, `performer`, and `offers`).
*   **Expert Directory (`/experts/[id]`)**: `Person` schema.

*Example Next.js Implementation (`src/app/(marketing)/live/[id]/page.tsx`):*
```tsx
import Script from "next/script";

export default function LiveClassPage({ params }: { params: { id: string } }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "Advanced Pick & Roll Reads",
    "startDate": "2026-05-15T18:00:00-05:00",
    "performer": {
      "@type": "Person",
      "name": "Coach Smith"
    },
    "offers": {
      "@type": "Offer",
      "price": "25.00",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <Script
        id="json-ld-event"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Page Content */}
    </>
  );
}
```

## 7. Analytics & Measurement Plan

Measurement is focused on identifying which audience segment converts best and where drop-offs occur in the multi-step onboarding flows.

### Event Taxonomy
*   `marketing_view_pricing`: Triggered when the pricing matrix enters the viewport.
*   `marketing_click_cta`: Triggered on any primary/secondary CTA click. Properties: `target_role` (athlete, coach, team), `location` (hero, footer).
*   `marketing_play_video`: Triggered when the AI demo or a MasterClass trailer is played.
*   `marketing_lead_capture`: Triggered when a team requests a demo or downloads a playbook.

### UTM Conventions
*   `utm_source`: e.g., `instagram`, `tiktok`, `google`, `coach_referral`.
*   `utm_medium`: e.g., `paid_social`, `organic`, `email`.
*   `utm_campaign`: e.g., `summer_grind_2026`, `team_discount_launch`.

### A/B Test Hook Points
*   **Homepage Hero CTA:** Test `[ Start Training ]` vs. `[ See How It Works ]`.
*   **Pricing Page:** Test showing the Annual toggle by default vs. Monthly by default.

## 8. Legal & Trust Elements

Given the target demographic (youth athletes and institutional schools), the legal and trust surfaces are not an afterthought—they are a core conversion asset.

### Youth Privacy (COPPA) Surface
*   **Location:** `/legal/youth` (linked prominently in the footer and during athlete sign-up).
*   **Content:** Plain-English explanation of how HoopsIQ handles data for users under 13.
*   **Key Trust Points:**
    *   "We never sell athlete data."
    *   "Direct messaging between adults and minors is disabled; parents are always in the loop."
    *   "AI pose estimation data is anonymized and used strictly for personal feedback."

### Accessibility Statement
*   **Location:** Footer link.
*   **Content:** Commitment to WCAG 2.1 AA compliance. Highlights support for screen readers, keyboard navigation in Coach HQ, and the `prefers-reduced-motion` toggle.

### Terms & Conditions
*   **Location:** `/legal/terms`
*   **Content:** Standard SaaS terms, plus specific clauses for the Expert Marketplace (payout schedules, content ownership) and the Team 50% discount rules (revocation conditions).
