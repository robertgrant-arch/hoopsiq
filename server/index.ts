import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app";
import { bootstrapLocalAuth } from "./auth/local";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();
  const server = createServer(app);

  // Seed auth table, default org, and master admin. Non-fatal so the app
  // still serves the SPA when the database is unreachable.
  try {
    await bootstrapLocalAuth();
  } catch (e) {
    console.error("[auth] bootstrap failed:", e);
  }

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
