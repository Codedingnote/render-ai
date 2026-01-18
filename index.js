const http = require("http");
const https = require("https");

const WEBHOOK = process.env.WEBHOOK; // เอาไว้ซ่อน webhook
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  const ua = req.headers["user-agent"] || "unknown";

  const payload = JSON.stringify({
    content:
      "🔔 มีการเข้าเว็บ\n" +
      "IP: " + ip + "\n" +
      "Device: " + ua
  });

  const url = new URL(WEBHOOK);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  const reqDiscord = https.request(options);
  reqDiscord.on("error", err => console.log(err));
  reqDiscord.write(payload);
  reqDiscord.end();

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});