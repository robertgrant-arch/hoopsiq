# HoopsIQ: Premium Basketball Development Platform Architecture

## 1. High-Level App Architecture

HoopsIQ is designed as a **Modular Monolith** using the Next.js App Router. This approach balances deployment simplicity with domain isolation, allowing the platform to scale gracefully before microservices are strictly necessary.

### Core Architecture Components
*   **Frontend & API Gateway**: Next.js App Router (React Server Components, Server Actions, API Routes).
*   **Database & ORM**: PostgreSQL managed via Prisma.
*   **Authentication & Identity**: Clerk (or Auth.js) handling multi-tenant JWTs, RBAC, and session management.
*   **Payments & Entitlements**: Stripe Billing (subscriptions) + Stripe Connect (expert marketplace payouts).
*   **Video Infrastructure**: Mux for VOD (film room, courses, drills) and LiveKit/Daily for live classes and expert 1:1s.
*   **Background Processing**: Event-driven architecture (e.g., Inngest or Upstash QStash) for async tasks like AI video analysis, video encoding webhooks, and notification dispatch.
*   **AI Engine**: Serverless function integration with OpenAI/custom ML models for jump shot, posture, and agility analysis.

---

## 2. Route Map Grouped by Product Area and Role

### Public & Marketing
*   `/` - Landing Page
*   `/pricing` - Subscription plans and 50% athlete discount info
*   `/experts` - Public directory of experts
*   `/auth/sign-in`, `/auth/sign-up` - Authentication flows

### Player App (`/app/player`)
*   `/app/player/dashboard` - Daily WODs, streaks, XP progress
*   `/app/player/workouts` - 30-minute programs, drill library
*   `/app/player/film` - Upload film, view AI feedback, coach reviews
*   `/app/player/classes` - Upcoming live classes, past recordings
*   `/app/player/profile` - Skill tracks, achievements, settings

### Coach HQ (`/app/coach`)
*   `/app/coach/dashboard` - Active athletes, pending reviews, upcoming sessions
*   `/app/coach/athletes` - Athlete list, progression tracking
*   `/app/coach/reviews` - Telestration and timestamped comment workflow
*   `/app/coach/education` - Coach education course library
*   `/app/coach/playbook` - Whiteboard studio, animated sequences

### Team Management (`/app/team`)
*   `/app/team/dashboard` - Team overview, upcoming events
*   `/app/team/roster` - Manage athletes, assistant coaches, parents
*   `/app/team/film-room` - Team film watch events, assignments, quizzes
*   `/app/team/billing` - Manage team subscriptions and athlete entitlements

### Expert Marketplace (`/app/expert`)
*   `/app/expert/dashboard` - Revenue, bookings, pending requests
*   `/app/expert/schedule` - Availability management
*   `/app/expert/content` - Manage courses, live session creation
*   `/app/expert/payouts` - Stripe Connect integration

### Admin/Back-Office (`/app/admin`)
*   `/app/admin/users` - Global user management
*   `/app/admin/orgs` - Organization and team oversight
*   `/app/admin/content` - Global content moderation
*   `/app/admin/financials` - Platform revenue, payouts, subscription metrics

---

## 3. Domain-Driven Module Breakdown

The application is structured into bounded contexts (modules) to ensure separation of concerns:

1.  **Identity & Access Module (`@/modules/identity`)**: Users, Profiles, Roles, Permissions, Auth flows.
2.  **Organization Module (`@/modules/organization`)**: Orgs, Teams, Rosters, Parent-Child links.
3.  **Content & Curriculum Module (`@/modules/content`)**: Drills, Workouts, WODs, Courses, Lessons, Playbooks, Quizzes.
4.  **Progression & Gamification Module (`@/modules/progression`)**: XP, Levels, Streaks, Skill Tracks, Achievements, Completions.
5.  **Media & Analysis Module (`@/modules/media`)**: Video uploads, Mux integration, AI feedback engine, Coach reviews (telestration, comments).
6.  **Scheduling & Live Module (`@/modules/live`)**: Availability, Bookings, Live Classes (LiveKit/Daily), Watch Events.
7.  **Commerce & Billing Module (`@/modules/commerce`)**: Subscriptions, Stripe integration, Discount engine (50% entitlement), Marketplace payouts.
8.  **Communication Module (`@/modules/communication`)**: Notifications (in-app, email, push), Chat/Messaging.

---

## 4. Prisma Schema Proposal

