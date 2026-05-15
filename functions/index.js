const KV_NAMESPACE = "worktimeapp";
const ADMIN_NAME_KEY = "admin_name";
const ADMIN_PASSWD_KEY = "admin_passwd";
const PASSWORD_PRIVATE_KEY = "RSA_key";
const USER_INDEX_KEY = "users:index";
const USAGE_KEY = "usage:daily";
const MAX_DATA_BYTES = 1_800_000;
const HASH_ITERATIONS = 120_000;
const ADMIN_SESSION_TTL_SECONDS = 2 * 60 * 60;
const USER_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export default {
  async fetch(request, env = {}) {
    if (request.method === "OPTIONS") return corsResponse(null, 204);
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/admin")) {
        return await handleAdmin(request, env, url);
      }
      if (url.pathname.startsWith("/api/cloud")) {
        return await handleCloud(request, env, url);
      }
      return json({ ok: true, service: "worktimeapp" });
    } catch (error) {
      return json({ error: publicErrorMessage(error) }, error.status || 500);
    }
  }
};

async function handleCloud(request, env, url) {
  const kv = await getKV(env);
  if (request.method === "GET" && url.pathname.endsWith("/key")) {
    return json(await publicPasswordKey(kv));
  }
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > 500000) return json({ error: "请求体过大" }, 413);

  const payload = await request.json();
  const action = resolveAction(url, payload);
  const unknownFields = validatePayloadFields(action, payload);
  if (unknownFields.length) return json({ error: "请求包含未知字段" }, 400);
  const userId = normalizeUserId(payload.userId);
  if (!userId) return json({ error: "用户 ID 仅支持 3-64 位字母、数字、下划线或短横线" }, 400);

  const client = getClientInfo(request);
  if (!await checkRateLimit(kv, client)) return json({ error: "请求过于频繁，请稍后再试" }, 429);
  const key = userKey(userId);
  const existing = await readRecord(kv, key);
  const keyMaterial = await readPasswordKeyMaterial(kv).catch(() => null);
  if (!keyMaterial) return json({ error: "云端安全密钥未配置" }, 500);

  if (action === "register") {
    const password = await decryptPasswordPayload(kv, payload, "passwordCipher", keyMaterial);
    if (password.length < 6) return json({ error: "密码至少 6 位" }, 400);
    if (existing) return json({ error: "该账号已存在，请直接登录" }, 409);
    const data = sanitizeData(payload.data);
    const passwordInfo = await hashPassword(password);
    const now = new Date().toISOString();
    const record = {
      userId,
      ...passwordInfo,
      status: "active",
      revision: 1,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      lastIP: client.ip,
      lastIPPrefix: ipBucket(client.ip),
      lastUserAgent: client.ua,
      loginCount: 1,
      syncCount: 1,
      adminNote: "",
      data
    };
    await writeRecord(kv, key, record);
    await updateUserIndex(kv, userId, record);
    await recordUsage(kv, "register", client, userId);
    return json({ ...publicRecord(record), ...(await userSessionResponse(kv, userId, keyMaterial)) });
  }

  if (!existing) {
    await recordUsage(kv, "login_failed", client, userId);
    return json({ error: "账号或密码不正确" }, 401);
  }
  const session = action === "login" ? null : await verifyUserSession(request, kv, payload.sessionToken, keyMaterial);
  if (session && session.sub !== userId) {
    await recordUsage(kv, "login_failed", client, userId);
    return json({ error: "登录信息已过期，请重新登录" }, 401);
  }
  if (!session) {
    if (!payload.passwordCipher) return json({ error: "登录信息已过期，请重新登录" }, 401);
    const password = await decryptPasswordPayload(kv, payload, "passwordCipher", keyMaterial);
    if (password.length < 6) return json({ error: "密码至少 6 位" }, 400);
    const verified = await verifyPassword(password, existing.passwordSalt, existing.passwordHash);
    if (!verified) {
      await recordUsage(kv, "login_failed", client, userId);
      return json({ error: "账号或密码不正确" }, 401);
    }
  }
  if (existing.status === "disabled") return json({ error: "账号已停用，暂时无法云备份" }, 403);

  const touched = touchUser(existing, client, action);

  if (action === "login") {
    await writeRecord(kv, key, touched);
    await recordUsage(kv, "login", client, userId);
    return json({ ...publicRecord(touched), ...(await userSessionResponse(kv, userId, keyMaterial)) });
  }

  if (action === "pull") {
    await writeRecord(kv, key, touched);
    await recordUsage(kv, "pull", client, userId);
    return json({ ...publicRecord(touched), ...(await userSessionResponse(kv, userId, keyMaterial)), data: touched.data || null });
  }

  if (action === "push") {
    const knownUpdatedAt = String(payload.knownUpdatedAt || "");
    if (knownUpdatedAt && touched.updatedAt && knownUpdatedAt !== touched.updatedAt && !payload.force) {
      return json({
        error: "云端已有更新，请先恢复确认，或重新登录后再备份",
        updatedAt: touched.updatedAt
      }, 409);
    }
    const data = sanitizeData(payload.data);
    const now = new Date().toISOString();
    const next = {
      ...touched,
      revision: Number(touched.revision || 0) + 1,
      updatedAt: now,
      syncCount: Number(touched.syncCount || 0) + 1,
      data
    };
    await writeRecord(kv, key, next);
    await recordUsage(kv, "push", client, userId);
    return json({ ...publicRecord(next), ...(await userSessionResponse(kv, userId, keyMaterial)) });
  }

  if (action === "change-password") {
    const session = await verifyUserSession(request, kv, payload.sessionToken, keyMaterial);
    if (session && session.sub !== userId) {
      await recordUsage(kv, "login_failed", client, userId);
      return json({ error: "登录信息已过期，请重新登录" }, 401);
    }
    if (!session) {
      if (!payload.passwordCipher) return json({ error: "登录信息已过期，请重新登录" }, 401);
      const password = await decryptPasswordPayload(kv, payload, "passwordCipher", keyMaterial);
      if (password.length < 6) return json({ error: "密码至少 6 位" }, 400);
      const verified = await verifyPassword(password, existing.passwordSalt, existing.passwordHash);
      if (!verified) {
        await recordUsage(kv, "login_failed", client, userId);
        return json({ error: "原密码不正确" }, 401);
      }
    }
    if (existing.status === "disabled") return json({ error: "账号已停用，暂时无法云备份" }, 403);
    if (!payload.newPasswordCipher) return json({ error: "请提供新密码" }, 400);
    const newPassword = await decryptPasswordPayload(kv, payload, "newPasswordCipher", keyMaterial);
    if (newPassword.length < 6) return json({ error: "新密码至少 6 位" }, 400);
    const passwordInfo = await hashPassword(newPassword);
    const now = new Date().toISOString();
    const next = {
      ...existing,
      ...passwordInfo,
      updatedAt: now
    };
    await writeRecord(kv, key, next);
    await recordUsage(kv, "change_password", client, userId);
    return json({ ...publicRecord(next), ...(await userSessionResponse(kv, userId, keyMaterial)) });
  }

  return json({ error: "未知操作" }, 400);
}

