import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5001",
  plugins: [adminClient()],
  fetchOptions: {
    credentials: "include", // Required for cross-origin cookie support (FE & BE on different domains)
    onError: (ctx) => {
      console.error("[auth] fetch error:", ctx.error.message);
    },
  },
});
