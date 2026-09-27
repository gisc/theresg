export default defineNuxtPlugin(() => {
	if (!('serviceWorker' in navigator)) return;
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch(() => {
			// Offline support is a bonus; never break the app over it.
		});
	});
});
