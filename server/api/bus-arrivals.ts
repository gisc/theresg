import type { BusArrival } from '~~/shared/types/BusArrival';
import { createTtlCache } from '~~/server/utils/ttl-cache';

// Arrivals update quickly; cap staleness at 15 seconds per stop/service pair.
const cachedArrivals = createTtlCache<BusArrival[]>(15_000, 256);

export default defineEventHandler(async (event) => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const { stopCode, serviceNumber } = getQuery<{
		stopCode: string;
		serviceNumber?: string;
	}>(event);

	if (typeof stopCode !== 'string' || !/^\d{5}$/.test(stopCode)) {
		throw createError({ statusCode: 400, statusMessage: 'Select a valid bus stop' });
	}
	if (
		serviceNumber !== undefined &&
		(typeof serviceNumber !== 'string' || !/^[0-9]{1,3}[A-Z]{0,2}$/.test(serviceNumber))
	) {
		throw createError({ statusCode: 400, statusMessage: 'Select a valid bus service' });
	}

	return cachedArrivals(`${stopCode}:${serviceNumber ?? ''}`, async () => {
		const data = await $fetch<{
			Services: BusArrival[];
		}>('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				AccountKey: apiKey || '',
			},
			query: {
				BusStopCode: stopCode,
				ServiceNo: serviceNumber,
			},
		});

		const sortedServices = data.Services.sort((a, b) => {
			return (
				new Date(a.NextBus.EstimatedArrival).getTime() -
				new Date(b.NextBus.EstimatedArrival).getTime()
			);
		});

		return sortedServices;
	});
});
