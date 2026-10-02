import { createTtlCache } from '~~/server/utils/ttl-cache';
import { onemapConfigured, onemapGet } from '~~/server/utils/onemap';

// Free-text place or building name -> a few candidate addresses (OneMap Search). Cached a day.
interface Hit {
	name: string;
	address: string;
	postal: string;
	lat: number;
	lon: number;
}
interface SearchResponse {
	results?: { SEARCHVAL: string; BUILDING?: string; ADDRESS: string; POSTAL: string; LATITUDE: string; LONGITUDE: string }[];
}
const cache = createTtlCache<Hit[]>(24 * 3600_000, 2000);

export default defineEventHandler(async (event) => {
	const q = String(getQuery(event).q ?? '').trim().slice(0, 80);
	if (q.length < 3 || /^\d{6}$/.test(q)) return [];
	if (!onemapConfigured()) throw createError({ statusCode: 503, statusMessage: 'Place search is unavailable right now' });
	const hits = await cache(q.toLowerCase(), async () => {
		const r = await onemapGet<SearchResponse>('/api/common/elastic/search', {
			searchVal: q,
			returnGeom: 'Y',
			getAddrDetails: 'Y',
			pageNum: '1',
		});
		const out: Hit[] = [];
		const seen = new Set<string>();
		for (const m of r.results ?? []) {
			const lat = Number(m.LATITUDE);
			const lon = Number(m.LONGITUDE);
			if (!/^\d{6}$/.test(m.POSTAL ?? '') || !Number.isFinite(lat) || !Number.isFinite(lon) || seen.has(m.POSTAL)) continue;
			seen.add(m.POSTAL);
			const name = m.BUILDING && m.BUILDING !== 'NIL' ? m.BUILDING : m.SEARCHVAL;
			out.push({ name, address: m.ADDRESS, postal: m.POSTAL, lat, lon });
			if (out.length >= 5) break;
		}
		return out;
	});
	setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');
	return hits;
});
