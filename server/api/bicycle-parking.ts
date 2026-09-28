import { datamallFetch } from '~~/server/utils/datamall-fetch';
import type { BicycleParking } from '~~/shared/types/BicycleParking';
import { createTtlCache } from '~~/server/utils/ttl-cache';

const cachedParking = createTtlCache<BicycleParking[]>(60_000, 128);

export default defineEventHandler(async (event) => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const { lat, lon, dist } = getQuery<{
		lat?: string;
		lon?: string;
		dist?: string;
	}>(event);

	const latitude = Number(lat);
	const longitude = Number(lon);
	if (
		typeof lat !== 'string' ||
		typeof lon !== 'string' ||
		lat.trim() === '' ||
		lon.trim() === '' ||
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude) ||
		latitude < 1.1 ||
		latitude > 1.5 ||
		longitude < 103.5 ||
		longitude > 104.2
	) {
		throw createError({ statusCode: 400, statusMessage: 'lat and lon are required' });
	}
	const distance = dist === undefined ? 0.5 : Number(dist);
	if (dist !== undefined && (typeof dist !== 'string' || !Number.isFinite(distance))) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid distance' });
	}
	const distanceKm = Math.min(Math.max(distance, 0.1), 2);

	// Exact validated coordinates preserve the requested search radius and results.
	return cachedParking(`${latitude}:${longitude}:${distanceKm}`, async () => {
		const data = await datamallFetch<{ value: BicycleParking[] }>(
			'https://datamall2.mytransport.sg/ltaodataservice/BicycleParkingv2',
			{
				method: 'GET',
				headers: {
					Accept: 'application/json',
					AccountKey: apiKey || '',
				},
				query: {
					Lat: latitude,
					Long: longitude,
					Dist: distanceKm,
				},
			},
		);

		return data.value ?? [];
	});
});
