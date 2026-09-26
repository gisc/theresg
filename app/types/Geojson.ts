import type { BusStop } from './BusStop';

export interface Geojson {
	type: string;
	features: {
		properties: BusStop;
	}[];
}
