import { useLocation, Link } from "wouter";
import {
  User,
  Shield,
  Users,
  Flame,
  Heart,
  Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLE_META, demoUsers, type Role } from "@/lib/mock/users";
import { Logo } from "@/components/brand/Logo";
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";

const iconFor: Record<Role, React.ReactNode> = {
  ATHLETE: <User className="w-5 h-5" />,
  COACH: <Shield className="w-5 h-5" />,
  TEAM_ADMIN: <Users className="w-5 h-5" />,
  EXPERT: <Flame className="w-5 h-5" />,
  PARENT: <Heart className="w-5 h-5" />,
  SUPER_ADMIN: <Settings className="w-5 h-5" />,
};

export default function SignIn() {
  const [, navigate] = useLocation();
  const { signIn } = useAuth();
    const HAS_CLERK = false;
if (HAS_CLERK) {
return (
<div className="min-h-screen flex items-center justify-center p-6 bg-background">
<ClerkSignIn routing="virtual" signUpUrl="/sign-up" afterSignInUrl="/app/coach" /></div>
);
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
