export default defineEventHandler(async (event) => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const serviceNumber = event.headers.get('serviceNumber');

	const data = await $fetch('https://datamall2.mytransport.sg/ltaodataservice/BusServices', {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			AccountKey: apiKey || '',
		},
		body: {
			ServiceNo: serviceNumber,
		},
	});

	return data;
});
