// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: { head: { link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=3' }, { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=3', sizes: '32x32' }, { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=3', sizes: '180x180' }, { rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/space-grotesk-500.woff2', crossorigin: '' }], meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }, { name: 'theme-color', content: '#E62333' }, { name: 'mobile-web-app-capable', content: 'yes' }, { name: 'apple-mobile-web-app-capable', content: 'yes' }, { name: 'apple-mobile-web-app-title', content: 'ThereSG' }] } },
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxtjs/seo', 'nuxt-maplibre'],

	routeRules: {
		'/': { swr: 60 },
	},

	site: {
		name: 'ThereSG',
	},

	// /all (integrated bus + MRT planner) is not promoted yet: keep it out of the sitemap.
	sitemap: { exclude: ['/all'] },

	css: ['~/assets/css/main.css'],

	future: {
		compatibilityVersion: 4,
	},

	vue: {
		compilerOptions: {
			isCustomElement: (tag) => tag.startsWith('m3e-'),
		},
	},
});
