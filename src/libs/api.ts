// src/libs/api.ts

const LOCAL_BASE = import.meta.env.VITE_BETTER_AUTH_URL || "https://ingeri-api.onrender.com/api";

async function baseRequest<T>(
  baseUrl: string,
  endpoint: string,
  options: RequestInit & { credentials?: RequestCredentials } = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  
  // Ensure correct slash separation between baseUrl and endpoint
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: isFormData ? { ...options.headers } : {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
    credentials: options.credentials || "include",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Request failed at ${url} (${response.status}): ${errorText || response.statusText}`);
  }

  // Handle empty responses gracefully
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// --- API Wrapper ---
export const localApi = {
  get: async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
    let queryPath = endpoint;
    if (params) {
      // Filter out undefined or null query params to keep URLs clean
      const cleanedParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
      );
      const query = new URLSearchParams(cleanedParams).toString();
      if (query) {
        queryPath += queryPath.includes('?') ? `&${query}` : `?${query}`;
      }
    }
    return baseRequest<T>(LOCAL_BASE, queryPath, { method: "GET", credentials: "include" });
  },

  post: async <T>(endpoint: string, body?: any): Promise<T> =>
    baseRequest<T>(LOCAL_BASE, endpoint, { method: "POST", body, credentials: "include" }),

  patch: async <T>(endpoint: string, body?: any): Promise<T> =>
    baseRequest<T>(LOCAL_BASE, endpoint, { method: "PATCH", body, credentials: "include" }),

  delete: async <T>(endpoint: string): Promise<T> =>
    baseRequest<T>(LOCAL_BASE, endpoint, { method: "DELETE", credentials: "include" }),
};