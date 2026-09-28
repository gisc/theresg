// Per-client-IP fixed-window rate limit for the LTA-backed API routes.
// 40 requests per minute per IP is far above real app usage (a busy session
// makes a handful of requests per minute) but stops scripted abuse from
// burning the daily LTA budget in one go.
const WINDOW_MS = 60_000;
const LIMIT = 40;

interface Bucket {
	count: number;
	reset: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function clientIp(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): string {
	const cf = getRequestHeader(event, 'cf-connecting-ip');
	if (cf) return cf.trim();
	const xff = getRequestHeader(event, 'x-forwarded-for');
	if (xff) return xff.split(',')[0]!.trim();
	return event.node.req.socket.remoteAddress ?? 'unknown';
}

export default defineEventHandler((event) => {
	const path = getRequestURL(event).pathname;
	if (!path.startsWith('/api/')) return;

	const now = Date.now();
	if (now - lastSweep > WINDOW_MS) {
		for (const [key, bucket] of buckets) {
			if (bucket.reset <= now) buckets.delete(key);
		}
		lastSweep = now;
	}

	const ip = clientIp(event);
	let bucket = buckets.get(ip);
	if (!bucket || bucket.reset <= now) {
		bucket = { count: 0, reset: now + WINDOW_MS };
		buckets.set(ip, bucket);
	}
	bucket.count++;

	setResponseHeader(event, 'X-RateLimit-Limit', LIMIT);
	setResponseHeader(event, 'X-RateLimit-Remaining', Math.max(0, LIMIT - bucket.count));
	if (bucket.count > LIMIT) {
		setResponseHeader(event, 'Retry-After', Math.max(1, Math.ceil((bucket.reset - now) / 1000)));
		throw createError({
			statusCode: 429,
			statusMessage: 'Too Many Requests - slow down and try again in a minute.',
		});
	}
});
