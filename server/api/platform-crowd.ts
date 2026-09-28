import { datamallFetch } from '~~/server/utils/datamall-fetch';
import type {
	CrowdLevel,
	PlatformCrowdEntry,
	PlatformCrowdResponse,
} from '~~/shared/types/PlatformCrowd';

// LTA DataMall Platform Crowd Density (real time) feed line codes.
const FEED_LINES = [
	'NSL',
	'EWL',
	'CGL',
	'NEL',
	'CCL',
	'DTL',
	'TEL',
	'BPL',
	'SLRT',
	'PLRT',
	'CEL',
] as const;

interface PcdItem {
	Station: string;
	StartTime: string;
	EndTime: string;
	CrowdLevel: string;
}

interface PcdResponse {
	value: PcdItem[];
}

// The feed updates every 10 minutes; serve a 1-minute cache to be polite.
const CACHE_TTL_MS = 60_000;
// Entries whose interval ended more than this long ago are stale (some branches
// rarely update, and the feed itself can lag an interval or two) and are dropped.
const STALE_MS = 3 * 60 * 60_000;

let cache: { at: number; data: PlatformCrowdResponse } | null = null;

export default defineEventHandler(async () => {
	const now = Date.now();
	if (cache && now - cache.at < CACHE_TTL_MS) {
		return cache.data;
	}

	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const results = await Promise.all(
		FEED_LINES.map(async (line) => {
			try {
				const data = await datamallFetch<PcdResponse>(
					`https://datamall2.mytransport.sg/ltaodataservice/PCDRealTime?TrainLine=${line}`,
					{
						method: 'GET',
						headers: {
							Accept: 'application/json',
							AccountKey: apiKey || '',
						},
					},
				);
				return data.value ?? [];
			} catch (error) {
				// A quota failure is not a quiet missing line; do not mask exhaustion as empty crowd data.
				if ((error as { statusCode?: number })?.statusCode === 503) throw error;
				return [] as PcdItem[];
			}
		}),
	);

	const freshAfter = now - STALE_MS;
	const entries: PlatformCrowdEntry[] = [];
	results.forEach((items, i) => {
		const line = FEED_LINES[i];
		for (const item of items) {
			const end = Date.parse(item.EndTime);
			if (!line || Number.isNaN(end) || end < freshAfter) continue;
			const level = (
				['l', 'm', 'h'].includes(item.CrowdLevel) ? item.CrowdLevel : 'l'
			) as CrowdLevel;
			entries.push({
				line,
				station: item.Station,
				level,
				start: item.StartTime,
				end: item.EndTime,
			});
		}
	});

	entries.sort((a, b) => a.station.localeCompare(b.station, undefined, { numeric: true }));

	const data: PlatformCrowdResponse = {
		updated: new Date(now).toISOString(),
		entries,
	};

	cache = { at: now, data };
	return data;
});
