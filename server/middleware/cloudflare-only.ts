// The origin must only serve API traffic that arrived through Cloudflare.
// Cloudflare always sets cf-ray and cf-connecting-ip on proxied requests;
// direct hits to the origin (which bypass Cloudflare) carry neither and are
// refused. This stops casual direct-origin abuse of the LTA-backed endpoints.
// NOTE: headers can be spoofed by a determined attacker who discovers the
// origin. A hard lock needs Cloudflare Authenticated Origin Pull (mTLS) or
// origin firewall rules, which require account/network changes.
//
// TEMPORARY (8 Nov 2026): while www.there.sg is unreachable the app is served
// on its default Olares address, whose traffic never passes Cloudflare, so API
// calls on that hostname are allowed without the Cloudflare headers. Every
// other hostname still requires them. The per-IP rate limit (rate-limit.ts)
// and the LTA daily budget guard still apply on this exception path.
const PLATFORM_HOST = 'theresg.huatbigbig888.olares.com';

export default defineEventHandler((event) => {
	const path = getRequestURL(event).pathname;
	if (!path.startsWith('/api/')) return;

	if (getRequestHost(event) === PLATFORM_HOST) return;

	const cfRay = getRequestHeader(event, 'cf-ray');
	const cfIp = getRequestHeader(event, 'cf-connecting-ip');
	if (!cfRay || !cfIp) {
		throw createError({
			statusCode: 403,
			statusMessage:
				'Direct origin access is not allowed. Please use https://www.there.sg',
		});
	}
});
