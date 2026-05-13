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

test("cloud user session token can sync without resending password", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({ RSA_key: JSON.stringify(privateJwk) });
  const env = { worktimeapp: kv };
  const keyInfo = await publicKeyInfo(env);
  const passwordCipher = await encryptPassword("worker-password-123", keyInfo.publicKey);
  const initialData = cloudData([{ id: "entry_1", date: "2026-05-01", totalHours: 8 }]);

  const registerResponse = await cloudRequest(env, {
    action: "register",
    userId: "worker_1",
    passwordCipher,
    data: initialData
  });
  const registered = await registerResponse.json();
  assert.equal(registerResponse.status, 200);
  assert.match(registered.sessionToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.ok(registered.tokenExpiresAt);

  const pushResponse = await cloudRequest(env, {
    action: "push",
    userId: "worker_1",
    knownUpdatedAt: registered.updatedAt,
    data: cloudData([{ id: "entry_2", date: "2026-05-02", totalHours: 9 }])
  }, registered.sessionToken);
  const pushed = await pushResponse.json();
  assert.equal(pushResponse.status, 200);
  assert.match(pushed.sessionToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

  const pullResponse = await cloudRequest(env, {
    action: "pull",
    userId: "worker_1"
  }, pushed.sessionToken);
  const pulled = await pullResponse.json();
  assert.equal(pullResponse.status, 200);
  assert.equal(pulled.data.entries[0].id, "entry_2");

  const secondPasswordCipher = await encryptPassword("second-password-123", keyInfo.publicKey);
  await cloudRequest(env, {
    action: "register",
    userId: "worker_2",
    passwordCipher: secondPasswordCipher,
    data: cloudData([])
  });
  const mismatchResponse = await cloudRequest(env, {
    action: "pull",
    userId: "worker_2"
  }, pushed.sessionToken);
  assert.equal(mismatchResponse.status, 401);
});

test("cloud push conflict can be forced after explicit overwrite", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({ RSA_key: JSON.stringify(privateJwk) });
  const env = { worktimeapp: kv };
  const keyInfo = await publicKeyInfo(env);
  const passwordCipher = await encryptPassword("worker-password-456", keyInfo.publicKey);

  const registerResponse = await cloudRequest(env, {
    action: "register",
    userId: "worker_3",
    passwordCipher,
    data: cloudData([{ id: "base", date: "2026-05-01", totalHours: 8 }])
  });
  const registered = await registerResponse.json();

  const firstPushResponse = await cloudRequest(env, {
    action: "push",
    userId: "worker_3",
    knownUpdatedAt: registered.updatedAt,
    data: cloudData([{ id: "server_new", date: "2026-05-02", totalHours: 8 }])
  }, registered.sessionToken);
  const firstPush = await firstPushResponse.json();
  assert.equal(firstPushResponse.status, 200);

  const conflictResponse = await cloudRequest(env, {
    action: "push",
    userId: "worker_3",
    knownUpdatedAt: "2026-01-01T00:00:00.000Z",
    data: cloudData([{ id: "local_old", date: "2026-05-03", totalHours: 8 }])
  }, firstPush.sessionToken);
  assert.equal(conflictResponse.status, 409);

  const forcedResponse = await cloudRequest(env, {
    action: "push",
    userId: "worker_3",
    knownUpdatedAt: "2026-01-01T00:00:00.000Z",
    force: true,
    data: cloudData([{ id: "local_forced", date: "2026-05-04", totalHours: 8 }])
  }, firstPush.sessionToken);
  const forced = await forcedResponse.json();
  assert.equal(forcedResponse.status, 200);

  const pullResponse = await cloudRequest(env, {
    action: "pull",
    userId: "worker_3"
  }, forced.sessionToken);
  const pulled = await pullResponse.json();
  assert.equal(pulled.data.entries[0].id, "local_forced");
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

async function publicKeyInfo(env) {
  const keyResponse = await api.fetch(new Request("https://example.com/api/cloud/key"), env);
  assert.equal(keyResponse.status, 200);
  return keyResponse.json();
}

async function cloudRequest(env, body, sessionToken = "") {
  return api.fetch(new Request("https://example.com/api/cloud", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {})
    },
    body: JSON.stringify(body)
  }), env);
}

function cloudData(entries) {
  return {
    app: "worktimeapp",
    version: 2,
    exportedAt: "2026-05-13T00:00:00.000Z",
    settings: {},
    entries,
    adjustments: [],
    activeView: "calendar",
    backup: {}
  };
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
