// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxtjs/seo'],

	routeRules: {
		'/': { prerender: true },
	},

	site: {
		name: 'transitsg',
	},

	css: ['@/assets/css/main.css'],

	future: {
		compatibilityVersion: 4,
	},
});
