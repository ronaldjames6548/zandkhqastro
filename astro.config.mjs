import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { autolinkConfig } from "./plugins/rehype-autolink-config";
import rehypeSlug from "rehype-slug";
import alpinejs from "@astrojs/alpinejs";
import AstroPWA from "@vite-pwa/astro";
import icon from "astro-icon";
import solidJs from "@astrojs/solid-js";
// Remove vercel import for static build

export default defineConfig({
  site: "https://zandkhqastro.vercel.app",
  output: "static", // CHANGED: Use static output
  // Remove adapter for static builds
  
  i18n: {
    defaultLocale: "en",
    locales: ["en", "it"],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    define: {
      __DATE__: `'${new Date().toISOString()}'`
    }
  },

  integrations: [
    tailwind(),
    alpinejs(),
    AstroPWA({
      mode: "production",
      base: "/",
      scope: "/",
      includeAssets: ["favicon.ico"],
      registerType: "autoUpdate",
      manifest: {
        name: "Tiktokio - TikTok Downloader - Download TikTok Videos Without Watermark",
        short_name: "Tikokio",
        theme_color: "#ffffff",
        icons: [{
          src: "pwa-192x192.webp",
          sizes: "192x192",
          type: "image/webp"
        }, {
          src: "pwa-512x512.webp",
          sizes: "512x512",
          type: "image/webp"
        }, {
          src: "pwa-512x512.webp",
          sizes: "512x512",
          type: "image/webp",
          purpose: "any maskable"
        }]
      },
      workbox: {
        navigateFallback: "/404",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"]
      },
      devOptions: {
        enabled: false,
        navigateFallbackAllowlist: [/^\/404$/],
        suppressWarnings: true
      }
    }),
    icon(),
    solidJs(),
    sitemap({
      filter(page) {
        const url = new URL(page, 'https://zandkhqastro.vercel.app');
        
        const nonEnglishLangs = ['it'];
        
        const shouldExclude = 
          nonEnglishLangs.some(lang => 
            url.pathname.startsWith(`/${lang}/blog/`) && 
            url.pathname !== `/${lang}/blog/`
          ) ||
          /\/blog\/\d+\//.test(url.pathname) ||
          url.pathname.includes('/tag/') || 
          url.pathname.includes('/category/');
        return !shouldExclude;
      }
    })
  ],

  markdown: {
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, autolinkConfig]]
  },

  experimental: {
    contentCollectionCache: true
  }
});