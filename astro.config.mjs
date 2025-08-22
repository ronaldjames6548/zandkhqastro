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
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: "https://zandkhqastro.vercel.app",
  output: "hybrid",
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  vite: {
    define: {
      __DATE__: `'${new Date().toISOString()}'`
    }
  },
  integrations: [
    tailwind(),
    i18n: {
		defaultLocale: "en",
		locales: ["en", "it"],
		routing: {
			prefixDefaultLocale: false, // /about for English, /it/about for Italian
		},
	},
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
        globPatterns: ["*.js"]
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
    
    // All non-English language codes
    const nonEnglishLangs = ['it'];
    
    // Should exclude if:
    const shouldExclude = 
      // Non-English blog posts (but keeps /{lang}/blog/ index pages)
      nonEnglishLangs.some(lang => 
        url.pathname.startsWith(`/${lang}/blog/`) && 
        url.pathname !== `/${lang}/blog/`
      ) ||
      // Pagination, tags, categories
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