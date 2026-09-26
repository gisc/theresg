import type { BusStop } from '~/types/BusStop';

export function getStop(stops: BusStop[], code: string): BusStop | null {
	return stops.find((s) => s.code === code) || null;
}

export function getStopName(stops: BusStop[], code: string): string | null {
	return getStop(stops, code)?.name || null;
}
