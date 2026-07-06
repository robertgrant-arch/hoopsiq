/**
 * PrivacyPolicyPage — /privacy
 *
 * Public privacy policy, required for App Store submission (a publicly
 * reachable Privacy Policy URL). Rendered with the marketing chrome.
 */
import type { ReactNode } from "react";
import { Link } from "wouter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

function H2({ children }: { children: ReactNode }) {
  return <h2 className="display text-xl text-foreground mt-10 mb-3">{children}</h2>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-muted-foreground mb-4">{children}</p>;
}

function LI({ children }: { children: ReactNode }) {
  return <li className="text-[14px] leading-relaxed text-muted-foreground">{children}</li>;
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/*
        NOTE FOR THE TEAM: This policy is provided as a starting point and
        should be reviewed by legal counsel before public release.
      */}
      <MarketingHeader />
      <main className="max-w-3xl mx-auto px-5 lg:px-8 py-16">
        <h1 className="display text-3xl text-foreground mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-10">
          Last updated: July 6, 2026
        </p>

        <P>
          HoopsIQ Inc. (&ldquo;HoopsIQ&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides a youth
          basketball operations platform used by coaches, athletes, and parents. This policy
          explains what information we collect, how we use it, who can see it, and the choices
          you have. It applies to our websites and mobile apps (together, the
          &ldquo;Service&rdquo;).
        </P>

        <H2>Information we collect</H2>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <LI>
            <span className="text-foreground">Account information.</span> Name, email address,
            and role (coach, athlete, parent, or program staff), managed through our
            authentication provider, Clerk. Depending on your program, a phone number may be
            collected for SMS notifications.
          </LI>
          <LI>
            <span className="text-foreground">Athlete performance data.</span> Skill assessments,
            benchmarks, workout completion, development plans, and coach observations recorded
            through the Service.
          </LI>
          <LI>
            <span className="text-foreground">Readiness check-ins.</span> Self-reported wellness
            information such as sleep, soreness, energy, and mood that athletes submit to help
            coaches plan training load.
          </LI>
          <LI>
            <span className="text-foreground">Video and film uploads.</span> Game and practice
            film uploaded to the Service, processed and streamed via Mux.
          </LI>
          <LI>
            <span className="text-foreground">Wearables metrics.</span> Activity and recovery
            metrics from wearable providers you or your parent/guardian choose to connect.
          </LI>
          <LI>
            <span className="text-foreground">Messages.</span> Messages and announcements sent
            within the Service between coaches, athletes, and parents.
          </LI>
        </ul>

        <H2>How we use information</H2>
        <P>
          We use this information to operate the Service: authenticate accounts, display
          performance and readiness data to the people authorized to see it, generate practice
          plans and workouts, deliver film and highlights, send program communications, provide
          support, and keep the Service safe and reliable. We do not use your information for
          third-party advertising.
        </P>

        <H2>Who can see your information</H2>
        <P>
          Visibility follows role-based permissions. Coaches and authorized program staff can
          see performance data, check-ins, film, and messages for athletes on their rosters.
          Parents and guardians can see their own child&rsquo;s information through the parent
          portal. Athletes see their own data. Recruiting profiles are only visible outside your
          program when a parent or guardian (or an adult athlete) has explicitly enabled
          sharing. We never sell personal data.
        </P>

        <H2>Children&rsquo;s privacy (COPPA)</H2>
        <P>
          The Service is used by athletes under 13 only with verifiable parental consent
          obtained during registration. Parents and guardians can review the personal
          information we hold about their child, ask us to correct it, refuse further
          collection, and request deletion of their child&rsquo;s data at any time — through the
          parent portal or by emailing{" "}
          <a href="mailto:support@hoopsiq.com" className="text-primary hover:underline">
            support@hoopsiq.com
          </a>
          . We collect only the information reasonably necessary for a child to participate in
          their program, and we do not condition participation on providing more information
          than is needed.
        </P>

        <H2>Third-party processors</H2>
        <P>
          We rely on a small set of service providers to run the Service. Each processes data
          only on our instructions:
        </P>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <LI><span className="text-foreground">Clerk</span> — authentication and account management.</LI>
          <LI><span className="text-foreground">Mux</span> — video processing and streaming.</LI>
          <LI><span className="text-foreground">Neon (Postgres)</span> — database hosting.</LI>
          <LI><span className="text-foreground">Twilio</span> — SMS notifications.</LI>
          <LI><span className="text-foreground">OpenAI</span> — generation of workout and practice-plan suggestions. Content sent for generation is not used to train third-party models.</LI>
        </ul>

        <H2>Data retention</H2>
        <P>
          We keep personal information for as long as your account is active or as needed to
          provide the Service. When an account is deleted, associated personal data is deleted
          or de-identified within a reasonable period, except where we must retain limited
          records to meet legal, safety, or billing obligations.
        </P>

        <H2>Account deletion</H2>
        <P>
          You can permanently delete your account in the app under{" "}
          <span className="text-foreground">Account settings &rarr; Delete account</span>, or by
          emailing{" "}
          <a href="mailto:support@hoopsiq.com" className="text-primary hover:underline">
            support@hoopsiq.com
          </a>{" "}
          from the address on your account. Deletion removes your profile and associated
          personal data as described above.
        </P>

        <H2>No sale of personal data</H2>
        <P>
          We do not sell personal data, and we do not share personal data with third parties
          for their own marketing purposes.
        </P>

        <H2>Changes to this policy</H2>
        <P>
          If we make material changes to this policy, we will notify you through the Service or
          by email before the changes take effect, and we will update the date at the top of
          this page.
        </P>

        <H2>Contact us</H2>
        <P>
          Questions about privacy? Email{" "}
          <a href="mailto:support@hoopsiq.com" className="text-primary hover:underline">
            support@hoopsiq.com
          </a>
          . See also our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
          <Link href="/support" className="text-primary hover:underline">Support</Link> pages.
        </P>
      </main>
      <MarketingFooter />
    </div>
  );
}
