import assert from "node:assert/strict";
import test from "node:test";
import api from "../functions/index.js";

class MemoryKV {
  constructor(initial = {}) {
    this.store = new Map(Object.entries(initial));
  }

  async get(key) {
    return this.store.get(key) ?? null;
  }

  async put(key, value) {
    this.store.set(key, value);
  }
}

test("admin login accepts fenced RSA_key and salt/hash admin_passwd", async () => {
  const password = "test-admin-password-123";
  const privateJwk = await generatePrivateJwk();
  const passwordRecord = await hashPassword(password, "test-salt");
  const kv = new MemoryKV({
    RSA_key: `\`\`\`json\n${JSON.stringify(privateJwk)}\n\`\`\``,
    admin_name: " admin ",
    admin_passwd: JSON.stringify({
      salt: passwordRecord.passwordSalt,
      hash: passwordRecord.passwordHash
    })
  });
  const env = { worktimeapp: kv };

  const keyResponse = await api.fetch(new Request("https://example.com/api/cloud/key"), env);
  assert.equal(keyResponse.status, 200);
  const keyInfo = await keyResponse.json();
  assert.equal(keyInfo.publicKey.kty, "RSA");

  const passwordCipher = await encryptPassword(password, keyInfo.publicKey);
  const loginResponse = await api.fetch(new Request("https://example.com/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", passwordCipher })
  }), env);
  const result = await loginResponse.json();

  assert.equal(loginResponse.status, 200);
  assert.match(result.token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
});

test("admin login hides malformed ciphertext internals", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({
    RSA_key: JSON.stringify(privateJwk),
    admin_name: "admin",
    admin_passwd: "secret123"
  });

  const response = await api.fetch(new Request("https://example.com/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", passwordCipher: "not valid!!!" })
  }), { worktimeapp: kv });
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.error, "登录信息格式不正确，请刷新页面后重试");
  assert.doesNotMatch(result.error, /base64|decode|atob/i);
});

async function generatePrivateJwk() {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );
  return crypto.subtle.exportKey("jwk", pair.privateKey);
}

async function encryptPassword(password, publicJwk) {
  const key = await crypto.subtle.importKey(
    "jwk",
    publicJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    new TextEncoder().encode(password)
  );
  return Buffer.from(new Uint8Array(encrypted)).toString("base64url");
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120_000 },
    key,
    256
  );
  return {
    passwordSalt: salt,
    passwordHash: Buffer.from(new Uint8Array(bits)).toString("base64url")
  };
}
