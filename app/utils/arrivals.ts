import { formatDistance } from 'date-fns';

export function timeToArrival(arrival: string, now: number): string {
	if (!arrival) return 'No estimate';
	const time = new Date(arrival).getTime();
	if (!Number.isFinite(time)) return 'No estimate';
	if (time <= now) return 'Due';
	return formatDistance(time, now, { addSuffix: true });
}

// DataMall Load codes: SEA seats available, SDA standing available, LSD limited standing.
export function busLoadLabel(load: string): string {
	switch (load) {
		case 'SEA':
			return 'Seats';
		case 'SDA':
			return 'Standing';
		case 'LSD':
			return 'Limited';
		default:
			return '';
	}
}

export function busLoadClass(load: string): string {
	switch (load) {
		case 'SEA':
			return 'load-seats';
		case 'SDA':
			return 'load-standing';
		case 'LSD':
			return 'load-limited';
		default:
			return '';
	}
}

export function isWheelchairAccessible(feature: string): boolean {
	return feature?.toUpperCase().includes('WAB') ?? false;
}

export function busDeckLabel(type: string): string {
	return type === 'DD' ? 'Double-decker' : '';
}

// Monitored = 1 means the estimate comes from live tracking; anything else is
// timetable-based and should read as "Scheduled".
export function isLiveEstimate(bus: { Monitored?: number; EstimatedArrival?: string }): boolean {
	return bus?.Monitored === 1 && Boolean(bus?.EstimatedArrival);
}
