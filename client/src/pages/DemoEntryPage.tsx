/**
 * /demo — stable, shareable entry into the interactive demo.
 *
 * Forces the sticky demo flag and performs a FULL page load of the demo
 * sign-in picker so all auth-mode constants re-evaluate, regardless of any
 * cached SPA state or prior real session.
 */
import { useEffect } from "react";

export default function DemoEntryPage() {
  useEffect(() => {
    try {
      window.localStorage.setItem("hoopsiq.demoMode", "true");
    } catch {
      /* ignore */
    }
    window.location.replace("/sign-in?demo=true");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-[14px] text-muted-foreground">Opening the demo…</p>
    </div>
  );
}
