import { datamallFetch } from '~~/server/utils/datamall-fetch';
export default defineEventHandler(async (event) => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const { serviceNumber, skip } = getQuery<{
		serviceNumber: string;
		skip: number;
	}>(event);

	const page = skip === undefined ? 0 : Number(skip);
	if (!Number.isInteger(page) || page < 0 || page > 5000 || page % 500 !== 0) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid page' });
	}
	if (serviceNumber !== undefined && (typeof serviceNumber !== 'string' || !/^[0-9]{1,3}[A-Z]{0,2}$/.test(serviceNumber))) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid bus service' });
	}

	const data = await datamallFetch('https://datamall2.mytransport.sg/ltaodataservice/BusServices', {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			AccountKey: apiKey || '',
		},
		query: {
			ServiceNo: serviceNumber,
			$skip: page,
		},
	});

	return data;
});
