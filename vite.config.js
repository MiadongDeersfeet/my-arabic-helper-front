import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite 개발 서버 및 React 플러그인 설정
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
