# HoopsIQ: Expert Marketplace Architecture & Scaffolding

This document details the Expert Marketplace, the premium monetization engine of HoopsIQ. It connects athletes seeking elite instruction with verified coaches, trainers, and former pros offering async reviews, live consults, and premium courses.

## 1. Marketplace Information Architecture

The marketplace serves two distinct audiences: **Buyers** (Athletes/Parents) and **Sellers** (Verified Experts).

*   **Discovery:** Users browse experts by category (e.g., Shooting, Point Guard Reads, College Recruiting) or search by name.
*   **Profile:** A cinematic, MasterClass-style landing page for the expert, establishing immense credibility.
*   **Offer Catalog:** The specific products the expert sells (Async Review, 1:1 Consult, Live Class, Course).
*   **Checkout:** Frictionless Stripe Checkout, supporting split pricing (Member vs. Public).
*   **Post-Purchase:** Routing the buyer to the specific fulfillment surface (e.g., the video upload flow for an async review, or the scheduling calendar for a 1:1).

## 2. Route Structure `(marketplace)`

The marketplace lives within the `(app)/(marketplace)` route group. It uses the signature Indigo (`#6D28D9`) premium accent color to visually distinguish it from the standard Player App.

*   `/(marketplace)` - The discovery home page. Featured carousels, category pills.
*   `/(marketplace)/experts` - The full, filterable directory of verified experts.
*   `/(marketplace)/experts/[slug]` - The cinematic Expert Profile.
*   `/(marketplace)/offers/[offerId]` - The detail page for a specific product (e.g., "Coach K's Pick & Roll Masterclass").
*   `/(marketplace)/checkout/[offerId]` - The pre-checkout confirmation and Stripe redirect handler.
*   `/(marketplace)/bookings/[bookingId]` - The post-purchase fulfillment hub for the buyer (upload video, view scheduled time).
*   `/(marketplace)/apply` - The public application form for prospective experts.
*   `/(marketplace)/payouts` - The seller-side dashboard (only accessible to users with the `EXPERT` role) for managing Stripe Connect and viewing earnings.

## 3. Expert Profile UX

The Expert Profile (`/[slug]`) is designed to convert. It must feel elite, avoiding the cheap look of generic gig-economy platforms.

*   **The Hero:** A massive, edge-to-edge `ExpertProfileHero` component. It features a high-quality, dark-gradient portrait of the expert.
*   **Credibility Block:** Immediately below the hero. Displays the verified badge, average rating (e.g., `★ 4.9`), total reviews, and average response time (e.g., `< 24 hours`).
*   **Bio & Philosophy:** A concise, text-heavy section detailing their coaching pedigree and playing career.
*   **The Offers Matrix:** A grid of `MediaCard` components representing what the expert sells.
    *   *Async Video Review:* "Upload 5 mins of film. Get a detailed telestration breakdown."
    *   *1:1 Video Consult:* "30-minute live Zoom session."
    *   *Premium Course:* "The 12-Week Elite Shooter Protocol."
*   **Availability Calendar:** If 1:1 consults are offered, a stylized, read-only view of their upcoming availability (to create scarcity).

## 4. Offer Catalog & Detail Pages

When a user clicks an offer from the profile, they land on `/(marketplace)/offers/[offerId]`.

*   **The Pitch:** A detailed breakdown of exactly what the buyer will receive.
*   **The Deliverables:** Clear bullet points (e.g., "1x Telestrated Video", "1x Custom WOD Assignment", "Direct Message Access for 7 Days").
*   **Pricing:** Explicitly shows the dual-pricing model.
    *   *Public Price:* $150.00
    *   *Member Price (HoopsIQ Player Core):* $120.00 (Creates a powerful upsell loop for the core subscription).
*   **Reviews:** Filtered specifically to reviews left for *this* specific offer.

## 5. Marketplace Search & Discovery

The `/(marketplace)` home page is optimized for browsing.

*   **Featured Carousels:** "Trending Experts", "Top Shooting Coaches", "New Arrivals".
*   **Category Pills:** Horizontal scrolling list of tags (Shooting, Defense, Point Guard, Post Play, Mental Conditioning, Recruiting).
*   **Filters & Sort:** On the `/experts` directory, users can filter by Offer Type (Async, Live, Course), Price Range, and Availability (Next 7 Days). Sort by Rating, Popularity, or Price.

## 6. Booking & Checkout Flow (Stripe Connect)

The monetization engine relies on Stripe Connect (Destination Charges) to automatically split the transaction between HoopsIQ (platform fee) and the Expert (payout).

