# HoopsIQ: Design System & Component Library

This document defines the complete design system for HoopsIQ, translating the "MasterClass x Peloton x Elite Sports OS" vision into a rigorous, scalable front-end architecture. It covers brand energy, token systems, component patterns, and provides the foundational `tailwind.config.ts` and `globals.css` code.

## 1. Brand Energy & Direction

*   **Mood:** Cinematic, athletic, immersive, and relentless. It feels like stepping onto a polished hardwood court under stadium lights.
*   **Voice:** Direct, authoritative, motivating, and precise. No fluff. We use terms like "Execute," "Analyze," and "Dominate" rather than "Click here" or "Try this."
*   **Positioning:** A premium operating system for serious basketball development. It is credible enough for a Division 1 head coach, aspirational for a high school athlete, and professional enough for a parent paying for subscriptions. It is *never* childish or generic SaaS.
*   **Logo Direction:** A minimalist, sharp geometric monogram (e.g., an abstracted 'H' intersecting with a subtle court key or net arc). Monochromatic, heavily relying on negative space.
    *   *Inline SVG Concept:* `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16M20 4v16M4 12h16M12 4v16" stroke-linecap="round"/></svg>` (A sharp, brutalist 'H' that doubles as a half-court line).
*   **Favicon:** A stark, high-contrast version of the monogram. White on pitch black for dark mode, pitch black on white for light mode.

## 2. Color System

The color system relies on semantic HSL variables. It supports true dark and light modes, but the platform defaults to **Dark Mode** for the Player App and Film Room to maintain the cinematic MasterClass feel, while the Coach HQ and Admin dashboards offer a crisp Light Mode for data density and readability.

*   **Backgrounds:** Deep, rich blacks (not `#000000`, but `#09090B`) for dark mode; pure white for light mode.
*   **Court Accent (Primary):** A vibrant, high-energy Amber/Orange (`#F59E0B`), representing the basketball, the hardwood, and kinetic energy.
*   **Signature Accent (Premium):** A deep, electric Indigo/Violet (`#6D28D9`), used exclusively for the Expert Marketplace, premium content, and high-tier achievements.
*   **Semantics:**
    *   *Success:* Emerald green (`#10B981`) - used for completed WODs and streaks.
    *   *Warning:* Amber (`#F59E0B`) - shared with the primary accent.
    *   *Danger:* Rose red (`#EF4444`) - used for destructive actions (e.g., deleting a team).

## 3. Typography System

Typography creates the immediate visual distinction between "SaaS" and "Sports Performance."

*   **Display / Headings:** **Oswald** (or Tungsten/Teko). Condensed, uppercase-heavy, tightly tracked. Used for hero titles, numbers (XP, scores), and section headers. Gives the "stadium graphic" feel.
*   **UI / Body:** **Inter** (or Roboto). Highly legible, neutral, and precise. Used for all data tables, paragraphs, and functional UI.
*   **Mono:** **JetBrains Mono**. Used for telestration timestamps, code snippets (in Coach Education), and precise metrics.
*   **Type Scale (Responsive Clamps):**
    *   `text-hero`: `clamp(3rem, 8vw, 6rem)` - For massive cinematic titles.
    *   `text-h1`: `clamp(2rem, 5vw, 4rem)`
    *   `text-body`: `1rem` (16px base).

## 4. Spacing, Radius, Shadow, and Blur

*   **Radius:**
    *   `radius-sm` (4px): Checkboxes, tags, small functional inputs.
    *   `radius-md` (8px): Standard buttons, coach dashboard cards.
    *   `radius-lg` (12px): Player app media cards, dialogs.
    *   `radius-full` (9999px): Avatars, pill buttons.
*   **Shadows (Elevation):**
    *   `shadow-sm`: Subtle border-like shadow for inputs.
    *   `shadow-md`: Standard card elevation.
    *   `shadow-rise`: Hover state for interactive cards (lifts the element).
    *   `shadow-glow`: A soft, colored shadow (using the primary or premium accent) used for active live classes or unlocked achievements.
*   **Blur (Glassmorphism):**
    *   `blur-glass`: `backdrop-filter: blur(12px)` with a semi-transparent surface color. Used for sticky headers, video player controls, and telestration toolbars over moving film.

## 5. Elevation & Depth System

HoopsIQ avoids flat, lifeless UI but also rejects cheesy 2010s gradients.
*   **Depth via Contrast:** In dark mode, depth is achieved by layering grays (e.g., `bg-zinc-950` base, `bg-zinc-900` card, `bg-zinc-800` hover).
*   **Spotlight Effect:** Premium cards (e.g., Expert profiles) use a subtle radial gradient mask on hover to simulate a stadium spotlight tracking the cursor.
*   **Glass Overlays:** Critical for the Film Room. UI controls must float above the video without obscuring the action, using `blur-glass` and `bg-black/40`.

