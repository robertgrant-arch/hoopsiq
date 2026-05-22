# HoopsIQ: Coach Education & Learning System

This document details the `(learn)` route group, a premium video-on-demand educational platform. It serves both coaches (tactics, culture, program building) and athletes (skill development, film study). It operates as a hybrid model: some content is included with the core subscription, while premium masterclasses are sold a la carte or in bundles.

## 1. Learning IA & Route Structure

The learning module uses a cinematic, content-forward navigation structure.

*   `/(learn)` - The discovery hub. Features a "Continue Learning" rail at the top, followed by category-based carousels (Tactics, Culture, Skill Dev).
*   `/(learn)/categories/[slug]` - A filtered view of all courses within a specific domain (e.g., "Zone Offense").
*   `/(learn)/courses/[courseId]` - The course overview page. Displays the trailer, instructor bio, curriculum outline, and the enrollment/purchase CTA.
*   `/(learn)/courses/[courseId]/lessons/[lessonId]` - The immersive viewing experience.
*   `/(learn)/my` - The user's personal library of enrolled courses and active bundles, sorted by recent activity.
*   `/(learn)/bundles/[bundleId]` - A sales page for a collection of courses sold together at a discount (e.g., "The Complete Princeton Offense System").
*   `/(learn)/instructors/[slug]` - An instructor's educational portfolio, linking back to their `/(marketplace)` profile for 1:1 bookings.

## 2. Schema Usage

Building on the canonical schema (Prompt 3), the Learning system utilizes the following entities:

*   `Bundle`: A collection of courses (`id`, `title`, `description`, `priceCents`, `coverImageUrl`).
*   `Course`: The primary container (`id`, `bundleId?`, `instructorId`, `title`, `description`, `tier: INCLUDED | PREMIUM`, `priceCents`, `isPublished`).
*   `Module`: A section within a course (`id`, `courseId`, `title`, `order`).
*   `Lesson`: A specific video or text asset (`id`, `moduleId`, `title`, `type: VIDEO | TEXT | QUIZ`, `muxAssetId`, `contentHtml`, `order`, `isFreePreview`).
*   `CourseEnrollment`: The entitlement record (`id`, `userId`, `courseId`, `status: ACTIVE | COMPLETED`, `progressPercent`).
*   `LessonProgress`: Granular watch-tracking (`id`, `enrollmentId`, `lessonId`, `isCompleted`, `lastWatchedPosition`).

## 3. Lesson Page UX

The `/(learn)/courses/[courseId]/lessons/[lessonId]` route is the core consumption surface, designed to keep the user engaged without distractions.

*   **Cinematic Player:** The Mux video player dominates the top of the screen (or the left 70% on large desktop displays). It uses a custom theme matching the HoopsIQ brand (Amber accents, dark controls).
*   **Curriculum Sidebar:** A scrollable list of modules and lessons docks to the right (desktop) or below the video (mobile). Completed lessons show a green checkmark; the active lesson is highlighted in Indigo.
*   **Notes & Resources Tab:** Below the video, a tabbed interface contains the instructor's written summary (`contentHtml`) and downloadable assets (PDFs, play diagrams, practice plans).
*   **"Mark Complete" & Auto-Advance:** When the video ends, the `LessonProgress` is automatically marked `isCompleted: true`. A 5-second countdown appears over the video before auto-advancing to the next lesson. The user can also manually click "Mark Complete" if they've finished reading a text-only lesson.

## 4. Progress Model

Progress tracking is essential for user retention and is tracked at three levels:

1.  **Per-Lesson:** The Mux player emits `timeupdate` events. The frontend debounces these and saves the `lastWatchedPosition` to the database every 10 seconds. This allows cross-device resume. If the user watches >90% of the video, the lesson is marked `isCompleted`.
2.  **Per-Course:** The `CourseEnrollment.progressPercent` is a computed field: `(completedLessons / totalLessons) * 100`. This drives the progress bars on the `/(learn)/my` dashboard.
3.  **Watch-Time Aggregation:** A background job aggregates total minutes watched across all courses. This data powers gamification features (e.g., "Learner Level: Scholar") and provides analytics to instructors on which lessons have the highest drop-off rates.

## 5. Bundle & Entitlement Logic

