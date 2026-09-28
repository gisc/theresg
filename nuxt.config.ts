// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: { head: { link: [{ rel: 'icon', type: 'image/svg+xml', href: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InQiPgogIDx0aXRsZSBpZD0idCI+VGhlcmVTRyAtIFNpbmdhcG9yZSBmbGFnIG1hcms8L3RpdGxlPgogIDxkZWZzPgogICAgPGNsaXBQYXRoIGlkPSJyciI+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTQiLz48L2NsaXBQYXRoPgogICAgPG1hc2sgaWQ9ImNyZXMiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiLz48Y2lyY2xlIGN4PSIyMC41IiBjeT0iMTYuNSIgcj0iOC42IiBmaWxsPSJibGFjayIvPjwvbWFzaz4KICA8L2RlZnM+CiAgPGcgY2xpcC1wYXRoPSJ1cmwoI3JyKSI+CiAgICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNjQiIGhlaWdodD0iMzguNCIgZmlsbD0iI0U2MjMzMyIvPgogICAgPHJlY3QgeD0iMCIgeT0iMzguNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjI1LjYiIGZpbGw9IiNmZmZmZmYiLz4KICA8L2c+CiAgPHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0MwMDAxRCIgc3Ryb2tlLW9wYWNpdHk9IjAuMjUiIHN0cm9rZS13aWR0aD0iMSIvPgogIDxjaXJjbGUgY3g9IjE2LjUiIGN5PSIxNi41IiByPSIxMC4yIiBmaWxsPSIjZmZmZmZmIiBtYXNrPSJ1cmwoI2NyZXMpIi8+CiAgPHBvbHlnb24gcG9pbnRzPSIyNy41MCw3LjAwIDI4LjEyLDguODUgMzAuMDcsOC44NyAyOC41MCwxMC4wMiAyOS4wOSwxMS44OCAyNy41MCwxMC43NSAyNS45MSwxMS44OCAyNi41MCwxMC4wMiAyNC45Myw4Ljg3IDI2Ljg4LDguODUiIGZpbGw9IiNmZmZmZmYiLz4KICA8cG9seWdvbiBwb2ludHM9IjMzLjk3LDExLjcwIDM0LjU4LDEzLjU1IDM2LjU0LDEzLjU2IDM0Ljk3LDE0LjcyIDM1LjU1LDE2LjU4IDMzLjk3LDE1LjQ1IDMyLjM4LDE2LjU4IDMyLjk3LDE0LjcyIDMxLjQwLDEzLjU2IDMzLjM1LDEzLjU1IiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBvbHlnb24gcG9pbnRzPSIzMS41MCwxOS4zMCAzMi4xMSwyMS4xNSAzNC4wNiwyMS4xNyAzMi41MCwyMi4zMyAzMy4wOCwyNC4xOSAzMS41MCwyMy4wNSAyOS45MSwyNC4xOSAzMC41MCwyMi4zMyAyOC45MywyMS4xNyAzMC44OCwyMS4xNSIgZmlsbD0iI2ZmZmZmZiIvPgogIDxwb2x5Z29uIHBvaW50cz0iMjMuNTAsMTkuMzAgMjQuMTIsMjEuMTUgMjYuMDcsMjEuMTcgMjQuNTAsMjIuMzMgMjUuMDksMjQuMTkgMjMuNTAsMjMuMDUgMjEuOTIsMjQuMTkgMjIuNTAsMjIuMzMgMjAuOTQsMjEuMTcgMjIuODksMjEuMTUiIGZpbGw9IiNmZmZmZmYiLz4KICA8cG9seWdvbiBwb2ludHM9IjIxLjAzLDExLjcwIDIxLjY1LDEzLjU1IDIzLjYwLDEzLjU2IDIyLjAzLDE0LjcyIDIyLjYyLDE2LjU4IDIxLjAzLDE1LjQ1IDE5LjQ1LDE2LjU4IDIwLjAzLDE0LjcyIDE4LjQ2LDEzLjU2IDIwLjQyLDEzLjU1IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPgo=' }, { rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/space-grotesk-500.woff2', crossorigin: '' }], meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }, { name: 'theme-color', content: '#E62333' }, { name: 'mobile-web-app-capable', content: 'yes' }, { name: 'apple-mobile-web-app-capable', content: 'yes' }, { name: 'apple-mobile-web-app-title', content: 'ThereSG' }] } },
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxtjs/seo', 'nuxt-maplibre'],

	routeRules: {
		'/': { swr: 60 },
	},

	site: {
		name: 'ThereSG',
	},

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
