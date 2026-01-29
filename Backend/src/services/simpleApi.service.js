// src/services/simpleApi.service.js
export class SimpleApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "SimpleApiError";
    this.status = status || 500;
    this.details = details;
  }
}

function getBaseUrl() {
  return process.env.SIMPLEAPI_BASE_URL || "https://api.simpleapi.cl";
}

function getApiKey() {
  const key = process.env.SIMPLEAPI_API_KEY;
  if (!key) throw new SimpleApiError("Falta SIMPLEAPI_API_KEY en .env", 500);
  return key;
}

export async function simpleApiJson(path, { method = "GET", body, headers = {} } = {}) {
  const url = `${getBaseUrl()}${path}`;
  const apiKey = getApiKey();

  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!resp.ok) {
    throw new SimpleApiError(
      data?.message || data?.error || `SimpleAPI error (${resp.status})`,
      resp.status,
      data
    );
  }

  return data;
}

export async function simpleApiMultipart(path, { formData, method = "POST", headers = {} } = {}) {
  const url = `${getBaseUrl()}${path}`;
  const apiKey = getApiKey();

  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: apiKey,
      ...headers,
    },
    body: formData,
  });

  const text = await resp.text();

  if (!resp.ok) {
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    throw new SimpleApiError(
      data?.message || data?.error || `SimpleAPI error (${resp.status})`,
      resp.status,
      data
    );
  }

  return text; // puede ser XML
}
