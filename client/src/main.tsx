import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

// Clerk SSO is parked — first-party auth (lib/auth HAS_CUSTOM_AUTH) handles
// sign-in. To re-enable Clerk, restore the ClerkProvider wrapper here and the
// key check in lib/auth.ts.

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

// When a new service worker REPLACES the current one after a deploy, reload
// once so the running page can't keep serving a stale build. The
// hadController guard skips the SW's first claim of an uncontrolled page
// (fresh visits / bypass-cache reloads) — reloading on that loops forever.
if ("serviceWorker" in navigator) {
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
