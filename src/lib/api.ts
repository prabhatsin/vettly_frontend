import { clearToken, getToken } from "@/lib/token";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ValidationItem = { loc?: (string | number)[]; msg?: string };

/** Turns `{detail}` (a string, or a 422 array) into one readable message. */
function detailMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item: ValidationItem) => {
        const field = item.loc?.filter((p) => p !== "body").join(".");
        const msg = item.msg ?? "Invalid value";
        return field ? `${field}: ${msg}` : msg;
      })
      .join(". ");
  }
  if (status >= 500) return "The server had a problem. Please try again.";
  return `Request failed (${status}).`;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Sent as JSON. */
  body?: unknown;
  /** Sent as multipart form data instead of `body`. */
  formData?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not set.");
  }

  const token = getToken();
  const headers: Record<string, string> = { ...opts.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body,
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    // An expired or invalid session: drop it and send the user to log in.
    // A 401 without a token (e.g. wrong password on login) is a normal error.
    if (res.status === 401 && token) {
      clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        // Full reload on purpose: drops all client state from the old session.
        window.location.href = new URL(`/login?next=${next}`, window.location.origin).href;
      }
    }
    throw new ApiError(res.status, detailMessage(data, res.status));
  }

  return data as T;
}
