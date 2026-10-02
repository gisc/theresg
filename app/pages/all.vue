<script setup lang="ts">
import type { JourneyPlace } from '~/components/JourneyPlaceInput.vue';
import type { BusArrivalsResponse } from '~~/shared/types/BusArrivalsResponse';
import {
	ASSUMPTIONS,
	JourneyGraph,
	planJourneys,
	type JLine,
	type JNetworkInput,
	type JourneyOption,
	type JStop,
	type Leg,
} from '~~/shared/utils/journey';

definePageMeta({ title: 'Plan a trip' });
useSeoMeta({
	title: 'Plan a trip: bus and MRT',
	robots: 'noindex, nofollow',
});

interface StopFeature {
	geometry: { coordinates: [number, number] };
	properties: { code: string; name: string; road: string };
}
interface MrtJson {
	lines: JLine[];
	extraEdges: { from: string; to: string; line: string }[];
}
interface PlacesFile {
	items: { name: string; address?: string; lat?: number; lon?: number; category?: string; closed?: boolean }[];
}

const loadError = ref('');
const ready = ref(false);
const places = ref<JourneyPlace[]>([]);
const extraLoaded = ref(false);
let unsnapped = new Set<string>();
let graph: JourneyGraph | null = null;
let rawInput: Omit<JNetworkInput, 'when'> | null = null;
let builtFor = '';
const clock = ref(Date.now());
let clockTimer: ReturnType<typeof setInterval> | undefined;
onBeforeUnmount(() => clearInterval(clockTimer));

// Singapore time and day type (public holidays follow Sunday timings but cannot be detected here).
function sgWhen(ms: number): { minutes: number; day: 'WD' | 'SAT' | 'SUN'; label: string } {
	const f = new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(ms));
	const g = (t: string) => f.find((p) => p.type === t)?.value ?? '';
	const wd = g('weekday');
	const minutes = Number(g('hour')) * 60 + Number(g('minute'));
	const day = wd === 'Sat' ? 'SAT' : wd === 'Sun' ? 'SUN' : 'WD';
	return { minutes, day, label: `${g('hour').padStart(2, '0')}:${g('minute').padStart(2, '0')}` };
}
function ensureGraph() {
	if (!rawInput) return;
	const w = sgWhen(clock.value);
	const key = `${w.day}${Math.floor(w.minutes / 5)}`;
	if (key === builtFor && graph) return;
	graph = new JourneyGraph({ ...rawInput, when: { minutes: w.minutes, day: w.day } });
	builtFor = key;
}
const dataDate = ref<number | null>(null);
const dataSource = ref<'datamall' | 'datamall-snapshot' | 'dev-snapshot'>('datamall');

onMounted(async () => {
	clockTimer = setInterval(() => (clock.value = Date.now()), 60_000);
	try {
		const [stopsFc, mrt, net, walk] = await Promise.all([
			$fetch<{ features: StopFeature[] }>('/bus-stops.json'),
			$fetch<MrtJson>('/mrt-lines.json'),
			$fetch<{ updatedAt: number; source: 'datamall' | 'datamall-snapshot' | 'dev-snapshot'; services: Record<string, Record<string, string[]>>; dist?: JNetworkInput['dist']; hours?: JNetworkInput['hours'] }>('/api/bus-network'),
			$fetch<{ ids: string[]; links: Record<string, number[]>; unsnapped: string[]; source: string }>('/walk-links.json'),
		]);
		const stops: JStop[] = stopsFc.features.map((f) => ({
			code: f.properties.code,
			name: f.properties.name,
			road: f.properties.road,
			lon: f.geometry.coordinates[0],
			lat: f.geometry.coordinates[1],
		}));
		rawInput = {
			stops,
			lines: mrt.lines,
			extraEdges: mrt.extraEdges,
			services: net.services,
			dist: net.dist,
			hours: net.hours,
			walk: { ids: walk.ids, links: walk.links },
		};
		ensureGraph();
		unsnapped = new Set(walk.unsnapped);
		dataDate.value = net.updatedAt;
		dataSource.value = net.source;
		const out: JourneyPlace[] = [];
		for (const st of graph!.stations) {
			out.push({
				id: `m:${st.name}`,
				name: st.name,
				sub: '',
				kind: 'mrt',
				lat: st.lat,
				lon: st.lon,
				codes: st.codes.map((c) => ({ code: c.code, color: c.color, textColor: c.textColor })),
			});
		}
		for (const s of stops) {
			out.push({ id: `b:${s.code}`, name: s.name, sub: `${s.road} - stop ${s.code}`, kind: 'bus', lat: s.lat, lon: s.lon });
		}
		places.value = out;
		ready.value = true;
		applyQuery();
	} catch {
		loadError.value = 'Route data is unavailable right now. Try again in a minute.';
	}
});

