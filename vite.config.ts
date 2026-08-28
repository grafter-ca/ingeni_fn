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
        enabled: true,
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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg}"],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        // Exclude cross-origin API calls from workbox injection strategies entirely
        navigateFallbackAllowlist: [/^(?!\/api).*/],
        runtimeCaching: [
          {
            // Match the exact backend URL pattern safely
            urlPattern: /^https:\/\/ingeri-api\.onrender\.com\/api\/.*/i,
            handler: 'NetworkOnly',
          }
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
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
});