```prisma
// This is a high-level representation covering the core domains

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- IDENTITY & ORG ---
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  role          Role     @default(ATHLETE)
  profile       Profile?
  memberships   TeamMember[]
  subscriptions Subscription[]
  createdAt     DateTime @default(now())
}

enum Role {
  ATHLETE
  COACH
  ASSISTANT_COACH
  TRAINER
  TEAM_ADMIN
  ORG_ADMIN
  PARENT
  EXPERT
  SUPER_ADMIN
}

model Profile {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id])
  firstName String
  lastName  String
  avatarUrl String?
  xp        Int    @default(0)
  level     Int    @default(1)
  streak    Int    @default(0)
}

model Organization {
  id    String @id @default(cuid())
  name  String
  teams Team[]
}

model Team {
  id             String       @id @default(cuid())
  orgId          String?
  org            Organization? @relation(fields: [orgId], references: [id])
  name           String
  subscriptionId String?      // Links to active team sub
  members        TeamMember[]
}

model TeamMember {
  id     String @id @default(cuid())
  teamId String
  userId String
  role   Role   // Role within the team context
  team   Team   @relation(fields: [teamId], references: [id])
  user   User   @relation(fields: [userId], references: [id])
}

// --- COMMERCE & BILLING ---
model Subscription {
  id                   String   @id @default(cuid())
  userId               String
  user                 User     @relation(fields: [userId], references: [id])
  stripeSubscriptionId String   @unique
  status               String
  planType             String   // e.g., "INDIVIDUAL", "TEAM", "EXPERT"
  isDiscounted         Boolean  @default(false) // True if linked to team/coach
  linkedTeamId         String?  // For the 50% discount engine
}

// --- CONTENT & PROGRESSION ---
model Workout {
  id          String   @id @default(cuid())
  title       String
  description String
  isWod       Boolean  @default(false)
  drills      Drill[]
  completions Completion[]
}

model Drill {
  id          String   @id @default(cuid())
  workoutId   String
  workout     Workout  @relation(fields: [workoutId], references: [id])
  title       String
  videoUrl    String   // Mux Asset URL
  xpReward    Int
}

model Completion {
  id        String   @id @default(cuid())
  userId    String
  workoutId String
  workout   Workout  @relation(fields: [workoutId], references: [id])
  completedAt DateTime @default(now())
}

// --- MEDIA & ANALYSIS ---
model VideoUpload {
  id          String   @id @default(cuid())
  uploaderId  String
  muxAssetId  String
  status      String   // UPLOADING, PROCESSING, READY
  aiAnalysis  AIAnalysis?
  reviews     CoachReview[]
}

model AIAnalysis {
  id            String      @id @default(cuid())
  videoId       String      @unique
  video         VideoUpload @relation(fields: [videoId], references: [id])
  mechanicsData Json        // Posture, jump shot angles, etc.
  feedback      String
}

model CoachReview {
  id          String      @id @default(cuid())
  videoId     String
  coachId     String
  video       VideoUpload @relation(fields: [videoId], references: [id])
  comments    Json        // Timestamped comments & telestration data
  createdAt   DateTime    @default(now())
}

// --- LIVE & EXPERT ---
model LiveEvent {
  id          String   @id @default(cuid())
  hostId      String   // Expert or Coach
  title       String
  scheduledFor DateTime
  price       Int?     // In cents, if premium
  roomId      String   // LiveKit/Daily room ID
}
```

---

## 5. RBAC Model with Permission Matrix

| Role | View Public Content | Access Player App | Access Coach HQ | Manage Team Roster | Sell Premium Content | Global Admin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Athlete** | Yes | Yes | No | No | No | No |
| **Coach** | Yes | Yes | Yes | No | No | No |
| **Team Admin** | Yes | Yes | Yes | Yes | No | No |
| **Parent** | Yes | View Child Only | No | No | No | No |
| **Expert** | Yes | Yes | Yes | No | Yes | No |
| **Super Admin**| Yes | Yes | Yes | Yes | Yes | Yes |

*Implementation Note:* Permissions will be evaluated at the middleware level for route protection and at the data access layer (Prisma extensions/services) for tenant isolation.

---

## 6. Billing and Entitlement Model

The billing engine handles individual subscriptions, team subscriptions, and marketplace transactions.

### The 50% Discount Engine (Athlete Entitlement)
1.  **Trigger**: A Coach or Team Admin adds an Athlete to their `Team` via email invite or link.
2.  **Verification**: The system checks if the Team has an active, valid `Subscription`.
3.  **Entitlement Grant**: If valid, a metadata flag (`eligibleForDiscount: true`, `linkedTeamId: XYZ`) is attached to the Athlete's profile/customer record.
4.  **Checkout**: When the Athlete goes to upgrade their individual account (e.g., to access premium expert content or advanced AI features), Stripe Checkout is invoked with a dynamic 50% off coupon or a specific discounted Price ID based on the entitlement flag.
5.  **Revocation**: If the Athlete is removed from the Team, or the Team subscription lapses, a webhook triggers the removal of the discount on the Athlete's next billing cycle.

