// Approximate daily service windows per line (SGT), from each line's typical
// first departure to its typical last arrival. Special late nights (eve of
// public holidays, New Year's Eve, etc.) are not modelled, so treat the
// "Not in service" label as approximate.
const SERVICE_WINDOWS: Record<string, { start: string; end: string }> = {
	NS: { start: '05:15', end: '00:45' },
	EW: { start: '05:15', end: '00:45' },
	CG: { start: '05:20', end: '23:59' },
	NE: { start: '05:25', end: '00:05' },
	CC: { start: '05:25', end: '00:00' },
	CE: { start: '05:25', end: '00:00' },
	DT: { start: '05:25', end: '00:35' },
	TE: { start: '05:25', end: '00:30' },
	BP: { start: '05:25', end: '00:30' },
	SE: { start: '05:25', end: '00:30' },
	SW: { start: '05:25', end: '00:30' },
	PE: { start: '05:25', end: '00:30' },
	PW: { start: '05:25', end: '00:30' },
};

const DEFAULT_WINDOW = { start: '05:15', end: '00:45' };

function sgMinutes(now: Date): number {
	const parts = new Intl.DateTimeFormat('en-SG', {
		timeZone: 'Asia/Singapore',
		hour: 'numeric',
		minute: 'numeric',
		hourCycle: 'h23',
	}).formatToParts(now);
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	return get('hour') * 60 + get('minute');
}

function toMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(':').map(Number);
	return h! * 60 + m!;
}

export function isLineInService(line: string, now = new Date()): boolean {
	const window = SERVICE_WINDOWS[line] ?? DEFAULT_WINDOW;
	const start = toMinutes(window.start);
	const end = toMinutes(window.end);
	const nowMin = sgMinutes(now);
	// Windows run past midnight (end is next-day), e.g. 05:15 -> 00:45.
	if (nowMin >= start) return true;
	return nowMin <= end;
}

export function firstTrainLabel(line: string): string {
	const window = SERVICE_WINDOWS[line] ?? DEFAULT_WINDOW;
	const [h, m] = window.start.split(':').map(Number);
	const hour12 = h! % 12 === 0 ? 12 : h! % 12;
	return `${hour12}:${String(m).padStart(2, '0')} am`;
}
