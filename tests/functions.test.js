import assert from "node:assert/strict";
import test from "node:test";
import api from "../functions/index.js";

let testIpCounter = 1;

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

test("cloud sync preserves shift calendar settings and explicit snapshot field", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({ RSA_key: JSON.stringify(privateJwk) });
  const env = { worktimeapp: kv };
  const keyInfo = await publicKeyInfo(env);
  const passwordCipher = await encryptPassword("shift-worker-password", keyInfo.publicKey);
  const shiftCalendar = {
    enabled: true,
    name: "A 线倒班",
    teamName: "乙班",
    anchorDate: "2026-05-15",
    anchorTime: "08:00",
    items: [
      { id: "day", name: "早班", kind: "day", startTime: "08:00", endTime: "16:00" },
      { id: "night", name: "夜班", kind: "night", startTime: "20:00", endTime: "04:00" },
      { id: "off", name: "下夜班", kind: "offNight", startTime: "09:00", endTime: "10:00" },
      { id: "rest", name: "休班", kind: "rest", startTime: "09:00", endTime: "10:00" }
    ]
  };

  const registerResponse = await cloudRequest(env, {
    action: "register",
    userId: "shift_worker",
    passwordCipher,
    data: {
      ...cloudData([]),
      shiftCalendar,
      settings: { shiftCalendar }
    }
  });
  const registered = await registerResponse.json();
  assert.equal(registerResponse.status, 200);

  const pullResponse = await cloudRequest(env, {
    action: "pull",
    userId: "shift_worker"
  }, registered.sessionToken);
  const pulled = await pullResponse.json();

  assert.equal(pullResponse.status, 200);
  assert.equal(pulled.data.shiftCalendar.enabled, true);
  assert.equal(pulled.data.shiftCalendar.anchorTime, "08:00");
  assert.equal(pulled.data.settings.shiftCalendar.teamName, "乙班");
  assert.equal(pulled.data.shiftCalendar.items[1].startTime, "20:00");
  assert.equal(pulled.data.shiftCalendar.items[1].endTime, "04:00");
  assert.equal(pulled.data.shiftCalendar.items[2].startTime, "");
  assert.equal(pulled.data.shiftCalendar.items[2].endTime, "");
});

test("cloud snapshot sanitizes settings and strips unknown fields", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({ RSA_key: JSON.stringify(privateJwk) });
  const env = { worktimeapp: kv };
  const keyInfo = await publicKeyInfo(env);
  const passwordCipher = await encryptPassword("settings-worker-password", keyInfo.publicKey);

  const registerResponse = await cloudRequest(env, {
    action: "register",
    userId: "settings_worker",
    passwordCipher,
    data: {
      ...cloudData([]),
      settings: {
        baseSalary: 8888.88,
        weekStart: 1,
        handedness: "left",
        unknownHtml: "<img src=x onerror=alert(1)>",
        tax: {
          standardDeductionMonthly: 5000,
          unknownTaxField: "remove-me"
        }
      }
    }
  });
  const registered = await registerResponse.json();
  assert.equal(registerResponse.status, 200);

  const pullResponse = await cloudRequest(env, {
    action: "pull",
    userId: "settings_worker"
  }, registered.sessionToken);
  const pulled = await pullResponse.json();

  assert.equal(pullResponse.status, 200);
  assert.equal(pulled.data.settings.baseSalary, 8888.88);
  assert.equal(pulled.data.settings.handedness, "left");
  assert.equal(pulled.data.settings.unknownHtml, undefined);
  assert.equal(pulled.data.settings.tax.unknownTaxField, undefined);
});

