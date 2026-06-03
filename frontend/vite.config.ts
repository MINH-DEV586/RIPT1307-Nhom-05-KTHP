import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type { Plugin } from "vite";

// Intercepts Chrome DevTools auto-discovery request before React Router sees it
const suppressChromeDevtools = (): Plugin => ({
  name: "suppress-chrome-devtools",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith("/.well-known")) {
        res.writeHead(204);
        res.end();
        return;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [tailwindcss(), suppressChromeDevtools(), reactRouter(), tsconfigPaths()],
  ssr: {
    noExternal: ["xlsx"],
  },
  optimizeDeps: {
    include: ["xlsx"],
  },
});
