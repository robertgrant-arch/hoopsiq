export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") { res.statusCode = 200; res.end(); return; }
  res.statusCode = 401;
  res.end(JSON.stringify({ error: "Unauthorized" }));
}
