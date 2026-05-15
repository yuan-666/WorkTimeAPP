import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import api from "../functions/index.js";

const requestedPort = Number.parseInt(process.env.PORT || "4173", 10);
const PORT = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 4173;
const KV_FILE = path.join(process.cwd(), ".local-kv.json");

// Simple mock for Cloudflare Workers / ESA KV namespace
class LocalKV {
  constructor() {
    this.store = new Map();
  }
  async load() {
    try {
      const data = await fs.readFile(KV_FILE, "utf8");
      const json = JSON.parse(data);
      for (const [k, v] of Object.entries(json)) {
        this.store.set(k, v);
      }
    } catch (e) {
      // Ignore if file doesn't exist
    }
  }
  async save() {
    const obj = Object.fromEntries(this.store.entries());
    await fs.writeFile(KV_FILE, JSON.stringify(obj, null, 2));
  }
  async get(key) {
    return this.store.get(key) ?? null;
  }
  async put(key, value) {
    this.store.set(key, value);
    await this.save();
  }
}

async function startServer() {
  const kv = new LocalKV();
  await kv.load();

  // Initialize RSA key and default admin if missing
  if (!(await kv.get("RSA_key"))) {
    const pair = await crypto.subtle.generateKey(
      { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["encrypt", "decrypt"]
    );
    const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
    await kv.put("RSA_key", JSON.stringify(jwk));
    console.log("Generated local RSA_key.");
  }
  if (!(await kv.get("admin_name"))) {
    await kv.put("admin_name", "admin");
    const salt = "local-salt";
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("admin"), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120000 },
      key,
      256
    );
    const hash = Buffer.from(new Uint8Array(bits)).toString("base64url");
    await kv.put("admin_passwd", JSON.stringify({ salt, hash }));
    console.log("Generated default admin user: admin / admin");
  }

  const env = { worktimeapp: kv };

  const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json"
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);

      // 1. API Route -> Forward to ESA function
      if (url.pathname.startsWith("/api/")) {
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        const body = buffers.length ? Buffer.concat(buffers) : undefined;

        const webReq = new Request(url.href, {
          method: req.method,
          headers: req.headers,
          body: ["GET", "HEAD"].includes(req.method) ? undefined : body
        });

        const webRes = await api.fetch(webReq, env);
        res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()));

        if (webRes.body) {
          const reader = webRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
        return;
      }

      // 2. Static Files
      let filePath = path.join(process.cwd(), url.pathname === "/" ? "/index.html" : url.pathname);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
      } catch (e) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const content = await fs.readFile(filePath);

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end("Server Error");
    }
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`🚀 Local dev server running at http://127.0.0.1:${PORT}`);
    console.log(`📦 ESA API endpoints are locally mocked using functions/index.js and .local-kv.json`);
  });
}

startServer();
