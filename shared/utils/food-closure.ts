// Keep a last-business-day feature valid through that day in Singapore,
// regardless of the visitor's timezone. Undefined means no closure announced.
export function foodIsClosed(closesOn: string | undefined, now: number): boolean {
	if (!closesOn) return false;
	const parts = new Intl.DateTimeFormat('en-SG', {
		timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
	}).formatToParts(new Date(now));
	const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
	return `${value('year')}-${value('month')}-${value('day')}` > closesOn;
}
