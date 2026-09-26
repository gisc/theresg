import type { BusStop } from '~/types/BusStop';

export function getStopName(stops: BusStop[], code: string): string | null {
	return (stops.find((s) => s.code === code) || null)?.name || null;
}