## 6. Motion Principles

Motion must feel athletic: explosive starts, controlled decelerations.

*   **Easing Curves:**
    *   `ease-athletic`: `cubic-bezier(0.16, 1, 0.3, 1)` - Fast out, slow in. Used for modals, sheets, and card expansions.
    *   `ease-cinematic`: `cubic-bezier(0.4, 0, 0.2, 1)` - Smooth, dramatic. Used for page transitions and MasterClass-style hero reveals.
*   **Durations:**
    *   `duration-fast` (150ms): Hover states, toggles.
    *   `duration-base` (300ms): Modals, dropdowns.
    *   `duration-slow` (500ms+): Page transitions, achievement unlock ceremonies.
*   **Patterns:**
    *   *Scroll-Linked Reveals:* As athletes scroll their WOD, drills fade up and slightly in (`y: 20, opacity: 0`).
    *   *Tap Feedback:* Buttons slightly scale down (`scale: 0.97`) on press to feel tactile and responsive.

## 7. Component Inventory & Patterns

The component library is built on shadcn/ui, but heavily customized to match the brand energy. The inventory is divided into foundational, media, gamification, and coach tooling components.

### Foundational UI
*   **Button:** `primary` (Amber, bold text, slight inner shadow), `secondary` (Zinc-800, white text), `ghost` (transparent, hover:bg-zinc-800), `destructive` (Rose red), `premium` (Indigo gradient with a subtle pulse animation).
*   **Card & StatCard:** The primary container. StatCards feature a large, condensed number (Oswald) and a subtle trend indicator.
*   **Dialog & Sheet:** Dialogs are used for destructive confirmations. Sheets (side drawers) are used for complex forms like creating a workout or editing a profile, keeping the user in context.
*   **CommandMenu:** `Cmd+K` interface for power users (coaches and admins) to jump between athletes, teams, or settings instantly.
*   **DataTable:** Used in Coach HQ and Admin. Features sticky headers, sortable columns, and bulk-selection checkboxes.

### Media & Content
*   **MediaCard (MasterClass-style):** 16:9 aspect ratio, dark gradient overlay at the bottom, crisp white typography. The image zooms slightly on hover. Used for Courses and Drill Libraries.
*   **ClassCard (Peloton-style):** Square or portrait aspect ratio. Features the expert's avatar prominently, a live badge (if active), and a bold, condensed title. Used for Live Events and Replays.
*   **LiveStage & ReplayShelf:** The layout pattern for the Live Class viewing experience, prioritizing the video feed with a chat overlay and a shelf of related content below.

### Progress & Gamification
*   **ProgressRing & XPBar:** Visual indicators of daily effort. The ring fills with the primary Amber color, glowing slightly when complete.
*   **StreakFlame:** A small, animated SVG icon that ignites when a user hits a 3+ day streak.
*   **SkillTrackBadge & LevelBadge:** Hexagonal or shield-shaped tokens representing an athlete's current tier (e.g., "Varsity", "Elite").
*   **GraduationModal & ConfettiBurst:** A full-screen, high-energy overlay triggered when an athlete levels up or completes a major course.

### Coach Tooling
*   **RosterRow & AssignmentRow:** Dense, scannable list items showing athlete avatars, current status, and quick-action buttons (Assign, Review).
*   **FilmClipRow:** A timeline-style row showing a video thumbnail, duration, and markers indicating where telestration comments exist.
*   **ReviewCommentThread:** A sidebar component attached to the video player, listing timestamped feedback. Clicking a comment seeks the video to that exact frame.
*   **TelestrationCanvas & PlayDiagramToken:** The drawing surface overlaying the video, and the draggable icons (X's, O's, arrows) used in the Playbook Studio.
*   **CoachMetricTile:** A dense dashboard widget showing team compliance (e.g., "85% WOD Completion").

## 8. Dashboard Patterns

The layout rhythm and data density change based on the user's role and intent.

*   **Player "Today's Work" Home:** Low cognitive load. A massive hero section highlights the single most important action (the daily WOD). Below that, a horizontal scroll of streaks and recent achievements. The UI is dark, immersive, and focuses entirely on execution.
*   **Coach Compliance Home:** High data density. A light-mode (or high-contrast dark mode) table dominates the view. The layout rhythm is tabular, designed for rapid scanning of which athletes missed their assignments or need film reviews. Filters and bulk actions are pinned to the top.
*   **Expert Office Hours Home:** Split layout. The left column shows a calendar view of upcoming 1:1 bookings. The right column highlights pending course reviews and recent Stripe payouts. The tone is professional and business-focused.

