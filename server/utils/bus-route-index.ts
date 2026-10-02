import { datamallFetch } from './datamall-fetch';

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
				datamallFetch<{ value: RouteRow[] }>(
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


export type RouteIndex = Record<string, Record<string, string[]>>;

/** Whole-network route index, loaded from DataMall at most once a day and shared by every route endpoint. */
export async function getRouteIndex(): Promise<RouteIndex> {
	// Local development without a DataMall key can point at a saved snapshot.
	if (import.meta.dev && process.env.THERESG_DEV_BUS_NETWORK) {
		const { readFile, stat } = await import('node:fs/promises');
		const file = process.env.THERESG_DEV_BUS_NETWORK;
		devSnapshotAt = (await stat(file)).mtimeMs;
		return JSON.parse(await readFile(file, 'utf8')).services;
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
	return routeIndex!;
}

let devSnapshotAt = 0;

export function routeIndexLoadedAt(): number {
	return devSnapshotAt || loadedAt;
}

/** Where the index really came from, so the page can label it truthfully. */
export function routeIndexSource(): 'datamall' | 'dev-snapshot' {
	return devSnapshotAt ? 'dev-snapshot' : 'datamall';
}
