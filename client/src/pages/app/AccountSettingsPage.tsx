/**
 * AccountSettingsPage — /app/settings
 *
 * Account management hub. With first-party auth this exposes profile info,
 * password change, sign-out, and permanent account deletion (required by App
 * Store guideline 5.1.1(v)). SUPER_ADMIN additionally gets a portal-role
 * switcher (to test every role's experience) and a link to user management.
 * In demo mode it offers sign-out and local demo-data reset instead.
 */
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  LogOut,
  Trash2,
  ShieldAlert,
  CreditCard,
  KeyRound,
  Users,
  Eye,
} from "lucide-react";
import {
  useAuth,
  HAS_CUSTOM_AUTH,
  ROLE_META,
  clearAuthSession,
  type Role,
} from "@/lib/auth";
import { apiPost, apiDelete } from "@/lib/api/client";
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

const ALL_ROLES: Role[] = ["ATHLETE", "COACH", "TEAM_ADMIN", "EXPERT", "PARENT", "SUPER_ADMIN"];

function ChangePasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pending, setPending] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      await apiPost("/auth/change-password", { currentPassword: current, newPassword: next });
      toast.success("Password updated.");
      setCurrent("");
      setNext("");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="display text-[15px] mb-3 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-muted-foreground" /> Change password
      </h2>
      <form onSubmit={handleChange} className="space-y-3 max-w-sm">
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Current password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/60 transition"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="New password (min 8 characters)"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/60 transition"
        />
        <button
          type="submit"
          disabled={pending || !current || !next}
          className="px-4 py-2 rounded-lg border border-border text-[13px] hover:bg-muted disabled:opacity-50 transition"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}

function DeleteAccountSection() {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiDelete("/auth/me");
      clearAuthSession();
      window.location.replace("/");
    } catch {
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

export default function AccountSettingsPage() {
  const { user, signOut, setRole } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  const meta = ROLE_META[user.role];
  // The stored portal role (not the view-as override) decides admin surfaces.
  const isAdmin = HAS_CUSTOM_AUTH
    ? (() => {
        try {
          const raw = window.localStorage.getItem("hoopsiq.authUser");
          return raw ? JSON.parse(raw).portalRole === "SUPER_ADMIN" : false;
        } catch {
          return false;
        }
      })()
    : user.role === "SUPER_ADMIN";

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

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="display text-[15px] mb-3">Profile</h2>
          <dl className="space-y-2 text-[13.5px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{HAS_CUSTOM_AUTH ? "Email" : "Handle"}</dt>
              <dd>{user.handle}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd style={{ color: meta.color }}>{meta.label}</dd>
            </div>
          </dl>
        </section>

        {isAdmin && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="display text-[15px] mb-1 flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" /> View as role
            </h2>
            <p className="text-[12.5px] text-muted-foreground mb-3">
              Admin only — switch which portal you experience to test every feature.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    toast.success(`Viewing as ${ROLE_META[r].label}`);
                    navigate(ROLE_META[r].home);
                  }}
                  className="px-3 py-1.5 rounded-lg border text-[12px] font-mono uppercase tracking-wide transition hover:border-primary/60"
                  style={
                    user.role === r
                      ? { borderColor: ROLE_META[r].color, color: ROLE_META[r].color }
                      : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                  }
                >
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
            {HAS_CUSTOM_AUTH && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/app/admin/users" asChild>
                  <a className="flex items-center gap-2 text-[13.5px] text-primary hover:underline">
                    <Users className="w-4 h-4" />
                    Manage users
                  </a>
                </Link>
              </div>
            )}
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

        {HAS_CUSTOM_AUTH && <ChangePasswordSection />}

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

        {HAS_CUSTOM_AUTH ? (
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
