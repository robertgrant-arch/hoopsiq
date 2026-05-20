import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export default function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}
