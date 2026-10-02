import { createTtlCache } from '~~/server/utils/ttl-cache';
import { onemapConfigured, onemapGet } from '~~/server/utils/onemap';

// Postal code -> address + coordinates (OneMap Search). Postal codes rarely change: cache a day.
const cache = createTtlCache<Resolved | null>(24 * 3600_000, 2000);
interface Resolved {
	code: string;
	address: string;
	lat: number;
	lon: number;
}
interface SearchResponse {
	results?: { ADDRESS: string; POSTAL: string; LATITUDE: string; LONGITUDE: string }[];
}

export default defineEventHandler(async (event) => {
	const code = String(getQuery(event).code ?? '').trim();
	if (!/^\d{6}$/.test(code)) throw createError({ statusCode: 400, statusMessage: 'A postal code has 6 digits' });
	if (!onemapConfigured()) throw createError({ statusCode: 503, statusMessage: 'Postal code lookup is unavailable right now' });
	const hit = await cache(code, async () => {
		const r = await onemapGet<SearchResponse>('/api/common/elastic/search', {
			searchVal: code,
			returnGeom: 'Y',
			getAddrDetails: 'Y',
			pageNum: '1',
		});
		const m = r.results?.find((x) => x.POSTAL === code);
		if (!m) return null;
		const lat = Number(m.LATITUDE);
		const lon = Number(m.LONGITUDE);
		if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
		return { code, address: m.ADDRESS, lat, lon };
	});
	setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');
	if (!hit) throw createError({ statusCode: 404, statusMessage: 'Postal code not found' });
	return hit;
});
