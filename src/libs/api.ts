// src/libs/api.ts
import { resolveApiBaseUrl } from "./api-base";

const LOCAL_BASE = resolveApiBaseUrl();

async function baseRequest<T>(
  baseUrl: string,
  endpoint: string,
  options: RequestInit & { credentials?: RequestCredentials } = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const cleanBase = baseUrl.replace(/\/+$/, "");
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Prevent /api/api/... if an endpoint already starts with /api/
  if (cleanBase.endsWith("/api") && cleanEndpoint.startsWith("/api/")) {
    cleanEndpoint = cleanEndpoint.slice(4);
  }

  const url = `${cleanBase}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: isFormData
      ? { ...options.headers }
      : {
          "Content-Type": "application/json",
          ...options.headers,
        },
    body: isFormData
      ? options.body
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    credentials: options.credentials || "include",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Request failed at ${url} (${response.status}): ${text || response.statusText}`,
    );
  }

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Expected JSON from ${url}, received non-JSON response starting with: ${text
        .slice(0, 80)
        .replace(/\s+/g, " ")}`,
    );
  }
}

// --- API Wrapper ---
export const localApi = {
  get: async <T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<T> => {
    let queryPath = endpoint;
    if (params) {
      const cleanedParams = Object.fromEntries(
        Object.entries(params).filter(
          ([_, v]) => v !== undefined && v !== null,
        ),
      );
      const query = new URLSearchParams(cleanedParams).toString();
      if (query) {
        queryPath += queryPath.includes("?") ? `&${query}` : `?${query}`;
      }
    }
    return baseRequest<T>(LOCAL_BASE, queryPath, {
      method: "GET",
      credentials: "include",
    });
  },

  post: async <T>(endpoint: string, body?: any): Promise<T> =>
    baseRequest<T>(LOCAL_BASE, endpoint, {
      method: "POST",
      body,
      credentials: "include",
    }),

  patch: async <T>(endpoint: string, body?: any): Promise<T> =>
    baseRequest<T>(LOCAL_BASE, endpoint, {
      method: "PATCH",
      body,
      credentials: "include",
    }),

  delete: async <T>(endpoint: string): Promise<T> =>
    baseRequest<T>(LOCAL_BASE, endpoint, {
      method: "DELETE",
      credentials: "include",
    }),
};