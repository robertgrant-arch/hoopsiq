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

/** Clerk SSO is parked — first-party auth (below) is the active sign-in path.
 *  Re-enable by restoring the key check if SSO comes back. */
export const HAS_CLERK = false;

/** First-party email/password auth. Active in production builds (and anywhere
 *  VITE_CUSTOM_AUTH=true) unless explicit demo mode is requested. */
export const HAS_CUSTOM_AUTH =
  (import.meta.env.PROD || import.meta.env.VITE_CUSTOM_AUTH === "true") && !isDemoMode();

/** True when some real auth mode is active (custom or Clerk). */
export const HAS_AUTH = HAS_CUSTOM_AUTH || HAS_CLERK;

/** Complement of HAS_AUTH for the API hook layer: when real auth isn't
 *  active, hooks serve mock data instead of hitting endpoints that would 401. */
export const IS_DEMO = !HAS_AUTH;

// ---------------------------------------------------------------------------
// First-party auth path (custom sign-in managed by admins)
// ---------------------------------------------------------------------------

const TOKEN_KEY = "hoopsiq.authToken";
const AUTH_USER_KEY = "hoopsiq.authUser";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  portalRole: Role;
  mustChangePassword?: boolean;
};

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeAuthSession(token: string, user: AuthUser): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("hoopsiq-user-changed"));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.dispatchEvent(new CustomEvent("hoopsiq-user-changed"));
}

function readStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function toDemoUserShape(u: AuthUser, roleOverride: Role | null): DemoUser {
  // SUPER_ADMIN can view the app as any portal role (for testing all features);
  // everyone else is pinned to their assigned role.
  const role = u.portalRole === "SUPER_ADMIN" && roleOverride ? roleOverride : u.portalRole;
  const initials = u.name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: u.id,
    role,
    name: u.name,
    handle: u.email,
    avatar: initials || "U",
    title: ROLE_META[role]?.label ?? role,
    orgId: undefined,
    teamId: undefined,
  };
}

function useCustomAuth(): {
  user: DemoUser | null;
  signIn: (id: string) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
} {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => readStoredAuthUser());
  const [roleOverride, setRoleOverride] = useState<Role | null>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(ROLE_KEY) : null;
    return (stored as Role) ?? null;
  });

  useEffect(() => {
    const handler = () => {
      setAuthUser(readStoredAuthUser());
      const stored = window.localStorage.getItem(ROLE_KEY);
      setRoleOverride((stored as Role) ?? null);
    };
    window.addEventListener("hoopsiq-user-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("hoopsiq-user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Revalidate the session against the server once per mount; a 401 clears it.
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    const base = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
    fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) {
          clearAuthSession();
          return;
        }
        if (res.ok) {
          const body = (await res.json()) as { user: AuthUser };
          window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(body.user));
          setAuthUser(body.user);
        }
      })
      .catch(() => {
        /* network failure — keep the cached session */
      });
  }, []);

  const signIn = useCallback((_id: string) => {
    // Sign-in happens on the SignIn page via POST /api/auth/login.
  }, []);

  const signOut = useCallback(() => {
    clearAuthSession();
  }, []);

  const setRole = useCallback((role: Role) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ROLE_KEY, role);
      // Broadcast so every useAuth() instance (AppShell, pages) re-reads the
      // override — without this only the calling component saw the switch.
      window.dispatchEvent(new CustomEvent("hoopsiq-user-changed"));
    }
    setRoleOverride(role);
  }, []);

  const user = authUser ? toDemoUserShape(authUser, roleOverride) : null;
  return { user, signIn, signOut, setRole };
}

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
    // Demo mode: switch to the demo user holding that role so "View as role"
    // works identically to production.
    const target = demoUsers.find((u) => u.role === role);
    if (target) {
      writeStoredUserId(target.id);
      setUserId(target.id);
    }
  }, []);

  return { user, signIn, signOut, setRole };
}

// ---------------------------------------------------------------------------
// Public hook — always returns the same shape
// ---------------------------------------------------------------------------

export function useAuth() {
  // Rules of Hooks: we must call the same hook every render.
  // We branch at module load time (the mode flags are module-level constants).
  const clerkResult = HAS_CLERK ? useClerkAuth() : null; // eslint-disable-line react-hooks/rules-of-hooks
  const customResult = !HAS_CLERK && HAS_CUSTOM_AUTH ? useCustomAuth() : null; // eslint-disable-line react-hooks/rules-of-hooks
  const demoResult = !HAS_CLERK && !HAS_CUSTOM_AUTH ? useDemoAuth() : null; // eslint-disable-line react-hooks/rules-of-hooks

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return HAS_CLERK ? clerkResult! : HAS_CUSTOM_AUTH ? customResult! : demoResult!;
}
