import type { TrafficIncident } from '~~/shared/types/TrafficIncident';
import { createTtlCache } from '~~/server/utils/ttl-cache';

const cachedIncidents = createTtlCache<TrafficIncident[]>(60_000, 1);

export default defineEventHandler(async () => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	return cachedIncidents('incidents', async () => {
		const data = await $fetch<{
			value: TrafficIncident[];
		}>('https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				AccountKey: apiKey || '',
			},
		});

		return data.value;
	});
});