## 9. Media Player Patterns

The media player is the core of the HoopsIQ experience, powered by Mux.

*   **Drill Demo:** A minimalist player embedded within the WOD flow. It loops automatically, has no timeline scrubber (to keep focus on execution), and features a large, central play/pause overlay.
*   **Live Class:** A full-bleed player. The UI chrome (chat, expert stats) floats above the video using `blur-glass`. Speed control is disabled.
*   **Film Room (Replay & Review):** The most complex player. It features chapter markers on the timeline (representing plays or coach comments). It includes a speed control toggle (0.5x, 1x, 2x), a split-screen compare mode (athlete vs. pro), and the crucial telestration overlay layer that captures drawing coordinates relative to the video frame.

## 10. Progress Visualization Styles

HoopsIQ uses distinct visual metaphors for different types of progression.

*   **Rings:** Used for daily, short-term goals (e.g., completing today's 30-minute program). They reset daily.
*   **Bars:** Used for linear, cumulative progression (e.g., XP toward the next Level).
*   **Constellations (Skill Trees):** Used for the `SkillTrack` domain. A web of interconnected nodes representing specific skills (e.g., "Weak Hand Finish" unlocks "Euro Step").
*   **Heatmaps:** Used in the Coach HQ to visualize team film watch tracking. A grid where rows are athletes, columns are assignments, and color intensity (Amber to Red) indicates completion percentage.

## 11. Gamification Principles

Gamification in HoopsIQ must feel elite and motivating, avoiding the childish tropes of generic educational apps.

*   **Tier-Badge System:** Badges are metallic, angular, and authoritative (Bronze, Silver, Gold, Obsidian). They resemble professional sports hardware, not cartoon stickers.
*   **Milestone Drawer:** When a minor milestone is hit (e.g., 500 shots made), a sleek `Sheet` slides in from the bottom right, acknowledging the effort without interrupting the workout flow.
*   **Unlock Ceremony:** For major achievements (e.g., completing a 12-week program), the UI darkens, the specific badge scales up to the center of the screen, and a subtle `ConfettiBurst` (using the brand colors) fires.
*   **Streak Protect State:** If an athlete is in danger of losing a long streak, the `StreakFlame` icon turns a warning Amber and pulses slowly, creating a sense of urgency.

## 12. Coach Tooling UI Patterns

Coaches need powerful, desktop-optimized tools to manage rosters and analyze film.

*   **Filters & Bulk Selection:** The `DataTable` component includes sticky filter bars (e.g., "Filter by Position", "Show only Pending Reviews"). Bulk selection allows coaches to assign a specific `FilmClip` to multiple athletes simultaneously.
*   **Timestamp Comment Input:** When a coach pauses a video, a specialized input field automatically captures the current `timestampSec`. Submitting the comment pins it to the timeline.
*   **Drawing Palette:** A floating toolbar next to the `TelestrationCanvas` offering precise tools: straight arrows, curved arrows, freehand draw, and color selection (typically high-contrast Yellow or Cyan against the video).
*   **Assignment Composer:** A multi-step `Dialog` where coaches select a `WorkoutTemplate`, select athletes, set a due date, and add an optional motivational note.

## 13. Tailwind Theme Token Output

### `globals.css` (Token Layer)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Backgrounds & Surfaces (Light Mode) */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    
    /* Brand Accents */
    /* Primary: Court Amber (#F59E0B) */
    --primary: 38 92% 50%;
    --primary-foreground: 0 0% 100%;
    
    /* Secondary/Muted: Zinc */
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    
    /* Premium/Signature Accent: Indigo (#6D28D9) */
    --accent: 263 70% 50%;
    --accent-foreground: 0 0% 100%;
    
    /* Semantics */
    --success: 160 84% 39%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;

    /* Borders & Inputs */
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 38 92% 50%; /* Focus rings use primary */

    /* Radius */
    --radius: 0.5rem;
  }

  .dark {
    /* Backgrounds & Surfaces (Dark Mode - Deep Zinc/Black) */
    --background: 240 10% 3.9%; /* #09090B */
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    
    /* Brand Accents */
    --primary: 38 92% 50%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    
    --accent: 263 70% 50%;
    --accent-foreground: 0 0% 100%;
    
    /* Semantics */
    --success: 160 84% 39%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;

    /* Borders & Inputs */
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 38 92% 50%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased selection:bg-primary/30;
  }
  /* Custom scrollbar for data-heavy coach views */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/30 rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }
}

