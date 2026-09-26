import type { TrafficIncident } from '~~/shared/types/TrafficIncident';

export default defineEventHandler(async () => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

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
