// src/libs/auth-client.ts
import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  multiSessionClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { resolveApiOrigin } from "./api-base";

export const authClient = createAuthClient({
  baseURL: resolveApiOrigin(),
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