const TOKEN_KEY = "duimai_runner_token";

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api";

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getRunnerToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setRunnerToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

async function parseJson<T>(res: Response): Promise<ApiResult<T>> {
  const text = await res.text();
  if (!text) {
    throw new ApiError(res.statusText || "Empty response", res.status);
  }
  try {
    return JSON.parse(text) as ApiResult<T>;
  } catch {
    throw new ApiError("Invalid JSON response", res.status);
  }
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>,
  auth = true,
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") url.searchParams.set(k, v);
    });
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth) {
    const token = getRunnerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), { method: "GET", headers });
  const body = await parseJson<T>(res);
  if (!res.ok || body.code !== 200) {
    throw new ApiError(body.message || res.statusText, res.status, body.code);
  }
  return body.data;
}

export async function apiPostForm<T>(
  path: string,
  form: FormData,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth) {
    const token = getRunnerToken();
    if (!token) {
      throw new ApiError("请先绑定参赛号登录后再使用语音输入", 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: form,
  });
  const body = await parseJson<T>(res);
  if (!res.ok || body.code !== 200) {
    throw new ApiError(body.message || res.statusText, res.status, body.code);
  }
  return body.data;
}

export async function apiPost<T>(
  path: string,
  payload: unknown,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = getRunnerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const body = await parseJson<T>(res);
  if (!res.ok || body.code !== 200) {
    throw new ApiError(body.message || res.statusText, res.status, body.code);
  }
  return body.data;
}
