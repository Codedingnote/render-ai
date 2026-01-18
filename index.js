const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const WEBHOOK = process.env.WEBHOOK;

const server = http.createServer((req, res) => {
  console.log("REQUEST IN");

  if (!WEBHOOK || !WEBHOOK.startsWith("https://")) {
    console.log("WEBHOOK NOT SET");
    res.writeHead(500);
    res.end("Webhook not set");
    return;
  }

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

  let url;
  try {
    url = new URL(WEBHOOK);
  } catch (e) {
    console.log("INVALID WEBHOOK URL");
    res.end("Invalid webhook");
    return;
  }

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  const reqDiscord = https.request(options, res2 => {
    console.log("DISCORD STATUS:", res2.statusCode);
  });

  reqDiscord.on("error", err => {
    console.log("DISCORD ERROR:", err.message);
  });

  reqDiscord.write(payload);
  reqDiscord.end();

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
