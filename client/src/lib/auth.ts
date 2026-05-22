import { useEffect, useState, useCallback } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { demoUsers, type DemoUser, type Role, ROLE_META } from "@/lib/mock/users";

export type { Role };
export { ROLE_META };

// ---------------------------------------------------------------------------
// Helpers shared by both paths
// ---------------------------------------------------------------------------

const STORAGE_KEY = "hoopsiq.demoUserId";
const ROLE_KEY = "hoopsiq_role";

function readStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function writeStoredUserId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(STORAGE_KEY, id);
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("hoopsiq-user-changed"));
}

function isDemoMode(): boolean {
  if (typeof window === "undefined") return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get("demo") === "true") return true;
  if (import.meta.env.VITE_DEMO_MODE === "true") return true;
  return false;
}

const HAS_CLERK = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !isDemoMode();

// ---------------------------------------------------------------------------
// Clerk path — only imported when Clerk is actually configured
// ---------------------------------------------------------------------------

function useClerkAuth(): {
  user: DemoUser | null;
  signIn: (id: string) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
} {
  const { user: clerkUser, isLoaded } = useUser();
  const clerk = useClerk();

  const [role, setRoleState] = useState<Role>(() => {
    const stored = typeof window !== "undefined"
      ? window.localStorage.getItem(ROLE_KEY)
      : null;
    return (stored as Role) ?? "ATHLETE";
  });

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem(ROLE_KEY, r);
  }, []);

  const user: DemoUser | null =
    isLoaded && clerkUser
      ? {
          id: clerkUser.id,
          role,
          name: clerkUser.fullName ?? clerkUser.username ?? "User",
          handle: clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.username ?? "",
          avatar: (clerkUser.firstName?.[0] ?? "") + (clerkUser.lastName?.[0] ?? ""),
          title: ROLE_META[role]?.label ?? role,
          orgId: undefined,
          teamId: undefined,
        }
      : null;

  const signIn = useCallback((_id: string) => {
    // With real Clerk, signIn is handled by Clerk's own UI — no-op here.
  }, []);

  const signOut = useCallback(() => {
    clerk.signOut();
  }, [clerk]);

  return { user, signIn, signOut, setRole };
}

// ---------------------------------------------------------------------------
// Demo / mock path (original implementation)
// ---------------------------------------------------------------------------

function useDemoAuth(): {
  user: DemoUser | null;
  signIn: (id: string) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
} {
  const [userId, setUserId] = useState<string | null>(() => readStoredUserId());

  useEffect(() => {
    const handler = () => setUserId(readStoredUserId());
    window.addEventListener("hoopsiq-user-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("hoopsiq-user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const user: DemoUser | null =
    demoUsers.find((u) => u.id === userId) || null;

  const signIn = useCallback((id: string) => {
    writeStoredUserId(id);
    setUserId(id);
  }, []);

  const signOut = useCallback(() => {
    writeStoredUserId(null);
    setUserId(null);
  }, []);

  const setRole = useCallback((role: Role) => {
    if (typeof window !== "undefined") window.localStorage.setItem(ROLE_KEY, role);
    // For demo mode, role is embedded in the DemoUser object; this is a no-op
    // unless the caller also swaps the active demo user.
  }, []);

  return { user, signIn, signOut, setRole };
}

// ---------------------------------------------------------------------------
// Public hook — always returns the same shape
// ---------------------------------------------------------------------------

export function useAuth() {
  // Rules of Hooks: we must call the same hook every render.
  // We branch at module load time (HAS_CLERK is a module-level constant).
  const clerkResult = HAS_CLERK ? useClerkAuth() : null; // eslint-disable-line react-hooks/rules-of-hooks
  const demoResult = !HAS_CLERK ? useDemoAuth() : null;  // eslint-disable-line react-hooks/rules-of-hooks

  // Return whichever branch is active
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return HAS_CLERK ? clerkResult! : demoResult!;
}
