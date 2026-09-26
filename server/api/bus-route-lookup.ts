interface RouteRow {
	ServiceNo: string;
	Direction: number;
	StopSequence: number;
	BusStopCode: string;
}

let routeIndex: Record<string, Record<string, string[]>> | undefined;
let loadedAt = 0;
let pending: Promise<Record<string, Record<string, string[]>>> | undefined;

async function loadRoutes() {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;
	if (!apiKey)
		throw createError({ statusCode: 503, statusMessage: 'Bus route data unavailable' });
	const index: Record<string, Record<string, { seq: number; code: string }[]>> = {};
	let skip = 0;
	// DataMall returns 500 records at a time. Read batches in parallel and stop at the first short page.
	while (skip < 100000) {
		const pages = await Promise.all(
			Array.from({ length: 6 }, (_, i) =>
				$fetch<{ value: RouteRow[] }>(
					'https://datamall2.mytransport.sg/ltaodataservice/BusRoutes',
					{
						headers: { Accept: 'application/json', AccountKey: apiKey },
						query: { $skip: skip + i * 500 },
					},
				),
			),
		);
		for (const { value } of pages) {
			for (const row of value) {
				const directions = (index[row.ServiceNo] ??= {});
				(directions[row.Direction] ??= []).push({
					seq: row.StopSequence,
					code: row.BusStopCode,
				});
			}
		}
		skip += pages.length * 500;
		if (pages.some((page) => page.value.length < 500)) break;
	}
	const result: Record<string, Record<string, string[]>> = {};
	for (const [service, directions] of Object.entries(index)) {
		result[service] = {};
		for (const [direction, rows] of Object.entries(directions)) {
			result[service][direction] = rows.sort((a, b) => a.seq - b.seq).map((r) => r.code);
		}
	}
	return result;
}

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const service = String(query.service ?? '')
		.trim()
		.toUpperCase();
	if (!/^[0-9]{1,3}[A-Z]{0,3}$/.test(service)) {
		throw createError({ statusCode: 400, statusMessage: 'Select a valid bus service' });
	}
	if (!routeIndex || Date.now() - loadedAt > 24 * 60 * 60 * 1000) {
		pending ??= loadRoutes()
			.then((routes) => {
				routeIndex = routes;
				loadedAt = Date.now();
				return routes;
			})
			.finally(() => {
				pending = undefined;
			});
		await pending;
	}
	return routeIndex?.[service] ?? {};
});
