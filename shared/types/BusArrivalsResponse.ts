import type { BusArrival } from './BusArrival';

export interface BusArrivalsResponse {
	services: BusArrival[];
	fetchedAt: string;
	error?: string;
}