### Expert Marketplace
*   Uses **Stripe Connect** (Express or Custom accounts).
*   Experts set prices for 1:1s, live classes, or course bundles.
*   Platform takes a predefined take-rate (e.g., 15-20%).
*   Payouts are automated based on event completion.

---

## 7. Phased Implementation Roadmap

### Phase 1: MVP (Core Value & Retention)
*   Auth (Clerk) & DB Setup (Prisma).
*   Player App: Daily WODs, 30-min programs, basic video library.
*   Gamification: Basic XP and streaks.
*   Coach HQ: Basic roster management, simple video upload, and text-based feedback.
*   Billing: Standard individual and team subscriptions (Stripe Billing).

### Phase 2: Advanced Coaching & AI
*   Media & Analysis: Integrate AI engine for automated jump shot/mechanics feedback.
*   Coach HQ: Telestration and timestamped video review tools.
*   Playbook Studio: Whiteboard tools with basic animation.
*   Discount Engine: Implement the 50% athlete entitlement logic.

### Phase 3: Community & Team Workflows
*   Team Management: Advanced roster roles, film room assignments, watch events.
*   Content: Quizzes and comprehension tests for playbooks/film.
*   Coach Education: Launch course library for coaches.

### Phase 4: Premium Expert Marketplace & Live
*   Expert Marketplace: Stripe Connect integration, public expert profiles.
*   Live Events: Integration with LiveKit/Daily for MasterClass/Peloton style live sessions.
*   Booking system for 1:1 expert reviews.

## 8. Initial Next.js Code Scaffolding

### Folder Tree

```text
hoopsiq/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # Marketing pages (Landing, Pricing)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── app/                # Authenticated Application
│   │   │   ├── layout.tsx      # Main app shell (sidebar, topbar)
│   │   │   ├── player/         # Player App routes
│   │   │   ├── coach/          # Coach HQ routes
│   │   │   ├── team/           # Team Management routes
│   │   │   ├── expert/         # Expert Marketplace routes
│   │   │   └── admin/          # Admin Back-office routes
│   │   ├── api/                # API Routes / Webhooks
│   │   │   ├── webhooks/       # Stripe, Mux, Clerk webhooks
│   │   │   └── trpc/           # Optional: tRPC endpoint if used
│   │   ├── globals.css         # Global styles and Tailwind imports
│   │   └── layout.tsx          # Root layout (Providers, Fonts)
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── layout/             # Navigation, Sidebars, Shells
│   │   └── shared/             # Domain-agnostic components (e.g., VideoPlayer)
│   ├── lib/                    # Core utilities and configuration
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── utils.ts            # Tailwind merge, formatting utilities
│   │   └── stripe.ts           # Stripe client
│   ├── modules/                # Domain-Driven Modules
│   │   ├── identity/           # Auth, Users, Roles
│   │   ├── organization/       # Teams, Rosters
│   │   ├── content/            # Workouts, Drills
│   │   ├── progression/        # XP, Streaks
│   │   ├── media/              # Video, AI Analysis
│   │   ├── live/               # LiveKit/Daily integration
│   │   ├── commerce/           # Subscriptions, Entitlements
│   │   └── communication/      # Notifications
│   └── styles/                 # Design tokens and theme configuration
│       └── theme.ts            # Core design tokens
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

### Base Layout (`src/app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

// Inter for body, Oswald for impactful, athletic headings
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: "HoopsIQ | Premium Basketball Development",
  description: "The unified basketball development operating system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${oswald.variable} font-sans antialiased bg-background text-foreground`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### Design Tokens (`tailwind.config.ts` snippet)

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
        sans: ["var(--font-inter)"],
        heading: ["var(--font-oswald)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))", // e.g., A vibrant, athletic orange/amber
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
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

### Module Stub Example (`src/modules/identity/services/user.service.ts`)

```typescript
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export class UserService {
  /**
   * Retrieves a user with their profile and role.
   */
  static async getUserProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Checks if a user has a specific role or higher.
   * This is a stub for more complex RBAC logic.
   */
  static async hasPermission(userId: string, requiredRole: Role) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    if (!user) return false;
    
    // In a real implementation, you'd map roles to a hierarchy or specific permissions
    // e.g., SUPER_ADMIN > ORG_ADMIN > TEAM_ADMIN > COACH > ATHLETE
    return user.role === requiredRole || user.role === Role.SUPER_ADMIN; 
  }
}
```
