import { getRouteIndex } from '~~/server/utils/bus-route-index';

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const service = String(query.service ?? '')
		.trim()
		.toUpperCase();
	if (!/^[0-9]{1,3}[A-Z]{0,3}$/.test(service)) {
		throw createError({ statusCode: 400, statusMessage: 'Select a valid bus service' });
	}
	const index = await getRouteIndex();
	return index[service] ?? {};
});
