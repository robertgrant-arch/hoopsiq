import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  User,
  Shield,
  Users,
  Flame,
  Heart,
  Settings,
  Lock,
  Mail,
  Loader2,
} from "lucide-react";
import { useAuth, HAS_CUSTOM_AUTH, storeAuthSession, type AuthUser } from "@/lib/auth";
import { ROLE_META, demoUsers, type Role } from "@/lib/mock/users";
import { Logo } from "@/components/brand/Logo";

const iconFor: Record<Role, React.ReactNode> = {
  ATHLETE: <User className="w-5 h-5" />,
  COACH: <Shield className="w-5 h-5" />,
  TEAM_ADMIN: <Users className="w-5 h-5" />,
  EXPERT: <Flame className="w-5 h-5" />,
  PARENT: <Heart className="w-5 h-5" />,
  SUPER_ADMIN: <Settings className="w-5 h-5" />,
};

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

function CredentialsSignIn() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Sign-in failed. Please try again.");
        return;
      }
      const user = body.user as AuthUser;
      storeAuthSession(body.token as string, user);
      const home = ROLE_META[user.portalRole]?.home ?? "/app/coach";
      navigate(home);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 border-b border-border flex items-center px-5 lg:px-8">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="display text-3xl leading-tight">
              Sign in <span className="text-primary">to HoopsIQ.</span>
            </h1>
            <p className="text-[13.5px] text-muted-foreground mt-3">
              Accounts are created by your program administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-[12px] uppercase tracking-[0.1em] font-mono text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[14px] outline-none focus:border-primary/60 transition"
                placeholder="you@program.com"
              />
            </label>
            <label className="block">
              <span className="text-[12px] uppercase tracking-[0.1em] font-mono text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[14px] outline-none focus:border-primary/60 transition"
                placeholder="••••••••••••"
              />
            </label>

            {error && (
              <p className="text-[13px] text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold text-[14px] py-2.5 hover:brightness-110 disabled:opacity-60 transition"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="text-center mt-8 text-[12.5px] text-muted-foreground space-y-2">
            <p>
              Trouble signing in? Contact your administrator or{" "}
              <Link href="/support" asChild>
                <a className="text-primary hover:underline">support</a>
              </Link>
              .
            </p>
            <Link href="/" asChild>
              <a className="inline-block hover:text-foreground">← Back to the main site</a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignIn() {
  const [, navigate] = useLocation();
  const { signIn } = useAuth();

  if (HAS_CUSTOM_AUTH) {
    return <CredentialsSignIn />;
  }

  function chooseUser(id: string, role: Role) {
    signIn(id);
    navigate(ROLE_META[role].home);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-border flex items-center px-5 lg:px-8">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11.5px] uppercase tracking-[0.14em] font-mono mb-5 font-bold">
              ▶ Demo Mode · No Password Required
            </div>
            <h1 className="display text-4xl lg:text-5xl leading-tight">
              Tap any role <span className="text-primary">to enter the app.</span>
            </h1>
            <p className="text-[14.5px] text-muted-foreground mt-4 max-w-md mx-auto">
              This is the actual working product, not a video tour. Pick a role below — you'll be signed in instantly with a fully populated demo team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {demoUsers.map((u) => {
              const meta = ROLE_META[u.role];
              return (
                <button
                  key={u.id}
                  onClick={() => chooseUser(u.id, u.role)}
                  className="group text-left rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-[oklch(0.17_0.005_260)] transition-all p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition">
                      {iconFor[u.role]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="display text-[16px] group-hover:text-primary transition-colors">
                        {u.name}
                      </div>
                      <div
                        className="text-[11px] uppercase tracking-[0.1em] font-mono mt-0.5 mb-2"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </div>
                      <p className="text-[12.5px] text-muted-foreground leading-snug">
                        {u.title}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-10 text-[12.5px] text-muted-foreground">
            <Link href="/" asChild>
              <a className="hover:text-foreground">← Back to the main site</a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
