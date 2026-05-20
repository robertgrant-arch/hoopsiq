import { createApp } from "../server/app";

let _handler: ReturnType<typeof createApp> | null = null;
let _err: unknown = null;

try {
  _handler = createApp();
} catch (e) {
  _err = e;
}

export default function handler(req: any, res: any) {
  if (_err || !_handler) {
    const msg = _err instanceof Error ? _err.message : "init failed";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ init_error: msg }));
    return;
  }
  (_handler as any)(req, res);
}
