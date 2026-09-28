// The origin must only serve API traffic that arrived through Cloudflare.
// Cloudflare always sets cf-ray and cf-connecting-ip on proxied requests;
// direct hits to the origin (which bypass Cloudflare) carry neither and are
// refused. This stops casual direct-origin abuse of the LTA-backed endpoints.
// NOTE: headers can be spoofed by a determined attacker who discovers the
// origin. A hard lock needs Cloudflare Authenticated Origin Pull (mTLS) or
// origin firewall rules, which require account/network changes.
export default defineEventHandler((event) => {
	const path = getRequestURL(event).pathname;
	if (!path.startsWith('/api/')) return;

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
