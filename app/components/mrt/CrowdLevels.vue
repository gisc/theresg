<script setup lang="ts">
import type { MrtNetwork } from '~/utils/mrtRoute';
import type { PlatformCrowdResponse } from '~~/shared/types/PlatformCrowd';

const { data: network } = useLazyFetch<MrtNetwork>('/mrt-lines.json', {
	server: false,
	key: 'mrt-lines',
	getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
});

interface StationDirectoryEntry {
	code: string;
	name: string;
	line: string;
	open: boolean;
}

// Stations the feeds can report that are not yet in mrt-lines.json (new
// openings, unopened stations). One-line edit per station when things change.
const { data: directory } = useLazyFetch<{ stations: StationDirectoryEntry[] }>(
	'/mrt-station-directory.json',
	{
		server: false,
		key: 'mrt-station-directory',
		getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
	},
);

const {
	data: crowd,
	status,
	refresh,
} = useLazyFetch<PlatformCrowdResponse>('/api/platform-crowd', {
	server: false,
	key: 'platform-crowd',
});

// Order lines are listed in, matching how commuters know them.
const LINE_ORDER = ['NS', 'EW', 'CG', 'NE', 'CC', 'DT', 'TE', 'BP', 'SE', 'SW', 'PE', 'PW', 'CE'];
const FEED_FOR_LINE: Record<string, string> = { NS: 'NSL', EW: 'EWL', CG: 'CGL', NE: 'NEL', CC: 'CCL', DT: 'DTL', TE: 'TEL', BP: 'BPL', SE: 'SLRT', SW: 'SLRT', PE: 'PLRT', PW: 'PLRT', CE: 'CEL' };

const stationIndex = computed(() => {
	const map = new Map<string, { name: string; line: string; color: string }>();
	if (!network.value) return map;
	for (const line of network.value.lines) {
		for (const station of line.stations) {
			if (!map.has(station.code)) {
				map.set(station.code, { name: station.name, line: line.code, color: line.color });
			}
		}
	}
	return map;
});

const lineColors = computed(() => {
	const map = new Map<string, string>();
	if (!network.value) return map;
	for (const line of network.value.lines) {
		if (!map.has(line.code)) map.set(line.code, line.color);
	}
	return map;
});

const directoryIndex = computed(() => {
	const map = new Map<string, StationDirectoryEntry>();
	for (const station of directory.value?.stations ?? []) {
		map.set(station.code, station);
	}
	return map;
});

interface CrowdRow {
	station: string;
	name: string;
	line: string;
	color: string;
	level: 'l' | 'm' | 'h';
	inService: boolean;
}

const nowTick = ref(Date.now());

const rows = computed<CrowdRow[]>(() => {
	const mapped: CrowdRow[] = [];
	for (const entry of crowd.value?.entries ?? []) {
		const known = stationIndex.value.get(entry.station);
		const extra = directoryIndex.value.get(entry.station);
		// Skip stations that are not open yet (e.g. CC18 Bukit Brown) and codes
		// we cannot name at all, rather than showing a bare code.
		if (!known && !extra?.open) continue;
		const line = known?.line ?? extra?.line ?? entry.line;
		mapped.push({
			station: entry.station,
			name: known?.name ?? extra?.name ?? entry.station,
			line,
			color: known?.color ?? lineColors.value.get(line) ?? '#6F7978',
			level: entry.level,
			inService: isLineInService(line, new Date(nowTick.value)),
		});
	}
	return mapped;
});

// Keep lines in the filter even if DataMall omits an entire feed.
const availableLines = computed(() => LINE_ORDER.filter((code) => lineColors.value.has(code)));

const selectedUnavailable = computed(() => {
	if (selectedLine.value === 'all') return false;
	const feed = FEED_FOR_LINE[selectedLine.value];
	return Boolean(feed && crowd.value?.lineStatus?.[feed] === 'unavailable');
});

const unavailableLines = computed(() => availableLines.value.filter((code) => {
	const feed = FEED_FOR_LINE[code];
	return feed && crowd.value?.lineStatus?.[feed] === 'unavailable';
}));

const selectedLine = ref<string>('all');

const filteredRows = computed(() => {
	if (selectedLine.value === 'all') return rows.value;
	return rows.value.filter((row) => row.line === selectedLine.value);
});

const LEVEL_META = {
	l: { label: 'Low', class: 'low' },
	m: { label: 'Moderate', class: 'moderate' },
	h: { label: 'High', class: 'high' },
} as const;

function sgTime(value: string | number | Date): string {
	return new Date(value).toLocaleTimeString('en-SG', {
		timeZone: 'Asia/Singapore',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});
}