test("api rejects untrusted origins and oversized json bodies", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({ RSA_key: JSON.stringify(privateJwk) });

  const nativeResponse = await api.fetch(new Request("https://time.yuan6.cn/api/cloud/key", {
    headers: { origin: "capacitor://localhost" }
  }), { worktimeapp: kv });
  assert.equal(nativeResponse.status, 200);
  assert.equal(nativeResponse.headers.get("access-control-allow-origin"), "capacitor://localhost");

  const corsResponse = await api.fetch(new Request("https://example.com/api/cloud/key", {
    headers: { origin: "https://evil.example" }
  }), { worktimeapp: kv });
  assert.equal(corsResponse.status, 403);
  assert.equal(corsResponse.headers.get("access-control-allow-origin"), null);

  const largeResponse = await api.fetch(new Request("https://example.com/api/cloud", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "ali-real-client-ip": "198.51.100.220"
    },
    body: JSON.stringify({ action: "login", userId: "worker_big", passwordCipher: "a".repeat(520000) })
  }), { worktimeapp: kv });
  assert.equal(largeResponse.status, 413);
});

test("cloud rejects unknown actions before password checks", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({ RSA_key: JSON.stringify(privateJwk) });
  const response = await cloudRequest({ worktimeapp: kv }, {
    action: "login_probe_1",
    userId: "known_user",
    passwordCipher: "not-valid"
  });
  const result = await response.json();
  assert.equal(response.status, 400);
  assert.equal(result.error, "未知操作");
});

test("admin login is rate limited by trusted client ip", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({
    RSA_key: JSON.stringify(privateJwk),
    admin_name: "admin",
    admin_passwd: "secret123"
  });
  const env = { worktimeapp: kv };
  let lastResponse;
  for (let index = 0; index < 7; index += 1) {
    lastResponse = await api.fetch(new Request("https://example.com/api/admin/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "ali-real-client-ip": "198.51.100.221"
      },
      body: JSON.stringify({ username: "admin", passwordCipher: "not-valid" })
    }), env);
  }
  assert.equal(lastResponse.status, 429);
});

test("user password changes invalidate old session tokens", async () => {
  const privateJwk = await generatePrivateJwk();
  const kv = new MemoryKV({ RSA_key: JSON.stringify(privateJwk) });
  const env = { worktimeapp: kv };
  const keyInfo = await publicKeyInfo(env);
  const oldPasswordCipher = await encryptPassword("session-worker-password", keyInfo.publicKey);
  const newPasswordCipher = await encryptPassword("session-worker-new-password", keyInfo.publicKey);

  const registerResponse = await cloudRequest(env, {
    action: "register",
    userId: "session_worker",
    passwordCipher: oldPasswordCipher,
    data: cloudData([])
  });
  const registered = await registerResponse.json();
  assert.equal(registerResponse.status, 200);

  const missingPasswordResponse = await cloudRequest(env, {
    action: "change-password",
    userId: "session_worker",
    sessionToken: registered.sessionToken,
    newPasswordCipher
  }, registered.sessionToken);
  assert.equal(missingPasswordResponse.status, 400);

  const changeResponse = await cloudRequest(env, {
    action: "change-password",
    userId: "session_worker",
    sessionToken: registered.sessionToken,
    passwordCipher: oldPasswordCipher,
    newPasswordCipher
  }, registered.sessionToken);
  const changed = await changeResponse.json();
  assert.equal(changeResponse.status, 200);

  const oldPullResponse = await cloudRequest(env, {
    action: "pull",
    userId: "session_worker"
  }, registered.sessionToken);
  assert.equal(oldPullResponse.status, 401);

  const newPullResponse = await cloudRequest(env, {
    action: "pull",
    userId: "session_worker"
  }, changed.sessionToken);
  assert.equal(newPullResponse.status, 200);
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
      "ali-real-client-ip": `198.51.100.${testIpCounter++}`,
      ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {})
    },
    body: JSON.stringify(body)
  }), env);
}

function cloudData(entries) {
  return {
    app: "worktimeapp",
    version: 3,
    exportedAt: "2026-05-13T00:00:00.000Z",
    settings: {},
    shiftCalendar: {
      enabled: false,
      name: "我的倒班",
      teamName: "1 班",
      anchorDate: "2026-05-15",
      anchorTime: "00:00",
      items: []
    },
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
