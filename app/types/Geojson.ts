import type { BusStop } from './BusStop';

export interface Geojson {
	type: string;
	features: {
		type: string;
		geometry: {
			type: string;
			coordinates: number[];
		};
		properties: BusStop;
	}[];
}
