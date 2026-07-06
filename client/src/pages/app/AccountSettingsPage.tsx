/**
 * AccountSettingsPage — /app/settings
 *
 * Account management hub. With real Clerk auth this exposes profile info,
 * sign-out, and permanent account deletion (required by App Store guideline
 * 5.1.1(v) for any app that supports account creation). In demo mode it
 * offers sign-out and local demo-data reset instead.
 */
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Trash2, ShieldAlert, CreditCard } from "lucide-react";
import { useAuth, HAS_CLERK, ROLE_META } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteAccountSection() {
  const { user: clerkUser } = useUser();
  const [, navigate] = useLocation();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!clerkUser) return;
    setDeleting(true);
    try {
      await clerkUser.delete();
      // Clerk ends the session as part of deletion; land on the marketing page.
      window.location.replace("/");
    } catch (e) {
      setDeleting(false);
      toast.error("Could not delete your account. Please try again or contact support.");
    }
  }

  return (
    <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="display text-[15px] mb-1">Delete account</h2>
          <p className="text-[13px] text-muted-foreground mb-4">
            Permanently deletes your account and all data associated with it.
            This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your profile, teams, and all personal data will be permanently
                  removed. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
}

function ClerkProfileCard() {
  const { user: clerkUser } = useUser();
  if (!clerkUser) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="display text-[15px] mb-3">Profile</h2>
      <dl className="space-y-2 text-[13.5px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{clerkUser.fullName ?? clerkUser.username ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{clerkUser.primaryEmailAddress?.emailAddress ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

export default function AccountSettingsPage() {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  const meta = ROLE_META[user.role];

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  function handleResetDemo() {
    try {
      window.localStorage.clear();
      toast.success("Demo data reset.");
      window.location.replace("/sign-in");
    } catch {
      toast.error("Could not reset demo data.");
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Link href={meta.home} asChild>
            <a className="p-1.5 rounded-lg hover:bg-muted transition" aria-label="Back">
              <ArrowLeft className="w-4.5 h-4.5" />
            </a>
          </Link>
          <h1 className="display text-2xl">Account</h1>
        </div>

        {HAS_CLERK ? (
          <ClerkProfileCard />
        ) : (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="display text-[15px] mb-3">Profile</h2>
            <dl className="space-y-2 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Role</dt>
                <dd style={{ color: meta.color }}>{meta.label}</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="display text-[15px] mb-3">Billing</h2>
          <Link href="/app/settings/billing" asChild>
            <a className="flex items-center gap-2 text-[13.5px] text-primary hover:underline">
              <CreditCard className="w-4 h-4" />
              Manage subscription &amp; billing
            </a>
          </Link>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="display text-[15px] mb-3">Session</h2>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-[13px] hover:bg-muted transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="display text-[15px] mb-3">Legal</h2>
          <div className="flex flex-col gap-2 text-[13.5px]">
            <Link href="/privacy" asChild>
              <a className="text-primary hover:underline">Privacy Policy</a>
            </Link>
            <Link href="/terms" asChild>
              <a className="text-primary hover:underline">Terms of Service</a>
            </Link>
          </div>
        </section>

        {HAS_CLERK ? (
          <DeleteAccountSection />
        ) : (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="display text-[15px] mb-1">Reset demo data</h2>
            <p className="text-[13px] text-muted-foreground mb-4">
              Clears all locally stored demo state and returns to sign-in.
            </p>
            <button
              onClick={handleResetDemo}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/40 text-destructive text-[13px] hover:bg-destructive/10 transition"
            >
              <Trash2 className="w-4 h-4" />
              Reset demo data
            </button>
          </section>
        )}
      </div>
    </AppShell>
  );
}