async function handleAdmin(request, env, url) {
  const kv = await getKV(env);

  if (request.method === "POST" && url.pathname.endsWith("/login")) {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = await decryptPasswordPayload(kv, body);
    const ok = await verifyAdminCredentials(kv, username, password);
    if (!ok) return json({ error: "账号或密码不正确" }, 401);
    const token = await signAdminSession(kv, username);
    return json({
      token,
      expiresAt: new Date(Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000).toISOString()
    });
  }

  const session = await verifyAdminSession(request, kv);
  if (!session) return json({ error: "请先登录管理员后台" }, 401);

  if (request.method === "GET" && url.pathname.endsWith("/summary")) {
    return json(await buildAdminSummary(kv));
  }

  if (request.method === "POST" && url.pathname.endsWith("/user")) {
    try {
      const body = await request.json();
      return json(await adminUpdateUser(kv, body));
    } catch (error) {
      return json({ error: error.message || "管理员操作失败" }, 400);
    }
  }

  return json({ error: "Unknown admin endpoint" }, 404);
}

async function verifyAdminCredentials(kv, username, password) {
  const expectedName = await readTextValue(kv, ADMIN_NAME_KEY);
  const expectedPassword = await readRecord(kv, ADMIN_PASSWD_KEY);
  if (!expectedName || expectedPassword === null || expectedPassword === undefined) {
    throw new Error("管理员账号尚未配置");
  }
  if (!constantTimeEqual(username, expectedName)) return false;
  const passwordRecord = normalizePasswordCredential(expectedPassword);
  if (!passwordRecord) {
    throw new Error("管理员密码格式错误，请重新生成 admin_passwd");
  }
  if (passwordRecord.type === "hash") {
    return verifyPassword(password, passwordRecord.salt, passwordRecord.hash);
  }
  return Boolean(passwordRecord.password) && constantTimeEqual(password, passwordRecord.password);
}