// The feed's own 10-minute window, not the page-load time.
const windowLabel = computed(() => {
	const entries = crowd.value?.entries ?? [];
	if (!entries.length) return '';
	const latest = entries.reduce((a, b) => (Date.parse(b.end) > Date.parse(a.end) ? b : a));
	return `${sgTime(latest.start)}–${sgTime(latest.end)}`;
});

const updatedLabel = computed(() => {
	if (!crowd.value?.updated) return '';
	return sgTime(crowd.value.updated);
});

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
	timer = setInterval(() => {
		nowTick.value = Date.now();
		refresh();
	}, 60_000);
});
onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
});
</script>

<template>
	<m3e-card>
		<m3e-heading slot="header" variant="title" size="large">
			Station Crowd Levels
		</m3e-heading>
		<div slot="content" class="crowd">
			<p class="blurb">
				Live platform crowd density from LTA DataMall, in 10-minute intervals<span
					v-if="windowLabel"
				>
					&middot; crowd as of {{ windowLabel }}</span
				><span v-else-if="updatedLabel"> &middot; updated {{ updatedLabel }}</span
				>.
			</p>
			<p v-if="status === 'pending'">Loading crowd levels...</p>
			<p v-else-if="status === 'error'">Crowd data unavailable. Try again shortly.</p>
			<template v-else>
				<div class="line-chips" role="group" aria-label="Filter by line">
					<button
						type="button"
						class="chip"
						:class="{ active: selectedLine === 'all' }"
						:aria-pressed="selectedLine === 'all'"
						@click="selectedLine = 'all'"
					>
						All
					</button>
					<button
						v-for="code in availableLines"
						:key="code"
						type="button"
						class="chip"
						:class="{ active: selectedLine === code }"
						:aria-pressed="selectedLine === code"
						@click="selectedLine = code"
					>
						{{ code }}
					</button>
				</div>
				<p v-if="selectedLine === 'all' && unavailableLines.length" class="unavailable-note">
					Data unavailable for {{ unavailableLines.join(', ') }}. Other lines may still have readings.
				</p>
				<p v-if="selectedUnavailable" class="unavailable-note">Data unavailable for {{ selectedLine }} right now. Try again shortly.</p>
				<p v-else-if="!filteredRows.length">No crowd data for this line right now.</p>
				<ul v-else class="stations">
					<li v-for="row in filteredRows" :key="row.station" class="station">
						<span class="station-code" :style="{ backgroundColor: row.color }">{{
							row.station
						}}</span>
						<span class="station-name">{{ row.name }}</span>
						<span v-if="!row.inService" class="level offline">Not in service</span>
						<span v-else class="level" :class="LEVEL_META[row.level].class">{{
							LEVEL_META[row.level].label
						}}</span>
					</li>
				</ul>
			</template>
		</div>
	</m3e-card>
</template>

<style lang="css" scoped>
.crowd {
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-top: 8px;
	color: var(--md-sys-color-on-surface);
}

.blurb {
	margin: 0;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}

.unavailable-note {
	margin: 0;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}

.line-chips {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.chip {
	border: 1px solid var(--md-sys-color-outline-variant);
	background: none;
	border-radius: 999px;
	padding: 4px 12px;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	color: var(--md-sys-color-on-surface);
	cursor: pointer;
}

.chip.active {
	background-color: var(--md-sys-color-primary);
	border-color: var(--md-sys-color-primary);
	color: var(--md-sys-color-on-primary);
}

.stations {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
}

.station {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 0;
	border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.station:last-child {
	border-bottom: 0;
}

.station-code {
	flex-shrink: 0;
	min-width: 44px;
	text-align: center;
	padding: 3px 6px;
	border-radius: 6px;
	color: #ffffff;
	font-size: 12px;
	font-weight: 700;
	box-sizing: border-box;
}

.station-name {
	flex-grow: 1;
	min-width: 0;
}

.level {
	flex-shrink: 0;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 600;
}

.level.low {
	background-color: #dcf5e3;
	color: #14532d;
}

.level.moderate {
	background-color: #fdf0c8;
	color: #713f12;
}

.level.high {
	background-color: var(--md-sys-color-error-container);
	color: var(--md-sys-color-on-error-container);
}

.level.offline {
	background-color: var(--md-sys-color-surface-variant);
	color: var(--md-sys-color-on-surface-variant);
}

.dark .level.low {
	background-color: #14532d;
	color: #dcf5e3;
}

.dark .level.moderate {
	background-color: #713f12;
	color: #fdf0c8;
}
</style>
