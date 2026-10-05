// Singapore time and day type (public holidays follow Sunday timings but cannot be detected here).
export function sgWhen(ms: number): { minutes: number; day: 'WD' | 'SAT' | 'SUN'; label: string } {
	const f = new Intl.DateTimeFormat('en-SG', {
		timeZone: 'Asia/Singapore',
		weekday: 'short',
		hour: 'numeric',
		minute: 'numeric',
		hourCycle: 'h23',
	}).formatToParts(new Date(ms));
	const g = (t: string) => f.find((p) => p.type === t)?.value ?? '';
	const wd = g('weekday');
	const minutes = Number(g('hour')) * 60 + Number(g('minute'));
	const day = wd === 'Sat' ? 'SAT' : wd === 'Sun' ? 'SUN' : 'WD';
	return { minutes, day, label: `${g('hour').padStart(2, '0')}:${g('minute').padStart(2, '0')}` };
}