async function adminUpdateUser(kv, body) {
  const userId = normalizeUserId(body.userId);
  if (!userId) throw new Error("无效用户 ID");
  const record = await readRecord(kv, userKey(userId));
  if (!record) throw new Error("用户不存在");
  const action = String(body.action || "");
  let next = { ...record };
  if (action === "resetPassword") {
    const newPassword = await decryptPasswordPayload(kv, body, "newPasswordCipher");
    if (newPassword.length < 6) throw new Error("新密码至少 6 位");
    next = { ...next, ...(await hashPassword(newPassword)), updatedAt: new Date().toISOString() };
  } else if (action === "disable") {
    next.status = "disabled";
    next.updatedAt = new Date().toISOString();
  } else if (action === "enable") {
    next.status = "active";
    next.updatedAt = new Date().toISOString();
  } else if (action === "note") {
    next.adminNote = String(body.note || "").slice(0, 200);
    next.updatedAt = new Date().toISOString();
  } else {
    throw new Error("未知管理员操作");
  }
  await writeRecord(kv, userKey(userId), next);
  await updateUserIndex(kv, userId, next);
  return { ok: true, user: publicAdminUser(next) };
}

async function buildAdminSummary(kv) {
  const ids = await readList(kv, USER_INDEX_KEY);
  const users = [];
  for (const userId of ids) {
    const record = await readRecord(kv, userKey(userId));
    if (record) users.push(publicAdminUser(record));
  }
  const usage = await readRecord(kv, USAGE_KEY) || { days: {}, ipBuckets: {}, actions: {} };
  const ipDistribution = Object.entries(usage.ipBuckets || {})
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  const actionCounts = Object.entries(usage.actions || {})
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);
  const dailyUsage = Object.entries(usage.days || {})
    .map(([date, value]) => ({ date, events: Number(value.events || 0), userCount: Object.keys(value.users || {}).length }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.status !== "disabled").length,
    disabledUsers: users.filter((user) => user.status === "disabled").length,
    totalSyncs: users.reduce((sum, user) => sum + Number(user.syncCount || 0), 0),
    totalLogins: users.reduce((sum, user) => sum + Number(user.loginCount || 0), 0),
    ipDistribution,
    actionCounts,
    dailyUsage,
    users: users.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
  };
}

function touchUser(record, client, action) {
  const now = new Date().toISOString();
  return {
    ...record,
    lastLoginAt: now,
    lastIP: client.ip,
    lastIPPrefix: ipBucket(client.ip),
    lastUserAgent: client.ua,
    loginCount: Number(record.loginCount || 0) + (action === "login" ? 1 : 0)
  };
}

