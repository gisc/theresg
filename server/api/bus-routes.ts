import { datamallFetch } from '~~/server/utils/datamall-fetch';
export default defineEventHandler(async () => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const data = await datamallFetch('https://datamall2.mytransport.sg/ltaodataservice/BusRoutes', {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			AccountKey: apiKey || '',
		},
	});

	return data;
});
