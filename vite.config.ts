import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // This enables PWA generation in dev mode!
        navigateFallback: 'index.html'
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        id: "/",
        name: "Ingeni App",
        short_name: "Ingeni",
        description: "Your application description",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/desktop-shot.png",
            sizes: "1280x800",
            type: "image/png",
            form_factor: "wide",
            label: "Ingeni Desktop View"
          },
          {
            src: "/mobile-shot.png",
            sizes: "750x1334",
            type: "image/png",
            label: "Ingeni Mobile View"
          }
        ],
        protocol_handlers: [
          {
            protocol: "web+ingeni",
            url: "/open?url=%s"
          },
          {
            protocol: "web+ingeniproduct",
            url: "/products?ref=%s"
          }
        ]
      },
      workbox: {
        // Glob patterns to cache local assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg}"],
        // Runtime caching for external APIs or backend requests
        runtimeCaching: [
          {
            // Match your backend API routes (change /api/ to match your backend route prefix)
            urlPattern: /^https?:\/\/.*\/.*/i, // Adjust this pattern if your API is on a specific domain or path like /api/v1/
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Allows access from Docker container
    port: 5173, // Default Vite port
    watch: {
      usePolling: true, // Fixes hot reload issues in some environments
    },
  },
});
