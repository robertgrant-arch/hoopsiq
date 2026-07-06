/**
 * TermsPage — /terms
 *
 * Public terms of service, referenced from the App Store listing and the
 * marketing footer. Rendered with the marketing chrome.
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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/*
        NOTE FOR THE TEAM: These terms are provided as a starting point and
        should be reviewed by legal counsel before public release.
      */}
      <MarketingHeader />
      <main className="max-w-3xl mx-auto px-5 lg:px-8 py-16">
        <h1 className="display text-3xl text-foreground mb-2">Terms of Service</h1>
        <p className="text-[13px] text-muted-foreground font-mono uppercase tracking-[0.1em] mb-10">
          Last updated: July 6, 2026
        </p>

        <P>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the HoopsIQ websites
          and mobile apps (the &ldquo;Service&rdquo;), operated by HoopsIQ Inc. By creating an
          account or using the Service, you agree to these Terms and to our{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </P>

        <H2>Accounts and eligibility</H2>
        <P>
          You must provide accurate information when creating an account and keep your
          credentials secure. You are responsible for activity under your account. Athletes who
          are minors may use the Service only with the consent of a parent or legal guardian,
          and children under 13 require verifiable parental consent as described in our Privacy
          Policy. Coaches and program staff may only add athletes to a roster when the athlete
          or their parent/guardian has authorized participation in the program.
        </P>

        <H2>Acceptable use</H2>
        <P>
          You agree not to misuse the Service. Among other things, you may not: harass, bully,
          or endanger any user (particularly minors); upload content that is unlawful, abusive,
          or infringes someone else&rsquo;s rights; attempt to access accounts or data you are
          not authorized to see; scrape or resell data from the Service; interfere with the
          operation or security of the Service; or use the Service to contact minors outside
          the role-based channels the platform provides. We may remove content or suspend
          accounts that violate these rules.
        </P>

        <H2>Your content</H2>
        <P>
          You (or, for minors, the athlete&rsquo;s family and program) retain ownership of the
          content you submit — including video, assessments, check-ins, and messages. You grant
          HoopsIQ a limited, non-exclusive, worldwide license to host, process, transmit, and
          display that content solely as needed to operate, maintain, and improve the Service
          and as directed by your program&rsquo;s permission settings. You represent that you
          have the rights necessary to upload the content you submit.
        </P>

        <H2>Subscriptions and billing</H2>
        <P>
          Some features require a paid subscription, billed to the program, team, or family
          that purchases it. Fees are charged in advance on the billing cycle shown at
          purchase, and renew automatically until cancelled. You can cancel at any time from
          billing settings; cancellation takes effect at the end of the current billing period.
          Except where required by law, fees are non-refundable. We may change pricing with
          advance notice before your next renewal.
        </P>

        <H2>Not medical advice</H2>
        <P>
          Readiness scores, check-in summaries, workload indicators, and any injury-related
          features are informational only. They are not medical advice, diagnosis, or
          treatment, and they are not a substitute for the judgment of a qualified medical
          professional. Always consult a physician or athletic trainer regarding an
          athlete&rsquo;s health, and never rely on the Service to determine whether an athlete
          is fit to play.
        </P>

        <H2>Disclaimers</H2>
        <P>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the
          fullest extent permitted by law, HoopsIQ disclaims all warranties, express or
          implied, including merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the Service will be uninterrupted,
          error-free, or that data will never be lost.
        </P>

        <H2>Limitation of liability</H2>
        <P>
          To the fullest extent permitted by law, HoopsIQ and its officers, employees, and
          suppliers will not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or for lost profits, data, or goodwill, arising out of or relating
          to your use of the Service. Our total liability for any claim relating to the Service
          is limited to the greater of the amount you paid us in the twelve months before the
          claim or one hundred U.S. dollars (US$100).
        </P>

        <H2>Termination</H2>
        <P>
          You may stop using the Service and delete your account at any time (Account settings
          &rarr; Delete account). We may suspend or terminate your access if you violate these
          Terms, if required by law, or if we reasonably believe your use poses a risk to other
          users — with particular care for the safety of minors. Sections that by their nature
          should survive termination (including content licenses needed to wind down,
          disclaimers, and limitations of liability) survive.
        </P>

        <H2>Governing law</H2>
        <P>
          These Terms are governed by the laws of the State of New Jersey, without regard to
          its conflict-of-law rules. Any dispute that cannot be resolved informally will be
          brought in the state or federal courts located in New Jersey.
        </P>

        <H2>Changes to these Terms</H2>
        <P>
          We may update these Terms from time to time. If a change is material, we will notify
          you through the Service or by email before it takes effect. Continued use of the
          Service after a change becomes effective constitutes acceptance of the updated Terms.
        </P>

        <H2>Contact</H2>
        <P>
          Questions about these Terms? Email{" "}
          <a href="mailto:support@hoopsiq.com" className="text-primary hover:underline">
            support@hoopsiq.com
          </a>{" "}
          or visit our <Link href="/support" className="text-primary hover:underline">Support</Link> page.
        </P>
      </main>
      <MarketingFooter />
    </div>
  );
}
