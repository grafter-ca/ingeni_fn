import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  multiSessionClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";

const resolveAuthBaseUrl = (): string => {
  const isDeployedSite =
    import.meta.env.PROD ||
    (typeof window !== "undefined" &&
      window.location.hostname === "ingeni.onrender.com");

  if (isDeployedSite && typeof window !== "undefined") {
    return window.location.origin;
  }

  const rawUrl = (
    import.meta.env.VITE_API_URL || "https://ingeri-api.onrender.com"
  )
    .trim()
    .replace(/\/+$/, "");

  return rawUrl.replace(/\/api$/, "");
};

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseUrl(),
  plugins: [
    adminClient(),
    organizationClient(),
    multiSessionClient(),
    lastLoginMethodClient(),
  ],
  fetchOptions: {
    credentials: "include",
  },
  session: {
    user: {
      fields: {
        role: "string",
        phone: "string",
        country: "string",
      },
    },
  },
});