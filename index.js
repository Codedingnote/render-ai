const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const WEBHOOK = process.env.WEBHOOK;

// ===== กันสแปม Discord =====
let lastSent = 0;
const COOLDOWN = 5000; // 5 วินาที

function detectDevice(ua) {
  ua = ua.toLowerCase();

  if (ua.includes("android")) return "📱 Android";
  if (ua.includes("iphone")) return "📱 iPhone";
  if (ua.includes("ipad")) return "💻 iPad";
  if (ua.includes("windows")) return "🖥️ Windows";
  if (ua.includes("mac os")) return "💻 macOS";
  if (ua.includes("linux")) return "🖥️ Linux";

  return "❓ Unknown device";
}

const server = http.createServer((req, res) => {
  console.log("REQUEST IN");

  if (!WEBHOOK || !WEBHOOK.startsWith("https://")) {
    console.log("WEBHOOK NOT SET");
    res.end("Webhook not set");
    return;
  }

  // กันยิงถี่
  const now = Date.now();
  if (now - lastSent < COOLDOWN) {
    console.log("COOLDOWN ACTIVE");
    res.end("OK");
    return;
  }
  lastSent = now;

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  const ua = req.headers["user-agent"] || "unknown";
  const device = detectDevice(ua);

  // ===== Discord Embed =====
  const payload = JSON.stringify({
    embeds: [
      {
        title: "📣📢 แจ้งเตือน",
        color: 0xff5fa2, // ชมพู
        fields: [
          {
            name: "🌐 IP",
            value: ip,
            inline: false
          },
          {
            name: "🖥️ Device",
            value: device,
            inline: false
          }
        ],
        footer: {
          text: "Website Access Notification"
        },
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
