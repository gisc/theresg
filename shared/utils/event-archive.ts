// Keep a featured event current through its end date in Singapore,
// regardless of the visitor's timezone. Mirrors food-closure.ts.
export function eventHasEnded(endsOn: string, now: number): boolean {
	const parts = new Intl.DateTimeFormat('en-SG', {
		timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
	}).formatToParts(new Date(now));
	const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
	return `${value('year')}-${value('month')}-${value('day')}` > endsOn;
}
