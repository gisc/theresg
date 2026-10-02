import { getRouteIndex, routeIndexLoadedAt, routeIndexSource } from '~~/server/utils/bus-route-index';

// Whole-network bus stop sequences for the client-side journey planner. Built
// from the same once-a-day DataMall route load as bus-route-lookup, so this
// adds no extra LTA calls per visitor. Browsers and Cloudflare may cache it.
export default defineEventHandler(async (event) => {
	const services = await getRouteIndex();
	setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600');
	return { updatedAt: routeIndexLoadedAt(), source: routeIndexSource(), services };
});
