// TransitSG offline support: cache the app shell, static transit data, and
// build assets so previously visited pages (including the MRT planner data)
// keep working without a connection. Live /api data always comes from the
// network.
const CACHE = 'transitsg-v1';
const PRECACHE = ['/manifest.webmanifest'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
			)
			.then(() => self.clients.claim()),
	);
});

function cacheResponse(request, response) {
	if (response.ok) {
		const copy = response.clone();
		caches.open(CACHE).then((cache) => cache.put(request, copy));
	}
	return response;
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	// Live arrivals, alerts, and crowd levels must never come from a cache.
	if (url.pathname.startsWith('/api/')) return;

	// Pages: network first, fall back to the cached copy when offline.
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => cacheResponse(request, response))
				.catch(() =>
					caches.match(request).then((cached) => cached || caches.match('/')),
				),
		);
		return;
	}

	// Static transit data and build assets: cache first.
	if (
		url.pathname.startsWith('/_nuxt/') ||
		url.pathname === '/mrt-lines.json' ||
		url.pathname === '/bus-stops.json' ||
		url.pathname.startsWith('/icons/') ||
		url.pathname === '/manifest.webmanifest'
	) {
		event.respondWith(
			caches
				.match(request)
				.then((cached) => cached || fetch(request).then((response) => cacheResponse(request, response))),
		);
	}
});
