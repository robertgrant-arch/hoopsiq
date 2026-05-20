export default function(req, res) {
  res.status(200).json({ ok: true, source: "api/index.js ESM" });
}
