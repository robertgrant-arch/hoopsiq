import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";

const HAS_CLERK = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_LOAD_TIMEOUT_MS = 3000;

function clearClerkLocalState() {
  try {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("__clerk") || k.startsWith("clerk"))) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    if (window.sessionStorage) window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

function ClerkGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (isLoaded) return;
    const t = window.setTimeout(() => {
      clearClerkLocalState();
      const here =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      window.location.replace(
        `/sign-in?redirect_url=${encodeURIComponent(here)}&recovered=1`
      );
    }, CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [isLoaded]);

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const here =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(here)}`);
    }
  }, [isLoaded, isSignedIn, setLocation]);

  return <>{children}</>;
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!HAS_CLERK) return <>{children}</>;
  return <ClerkGate>{children}</ClerkGate>;
}
