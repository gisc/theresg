const MONTH_INDEX: Record<string, number> = {
	jan: 0,
	feb: 1,
	mar: 2,
	apr: 3,
	may: 4,
	jun: 5,
	jul: 6,
	aug: 7,
	sep: 8,
	oct: 9,
	nov: 10,
	dec: 11,
};

const SG_TZ = 'Asia/Singapore';

// "Today" (start of day) in Singapore time, as a UTC-midnight timestamp.
export function sgTodayStart(now = new Date()): number {
	const parts = new Intl.DateTimeFormat('en-SG', {
		timeZone: SG_TZ,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
	}).formatToParts(now);
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	return Date.UTC(get('year'), get('month') - 1, get('day'));
}

function inferYear(month: number, now: number): number {
	const ref = new Date(sgTodayStart(new Date(now)));
	const year = ref.getUTCFullYear();
	const curMonth = ref.getUTCMonth();
	if (month - curMonth > 6) return year - 1;
	if (curMonth - month > 6) return year + 1;
	return year;
}

// Dates mentioned in an alert's text (day+month names, or dd/mm/yyyy).
export function mentionedDates(content: string, now = Date.now()): number[] {
	const dates: number[] = [];

	for (const m of content.matchAll(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/g)) {
		let year = Number(m[3]);
		if (year < 100) year += 2000;
		const month = Number(m[2]) - 1;
		const day = Number(m[1]);
		if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
			dates.push(Date.UTC(year, month, day));
		}
	}

	const monthRe =
		/\b(jan|feb|mar|apr|may|june?|july?|aug|sept?|oct|nov|dec)[a-z]*\.?\s*(\d{4})?/gi;
	for (const m of content.matchAll(monthRe)) {
		const month = MONTH_INDEX[m[1]!.toLowerCase().slice(0, 3)];
		if (month === undefined) continue;
		const year = m[2] ? Number(m[2]) : inferYear(month, now);
		// Day numbers just before the month name, e.g. "20 and 27 Sep", "20, 27 Sep", "27 Sep"
		const before = content.slice(Math.max(0, m.index - 40), m.index);
		// strip times ("10:30pm", "6am", "11.59pm") so they are not read as days
		const cleaned = before
			.replace(/\d{1,2}[:.]\d{2}\s*(?:am|pm)?/gi, ' ')
			.replace(/\d{1,2}\s*(?:am|pm)\b/gi, ' ');
		const dayMatches = [...cleaned.matchAll(/\b(\d{1,2})\b/g)];
		for (const d of dayMatches) {
			const day = Number(d[1]);
			if (day >= 1 && day <= 31) dates.push(Date.UTC(year, month, day));
		}
		// "Sep 27" style after the month name
		const after = content.slice(m.index + m[0].length, m.index + m[0].length + 8);
		const afterMatch = after.match(/^\s*(\d{1,2})\b/);
		if (afterMatch && !m[2]) {
			const day = Number(afterMatch[1]);
			if (day >= 1 && day <= 31) dates.push(Date.UTC(year, month, day));
		}
	}

	return dates;
}

// Keep alerts with no dates (unknown validity) or any date today/onwards (SGT).
export function isAlertCurrent(content: string, now = Date.now()): boolean {
	const dates = mentionedDates(content, now);
	if (!dates.length) return true;
	return Math.max(...dates) >= sgTodayStart(new Date(now));
}

export function formatSgDate(value: string | number | Date): string {
	return new Intl.DateTimeFormat('en-SG', {
		timeZone: SG_TZ,
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value));
}

// LTA alert texts sometimes carry a machine prefix: "05:00-SK-Planned Service
// Adjustment. ..." - a time, then a line code. Parse it into a tag and body,
// and fall back to the raw text when the format does not match.
const ALERT_LINE_TAGS: Record<string, string> = {
	NS: 'NSL',
	EW: 'EWL',
	CG: 'CGL',
	NE: 'NEL',
	CC: 'CCL',
	CE: 'CEL',
	DT: 'DTL',
	TE: 'TEL',
	BP: 'BP LRT',
	SK: 'SK LRT',
	PG: 'PG LRT',
	SE: 'SE LRT',
	SW: 'SW LRT',
	PE: 'PE LRT',
	PW: 'PW LRT',
};

export interface ParsedAlertContent {
	time?: string;
	lineTag?: string;
	text: string;
}

export function parseAlertContent(content: string): ParsedAlertContent {
	const m = content.match(/^(\d{1,2}:\d{2})-([A-Z]{2})-([\s\S]+)$/);
	if (!m) return { text: content };
	return {
		time: m[1],
		lineTag: ALERT_LINE_TAGS[m[2]!] ?? m[2],
		text: m[3]!.trim(),
	};
}
