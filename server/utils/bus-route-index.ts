import { datamallFetch } from './datamall-fetch';

interface RouteRow {
	ServiceNo: string;
	Direction: number;
	StopSequence: number;
	BusStopCode: string;
	Distance?: number | null;
	WD_FirstBus?: string;
	WD_LastBus?: string;
	SAT_FirstBus?: string;
	SAT_LastBus?: string;
	SUN_FirstBus?: string;
	SUN_LastBus?: string;
}

export type RouteIndex = Record<string, Record<string, string[]>>;
export interface RouteDetail {
	/** service -> direction -> cumulative km from the first stop, per stop */
	dist: Record<string, Record<string, (number | null)[]>>;
	/** service -> direction -> per stop "WDfirst,WDlast,SATfirst,SATlast,SUNfirst,SUNlast" (HHMM scheduled arrival at that stop) */
	hours: Record<string, Record<string, string[]>>;
}

let routeIndex: RouteIndex | undefined;
let routeDetail: RouteDetail | undefined;
let loadedAt = 0;
let pending: Promise<RouteIndex> | undefined;

async function loadRoutes() {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;
	if (!apiKey)
		throw createError({ statusCode: 503, statusMessage: 'Bus route data unavailable' });
	const rowsBy: Record<string, Record<string, RouteRow[]>> = {};
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
				const directions = (rowsBy[row.ServiceNo] ??= {});
				(directions[row.Direction] ??= []).push(row);
			}
		}
		skip += pages.length * 500;
		if (pages.some((page) => page.value.length < 500)) break;
	}
	const result: RouteIndex = {};
	const detail: RouteDetail = { dist: {}, hours: {} };
	const t = (v?: string) => (v && /^\d{4}$/.test(v.trim()) ? v.trim() : '-');
	for (const [service, directions] of Object.entries(rowsBy)) {
		result[service] = {};
		detail.dist[service] = {};
		detail.hours[service] = {};
		for (const [direction, rows] of Object.entries(directions)) {
			rows.sort((a, b) => a.StopSequence - b.StopSequence);
			result[service][direction] = rows.map((r) => r.BusStopCode);
			detail.dist[service][direction] = rows.map((r) => (typeof r.Distance === 'number' ? r.Distance : null));
			detail.hours[service][direction] = rows.map((r) =>
				[r.WD_FirstBus, r.WD_LastBus, r.SAT_FirstBus, r.SAT_LastBus, r.SUN_FirstBus, r.SUN_LastBus].map(t).join(','),
			);
		}
	}
	routeDetail = detail;
	return result;
}

let devSnapshotAt = 0;

/** Whole-network route index, loaded from DataMall at most once a day and shared by every route endpoint. */
export async function getRouteIndex(): Promise<RouteIndex> {
	// Local development without a DataMall key can point at a saved snapshot.
	if (import.meta.dev && process.env.THERESG_DEV_BUS_NETWORK) {
		const { readFile, stat } = await import('node:fs/promises');
		const file = process.env.THERESG_DEV_BUS_NETWORK;
		devSnapshotAt = (await stat(file)).mtimeMs;
		const snap = JSON.parse(await readFile(file, 'utf8'));
		routeDetail = { dist: snap.dist ?? {}, hours: snap.hours ?? {} };
		return snap.services;
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

export function getRouteDetail(): RouteDetail {
	return routeDetail ?? { dist: {}, hours: {} };
}

export function routeIndexLoadedAt(): number {
	return devSnapshotAt || loadedAt;
}

/** Where the index really came from, so the page can label it truthfully. */
export function routeIndexSource(): 'datamall' | 'dev-snapshot' {
	return devSnapshotAt ? 'dev-snapshot' : 'datamall';
}