async function updateUserIndex(kv, userId, record) {
  const ids = new Set(await readList(kv, USER_INDEX_KEY));
  if (!ids.has(userId)) {
    ids.add(userId);
    await writeRecord(kv, USER_INDEX_KEY, [...ids].sort());
  }
}

async function recordUsage(kv, action, client, userId = "unknown") {
  const today = new Date().toISOString().slice(0, 10);
  const usage = await readRecord(kv, USAGE_KEY) || { days: {}, ipBuckets: {}, actions: {} };
  usage.days[today] = usage.days[today] || { events: 0, users: {}, actions: {} };
  usage.days[today].events += 1;
  usage.days[today].users[userId] = true;
  usage.days[today].actions[action] = (usage.days[today].actions[action] || 0) + 1;
  const bucket = ipBucket(client.ip);
  usage.ipBuckets[bucket] = (usage.ipBuckets[bucket] || 0) + 1;
  usage.actions[action] = (usage.actions[action] || 0) + 1;
  await writeRecord(kv, USAGE_KEY, usage);
}

function resolveAction(url, payload) {
  if (payload.action) return String(payload.action);
  return url.pathname.split("/").filter(Boolean).at(-1) || "";
}

function normalizeUserId(value) {
  const text = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{3,64}$/.test(text) ? text : "";
}

async function getKV(env) {
  if (env?.worktimeapp) return env.worktimeapp;
  if (globalThis.worktimeapp) return globalThis.worktimeapp;
  if (typeof EdgeKV !== "undefined") return new EdgeKV({ namespace: KV_NAMESPACE });
  throw new Error("云存储暂不可用");
}

async function publicPasswordKey(kv) {
  const { jwk } = await readPasswordKeyMaterial(kv);
  const publicKey = publicJwkFromPrivate(jwk);
  return {
    publicKey,
    keyId: await keyFingerprint(publicKey)
  };
}

async function decryptPasswordPayload(kv, payload, fieldName = "passwordCipher", keyMaterial = null) {
  const ciphertext = String(payload[fieldName] || "");
  if (!ciphertext) throw httpError("请使用最新版应用进行安全登录", 400);
  const km = await readPasswordKeyMaterial(kv, keyMaterial);
  const { jwk } = km;
  let key;
  try {
    key = await crypto.subtle.importKey(
      "jwk",
      { ...jwk, alg: "RSA-OAEP-256", ext: true, key_ops: ["decrypt"] },
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );
  } catch {
    throw httpError("云端安全密钥配置异常", 500);
  }
  let encryptedBytes;
  try {
    encryptedBytes = base64UrlToBytes(ciphertext);
  } catch {
    throw httpError("登录信息格式不正确，请刷新页面后重试", 400);
  }
  let decrypted;
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      key,
      encryptedBytes
    );
  } catch {
    throw httpError("登录信息校验失败，请刷新页面后重试", 401);
  }
  const password = new TextDecoder().decode(decrypted);
  if (password.length > 128) throw httpError("密码过长", 400);
  return password;
}

let cachedPasswordKeyMaterial = null;
async function readPasswordKeyMaterial(kv, cached = null) {
  if (cached) return cached;
  if (cachedPasswordKeyMaterial) return cachedPasswordKeyMaterial;
  const value = await readRecord(kv, PASSWORD_PRIVATE_KEY);
  const jwk = normalizePrivateJwk(value);
  if (!jwk) throw new Error("云端安全密钥未配置");
  cachedPasswordKeyMaterial = {
    jwk,
    raw: typeof value === "string" ? value : JSON.stringify(value)
  };
  return cachedPasswordKeyMaterial;
}

function normalizePrivateJwk(value) {
  const parsed = typeof value === "string" ? parseMaybeJson(value) : value;
  const candidate = parsed?.privateKey || parsed?.jwk || parsed;
  if (candidate?.kty === "RSA" && candidate.n && candidate.e && candidate.d) return candidate;
  return null;
}

