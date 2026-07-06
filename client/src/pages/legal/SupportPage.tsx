/**
 * SupportPage — /support
 *
 * Public support page, required for App Store submission (Support URL).
 * Brief FAQ plus contact information, rendered with the marketing chrome.
 */
import type { ReactNode } from "react";
import { Link } from "wouter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

function FAQ({ q, children }: { q: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="display text-[15px] text-foreground mb-2">{q}</h2>
      <div className="text-[14px] leading-relaxed text-muted-foreground space-y-3">{children}</div>
    </section>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="max-w-3xl mx-auto px-5 lg:px-8 py-16">
        <h1 className="display text-3xl text-foreground mb-2">Support</h1>
        <p className="text-[14px] leading-relaxed text-muted-foreground mb-10">
          Need help with HoopsIQ? Check the answers below, or email us at{" "}
          <a href="mailto:support@hoopsiq.com" className="text-primary hover:underline">
            support@hoopsiq.com
          </a>{" "}
          — we typically respond within one business day.
        </p>

        <div className="space-y-4">
          <FAQ q="I can't sign in">
            <p>
              Make sure you are using the email address your program registered you with. Use
              &ldquo;Forgot password&rdquo; on the sign-in screen to reset your password. If
              you sign in with a linked account (such as Google or Apple), use the same button
              you used when you first signed up. Still stuck? Email us and include the email
              address on your account.
            </p>
          </FAQ>

          <FAQ q="How do I delete my account?">
            <p>
              In the app, go to <span className="text-foreground">Account settings &rarr; Delete
              account</span> and confirm. This permanently removes your profile and associated
              personal data. You can also request deletion by emailing{" "}
              <a href="mailto:support@hoopsiq.com" className="text-primary hover:underline">
                support@hoopsiq.com
              </a>{" "}
              from the address on your account. Parents and guardians may request deletion of
              their child&rsquo;s data the same way.
            </p>
          </FAQ>

          <FAQ q="Can I get a copy of my data?">
            <p>
              Yes. Email{" "}
              <a href="mailto:support@hoopsiq.com" className="text-primary hover:underline">
                support@hoopsiq.com
              </a>{" "}
              with the subject &ldquo;Data export request&rdquo; from the email address on your
              account, and we will provide an export of the personal data associated with it.
              Parents and guardians can request an export of their child&rsquo;s data.
            </p>
          </FAQ>

          <FAQ q="How do I contact HoopsIQ?">
            <p>
              Email{" "}
              <a href="mailto:support@hoopsiq.com" className="text-primary hover:underline">
                support@hoopsiq.com
              </a>{" "}
              for account, billing, privacy, or technical questions. For questions about your
              team&rsquo;s schedule, roster, or program policies, contact your coach or program
              director directly — they manage those inside the platform.
            </p>
          </FAQ>
        </div>

        <p className="text-[13px] text-muted-foreground mt-10">
          Looking for our policies? Read the{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
          and{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