// Hawker centres, attractions, parks and libraries load when a field is first used.
async function loadExtra() {
	if (extraLoaded.value) return;
	extraLoaded.value = true;
	try {
		const [h, a, e] = await Promise.all([
			$fetch<PlacesFile>('/hawker-centres.json'),
			$fetch<PlacesFile>('/attractions.json'),
			$fetch<PlacesFile>('/explore-places.json'),
		]);
		const add: JourneyPlace[] = [];
		const push = (items: PlacesFile['items'], kind: JourneyPlace['kind'], sub: string, prefix: string) => {
			for (const it of items) {
				if (typeof it.lat !== 'number' || typeof it.lon !== 'number' || it.closed) continue;
				if (unsnapped.has(`${prefix}:${it.name}`)) continue;
				add.push({ id: `${prefix}:${it.name}`, name: it.name, sub, kind, lat: it.lat, lon: it.lon });
			}
		};
		push(h.items, 'hawker', 'Hawker centre', 'h');
		push(a.items, 'attraction', 'Attraction', 'a');
		push(e.items, 'park', 'Park', 'p');
		places.value = [...add, ...places.value];
	} catch {
		extraLoaded.value = false;
	}
}

const from = ref<JourneyPlace | null>(null);
const to = ref<JourneyPlace | null>(null);