function normalizePasswordCredential(value) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? parseMaybeJson(value) : value;
  if (typeof parsed === "string") {
    const password = cleanStoredText(parsed);
    return password ? { type: "plain", password } : null;
  }
  if (parsed?.value !== undefined) return normalizePasswordCredential(parsed.value);
  if (parsed?.password !== undefined) return normalizePasswordCredential(parsed.password);
  if (parsed?.passwd !== undefined) return normalizePasswordCredential(parsed.passwd);
  if (parsed?.plain !== undefined) return normalizePasswordCredential(parsed.plain);
  const salt = parsed?.passwordSalt || parsed?.salt;
  const hash = parsed?.passwordHash || parsed?.hash;
  if (salt && hash) return { type: "hash", salt: String(salt).trim(), hash: String(hash).trim() };
  return null;
}

function publicJwkFromPrivate(jwk) {
  return {
    kty: "RSA",
    n: jwk.n,
    e: jwk.e,
    alg: "RSA-OAEP-256",
    ext: true,
    key_ops: ["encrypt"]
  };
}

async function keyFingerprint(publicKey) {
  const text = JSON.stringify({ kty: publicKey.kty, n: publicKey.n, e: publicKey.e });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return base64Url(new Uint8Array(digest)).slice(0, 16);
}

async function signAdminSession(kv, username) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: username,
    role: "admin",
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS
  };
  const body = base64UrlText(JSON.stringify(payload));
  const signature = await hmacSign(kv, body);
  return `${body}.${signature}`;
}

async function userSessionResponse(kv, userId, keyMaterial = null) {
  return {
    sessionToken: await signUserSession(kv, userId, keyMaterial),
    tokenExpiresAt: new Date(Date.now() + USER_SESSION_TTL_SECONDS * 1000).toISOString()
  };
}

async function signUserSession(kv, userId, keyMaterial = null) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    role: "user",
    iat: now,
    exp: now + USER_SESSION_TTL_SECONDS
  };
  const body = base64UrlText(JSON.stringify(payload));
  const signature = await hmacSign(kv, body, keyMaterial);
  return `${body}.${signature}`;
}

async function verifyAdminSession(request, kv) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await hmacSign(kv, body);
  if (!constantTimeEqual(signature, expected)) return null;
  let payload;
  try {
    payload = parseMaybeJson(new TextDecoder().decode(base64UrlToBytes(body)));
  } catch {
    return null;
  }
  if (!payload || payload.role !== "admin") return null;
  if (Number(payload.exp || 0) < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function verifyUserSession(request, kv, fallbackToken = "", keyMaterial = null) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : String(fallbackToken || "");
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await hmacSign(kv, body, keyMaterial);
  if (!constantTimeEqual(signature, expected)) return null;
  let payload;
  try {
    payload = parseMaybeJson(new TextDecoder().decode(base64UrlToBytes(body)));
  } catch {
    return null;
  }
  if (!payload || payload.role !== "user") return null;
  if (Number(payload.exp || 0) < Math.floor(Date.now() / 1000)) return null;
  if (!normalizeUserId(payload.sub)) return null;
  return payload;
}

async function hmacSign(kv, value, keyMaterial = null) {
  const km = await readPasswordKeyMaterial(kv, keyMaterial);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(km.raw));
  const key = await crypto.subtle.importKey(
    "raw",
    digest,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(new Uint8Array(signature));
}

async function readRecord(kv, key) {
  const value = await kv.get(key);
  if (!value) return null;
  if (typeof value === "string") return parseMaybeJson(value);
  if (typeof value.text === "function") return parseMaybeJson(await value.text());
  return value;
}

async function readTextValue(kv, key) {
  const value = await readRecord(kv, key);
  if (typeof value === "string") return cleanStoredText(value);
  if (value?.value !== undefined) return cleanStoredText(value.value);
  return "";
}

