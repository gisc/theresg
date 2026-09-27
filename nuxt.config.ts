// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: { head: { link: [{ rel: 'icon', type: 'image/svg+xml', href: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InRpdGxlIj4KICA8dGl0bGUgaWQ9InRpdGxlIj5UcmFuc2l0U0cgY29sb3VyZnVsIHJhaWwgYW5kIGJ1cyByb3V0ZXM8L3RpdGxlPgogIDxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0ibmlnaHQiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agc3RvcC1jb2xvcj0iIzE1MzA1YSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzEwMjQ0NSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPgogIDxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcng9IjE3IiBmaWxsPSJ1cmwoI25pZ2h0KSIvPgogIDxwYXRoIGQ9Ik0xMCA0M0MyMCA0MyAxNyAxOCAzMCAxOHM3IDI4IDI0IDI1IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNmJlMzAiIHN0cm9rZS13aWR0aD0iNyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTEwIDI5YzExIDAgMTMgMTYgMjIgMTZzMTAtMjIgMjItMjIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2VmNTk2YiIgc3Ryb2tlLXdpZHRoPSI3IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNMTEgNDNjMTEgMCAxNi0xMyAyMi0xM3MxMiAxMyAyMSAxMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzZjOWFkIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxjaXJjbGUgY3g9IjMyIiBjeT0iMzEiIHI9IjYuNSIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjMyIiBjeT0iMzEiIHI9IjIuNiIgZmlsbD0iIzE1MzA1YSIvPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMjkiIHI9IjMuNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjU0IiBjeT0iMjMiIHI9IjMuNiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4K' }, { rel: 'manifest', href: '/manifest.webmanifest' }], meta: [{ name: 'theme-color', content: '#006A66' }, { name: 'mobile-web-app-capable', content: 'yes' }, { name: 'apple-mobile-web-app-capable', content: 'yes' }, { name: 'apple-mobile-web-app-title', content: 'TransitSG' }] } },
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxtjs/seo', 'nuxt-maplibre'],

	routeRules: {
		'/': { swr: 60 },
	},

	site: {
		name: 'transitsg',
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
