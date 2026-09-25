import type { BusStop } from './types/BusStop';
import path from 'node:path';
import fs from 'node:fs/promises';

async function cacheBusStops() {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;
	if (!apiKey || apiKey.length === 0) {
		console.error('error: LTA DataMall API key missing.');
		process.exit(1);
	}

	const allStops: BusStop[] = [];
	let skip = 0;
	// eslint-disable-next-line no-useless-assignment
	let fetchedCount: number = 0;

	do {
		const response = await fetch(
			`https://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${skip}`,
			{
				method: 'GET',
				headers: {
					Accept: 'application/json',
					AccountKey: apiKey,
				},
			},
		);

		if (!response.ok) {
			throw new Error(`error: failed to fetch bus stops: ${response.statusText}`);
		}

		const json = await response.json();
		const stops: BusStop[] = json.value;

		allStops.push(...stops);

		skip += 500;
		fetchedCount = stops.length;

		console.log(`log: fetched ${allStops.length} stops`);
	} while (fetchedCount === 500);

	const outputPath = path.join(process.cwd(), 'public/bus-stops.json');
	await fs.writeFile(outputPath, JSON.stringify(allStops));
	console.info(`info: fetched and cached ${allStops.length} stops`);
}

cacheBusStops();