/* Glassmorphism utility */
.blur-glass {
  @apply bg-background/60 backdrop-blur-md border border-white/10;
}
```

### `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-oswald)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        // Fluid typography clamps
        'hero': 'clamp(3rem, 8vw, 6rem)',
        'h1': 'clamp(2rem, 5vw, 4rem)',
        'h2': 'clamp(1.5rem, 3vw, 2.5rem)',
        'h3': 'clamp(1.25rem, 2vw, 1.75rem)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'rise': '0 10px 40px -10px rgba(0,0,0,0.5)',
        'glow-primary': '0 0 20px 0px hsla(var(--primary) / 0.3)',
        'glow-accent': '0 0 20px 0px hsla(var(--accent) / 0.3)',
      },
      transitionTimingFunction: {
        'athletic': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'cinematic': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5", filter: "brightness(1.2)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

## 14. shadcn/ui Customization Plan

*   **Use As-Is (Functional):** `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip`, `Tabs`. These provide excellent accessibility and behavior out of the box.
*   **Wrap & Extend (Styling):**
    *   `Button`: Extend with `premium` (gradient background) and `athletic` (uppercase Oswald font) variants using `class-variance-authority`.
    *   `Card`: Wrap to add `MediaCard` (image background, gradient overlay) and `StatCard` (condensed numbers) variants.
*   **Replace Entirely (Custom Behavior):**
    *   *Video Player:* Do not use standard HTML5 video. Build a custom wrapper around Mux Player to handle telestration layers and strict chapter marking.
    *   *Progress Visualization:* Build custom SVG-based `ProgressRing` and `SkillTrack` components for precise control over stroke animation and glow effects.

## 15. Accessibility & Responsive Strategy

### Accessibility Guidance
*   **Contrast:** All text must meet WCAG AA (4.5:1). The `primary` Amber against the dark `background` has been specifically chosen to pass this threshold.
*   **Focus Rings:** Visible, high-contrast focus rings (`ring-2 ring-primary ring-offset-2 ring-offset-background`) are mandatory for keyboard navigation, especially in the Coach HQ data tables.
*   **Reduced Motion:** Respect `prefers-reduced-motion`. Disable the `pulse-glow` animation and snap `ConfettiBurst` to the end state if enabled.
*   **Touch Targets:** Minimum 44x44px for all interactive elements in the Player App (mobile-first).

### Responsive Strategy
*   **Player App (Mobile-First):** Defaults to single-column, full-width cards. Navigation is a bottom tab bar on mobile, switching to a collapsed side rail on desktop.
*   **Coach HQ (Desktop-Primary):** Optimized for 1024px+. Uses a persistent left sidebar. Data tables require horizontal scrolling on mobile, but this is an accepted tradeoff for the necessary data density.
*   **Live Classes:** Full-bleed on all devices. On mobile, chat overlays the video; on desktop, chat is a dedicated right column.

## 16. Reference Layouts

1.  **Player "Today's Work" (Immersive):** Dark mode forced. No sidebar, just a clean top nav. A massive hero image of the WOD. Scroll down to reveal gamification stats (Rings and Streaks).
2.  **Coach Compliance (Dense):** Light mode default (or high-contrast dark). Persistent left sidebar. Top filter bar. A dense `DataTable` showing roster status.
3.  **Premium Content (Cinematic):** Dark mode forced. MasterClass-style layout. Large 16:9 hero video. Tabbed interface below for Chapters, Resources, and Expert Bio.

## 17. Example CVA Components

### `Button` (Extended)
```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 font-heading uppercase tracking-wide",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-accent to-purple-600 text-white shadow-glow-accent hover:brightness-110 font-heading uppercase",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### `MediaCard` (MasterClass Style)
```tsx
import { cva, type VariantProps } from "class-variance-authority"

const mediaCardVariants = cva(
  "group relative overflow-hidden rounded-lg bg-zinc-900 transition-all duration-cinematic ease-cinematic",
  {
    variants: {
      size: {
        default: "aspect-video w-full",
        portrait: "aspect-[3/4] w-full max-w-sm",
      },
      interaction: {
        hover: "hover:shadow-rise cursor-pointer",
        static: "",
      }
    },
    defaultVariants: {
      size: "default",
      interaction: "hover",
    }
  }
)

// Usage example:
// <div className={mediaCardVariants({ size: "default", interaction: "hover" })}>
//   <img src="..." className="absolute inset-0 object-cover transition-transform duration-cinematic group-hover:scale-105" />
//   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
//   <div className="absolute bottom-0 left-0 p-6">
//     <h3 className="font-heading text-2xl text-white uppercase tracking-tight">Advanced Ball Handling</h3>
//   </div>
// </div>
```
