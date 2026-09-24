export default defineEventHandler(async () => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const data = await $fetch('https://datamall2.mytransport.sg/ltaodataservice/BusStops', {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			AccountKey: apiKey || '',
		},
	});

	return data;
});
