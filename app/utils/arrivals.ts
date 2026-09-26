import { formatDistance } from 'date-fns';

export function timeToArrival(arrival: string, now: number): string {
	console.log('Arrival:', arrival);
	console.log('Now:', now);
	const arrivalDate = new Date(arrival);
	const currentDate = new Date(now);
	const distance = formatDistance(arrivalDate, currentDate, {
		addSuffix: true,
	});
	return distance;
}
