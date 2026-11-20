import { createAuthClient } from "better-auth/react";
import { 
  adminClient, 
  organizationClient, 
  multiSessionClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Vite requires the VITE_ prefix to expose env vars to the browser
  baseURL: import.meta.env.VITE_API_URL || "https://ingeri-api.onrender.com",
  plugins: [
    adminClient(),
    organizationClient(),
    multiSessionClient(),
    lastLoginMethodClient(),
  ],
  fetchOptions: {
    credentials: "include",
  },
  // Custom fields that your backend expects in the session user object
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