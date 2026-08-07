import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import appPlugin from "@poltter-ai/app/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [appPlugin],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 3000,
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
})
