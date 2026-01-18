const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const WEBHOOK = process.env.WEBHOOK;

// กันยิงซ้ำ
const notifiedIPs = new Set();

function detectDevice(ua) {
  ua = ua.toLowerCase();
  if (ua.includes("android")) return "📱 Android";
  if (ua.includes("iphone")) return "📱 iPhone";
  if (ua.includes("ipad")) return "💻 iPad";
  if (ua.includes("windows")) return "🖥️ Windows";
  if (ua.includes("mac os")) return "💻 macOS";
  return "❓ Unknown";
}

const server = http.createServer((req, res) => {
  // ❌ ข้าม favicon
  if (req.url === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ❌ รับเฉพาะหน้า /
  if (req.url !== "/") {
    res.end("OK");
    return;
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  // ❌ ตัด localhost / Render internal
  if (ip === "::1" || ip.startsWith("35.") || ip.startsWith("34.")) {
    console.log("SKIP INTERNAL:", ip);
    res.end("OK");
    return;
  }

  console.log("REQUEST IN:", ip);

  // ❌ กัน IP ซ้ำ
  if (notifiedIPs.has(ip)) {
    console.log("SKIP DUP IP");
    res.end("OK");
    return;
  }
  notifiedIPs.add(ip);

  const ua = req.headers["user-agent"] || "";
  if (!ua.includes("Mozilla")) {
    console.log("SKIP NON-BROWSER");
    res.end("OK");
    return;
  }

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
