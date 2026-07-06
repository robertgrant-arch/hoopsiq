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

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