The monetization engine for the learning module is built on the canonical `Entitlement` schema (Prompt 3), allowing for flexible packaging of content.

*   **Membership vs. Add-On:** Courses marked `tier: INCLUDED` are accessible to any user with an active `PLAYER_CORE` or `COACH_CORE` subscription. This is verified via the `sessionClaims.entitlements` JWT array. Courses marked `tier: PREMIUM` require a specific `CourseEnrollment` record, typically created via a Stripe Checkout session.
*   **Bundle Logic:** A `Bundle` is a single SKU in Stripe. When purchased, a webhook creates a `CourseEnrollment` for every `Course` linked to that `bundleId`. The UI on `/(learn)/bundles/[bundleId]` highlights the discounted price compared to buying the courses individually.
*   **Gift Codes & Team Purchases:** A team admin can purchase a block of seats for a premium course. This generates unique, single-use `DiscountRule` tokens (Prompt 9). When an athlete redeems the token, it provisions a `CourseEnrollment` with `status: ACTIVE`.

## 6. Premium Paywall Interstitial Patterns

HoopsIQ uses a "freemium tease" strategy to drive course sales, leveraging the `isFreePreview` flag on lessons.

1.  **The Tease:** The first lesson of a premium course is always `isFreePreview: true`. Any user, even those without an account, can watch this lesson.
2.  **The Gate:** When the free preview ends, or if the user clicks a locked lesson in the curriculum sidebar, the video player is replaced by a cinematic paywall interstitial.
3.  **The Pitch:** The paywall displays the course trailer (if available), the instructor's credentials, the total runtime, and a clear "Unlock Full Course" CTA.
4.  **The Upsell:** If the course is part of a bundle, the paywall presents a dual-pricing option: "Buy this course for $49" vs. "Get the Complete System (3 courses) for $99."

## 7. Instructor Profile Integration

The Learning module is deeply integrated with the Expert Marketplace (Prompt 11), creating a flywheel between asynchronous education and 1:1 coaching.

*   **The Flywheel:** An athlete watches a premium course on "Advanced Pick & Roll Reads." They want personalized feedback. The course overview page and the curriculum sidebar prominently feature the instructor's profile.
*   **Seamless Linking:** Clicking the instructor's name routes the user to `/(marketplace)/experts/[slug]`.
*   **Cross-Promotion:** Conversely, the instructor's marketplace profile features a "My Courses" carousel, driving traffic back to the `/(learn)` module. This dual-sided promotion maximizes the instructor's earning potential and the platform's GMV.

## 8. High-Fidelity Next.js Scaffolding

Below is the foundational code for the `(learn)` route group, establishing the cinematic lesson UX and the premium paywall patterns.

### `src/app/(app)/(learn)/layout.tsx`

```tsx
import { ReactNode } from "react";
import { LearnTopNav } from "@/components/learn/top-nav";

export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-foreground">
      {/* Cinematic dark theme for the learning module */}
      <LearnTopNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

### `src/app/(app)/(learn)/courses/[courseId]/page.tsx` (Course Overview)

```tsx
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { CourseHero } from "@/components/learn/course-hero";
import { CurriculumList } from "@/components/learn/curriculum-list";
import { InstructorCard } from "@/components/learn/instructor-card";
import { PremiumPaywallCard } from "@/components/learn/premium-paywall-card";

