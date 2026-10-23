// Today's date in Singapore, regardless of the visitor's timezone.
export function sgDateString(now: number): string {
	const parts = new Intl.DateTimeFormat('en-SG', {
		timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
	}).formatToParts(new Date(now));
	const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
	return `${value('year')}-${value('month')}-${value('day')}`;
}

// Keep a featured event current through its end date in Singapore,
// regardless of the visitor's timezone. Mirrors food-closure.ts.
export function eventHasEnded(endsOn: string, now: number): boolean {
	return sgDateString(now) > endsOn;
}

// One venue stop of a roving event; from/to are YYYY-MM-DD in Singapore time.
export type EventStop = { venue: string; from: string; to: string; mrtTo: string };

// The stop running today in Singapore, else the next upcoming one.
export function currentEventStop(stops: EventStop[], now: number): EventStop | null {
	const today = sgDateString(now);
	return stops.find((stop) => today >= stop.from && today <= stop.to) ?? stops.find((stop) => stop.from > today) ?? null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-10-19'..'2026-10-25' -> '19-25 Oct'; across months -> '26 Oct-1 Nov'.
export function formatStopRange(from: string, to: string): string {
	const fromParts = from.split('-').map(Number);
	const toParts = to.split('-').map(Number);
	const fromMonth = fromParts[1] ?? 1;
	const toMonth = toParts[1] ?? 1;
	const fromDay = fromParts[2] ?? 1;
	const toDay = toParts[2] ?? 1;
	if (fromMonth === toMonth) return `${fromDay}–${toDay} ${MONTHS[toMonth - 1]}`;
	return `${fromDay} ${MONTHS[fromMonth - 1]}–${toDay} ${MONTHS[toMonth - 1]}`;
}