function parseMaybeJson(value) {
  const text = cleanStoredText(value);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function readList(kv, key) {
  const value = await readRecord(kv, key);
  return Array.isArray(value) ? value : [];
}

async function writeRecord(kv, key, record) {
  await kv.put(key, JSON.stringify(record));
}

function sanitizeData(data) {
  const settings = data?.settings && typeof data.settings === "object" ? { ...data.settings } : {};
  const shiftCalendar = sanitizeShiftCalendar(data?.shiftCalendar || settings.shiftCalendar || {});
  if (shiftCalendar) settings.shiftCalendar = shiftCalendar;
  const safe = {
    app: "worktimeapp",
    version: Number(data?.version || 3),
    exportedAt: String(data?.exportedAt || new Date().toISOString()),
    settings,
    shiftCalendar,
    entries: Array.isArray(data?.entries) ? data.entries : [],
    adjustments: Array.isArray(data?.adjustments) ? data.adjustments : [],
    activeView: data?.activeView || "calendar",
    backup: data?.backup || {}
  };
  const size = new TextEncoder().encode(JSON.stringify(safe)).byteLength;
  if (size > MAX_DATA_BYTES) throw new Error("云备份数据超过 1.8MB，请先导出本地备份或清理历史记录");
  return safe;
}

function sanitizeShiftCalendar(config = {}) {
  const source = config && typeof config === "object" ? config : {};
  const items = Array.isArray(source.items)
    ? source.items.slice(0, 31).map((item, index) => sanitizeShiftCalendarItem(item, index))
    : [];
  return {
    enabled: Boolean(source.enabled),
    name: String(source.name || "我的倒班").trim().slice(0, 24) || "我的倒班",
    teamName: String(source.teamName || "1 班").trim().slice(0, 18) || "1 班",
    anchorDate: isDateText(source.anchorDate) ? String(source.anchorDate) : "2026-05-15",
    anchorTime: isTimeText(source.anchorTime) ? String(source.anchorTime) : "00:00",
    items
  };
}

function sanitizeShiftCalendarItem(item = {}, index = 0) {
  const kinds = new Set(["day", "night", "offNight", "rest", "custom"]);
  const kind = kinds.has(item?.kind) ? item.kind : "day";
  const restLike = kind === "rest" || kind === "offNight";
  return {
    id: String(item?.id || `cycle-${index + 1}`).slice(0, 48),
    name: String(item?.name || `第${index + 1}天`).trim().slice(0, 18) || `第${index + 1}天`,
    kind,
    startTime: restLike ? "" : (isTimeText(item?.startTime) ? String(item.startTime) : ""),
    endTime: restLike ? "" : (isTimeText(item?.endTime) ? String(item.endTime) : "")
  };
}

function isDateText(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function isTimeText(value) {
  return /^\d{2}:\d{2}$/.test(String(value || ""));
}

async function hashPassword(password, salt = randomSalt()) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: HASH_ITERATIONS },
    key,
    256
  );
  return {
    passwordSalt: salt,
    passwordHash: base64Url(new Uint8Array(bits)),
    passwordAlgorithm: `PBKDF2-SHA256:${HASH_ITERATIONS}`
  };
}

async function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const { passwordHash } = await hashPassword(password, salt);
  return constantTimeEqual(passwordHash, expectedHash);
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlText(text) {
  return base64Url(new TextEncoder().encode(text));
}

function base64UrlToBytes(value) {
  const text = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(text)) throw new Error("invalid base64url");
  const normalized = text.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function cleanStoredText(value) {
  let text = String(value ?? "").trim();
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) text = fenced[1].trim();
  return text;
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.publicMessage = message;
  return error;
}

function publicErrorMessage(error) {
  const message = error?.publicMessage || error?.message || "";
  if (/base64|decode|decrypt|DataError|OperationError/i.test(message)) {
    return "登录信息校验失败，请刷新页面后重试";
  }
  return message || "服务暂时不可用";
}

