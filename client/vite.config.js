import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // send /api requests to the Express server so we don't need CORS
  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
