import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { VitePWA } from "vite-plugin-pwa";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

function vitePluginStorageProxy(): Plugin {
  return {
    name: "manus-storage-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/manus-storage", async (req, res) => {
        const key = req.url?.replace(/^\//, "");
        if (!key) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing storage key");
          return;
        }

        const forgeBaseUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

        if (!forgeBaseUrl || !forgeKey) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Storage proxy not configured");
          return;
        }

        try {
          const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
          forgeUrl.searchParams.set("path", key);

          const forgeResp = await fetch(forgeUrl, {
            headers: { Authorization: `Bearer ${forgeKey}` },
          });

          if (!forgeResp.ok) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Storage backend error");
            return;
          }

          const { url } = (await forgeResp.json()) as { url: string };
          if (!url) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Empty signed URL");
            return;
          }

          res.writeHead(307, { Location: url, "Cache-Control": "no-store" });
          res.end();
        } catch {
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("Storage proxy error");
        }
      });
    },
  };
}

const pwaPlugin = VitePWA({
  registerType: "autoUpdate",
  // Include icon assets in the precache manifest
  includeAssets: ["icons/*.png", "icons/*.svg"],
  manifest: {
    name: "HoopsOS",
    short_name: "HoopsOS",
    description: "Elite basketball operations platform for coaches and athletes.",
    theme_color: "#0b0d12",
    background_color: "#0b0d12",
    display: "standalone",
    orientation: "portrait-primary",
    scope: "/",
    start_url: "/app/coach",
    categories: ["sports", "productivity"],
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
    ],
  },
  workbox: {
    // Only precache files under 500 kB — skips the large vendor chunks (HLS.js, React,
    // canvas libs) which are already cached by the browser after first load.
    maximumFileSizeToCacheInBytes: 512 * 1024,
    // Precache HTML shell, CSS, icons, fonts. Skip large JS chunks — they cache at runtime.
    globPatterns: ["**/*.{html,css,ico,svg,png,woff2}"],
    // Runtime caching picks up JS chunks on first navigation (stale-while-revalidate)
    runtimeCaching: [
      {
        urlPattern: /\/assets\/.*\.js$/,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "js-chunks", expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 } },
      },
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
      },
    ],
  },
});

const isDev = process.env.NODE_ENV !== "production";
const plugins = [
  react(),
  tailwindcss(),
  ...(isDev ? [jsxLocPlugin()] : []),
  ...(isDev ? [vitePluginManusRuntime()] : []),
  vitePluginManusDebugCollector(),
  vitePluginStorageProxy(),
  pwaPlugin,
];

export default defineConfig({
  plugins,
  assetsInclude: ["**/*.md"],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split vendor node_modules into stable named chunks so the browser
        // can cache them independently from app code changes.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // React core — cached forever, never changes between deploys
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
            return "vendor-react";
          }
          // Radix UI + icon set + overlay components
          if (id.includes("/@radix-ui/") || id.includes("/lucide-react/") || id.includes("/cmdk/") || id.includes("/vaul/")) {
            return "vendor-ui";
          }
          // Data fetching
          if (id.includes("/@tanstack/")) {
            return "vendor-query";
          }
          // Router
          if (id.includes("/wouter/")) {
            return "vendor-router";
          }
          // PWA runtime — tiny, never changes
          if (id.includes("/workbox-") || id.includes("/idb/")) {
            return "vendor-pwa";
          }
          // Auth — Clerk SDK is large, isolate it
          if (id.includes("/@clerk/")) {
            return "vendor-auth";
          }
          // Animation — framer-motion is large, only loaded by animated pages
          if (id.includes("/framer-motion/")) {
            return "vendor-motion";
          }
          // Charts — recharts + dependencies
          if (id.includes("/recharts/") || id.includes("/victory-") || id.includes("/d3-")) {
            return "vendor-charts";
          }
          // Canvas — konva + react-konva (playbook studio only)
          if (id.includes("/konva/") || id.includes("/react-konva/") || id.includes("/use-image/")) {
            return "vendor-canvas";
          }
          // Video / media — Mux player + HLS.js + media-chrome (all Mux deps)
          if (
            id.includes("/@mux/") ||
            id.includes("/hls.js/") ||
            id.includes("/media-chrome/") ||
            id.includes("/custom-media-element/") ||
            id.includes("/mux-embed/")
          ) {
            return "vendor-media";
          }
          // Markdown rendering stack — docs only
          if (
            id.includes("/react-markdown/") ||
            id.includes("/remark-") ||
            id.includes("/rehype-") ||
            id.includes("/hast") ||
            id.includes("/mdast") ||
            id.includes("/unist") ||
            id.includes("/micromark") ||
            id.includes("/vfile")
          ) {
            return "vendor-markdown";
          }
          // Syntax highlighting — huge, docs/code pages only
          if (id.includes("/highlight.js/")) {
            return "vendor-highlight";
          }
          // Form handling
          if (id.includes("/react-hook-form/") || id.includes("/@hookform/")) {
            return "vendor-forms";
          }
          // Drag and drop
          if (id.includes("/@dnd-kit/")) {
            return "vendor-dnd";
          }
          // AI / generative
          if (id.includes("/@google/generative-ai") || id.includes("/openai/")) {
            return "vendor-ai";
          }
          // Remaining node_modules — should now be small utilities only
          return "vendor";
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
