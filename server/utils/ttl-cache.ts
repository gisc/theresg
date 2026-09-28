/** In-process cache with bounded entries and per-key single-flight. Never cache failures. */
export function createTtlCache<T>(ttlMs: number, maxEntries: number) {
	const entries = new Map<string, { value: T; expires: number }>();
	const pending = new Map<string, Promise<T>>();

	return async (key: string, load: () => Promise<T>): Promise<T> => {
		const now = Date.now();
		const entry = entries.get(key);
		if (entry && entry.expires > now) return entry.value;
		const inFlight = pending.get(key);
		if (inFlight) return inFlight;
		// Do not admit more distinct concurrent keys than the cache can hold.
		// A burst of unique keys cannot build an unbounded pending map.
		if (pending.size >= maxEntries) {
			throw createError({ statusCode: 503, statusMessage: 'Data temporarily busy' });
		}
		const request = load()
			.then((value) => {
				entries.delete(key);
				entries.set(key, { value, expires: Date.now() + ttlMs });
				while (entries.size > maxEntries) {
					const oldest = entries.keys().next().value;
					if (oldest === undefined) break;
					entries.delete(oldest);
				}
				return value;
			})
			.finally(() => {
				pending.delete(key);
			});
		pending.set(key, request);
		return request;
	};
}
