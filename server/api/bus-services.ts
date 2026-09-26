export default defineEventHandler(async (event) => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const { serviceNumber, skip } = getQuery<{
		serviceNumber: string;
		skip: number;
	}>(event);

	const data = await $fetch('https://datamall2.mytransport.sg/ltaodataservice/BusServices', {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			AccountKey: apiKey || '',
		},
		query: {
			ServiceNo: serviceNumber,
			$skip: skip || 0,
		},
	});

	return data;
});
