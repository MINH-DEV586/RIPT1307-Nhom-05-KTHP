import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:5001",
  plugins: [adminClient()],
  fetchOptions: {
    // Disable automatic refetch on window focus to reduce noise in terminal
    onError: (ctx) => {
      console.error("[auth] fetch error:", ctx.error.message);
    },
  },
});