// Postal codes: OneMap gives the address and point, then walking distances to nearby stops
// and stations come from OneMap's pedestrian router (not straight-line guesses).
const postalLinks = shallowRef(new Map<string, { id: string; meters: number }[]>());
const postalMsg = reactive<{ from: string; to: string }>({ from: '', to: '' });
const postalBusy = ref(false);
function distM(aLat: number, aLon: number, bLat: number, bLon: number) {
	const p = Math.PI / 180;
	const x = Math.sin(((bLat - aLat) * p) / 2) ** 2 + Math.cos(aLat * p) * Math.cos(bLat * p) * Math.sin(((bLon - aLon) * p) / 2) ** 2;
	return 2 * 6371000 * Math.asin(Math.sqrt(x));
}
function tidyAddress(address: string, code: string) {
	const base = address.replace(new RegExp(`\\s*SINGAPORE\\s*${code}$`, 'i'), '');
	return base.toLowerCase().replace(/(^|[\s(-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
}
// Walking legs next to a postal code come from OneMap's pedestrian router, the others from OpenStreetMap paths.
const isPostalName = (n: string) => [from.value, to.value].some((p) => p?.kind === 'postal' && p.name === n);
async function resolvePostal(side: 'from' | 'to') {
	const ref_ = side === 'from' ? from : to;
	const place = ref_.value;
	if (!place || !place.id.startsWith('pc:') || postalLinks.value.has(place.id) || !rawInput) return;
	const code = place.id.slice(3);
	postalMsg[side] = '';
	postalBusy.value = true;
	try {
		const r = await $fetch<{ address: string; lat: number; lon: number }>('/api/postal', { query: { code } });
		const near = <T extends { lat: number; lon: number }>(items: T[], n: number) =>
			items
				.map((it) => ({ it, d: distM(r.lat, r.lon, it.lat, it.lon) }))
				.filter((x) => x.d <= 1500)
				.sort((a, b) => a.d - b.d)
				.slice(0, n)
				.map((x) => x.it);
		const targets = [
			...near(rawInput.stops, 10).map((s) => ({ id: `b:${s.code}`, lat: s.lat, lon: s.lon })),
			...near(graph!.stations, 5).map((s) => ({ id: `m:${s.name}`, lat: s.lat, lon: s.lon })),
		];
		if (!targets.length) {
			postalMsg[side] = `No bus stop or station within 1.5 km of ${r.address}.`;
			return;
		}
		const w = await $fetch<{ links: { id: string; meters: number }[] }>('/api/postal-walk', { method: 'POST', body: { lat: r.lat, lon: r.lon, targets } });
		const next = new Map(postalLinks.value);
		next.set(place.id, w.links);
		postalLinks.value = next;
		if (ref_.value?.id === place.id) {
			ref_.value = { id: place.id, name: `${tidyAddress(r.address, code)} (${code})`, sub: `Postal code ${code}`, kind: 'postal', lat: r.lat, lon: r.lon };
		}
	} catch (e) {
		const status = (e as { statusCode?: number }).statusCode;
		postalMsg[side] =
			status === 404
				? `Postal code ${code} was not found.`
				: status === 429
					? 'Too many lookups, try again in a minute.'
					: 'Postal code lookup is unavailable right now. Try a station, bus stop or place name.';
		if (ref_.value?.id === place.id) ref_.value = null;
	} finally {
		postalBusy.value = false;
	}
}
watch(from, () => {
	postalMsg.from = '';
	resolvePostal('from');
});
watch(to, () => {
	postalMsg.to = '';
	resolvePostal('to');
});

// /all?from=<station or stop name>&to=<name> pre-fills the fields.
const route = useRoute();
async function applyQuery() {
	if (route.query.from || route.query.to) await loadExtra();
	const find = (q: unknown) => {
		if (typeof q !== 'string' || !q) return null;
		const l = q.toLowerCase();
		return places.value.find((p) => p.name.toLowerCase() === l || p.id === `b:${l}`) ?? null;
	};
	if (!from.value) from.value = find(route.query.from);
	if (!to.value) to.value = find(route.query.to);
}

function swap() {
	const f = from.value;
	from.value = to.value;
	to.value = f;
}

const options = computed<JourneyOption[] | null>(() => {
	if (!ready.value || !from.value || !to.value) return null;
	if (from.value.id === to.value.id) return [];
	clock.value; // re-plan when the clock moves on
	ensureGraph();
	if (!graph) return null;
	// A postal code is only plannable once its walking links have arrived.
	for (const p of [from.value, to.value]) {
		if (p.id.startsWith('pc:')) {
			const links = postalLinks.value.get(p.id);
			if (!links) return null;
			graph.setPlaceLinks(p.id, links);
		}
	}
	return planJourneys(graph, from.value, to.value);
});

const whenLabel = computed(() => sgWhen(clock.value));
// Rail and most buses do not run overnight; warn rather than imply a trip is possible.
const offHours = computed(() => whenLabel.value.minutes >= 60 && whenLabel.value.minutes < 5 * 60 + 30);

const live = reactive<Record<string, { loading: boolean; text: string }>>({});
async function checkLive(leg: Extract<Leg, { mode: 'bus' }>) {
	const key = `${leg.boardCode}:${leg.service}`;
	live[key] = { loading: true, text: '' };
	try {
		const r = await $fetch<BusArrivalsResponse>('/api/bus-arrivals', { query: { stopCode: leg.boardCode } });
		if (r.error) {
			live[key] = { loading: false, text: 'Live arrivals are unavailable right now.' };
			return;
		}
		const svc = r.services.find((s) => s.ServiceNo.toLowerCase() === leg.service.toLowerCase());
		if (!svc) {
			live[key] = { loading: false, text: `No live ${leg.service} reported at this stop right now.` };
			return;
		}
		const now = Date.now();
		const times = [svc.NextBus, svc.NextBus2, svc.NextBus3]
			.filter((b) => b?.EstimatedArrival)
			.map((b) => `${timeToArrival(b.EstimatedArrival, now)}${isLiveEstimate(b) ? '' : ' (scheduled)'}`);
		live[key] = { loading: false, text: times.length ? `Next: ${times.join(', ')}` : 'No estimate yet.' };
	} catch {
		live[key] = { loading: false, text: 'Live arrivals are unavailable right now.' };
	}
}

function mins(n: number) {
	return `${Math.max(1, Math.round(n))} min`;
}
function dataAsOf() {
	return dataDate.value
		? new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short', year: 'numeric' }).format(dataDate.value)
		: '';
}
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading class="heading" variant="headline" size="large">Plan a trip</m3e-heading>
			<m3e-card>
				<div slot="content" class="planner">
					<div class="fields">
						<div class="flabel">From</div>
						<JourneyPlaceInput
							v-model="from"
							label="Station, bus stop, place or postal code"
							:places="places"
							@focused="loadExtra()"
						/>
						<m3e-icon-button class="swap" aria-label="Swap from and to" @click="swap">
							<Icon name="material-symbols:swap-vert" />
						</m3e-icon-button>
						<div class="flabel">To</div>
						<JourneyPlaceInput v-model="to" label="Station, bus stop, place or postal code" :places="places" @focused="loadExtra()" />
					</div>
					<p v-if="postalMsg.from || postalMsg.to" class="hint err">{{ postalMsg.from || postalMsg.to }}</p>
					<p v-else-if="postalBusy" class="hint">Looking up postal code...</p>
					<p v-if="loadError" class="hint err">{{ loadError }}</p>
					<p v-else-if="!ready" class="hint">Loading routes...</p>

					<p v-if="offHours && options" class="warn">
						<Icon name="material-symbols:schedule-outline" />
						It is late. MRT and most buses may not be running now, so check before you set off.
					</p>

					<template v-if="options">
						<p v-if="options.length === 0" class="hint">
							No bus or MRT route found between these two places within walking range of a stop or station.
						</p>
						<div v-for="(o, oi) in options" :key="oi" class="option">
							<div class="option-head">
								<span class="option-label">{{ o.label }}</span>
								<span class="option-time">~{{ o.minutes }} min</span>
							</div>
							<p class="option-meta">
								{{ o.transfers === 0 ? 'No transfers' : `${o.transfers} ${o.transfers === 1 ? 'transfer' : 'transfers'}` }}
								<template v-if="o.walkMeters >= 30"> &middot; {{ Math.round(o.walkMeters / 10) * 10 }} m walking</template>
							</p>
							<ol class="legs">
								<li v-for="(l, li) in o.legs" :key="li" class="leg">
									<template v-if="l.mode === 'walk'">
										<span class="badge walk"><Icon name="material-symbols:directions-walk" /></span>
										<div class="leg-body">
											<div class="leg-title">Walk about {{ Math.round(l.meters / 10) * 10 }} m <span class="dim">({{ mins(l.minutes) }})</span></div>
											<div class="dim">{{ l.from }} to {{ l.to }}</div>
											<div class="dim">Path distance from {{ isPostalName(l.from) || isPostalName(l.to) ? 'OneMap' : 'OpenStreetMap' }}</div>
										</div>
									</template>
									<template v-else-if="l.mode === 'bus'">
										<span class="badge bus">{{ l.service }}</span>
										<div class="leg-body">
											<div class="leg-title">
												Bus {{ l.service }} <span v-if="l.towards" class="dim">towards {{ l.towards }}</span>
											</div>
											<div class="dim">
												Board {{ l.boardName }} ({{ l.boardCode }})<br />
												Get off {{ l.alightName }} ({{ l.alightCode }})
											</div>
											<div class="dim">
												{{ l.stops }} {{ l.stops === 1 ? 'stop' : 'stops' }} &middot; about {{ mins(l.minutes) }} on board, plus ~{{ l.waitMinutes }} min average wait
											</div>
											<div class="live-row">
												<button type="button" class="live-btn" @click="checkLive(l)">Live arrivals here</button>
												<span v-if="live[`${l.boardCode}:${l.service}`]" class="dim">
													{{ live[`${l.boardCode}:${l.service}`]!.loading ? 'Checking...' : live[`${l.boardCode}:${l.service}`]!.text }}
												</span>
											</div>
										</div>
									</template>
									<template v-else>
										<span class="badge mrt" :style="{ backgroundColor: l.color, color: l.textColor }">{{ l.line }}</span>
										<div class="leg-body">
											<div class="leg-title">
												{{ l.lineName }} <span v-if="l.towards" class="dim">towards {{ l.towards }}</span>
											</div>
											<div class="dim">{{ l.from }} to {{ l.to }}</div>
											<div class="dim">
												{{ l.stops }} {{ l.stops === 1 ? 'stop' : 'stops' }} &middot; about {{ mins(l.minutes) }} on board, plus ~{{ l.waitMinutes }} min average wait
											</div>
										</div>
									</template>
								</li>
							</ol>
						</div>
						<p v-if="options.length" class="note">
							Times are planning estimates from distances and average waits, not live or timetable data
							(walk {{ ASSUMPTIONS.walkMetersPerMin }} m/min, bus wait ~{{ ASSUMPTIONS.busWaitMin }} min, MRT wait ~{{ ASSUMPTIONS.mrtWaitMin }} min).
							Use "Live arrivals here" for the next bus. Combined bus and MRT fares are not calculated.
							Walking distances are measured along OpenStreetMap footpaths and roads (map data of 26 Sep 2026), or by OneMap for postal codes, not
							surveyed on site: they do not know about closed paths, works, weather or whether a route is sheltered. Check a walk on a map
							before you rely on it. Buses shown are those scheduled to run at {{ whenLabel.label }} Singapore time
							(public holidays follow Sunday timings, which this page cannot detect).
							<template v-if="dataSource === 'datamall'">Bus routes: LTA DataMall, loaded {{ dataAsOf() }}.</template>
							<strong v-else-if="dataSource === 'datamall-snapshot'">PREVIEW: bus routes and operating hours are a saved copy of LTA DataMall BusRoutes fetched on {{ dataAsOf() }}. The live site will fetch them daily.</strong>
							<strong v-else>PREVIEW ONLY: bus routes here come from a sample snapshot (data.busrouter.sg, {{ dataAsOf() }}), not live LTA DataMall, and its operating hours are placeholders except 73T.</strong>
						</p>
					</template>
					<p v-else-if="ready" class="hint">Choose a start and a destination to see bus, MRT and mixed routes.</p>
				</div>
			</m3e-card>
			<DataCredits />
		</div>
	</div>
</template>

<style lang="css" scoped>
.bg {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	background-color: var(--md-sys-color-surface-container);
}
.pg {
	width: 100%;
	height: 100%;
	min-height: 0;
	overflow-y: auto;
	background-color: var(--md-sys-color-surface);
	border-radius: 32px;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 20px;
}
.pg::-webkit-scrollbar {
	display: none;
}
.heading {
	color: var(--md-sys-color-on-surface);
}
.planner {
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin-top: 8px;
}
.fields {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.swap {
	align-self: flex-end;
}
.hint {
	margin: 0;
	color: var(--md-sys-color-on-surface-variant);
}
.err {
	color: var(--md-sys-color-error);
}
.warn {
	display: flex;
	gap: 8px;
	align-items: flex-start;
	margin: 0;
	padding: 10px 12px;
	border-radius: 12px;
	background: var(--md-sys-color-surface-container-high);
	color: var(--md-sys-color-on-surface);
	font-size: 14px;
}
.option {
	border: 1px solid var(--md-sys-color-outline-variant);
	border-radius: 16px;
	padding: 12px;
	background: var(--md-sys-color-surface-container-low);
}
.option-head {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 8px;
}
.option-label {
	font-weight: 700;
	color: var(--md-sys-color-on-surface);
}
.option-time {
	font-weight: 700;
	color: var(--md-sys-color-primary);
	white-space: nowrap;
}
.option-meta {
	margin: 2px 0 10px;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}
.legs {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
}
.leg {
	display: flex;
	gap: 10px;
	align-items: flex-start;
}
.badge {
	flex: 0 0 auto;
	min-width: 38px;
	height: 28px;
	padding: 0 8px;
	box-sizing: border-box;
	border-radius: 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 13px;
}
.badge.bus {
	background: #1a1a1a;
	color: #fff;
}
.flabel {
	font-weight: 600;
	font-size: 0.9rem;
}
.badge.walk {
	background: var(--md-sys-color-surface-container-highest);
	color: var(--md-sys-color-on-surface);
}
.leg-body {
	min-width: 0;
	color: var(--md-sys-color-on-surface);
}
.leg-title {
	font-weight: 600;
}
.dim {
	font-weight: 400;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}
.live-row {
	margin-top: 6px;
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}
.live-btn {
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	padding: 6px 12px;
	border-radius: 999px;
	border: 1px solid var(--md-sys-color-outline);
	background: transparent;
	color: var(--md-sys-color-primary);
	cursor: pointer;
}
.note {
	margin: 0;
	font-size: 12px;
	color: var(--md-sys-color-on-surface-variant);
}
@media (max-width: 600px) {
	.pg {
		border-radius: 0;
		padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
		gap: 14px;
	}
}
</style>