function constantTimeEqual(left = "", right = "") {
  const a = String(left);
  const b = String(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

function getClientInfo(request) {
  const ip = getClientIP(request);
  return {
    ip,
    ua: String(request.headers.get("user-agent") || "").slice(0, 300)
  };
}

function getClientIP(request) {
  const headers = ["ali-real-client-ip", "ali-cdn-real-ip", "cf-connecting-ip", "x-real-ip", "x-client-ip", "x-forwarded-for"];
  for (const header of headers) {
    const value = request.headers.get(header);
    if (!value) continue;
    const ip = normalizeIP(value.split(",")[0]);
    if (ip) return ip;
  }
  return "0.0.0.0";
}

function normalizeIP(value) {
  let ip = String(value || "").trim().replace(/^"|"$/g, "");
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.replace(/:\d+$/, "");
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) return ip;
  if (ip.includes(":") && /^[0-9a-f:.]+$/i.test(ip)) return ip.toLowerCase();
  return "";
}

function ipBucket(ip) {
  if (!ip || ip === "0.0.0.0") return "unknown";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) return `ipv4_${ip.split(".").slice(0, 3).join("_")}_0_24`;
  if (ip.includes(":")) return `ipv6_${ip.split(":").slice(0, 3).join("_")}_48`;
  return "unknown";
}

function publicRecord(record) {
  return {
    userId: record.userId,
    revision: record.revision || 1,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    hasData: Boolean(record.data)
  };
}

function publicAdminUser(record) {
  const data = record.data || {};
  const shiftCalendar = data.shiftCalendar || data.settings?.shiftCalendar || {};
  return {
    userId: record.userId,
    status: record.status || "active",
    revision: record.revision || 1,
    createdAt: record.createdAt || "",
    updatedAt: record.updatedAt || "",
    lastLoginAt: record.lastLoginAt || "",
    lastIPPrefix: record.lastIPPrefix || ipBucket(record.lastIP),
    loginCount: Number(record.loginCount || 0),
    syncCount: Number(record.syncCount || 0),
    entryCount: Array.isArray(data.entries) ? data.entries.length : 0,
    adjustmentCount: Array.isArray(data.adjustments) ? data.adjustments.length : 0,
    shiftCalendarEnabled: Boolean(shiftCalendar.enabled),
    shiftCycleLength: Array.isArray(shiftCalendar.items) ? shiftCalendar.items.length : 0,
    adminNote: record.adminNote || ""
  };
}

function userKey(userId) {
  return `user:${userId}`;
}

const ALLOWED_PAYLOAD_FIELDS = {
  register: ["action", "userId", "passwordCipher", "passwordKeyId", "data"],
  login: ["action", "userId", "passwordCipher", "passwordKeyId", "sessionToken"],
  pull: ["action", "userId", "passwordCipher", "passwordKeyId", "sessionToken"],
  push: ["action", "userId", "passwordCipher", "passwordKeyId", "sessionToken", "data", "knownUpdatedAt", "force"],
  "change-password": ["action", "userId", "passwordCipher", "passwordKeyId", "sessionToken", "newPasswordCipher"]
};

function validatePayloadFields(action, payload) {
  const allowed = ALLOWED_PAYLOAD_FIELDS[action];
  if (!allowed) return [];
  return Object.keys(payload).filter((k) => !allowed.includes(k));
}

const rateLimitMap = new Map();
async function checkRateLimit(kv, client) {
  const now = Date.now();
  const entry = rateLimitMap.get(client.ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60000) {
    rateLimitMap.set(client.ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count += 1;
  rateLimitMap.set(client.ip, entry);
  return true;
}

function json(body, status = 200) {
  return corsResponse(JSON.stringify(body), status, { "content-type": "application/json;charset=utf-8" });
}

function corsResponse(body, status, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
      ...headers
    }
  });
}