1.  **Initiation:** Buyer clicks "Book Async Review" on the Offer Detail page.
2.  **Auth Gate:** If unauthenticated, they are prompted to sign up or sign in via Clerk.
3.  **Price Resolution:** The `CheckoutService` checks if the buyer has an active `Player Core` subscription. If yes, the `memberPrice` is applied. If no, the `publicPrice` is used.
4.  **Checkout Session Creation:** The server creates a Stripe Checkout Session. Crucially, the `transfer_data.destination` parameter is set to the expert's `StripeConnectAccountId`, and the platform fee (e.g., 20%) is calculated and retained by HoopsIQ.
5.  **Success Webhook:** Upon successful payment (`checkout.session.completed`), a webhook fires. The system creates a `Booking` record (`status: PENDING_FULFILLMENT`), associates the `PaymentIntentId`, and creates a `PayoutRecord` for the expert's ledger.
6.  **Fulfillment Routing:** The buyer is redirected to `/(marketplace)/bookings/[bookingId]`. If it's an Async Review, they are immediately prompted to upload their film. If it's a 1:1, they see the Zoom link and calendar invite options.

## 7. Expert Onboarding & Verification

To maintain the premium "MasterClass" energy, the supply side of the marketplace is strictly gated.

1.  **Application (`/(marketplace)/apply`):** A prospective expert submits their credentials, coaching history, social links, and a sample film breakdown.
2.  **Admin Review:** A `SUPER_ADMIN` reviews the application in the back-office (`/(admin)/users`).
3.  **Approval & Stripe Onboarding:** Upon approval, the expert receives an email inviting them to complete Stripe Connect Express onboarding (KYC/AML).
4.  **Publishing Gates:** Only when the expert's `StripeConnectAccount` is fully verified (`chargesEnabled: true`, `payoutsEnabled: true`) can they toggle `isPublic: true` on their profile and begin publishing `ExpertOffer`s.

## 8. Reviews & Credibility Surfaces

Social proof is the primary driver of conversion in the marketplace.

*   **Verified Badge:** A prominent blue checkmark (`VerifiedIcon`) displayed next to the expert's name, confirming their identity and coaching pedigree.
*   **Rating Breakdown:** A 5-star system. The profile shows the average rating, total reviews, and a histogram (5 stars: 80%, 4 stars: 15%, etc.).
*   **Response Time:** Calculated automatically based on the time between a `Booking` entering `PENDING_FULFILLMENT` and the expert marking it `FULFILLED` (e.g., uploading the telestrated review). "Usually responds in < 24 hours."
*   **Review Gating:** Only buyers who have completed a `Booking` with the expert can leave a review. This prevents review bombing and ensures authenticity.

## 9. Moderation & Reputation Model

HoopsIQ must protect its athletes and its brand reputation from bad actors on the supply side.

*   **Flagging:** Buyers can flag an expert's review or conduct (e.g., "Inappropriate language," "Did not fulfill service").
*   **Warning System:** Admins can issue formal warnings to experts, which are logged in the `AuditLog` but not visible publicly.
*   **Suspension:** If an expert's response time drops significantly or they receive multiple flags, an admin can toggle `isSuspended: true`. This immediately hides their profile and prevents new bookings, but allows them to fulfill existing ones.
*   **Ban:** Permanent removal (`isBanned: true`). All pending payouts are held pending review, and active offers are deleted.

## 10. Schema Confirmations

Building on the canonical schema from Prompt 3, we ensure the following structures exist to support the marketplace:

*   `ExpertProfile`: Extends the `User` model (`id`, `userId`, `bio`, `credentials`, `isPublic`, `isVerified`, `averageRating`, `reviewCount`, `stripeConnectAccountId`).
*   `ExpertOffer`: The product catalog (`id`, `expertId`, `title`, `description`, `type: ASYNC_REVIEW | LIVE_CONSULT | COURSE`, `publicPrice`, `memberPrice`, `isActive`).
*   `Booking`: The transaction and fulfillment record (`id`, `buyerId`, `offerId`, `expertId`, `status: PENDING_PAYMENT | PENDING_FULFILLMENT | FULFILLED | CANCELLED`, `paymentIntentId`, `amountPaid`, `createdAt`, `fulfilledAt`).
*   `PayoutRecord`: The ledger for the expert (`id`, `expertId`, `bookingId`, `amount`, `status: PENDING | PAID | FAILED`, `stripeTransferId`).
*   `Review`: The buyer's feedback (`id`, `bookingId`, `buyerId`, `expertId`, `rating`, `comment`, `createdAt`).

## 11. High-Fidelity Next.js Scaffolding

Below is the foundational code for the `(marketplace)` route group, establishing the premium UX and Stripe Connect checkout flow.