export default async function CourseOverviewPage({ params }: { params: { courseId: string } }) {
  const { userId, sessionClaims } = auth();
  
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      instructor: { include: { user: true } },
      modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      enrollments: userId ? { where: { userId } } : false
    }
  });

  if (!course || !course.isPublished) notFound();

  const isEnrolled = course.enrollments && course.enrollments.length > 0;
  const isIncluded = course.tier === "INCLUDED" && (sessionClaims?.entitlements?.includes("PLAYER_CORE") || sessionClaims?.entitlements?.includes("COACH_CORE"));
  const hasAccess = isEnrolled || isIncluded;

  return (
    <div className="pb-24">
      {/* Cinematic Hero with Trailer (if available) */}
      <CourseHero course={course} hasAccess={hasAccess} />

      <div className="container max-w-6xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Curriculum */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="font-heading text-2xl uppercase tracking-tight mb-6 border-b border-white/10 pb-2">
              Curriculum
            </h2>
            <CurriculumList modules={course.modules} hasAccess={hasAccess} courseId={course.id} />
          </section>
        </div>

        {/* Right Column: Instructor & Purchase CTA */}
        <div className="space-y-8">
          <div className="sticky top-24 space-y-8">
            {!hasAccess && (
              <PremiumPaywallCard course={course} />
            )}
            <InstructorCard instructor={course.instructor} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### `src/app/(app)/(learn)/courses/[courseId]/lessons/[lessonId]/page.tsx` (Immersive Lesson View)

```tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import MuxPlayer from "@mux/mux-player-react";
import { CurriculumSidebar } from "@/components/learn/curriculum-sidebar";
import { LessonTabs } from "@/components/learn/lesson-tabs";
import { PaywallInterstitial } from "@/components/learn/paywall-interstitial";

export default async function LessonViewPage({ params }: { params: { courseId: string, lessonId: string } }) {
  const { userId, sessionClaims } = auth();
  
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      enrollments: userId ? { where: { userId } } : false
    }
  });

  if (!course) notFound();

  // Find the current lesson
  let currentLesson = null;
  for (const mod of course.modules) {
    const lesson = mod.lessons.find(l => l.id === params.lessonId);
    if (lesson) {
      currentLesson = lesson;
      break;
    }
  }

  if (!currentLesson) notFound();

  // Authorization Check
  const isEnrolled = course.enrollments && course.enrollments.length > 0;
  const isIncluded = course.tier === "INCLUDED" && (sessionClaims?.entitlements?.includes("PLAYER_CORE") || sessionClaims?.entitlements?.includes("COACH_CORE"));
  const hasAccess = isEnrolled || isIncluded || currentLesson.isFreePreview;

  // Fetch user progress if logged in
  let progress = null;
  if (userId && hasAccess) {
    progress = await prisma.lessonProgress.findFirst({
      where: { enrollment: { userId, courseId: course.id }, lessonId: currentLesson.id }
    });
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Main Content Area (Video + Notes) */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-black">
        {/* The Cinematic Player or Paywall */}
        <div className="w-full aspect-video bg-zinc-900 relative">
          {hasAccess ? (
            currentLesson.type === "VIDEO" && currentLesson.muxAssetId ? (
              <MuxPlayer
                playbackId={currentLesson.muxAssetId} // Assuming public playback for courses, or use signed URLs
                startTime={progress?.lastWatchedPosition || 0}
                className="w-full h-full"
                metadata={{
                  video_id: currentLesson.id,
                  video_title: currentLesson.title,
                  viewer_user_id: userId || "anonymous",
                }}
                // TODO: Add onTimeUpdate handler to save progress via Server Action
                // TODO: Add onEnded handler to mark complete and auto-advance
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Text/Quiz Lesson Content
              </div>
            )
          ) : (
            <PaywallInterstitial course={course} />
          )}
        </div>

        {/* Notes & Resources Tabs */}
        <div className="p-8 max-w-4xl mx-auto w-full">
          <h1 className="font-heading text-3xl uppercase tracking-tight mb-6">{currentLesson.title}</h1>
          <LessonTabs lesson={currentLesson} />
        </div>
      </div>

      {/* Right Sidebar: Curriculum Navigation */}
      <aside className="w-full lg:w-96 border-l border-white/10 bg-zinc-950 flex flex-col h-full">
        <div className="p-6 border-b border-white/10">
          <h3 className="font-heading text-lg uppercase tracking-tight truncate" title={course.title}>
            {course.title}
          </h3>
          {/* Progress Bar (if enrolled) */}
          {isEnrolled && course.enrollments[0] && (
             <div className="mt-4">
               <div className="flex justify-between text-xs text-zinc-400 mb-1">
                 <span>Course Progress</span>
                 <span>{course.enrollments[0].progressPercent}%</span>
               </div>
               <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-500" 
                   style={{ width: `${course.enrollments[0].progressPercent}%` }} 
                 />
               </div>
             </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <CurriculumSidebar 
            modules={course.modules} 
            activeLessonId={currentLesson.id} 
            hasAccess={hasAccess} 
            courseId={course.id}
            // TODO: Pass down completed lesson IDs for green checkmarks
          />
        </div>
      </aside>
    </div>
  );
}
```
