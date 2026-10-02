import { createTtlCache } from '~~/server/utils/ttl-cache';
import { onemapGet } from '~~/server/utils/onemap';

// Walking distances (OneMap pedestrian routing) from one point to a short list of
// candidate stops/stations chosen by the browser. Nothing here is a straight-line guess:
// a candidate OneMap cannot route to is left out.
const cache = createTtlCache<number | null>(7 * 24 * 3600_000, 20000);
interface RouteResponse {
	route_summary?: { total_distance?: number };
}
const MAX_TARGETS = 16;
const inSg = (lat: number, lon: number) => lat > 1.15 && lat < 1.48 && lon > 103.58 && lon < 104.1;

export default defineEventHandler(async (event) => {
	const body = await readBody<{ lat?: number; lon?: number; targets?: { id?: string; lat?: number; lon?: number }[] }>(event);
	const { lat, lon } = body ?? {};
	const targets = body?.targets;
	if (typeof lat !== 'number' || typeof lon !== 'number' || !inSg(lat, lon) || !Array.isArray(targets) || targets.length === 0 || targets.length > MAX_TARGETS) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid request' });
	}
	for (const t of targets) {
		if (typeof t.id !== 'string' || t.id.length > 80 || typeof t.lat !== 'number' || typeof t.lon !== 'number' || !inSg(t.lat, t.lon)) {
			throw createError({ statusCode: 400, statusMessage: 'Invalid request' });
		}
	}
	const r5 = (n: number) => n.toFixed(5);
	const links: { id: string; meters: number }[] = [];
	let failed = 0;
	// Four at a time keeps one lookup well inside the OneMap rate limit.
	for (let i = 0; i < targets.length; i += 4) {
		await Promise.all(
			targets.slice(i, i + 4).map(async (t) => {
				try {
					const m = await cache(`${r5(lat)},${r5(lon)}>${r5(t.lat!)},${r5(t.lon!)}`, async () => {
						const r = await onemapGet<RouteResponse>('/api/public/routingsvc/route', {
							start: `${r5(lat)},${r5(lon)}`,
							end: `${r5(t.lat!)},${r5(t.lon!)}`,
							routeType: 'walk',
						});
						const d = r.route_summary?.total_distance;
						return typeof d === 'number' && d > 0 ? d : null;
					});
					if (m !== null) links.push({ id: t.id!, meters: m });
				} catch {
					failed++;
				}
			}),
		);
	}
	if (links.length === 0 && failed > 0) throw createError({ statusCode: 503, statusMessage: 'Walking routes are unavailable right now' });
	return { links, partial: failed > 0 };
});
