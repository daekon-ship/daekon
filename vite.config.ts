import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // project pages: https://daekon-ship.github.io/daekon/
  // saját domain (daekon.hu, FTP deploy): `npm run build:ftp` → gyökér
  base: mode === "ftp" ? "/" : "/daekon/",
  plugins: [react()],
}));
