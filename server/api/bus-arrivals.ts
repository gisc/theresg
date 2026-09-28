import { datamallFetch } from '~~/server/utils/datamall-fetch';
import type { BusArrival } from '~~/shared/types/BusArrival';
import type { BusArrivalsResponse } from '~~/shared/types/BusArrivalsResponse';
import { createTtlCache } from '~~/server/utils/ttl-cache';


// DataMall refreshes arrivals about every 20s; one cached copy per stop serves everyone.
const cachedArrivals = createTtlCache<BusArrivalsResponse>(20_000, 256);

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
		const fetchedAt = new Date().toISOString();
		let data: { Services: BusArrival[] };
		try {
			data = await datamallFetch<{
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
		} catch (error) {
			// A quota failure stays a hard error; anything else is reported in the
			// envelope so the page can tell "LTA unreachable" from "no buses".
			if ((error as { statusCode?: number })?.statusCode === 503) throw error;
			return { services: [], fetchedAt, error: 'upstream' };
		}

		const sortedServices = data.Services.sort((a, b) => {
			return (
				new Date(a.NextBus.EstimatedArrival).getTime() -
				new Date(b.NextBus.EstimatedArrival).getTime()
			);
		});

		return { services: sortedServices, fetchedAt };
	});
});
