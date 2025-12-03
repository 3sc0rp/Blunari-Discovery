// Server-side Supabase REST helpers (service role only). Do NOT import from client code.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseEnabled = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
);

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    Accept: "application/json",
    ...extra,
  };
}

function toUrl(path, params) {
  const url = new URL(path, SUPABASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

export async function sbGet(path, params) {
  const url = toUrl(path, params);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(
      `Supabase GET ${path} -> [${res.status}] ${res.statusText}`,
    );
  }
  return res.json();
}

export async function sbRequest(
  path,
  { method = "GET", params, json, extraHeaders } = {},
) {
  const url = toUrl(path, params);
  const init = {
    method,
    headers: headers(
      json
        ? { "Content-Type": "application/json", ...extraHeaders }
        : extraHeaders,
    ),
    body: json ? JSON.stringify(json) : undefined,
  };
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(
      `Supabase ${method} ${path} -> [${res.status}] ${res.statusText}`,
    );
  }
  return res.json().catch(() => null);
}

// Storage helpers
export async function ensureBucket(name, isPublic = false) {
  if (!supabaseEnabled) return;
  try {
    await sbRequest("/storage/v1/bucket", {
      method: "POST",
      json: { name, public: isPublic },
    });
  } catch (err) {
    // 409 conflict means it already exists. We ignore this case.
    if (!String(err.message || "").includes("409")) {
      throw err;
    }
  }
}

export async function createSignedUploadUrl(bucket, objectPath, contentType) {
  // API: POST /storage/v1/object/upload/sign/{bucket}/{object}
  const path = `/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeURIComponent(
    objectPath,
  )}`;
  const json = { contentType, upsert: true }; // allow overwrites
  const data = await sbRequest(path, { method: "POST", json });
  return data; // contains { signedUrl, path, token, url } (shape may vary by version)
}

export async function createSignedReadUrl(
  bucket,
  objectPath,
  expiresIn = 60 * 5,
) {
  // API: POST /storage/v1/object/sign/{bucket}/{object}
  const path = `/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeURIComponent(
    objectPath,
  )}`;
  const json = { expiresIn };
  const data = await sbRequest(path, { method: "POST", json });
  return data; // { signedUrl }
}

export async function fromTable(table, params) {
  // Convenient wrapper for GET on tables
  return sbGet(`/rest/v1/${table}`, params);
}

export async function upsert(table, rows) {
  // Uses PostgREST upsert with prefer: resolution=merge-duplicates
  const path = `/rest/v1/${table}`;
  return sbRequest(path, {
    method: "POST",
    json: Array.isArray(rows) ? rows : [rows],
    extraHeaders: { Prefer: "resolution=merge-duplicates" },
  });
}

export async function insert(table, row) {
  const path = `/rest/v1/${table}`;
  return sbRequest(path, { method: "POST", json: row });
}

export async function remove(table, params) {
  const path = `/rest/v1/${table}`;
  // params become query string filters
  return sbRequest(path, { method: "DELETE", params });
}
