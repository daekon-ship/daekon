import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // project pages: https://daekon-ship.github.io/daekon/
  base: "/daekon/",
  plugins: [react()],
});
