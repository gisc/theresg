import { formatDistance } from 'date-fns';

export function timeToArrival(arrival: string, now: number): string {
	if (!arrival) return 'No estimate';
	const time = new Date(arrival).getTime();
	if (!Number.isFinite(time)) return 'No estimate';
	if (time <= now) return 'Due';
	return formatDistance(time, now, { addSuffix: true });
}