### `src/app/(app)/(marketplace)/layout.tsx`

```tsx
import { ReactNode } from "react";
import { MarketplaceTopNav } from "@/components/marketplace/top-nav";

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-foreground">
      {/* Premium dark theme for the marketplace */}
      <MarketplaceTopNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

### `src/app/(app)/(marketplace)/experts/[slug]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExpertProfileHero } from "@/components/marketplace/expert-profile-hero";
import { CredibilityBlock } from "@/components/marketplace/credibility-block";
import { OfferMatrix } from "@/components/marketplace/offer-matrix";
import { ReviewSection } from "@/components/marketplace/review-section";

export default async function ExpertProfilePage({ params }: { params: { slug: string } }) {
  const expert = await prisma.expertProfile.findUnique({
    where: { slug: params.slug },
    include: {
      user: true,
      offers: { where: { isActive: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 }
    }
  });

  if (!expert || !expert.isPublic) notFound();

  return (
    <div className="pb-24">
      {/* Cinematic Hero */}
      <ExpertProfileHero 
        name={expert.user.name} 
        title={expert.title} 
        imageUrl={expert.heroImageUrl} 
      />

      <div className="container max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <CredibilityBlock 
          isVerified={expert.isVerified}
          rating={expert.averageRating}
          reviewCount={expert.reviewCount}
          responseTime="< 24 hours"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
          {/* Main Content (Bio & Reviews) */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight mb-4">About the Coach</h2>
              <div className="prose prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: expert.bioHtml }} />
            </section>

            <ReviewSection reviews={expert.reviews} total={expert.reviewCount} rating={expert.averageRating} />
          </div>

          {/* Sticky Sidebar (Offers Matrix) */}
          <div className="space-y-6">
            <div className="sticky top-24">
              <h3 className="font-heading text-xl uppercase tracking-tight mb-4">Available Services</h3>
              <OfferMatrix offers={expert.offers} expertSlug={expert.slug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### `src/app/(app)/(marketplace)/checkout/[offerId]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { offerId: string } }) {
  const { userId, sessionClaims } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const offer = await prisma.expertOffer.findUnique({
    where: { id: params.offerId },
    include: { expert: true }
  });

  if (!offer || !offer.isActive) {
    return new NextResponse("Offer unavailable", { status: 404 });
  }

  // Determine pricing tier (Member vs Public)
  const isMember = sessionClaims?.entitlements?.includes("PLAYER_CORE") || false;
  const finalPriceCents = isMember ? offer.memberPriceCents : offer.publicPriceCents;

  // Calculate platform fee (e.g., 20%)
  const platformFeeCents = Math.round(finalPriceCents * 0.20);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${offer.title} with ${offer.expert.title}`,
            description: offer.description,
          },
          unit_amount: finalPriceCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/offers/${offer.id}`,
      customer_email: sessionClaims?.email as string,
      metadata: {
        buyerId: userId,
        offerId: offer.id,
        expertId: offer.expertId,
      },
      payment_intent_data: {
        // Stripe Connect Destination Charge
        transfer_data: {
          destination: offer.expert.stripeConnectAccountId,
        },
        application_fee_amount: platformFeeCents,
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
```

### `src/app/(app)/(marketplace)/bookings/[bookingId]/page.tsx`

```tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { UploadCloudIcon, VideoIcon } from "lucide-react";

export default async function BookingFulfillmentPage({ params }: { params: { bookingId: string } }) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { offer: true, expert: { include: { user: true } } }
  });

  if (!booking || booking.buyerId !== userId) notFound();

  return (
    <div className="container max-w-3xl py-12">
      <div className="bg-zinc-900 border border-white/10 rounded-lg p-8">
        <h1 className="font-heading text-h2 uppercase mb-2">Booking Confirmed</h1>
        <p className="text-muted-foreground mb-8">
          {booking.offer.title} with {booking.expert.user.name}
        </p>

        {booking.status === "PENDING_FULFILLMENT" && booking.offer.type === "ASYNC_REVIEW" && (
          <div className="bg-black border border-border p-6 rounded-md text-center">
            <UploadCloudIcon className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">Next Step: Upload Your Film</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The coach needs 3-5 minutes of game or practice footage to begin the breakdown.
            </p>
            <Button className="shadow-glow-primary w-full sm:w-auto">
              Upload Video Now
            </Button>
          </div>
        )}

        {booking.status === "FULFILLED" && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 p-6 rounded-md text-center">
            <VideoIcon className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-medium text-lg text-emerald-500 mb-2">Review Complete</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your film breakdown is ready to watch.
            </p>
            <Button variant="outline" className="w-full sm:w-auto">
              Watch Breakdown
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```
