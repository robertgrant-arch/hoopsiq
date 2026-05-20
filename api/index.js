export default function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ alive: true }));
}
