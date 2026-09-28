import type { BicycleParking } from '~~/shared/types/BicycleParking';

export default defineEventHandler(async (event) => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const { lat, lon, dist } = getQuery<{
		lat?: string;
		lon?: string;
		dist?: string;
	}>(event);

	const latitude = Number(lat);
	const longitude = Number(lon);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		throw createError({ statusCode: 400, statusMessage: 'lat and lon are required' });
	}
	const distanceKm = Math.min(Math.max(Number(dist) || 0.5, 0.1), 2);

	const data = await $fetch<{ value: BicycleParking[] }>(
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
