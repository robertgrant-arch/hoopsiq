import { Link } from "wouter";
import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { Logo } from "@/components/brand/Logo";
import { HAS_CLERK, HAS_CUSTOM_AUTH } from "@/lib/auth";


export default function SignUp() {
  if (HAS_CUSTOM_AUTH) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="h-16 border-b border-border flex items-center px-5 lg:px-8">
          <Logo />
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="display text-3xl">Join HoopsIQ</h1>
            <p className="text-muted-foreground text-[14px]">
              HoopsIQ accounts are created by your program administrator. Ask
              your coach or program director for an invitation, then sign in
              with the credentials they provide.
            </p>
            <Link href="/sign-in" className="inline-block underline text-primary">
              Go to sign-in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (HAS_CLERK) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <ClerkSignUp
          routing="virtual"
          signInUrl="/sign-in"
          afterSignUpUrl="/app/coach"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-border flex items-center px-5 lg:px-8">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-3xl font-bold">Sign up</h1>
          <p className="text-muted-foreground">
            Authentication is not configured in this environment yet. Set the{" "}
            <code>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable in Vercel
            to enable real Google sign-up and sign-in for coach accounts.
          </p>
          <Link
            href="/sign-in"
            className="inline-block underline text-primary"
          >
            Continue to demo sign-in
          </Link>
        </div>
      </main>
    </div>
  );
}
