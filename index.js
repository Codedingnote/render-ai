const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const WEBHOOK = process.env.WEBHOOK;

// ===== กัน Discord 429 แบบถาวร =====
const notifiedIPs = new Map();
const IP_COOLDOWN = 60 * 1000; // 1 นาที ต่อ 1 IP

function detectDevice(ua) {
  ua = ua.toLowerCase();
  if (ua.includes("android")) return "📱 Android";
  if (ua.includes("iphone")) return "📱 iPhone";
  if (ua.includes("ipad")) return "💻 iPad";
  if (ua.includes("windows")) return "🖥️ Windows";
  if (ua.includes("mac os")) return "💻 macOS";
  if (ua.includes("linux")) return "🖥️ Linux";
  return "❓ Unknown";
}

const server = http.createServer((req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  console.log("REQUEST IN:", ip);

  if (!WEBHOOK || !WEBHOOK.startsWith("https://")) {
    res.end("Webhook not set");
    return;
  }

  // ===== กัน IP ซ้ำ =====
  const now = Date.now();
  const last = notifiedIPs.get(ip);
  if (last && now - last < IP_COOLDOWN) {
    console.log("SKIP DUP IP:", ip);
    res.end("OK");
    return;
  }
  notifiedIPs.set(ip, now);

  const ua = req.headers["user-agent"] || "unknown";
  const device = detectDevice(ua);

  const payload = JSON.stringify({
    embeds: [
      {
        title: "📣📢 แจ้งเตือน",
        color: 0xff5fa2,
        fields: [
          { name: "🌐 IP", value: ip, inline: false },
          { name: "🖥️ Device", value: device, inline: false }
        ],
        timestamp: new Date().toISOString()
      }
    ]
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

  const reqDiscord = https.request(options, r => {
    console.log("DISCORD STATUS:", r.statusCode);
  });

  reqDiscord.on("error", err => {
    console.log("DISCORD ERROR:", err.message);
  });

  reqDiscord.write(payload);
  reqDiscord.end();

  res.end("OK");
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
