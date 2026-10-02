// OneMap (Singapore Land Authority) client: postal code lookup and walking routes.
// Auth: the Search and Routing APIs need a token that lasts 3 days. The server keeps
// the account email/password in env (NUXT_ONEMAP_EMAIL / NUXT_ONEMAP_PASSWORD), mints
// a token, caches it until shortly before expiry and renews on a 401. Credentials are
// never logged or sent to the browser. NUXT_ONEMAP_TOKEN is a short-lived fallback
// for testing only; without any of them postal lookups report "unavailable".
const BASE = process.env.NUXT_ONEMAP_BASE || 'https://www.onemap.gov.sg'; // override is for local tests only
// OneMap allows 300 calls/min for token users; stay well under it, fail closed.
const MAX_CALLS_PER_MIN = 200;

let cached: { token: string; expires: number } | null = null;
let minting: Promise<string> | null = null;
let windowStart = 0;
let windowCalls = 0;

export function onemapConfigured(): boolean {
	return Boolean((process.env.NUXT_ONEMAP_EMAIL && process.env.NUXT_ONEMAP_PASSWORD) || process.env.NUXT_ONEMAP_TOKEN);
}

function decodeExp(token: string): number | null {
	try {
		const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8'));
		return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
	} catch {
		return null;
	}
}

function budget() {
	const now = Date.now();
	if (now - windowStart > 60_000) {
		windowStart = now;
		windowCalls = 0;
	}
	if (++windowCalls > MAX_CALLS_PER_MIN) {
		throw createError({ statusCode: 503, statusMessage: 'Postal lookup is busy, try again in a minute' });
	}
}

async function mint(): Promise<string> {
	const email = process.env.NUXT_ONEMAP_EMAIL;
	const password = process.env.NUXT_ONEMAP_PASSWORD;
	if (!email || !password) throw new Error('no credentials');
	budget();
	const r = await $fetch<{ access_token?: string; expiry_timestamp?: string | number }>(`${BASE}/api/auth/post/getToken`, {
		method: 'POST',
		body: { email, password },
		retry: 0,
		timeout: 8000,
	});
	if (!r.access_token) throw new Error('no token returned');
	const exp = decodeExp(r.access_token) ?? Number(r.expiry_timestamp) * 1000;
	cached = { token: r.access_token, expires: Number.isFinite(exp) ? exp : Date.now() + 24 * 3600_000 };
	return r.access_token;
}

async function getToken(forceRenew = false): Promise<string> {
	const now = Date.now();
	if (!forceRenew && cached && cached.expires - now > 3600_000) return cached.token;
	if (process.env.NUXT_ONEMAP_EMAIL && process.env.NUXT_ONEMAP_PASSWORD) {
		minting ??= mint().finally(() => {
			minting = null;
		});
		return minting;
	}
	const fallback = process.env.NUXT_ONEMAP_TOKEN;
	if (fallback) {
		const exp = decodeExp(fallback);
		if (exp && exp < now) throw new Error('static token expired');
		return fallback;
	}
	throw new Error('onemap not configured');
}

export async function onemapGet<T>(path: string, query: Record<string, string>): Promise<T> {
	let token: string;
	try {
		token = await getToken();
	} catch (error) {
		console.error('[OneMap] no usable token:', (error as Error).message);
		throw createError({ statusCode: 503, statusMessage: 'Postal code lookup is unavailable right now' });
	}
	const call = (t: string) => {
		budget();
		return $fetch<T>(`${BASE}${path}`, { query, headers: { Authorization: t }, retry: 0, timeout: 8000 });
	};
	try {
		return await call(token);
	} catch (error) {
		const status = (error as { statusCode?: number; status?: number }).statusCode ?? (error as { status?: number }).status;
		if (status === 401 && process.env.NUXT_ONEMAP_EMAIL) {
			cached = null;
			return call(await getToken(true));
		}
		throw error;
	}
}
