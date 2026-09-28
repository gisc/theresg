import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// MapLibre v6 resolves its web-worker URL at runtime relative to the bundle
// chunk (import.meta.url), but the Nuxt build never emits that file, so the
// default URL 404s and every map fails with "Worker failed to load".
// Build the worker (and its shared chunk) as a real Vite worker entry and
// pin MapLibre to the emitted URL instead.
export default defineNuxtPlugin(() => {
	setWorkerUrl(workerUrl);
});
