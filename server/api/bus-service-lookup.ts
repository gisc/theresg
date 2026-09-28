import { datamallFetch } from '~~/server/utils/datamall-fetch';
let services: string[] | undefined;
let loadedAt = 0;
let pending: Promise<string[]> | undefined;

async function loadServices() {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;
	if (!apiKey)
		throw createError({ statusCode: 503, statusMessage: 'Bus service data unavailable' });
	const all = new Set<string>();
	let skip = 0;
	while (skip < 5000) {
		const data = await datamallFetch<{ value: { ServiceNo: string }[] }>(
			'https://datamall2.mytransport.sg/ltaodataservice/BusServices',
			{
				headers: { Accept: 'application/json', AccountKey: apiKey },
				query: { $skip: skip },
			},
		);
		data.value.forEach((row) => all.add(row.ServiceNo));
		skip += 500;
		if (data.value.length < 500) break;
	}
	return [...all].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export default defineEventHandler(async () => {
	if (!services || Date.now() - loadedAt > 24 * 60 * 60 * 1000) {
		pending ??= loadServices()
			.then((list) => {
				services = list;
				loadedAt = Date.now();
				return list;
			})
			.finally(() => {
				pending = undefined;
			});
		await pending;
	}
	return services;
});
