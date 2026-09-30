<script setup lang="ts">
import type { BusStop } from '~/types/BusStop';
import type { Geojson } from '~/types/Geojson';
import type { BusArrival } from '~~/shared/types/BusArrival';
import type { BusArrivalsResponse } from '~~/shared/types/BusArrivalsResponse';

definePageMeta({
	title: 'Bus',
});

useSeoMeta({
	title: 'Bus',
});

const router = useRouter();
const { favourites } = useFavouriteStops();
const route = useRoute();
const stopQuery = ref('');
const serviceQuery = ref('');
const service = ref('');
const stopFocused = ref(false);
const serviceFocused = ref(false);
const routeLoading = ref(false);
const routeError = ref('');
const routeDirections = ref<Record<string, string[]>>({});
const { data: serviceList, status: serviceStatus } = useFetch<string[]>('/api/bus-service-lookup', {
	default: () => [],
});
const { data: geojson } = await useLazyFetch('/bus-stops.json', {
	server: false,
});


const allStops = computed(() => {
  const data = geojson.value as Geojson | null;
  return data?.features?.map((f) => f.properties) ?? [];
});

// Default to the bus stop nearest the user (Singapore only). Leaves the
// field blank when location is unavailable, denied, or outside Singapore.
const triedGeoDefault = ref(false);
watch(
	() => (geojson.value as Geojson | null)?.features?.length ?? 0,
	async (count) => {
		if (triedGeoDefault.value || !count || route.query.stop) return;
		triedGeoDefault.value = true;
		const coords = await getSingaporeCoords();
		if (!coords || route.query.stop) return;
		const features = (geojson.value as Geojson | null)?.features ?? [];
		const nearest = nearestByCoords(
			features,
			(f) => ({ lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }),
			coords,
		);
		if (nearest && !route.query.stop) pickStop(nearest.properties);
	},
);

const selectedStop = computed(
	() => allStops.value.find((s) => s.code === route.query.stop) ?? null,
);

// Stops near me: stops within 300m of the user with their next arrivals.
interface NearStop {
	stop: BusStop;
	distance: number;
	arrivals: BusArrival[];
	error: boolean;
}

const nearMe = ref<NearStop[] | null>(null);
const nearMeLoading = ref(false);
const nearMeNote = ref('');

async function findStopsNearMe() {
	nearMeLoading.value = true;
	nearMeNote.value = '';
	nearMe.value = null;
	const coords = await getSingaporeCoords();
	if (!coords) {
		nearMeLoading.value = false;
		nearMeNote.value =
			'Location is unavailable. Allow location access and try again (Singapore only).';
		return;
	}
	const features = ((geojson.value as Geojson | null)?.features ?? [])
		.map((f) => ({
			feature: f,
			distance: haversineM(coords, {
				lat: f.geometry.coordinates[1] as number,
				lon: f.geometry.coordinates[0] as number,
			}),
		}))
		.filter((x) => x.distance <= 300)
		.sort((a, b) => a.distance - b.distance)
		.slice(0, 6);
	if (!features.length) {
		nearMeLoading.value = false;
		nearMeNote.value = 'No bus stops within 300 m of you.';
		return;
	}
	const results: NearStop[] = await Promise.all(
		features.map(async ({ feature, distance }) => {
			try {
				const result = await $fetch<BusArrivalsResponse>('/api/bus-arrivals', {
					query: { stopCode: feature.properties.code },
				});
				return {
					stop: feature.properties,
					distance,
					arrivals: result.services,
					error: Boolean(result.error),
				};
			} catch {
				return { stop: feature.properties, distance, arrivals: [], error: true };
			}
		}),
	);
	nearMe.value = results;
	nearMeLoading.value = false;
}
const stopMatches = computed(() => {
	const q = stopQuery.value.trim().toLowerCase();
	if (
		!q ||
		(selectedStop.value &&
			stopQuery.value === `${selectedStop.value.name} (${selectedStop.value.code})`)
	)
		return [];
	const matches = allStops.value.filter(
		(s) =>
			s.code.startsWith(q) ||
			s.name.toLowerCase().includes(q) ||
			s.road.toLowerCase().includes(q),
	);
	return matches.sort((a, b) => Number(b.code === q) - Number(a.code === q)).slice(0, 8);
});
const serviceMatches = computed(() => {
	const q = serviceQuery.value.trim().toUpperCase();
	if (!q || q === service.value) return [];
	return (serviceList.value ?? []).filter((s) => s.toUpperCase().startsWith(q)).slice(0, 8);
});
const directions = computed(() =>
	Object.entries(routeDirections.value).sort(([a], [b]) => Number(a) - Number(b)),
);
const activeDirection = ref('1');
const routeStops = computed(() =>
	(routeDirections.value[activeDirection.value] ?? []).map(
		(code) =>
			allStops.value.find((s) => s.code === code) ?? { code, name: `Stop ${code}`, road: '' },
	),
);
function blurSuggestions(which: 'service' | 'stop') {
	window.setTimeout(() => {
		if (which === 'service') serviceFocused.value = false;
		else stopFocused.value = false;
	}, 180);
}
let routeRequest = 0;
function pickStop(s: BusStop) {
	stopQuery.value = `${s.name} (${s.code})`;
	stopFocused.value = false;
	router.push({ path: '/bus', query: { ...route.query, stop: s.code } });
}
async function pickService(s: string) {
	serviceQuery.value = s;
	serviceFocused.value = false;
	service.value = s;
	routeDirections.value = {};
	routeError.value = '';
	routeLoading.value = true;
	router.replace({ path: '/bus', query: { ...route.query, service: s } });
	const request = ++routeRequest;
	try {
		const result = await $fetch<Record<string, string[]>>('/api/bus-route-lookup', {
			query: { service: s },
		});
		if (request !== routeRequest) return;
		routeDirections.value = result;
		activeDirection.value = Object.keys(result).sort()[0] ?? '1';
	} catch {
		if (request === routeRequest)
			routeError.value = 'Could not load this route. Please try again.';
	} finally {
		if (request === routeRequest) routeLoading.value = false;
	}
}
function stopInput(e: Event) {
	stopQuery.value = (e.target as HTMLInputElement).value;
	stopFocused.value = true;
}
function serviceInput(e: Event) {
	serviceQuery.value = (e.target as HTMLInputElement).value.toUpperCase();
	serviceFocused.value = true;
}
function submitStop() {
	const exact = allStops.value.find((s) => s.code === stopQuery.value.trim());
	const match = exact ?? stopMatches.value[0] ?? null;
	if (match) pickStop(match);
}
function submitService() {
	const exact = (serviceList.value ?? []).find(
		(s) => s.toUpperCase() === serviceQuery.value.trim().toUpperCase(),
	);
	const match = exact ?? serviceMatches.value[0] ?? null;
	if (match) pickService(match);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapInstance = shallowRef<any>(null);
const arrivalsSection = ref<HTMLElement | null>(null);

watch(
	() => route.query.stop,
	async (code, previous) => {
		if (!code || code === previous || !window.matchMedia('(max-width: 767px)').matches) return;
		await nextTick();
		const page = arrivalsSection.value?.closest('.pg');
		if (!page || !arrivalsSection.value) return;
		page.scrollTo({
			top: page.scrollTop + arrivalsSection.value.getBoundingClientRect().top - page.getBoundingClientRect().top - 12,
			behavior: 'instant',
		});
	},
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleMapLoad(e: any) {
	mapInstance.value = e.target;
}

const style = 'https://tiles.openfreemap.org/styles/liberty';
const center = {
	lng: 103.8501,
	lat: 1.2897,
};
const zoom = 10;
// Bus arrivals only cover Singapore, so keep the map within the country.
const minZoom = 10;
const maxBounds = [
	[103.55, 1.15], // south-west
	[104.1, 1.5], // north-east
];

const circleColor = ref<string>('#006A66');
const outlineColor = ref<string>('#6F7978');
const clusterTextColor = ref<string>('#FFFFFF');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleStopClick(e: any) {
	const feature = e.features[0];
	if (!feature) {
		console.error('No feature found.');
		return;
	}

	const properties: BusStop = feature.properties;

	pickStop(properties);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleClusterClick(e: any) {
	const feature = e.features?.[0];
	if (!feature) {
		return;
	}

	const source = mapInstance.value?.getSource('stops');
	if (!source) {
		return;
	}

	const expansionZoom = await (
		source as unknown as {
			getClusterExpansionZoom: (clusterId: number) => Promise<number>;
		}
	).getClusterExpansionZoom(feature.properties.cluster_id);

	mapInstance.value?.easeTo({
		center: feature.geometry.coordinates as [number, number],
		zoom: expansionZoom + 0.5,
	});
}

onMounted(() => {
	const content = document.querySelector('#content');
	if (content) {
		const style = window.getComputedStyle(content);

		const primaryVar = style.getPropertyValue('--md-sys-color-primary').trim();
		const outlineVar = style.getPropertyValue('--md-sys-color-outline').trim();
		const onPrimaryVar = style.getPropertyValue('--md-sys-color-on-primary').trim();

		if (primaryVar) {
			circleColor.value = primaryVar;
		}

		if (outlineVar) {
			outlineColor.value = outlineVar;
		}

		if (onPrimaryVar) {
			clusterTextColor.value = onPrimaryVar;
		}
	}
	if (typeof route.query.service === 'string') pickService(route.query.service);
});
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading class="heading" variant="headline" size="large">Bus</m3e-heading>
			<MyCommute v-if="favourites.length" compact show-all class="saved-stops" />
			<section class="intro" aria-label="How to use bus search">
				<h2>Find your bus or stop</h2>
				<p>
					Search a bus number to see its route, then tap a stop for live arrivals. Or
					search a stop by name, road, or 5-digit code to see every bus arriving there.
				</p>
				<p class="example">
					<strong>Example:</strong> Enter <strong>36</strong>, choose a stop on its route,
					and see when bus 36 arrives. You can also enter <strong>01012</strong> for
					arrivals at Hotel Grand Pacific.
				</p>
			</section>
			<div class="near-me">
				<button type="button" class="near-me-button" :disabled="nearMeLoading" @click="findStopsNearMe()">
					<Icon name="material-symbols:my-location" />
					{{ nearMeLoading ? 'Finding stops near you...' : 'Stops near me' }}
				</button>
				<p v-if="nearMeNote" class="near-me-note">{{ nearMeNote }}</p>
			</div>
			<m3e-card v-if="nearMe?.length" class="near-me-card">
				<m3e-heading slot="header" variant="title" size="large"
					>Stops within 300 m</m3e-heading
				>
				<m3e-list slot="content" variant="segmented">
					<m3e-list-item v-for="item in nearMe" :key="item.stop.code">
						<button type="button" class="near-stop" @click="pickStop(item.stop)">
							<strong>{{ item.stop.name }}</strong>
							<small>{{ item.stop.road }} &middot; {{ item.stop.code }} &middot; {{ Math.round(item.distance) }} m</small>
						</button>
						<span slot="supporting-text" class="near-arrivals">
							<template v-if="item.error">Could not load arrivals.</template>
							<template v-else-if="!item.arrivals.length">No buses running right now.</template>
							<template v-else>
								<span v-for="a in item.arrivals.slice(0, 3)" :key="a.ServiceNo" class="near-arrival">
									<strong>{{ a.ServiceNo }}</strong>
									{{ timeToArrival(a.NextBus.EstimatedArrival, Date.now()) }}
								</span>
							</template>
						</span>
					</m3e-list-item>
				</m3e-list>
			</m3e-card>
			<div class="search-grid">
				<div class="search-field">
					<label for="bus-service">Bus number</label>
					<div class="ac">
						<input
							id="bus-service"
							:value="serviceQuery"
							placeholder="e.g. 36"
							autocomplete="off"
							aria-autocomplete="list"
							:aria-expanded="serviceFocused && serviceMatches.length > 0"
							aria-controls="service-options"
							@input="serviceInput"
							@focus="serviceFocused = true"
							@blur="blurSuggestions('service')"
							@keydown.enter.prevent="submitService"
						/>
						<ul
							v-if="serviceFocused && serviceMatches.length"
							id="service-options"
							class="matches"
							role="listbox"
							aria-label="Bus numbers"
						>
							<li
								v-for="item in serviceMatches"
								:key="item"
								role="option"
								:aria-selected="false"
							>
								<button
									type="button"
									@mousedown.prevent="pickService(item)"
									@click="pickService(item)"
								>
									Bus {{ item }}
								</button>
							</li>
						</ul>
					</div>
					<small v-if="serviceStatus === 'pending'">Loading bus numbers...</small>
				</div>
				<div class="search-field">
					<label for="bus-stop">Bus stop</label>
					<div class="ac">
						<input
							id="bus-stop"
							:value="stopQuery"
							placeholder="Name, road, or 5-digit code"
							autocomplete="off"
							aria-autocomplete="list"
							:aria-expanded="stopFocused && stopMatches.length > 0"
							aria-controls="stop-options"
							@input="stopInput"
							@focus="stopFocused = true"
							@blur="blurSuggestions('stop')"
							@keydown.enter.prevent="submitStop"
						/>
						<ul
							v-if="stopFocused && stopMatches.length"
							id="stop-options"
							class="matches"
							role="listbox"
							aria-label="Bus stops"
						>
							<li
								v-for="item in stopMatches"
								:key="item.code"
								role="option"
								:aria-selected="false"
							>
								<button
									type="button"
									@mousedown.prevent="pickStop(item)"
									@click="pickStop(item)"
								>
									<strong>{{ item.name }}</strong>
									<span>{{ item.road }} · {{ item.code }}</span>
								</button>
							</li>
						</ul>
					</div>
					<small v-if="!allStops.length">Loading stops...</small>
				</div>
			</div>
			<section v-if="service" class="route-panel" aria-live="polite">
				<h2>Bus {{ service }} route</h2>
				<p v-if="routeLoading">Loading the full route...</p>
				<p v-else-if="routeError">
					{{ routeError }}
					<button type="button" class="retry" @click="pickService(service)">Retry</button>
				</p>
				<p v-else-if="!directions.length">No route found for this bus.</p>
				<template v-else>
					<div
						v-if="directions.length > 1"
						class="direction-tabs"
						role="group"
						aria-label="Route direction"
					>
						<button
							v-for="[direction, stops] in directions"
							:key="direction"
							type="button"
							:class="{ active: activeDirection === direction }"
							:aria-pressed="activeDirection === direction"
							@click="activeDirection = direction"
						>
							Direction {{ direction }} ·
							{{
								allStops.find((s) => s.code === stops.at(-1))?.name ?? stops.at(-1)
							}}
						</button>
					</div>
					<p class="route-help">
						Choose a stop below for live arrivals. {{ routeStops.length }} stops in this
						direction.
					</p>
					<ol class="route-list">
						<li v-for="(item, i) in routeStops" :key="`${i}-${item.code}`">
							<button type="button" @click="pickStop(item)">
								<span class="stop-seq">{{ i + 1 }}</span
								><span
									><strong>{{ item.name }}</strong
									><small>{{ item.road }} · {{ item.code }}</small></span
								><span aria-hidden="true">›</span>
							</button>
						</li>
					</ol>
				</template>
			</section>
			<div ref="arrivalsSection" class="arrivals-section">
				<BusStop v-if="allStops.length" :stops="allStops" />
			</div>
			<p class="map-hint">
				Prefer the map? Zoom in or tap a cluster, then choose a stop for arrivals.
			</p>
			<div class="map-container">
				<ClientOnly>
					<MglMap
						:map-style="style"
						:center="center"
						:zoom="zoom"
						:min-zoom="minZoom"
						:max-bounds="maxBounds"
						:cooperative-gestures="true"
						@map:load="handleMapLoad"
					>
						<MglGeoJsonSource
							v-if="geojson"
							source-id="stops"
							:data="geojson"
							:cluster="true"
							:cluster-radius="50"
							:cluster-max-zoom="14"
						>
							<MglCircleLayer
								layer-id="clusters"
								:filter="['has', 'point_count']"
								:paint="{
									'circle-color': circleColor,
									'circle-radius': [
										'step',
										['get', 'point_count'],
										18,
										100,
										24,
										500,
										30,
									],
									'circle-stroke-width': 1,
									'circle-stroke-color': outlineColor,
								}"
								@click="handleClusterClick"
							/>
							<MglSymbolLayer
								layer-id="cluster-count"
								:filter="['has', 'point_count']"
								:layout="{
									'text-field': '{point_count_abbreviated}',
									// OpenFreeMap hosts Noto only; MapLibre's default fontstack 404s.
									'text-font': ['Noto Sans Regular'],
									'text-size': 13,
								}"
								:paint="{
									'text-color': clusterTextColor,
								}"
							/>
							<MglCircleLayer
								layer-id="stops"
								:filter="['!', ['has', 'point_count']]"
								:paint="{
									'circle-color': circleColor,
									'circle-radius': [
										'interpolate',
										['linear'],
										['zoom'],
										10,
										6,
										15,
										10,
									],
									'circle-stroke-width': 1,
									'circle-stroke-color': outlineColor,
								}"
								@click="handleStopClick"
							/>
						</MglGeoJsonSource>
						<MglNavigationControl />
					</MglMap>
				</ClientOnly>
			</div>
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
	padding: 16px;
	gap: 16px;
}

.pg::-webkit-scrollbar {
	display: none;
}

.heading {
	color: var(--md-sys-color-on-surface);
}
.saved-stops { margin-bottom: 4px; }

@media (max-width: 767px) {
	.pg {
		border-radius: 0;
		padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
		gap: 14px;
	}
}
</style>

<style lang="css" scoped>
.near-me {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
	margin-bottom: 16px;
}

.near-me-button {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 18px;
	border: 0;
	border-radius: 999px;
	background-color: var(--sg-brand);
	color: var(--sg-on-brand);
	font: inherit;
	font-size: 14px;
	font-weight: 700;
	cursor: pointer;
}

.near-me-button:disabled {
	opacity: 0.6;
	cursor: default;
}

.near-me-note {
	margin: 0;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}

.near-me-card {
	margin-bottom: 16px;
}

.near-stop {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
	border: 0;
	background: none;
	padding: 0;
	font: inherit;
	color: inherit;
	text-align: left;
	cursor: pointer;
}

.near-stop small {
	color: var(--md-sys-color-on-surface-variant);
}

.near-arrivals {
	display: inline-flex;
	flex-wrap: wrap;
	gap: 10px;
}

.near-arrival {
	white-space: nowrap;
}

.arrivals-section {
	scroll-margin-top: 12px;
}
.map-container {
	height: 50svh;
	min-height: 320px;
	flex: 0 0 auto;
}
.map-container :deep(.maplibregl-map) {
	border-radius: 16px;
}
@media (max-width: 767px) {
	.map-container {
		height: min(45svh, 380px);
		min-height: 280px;
	}
}
</style>

<style scoped>
.intro,
.route-panel {
	padding: 16px;
	border-radius: 16px;
	background: var(--md-sys-color-surface-container-low);
}
.intro h2,
.route-panel h2 {
	font-size: 20px;
	margin: 0 0 8px;
}
.intro p {
	margin: 0 0 8px;
	line-height: 1.45;
}
.intro p:last-child {
	margin-bottom: 0;
}
.example {
	color: var(--md-sys-color-on-surface-variant);
}
.search-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}
.search-field {
	min-width: 0;
}
.search-field label {
	display: block;
	font-weight: 650;
	margin-bottom: 6px;
}
.search-field small {
	display: block;
	margin-top: 5px;
	color: var(--md-sys-color-on-surface-variant);
}
.ac {
	position: relative;
}
.ac input {
	width: 100%;
	box-sizing: border-box;
	font: inherit;
	font-size: 16px;
	padding: 12px 14px;
	border: 1px solid var(--md-sys-color-outline);
	border-radius: 12px;
	color: var(--md-sys-color-on-surface);
	background: var(--md-sys-color-surface-container-lowest);
}
.ac input:focus {
	outline: 2px solid var(--md-sys-color-primary);
	outline-offset: 1px;
}
.matches {
	position: absolute;
	z-index: 25;
	top: 100%;
	left: 0;
	right: 0;
	max-height: 280px;
	overflow-y: auto;
	list-style: none;
	padding: 4px;
	margin: 4px 0;
	background: var(--md-sys-color-surface-container-highest);
	border-radius: 12px;
	box-shadow: 0 6px 20px #0003;
}
.matches button {
	text-align: left;
	width: 100%;
	padding: 10px;
	min-height: 44px;
	border: 0;
	border-radius: 8px;
	font: inherit;
	cursor: pointer;
	color: var(--md-sys-color-on-surface);
	background: transparent;
}
.matches button:hover,
.matches button:focus {
	background: var(--md-sys-color-primary-container);
}
.matches button span {
	display: block;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}
.route-panel {
	max-height: 50svh;
	display: flex;
	flex-direction: column;
}
.route-panel p {
	margin: 4px 0 10px;
}
.direction-tabs {
	display: flex;
	gap: 8px;
	overflow-x: auto;
	flex-shrink: 0;
	padding-bottom: 6px;
}
.direction-tabs button {
	flex: 0 0 auto;
	padding: 8px 10px;
	border-radius: 20px;
	border: 1px solid var(--md-sys-color-outline-variant);
	background: transparent;
	color: var(--md-sys-color-on-surface);
	cursor: pointer;
}
.direction-tabs button.active {
	background: var(--md-sys-color-primary-container);
	color: var(--md-sys-color-on-primary-container);
	border-color: var(--md-sys-color-primary);
}
.route-help {
	color: var(--md-sys-color-on-surface-variant);
	font-size: 14px;
}
.route-list {
	overflow-y: auto;
	padding: 0;
	margin: 0;
	list-style: none;
	border-radius: 12px;
	background: var(--md-sys-color-surface);
}
.route-list li + li {
	border-top: 1px solid var(--md-sys-color-outline-variant);
}
.route-list button {
	width: 100%;
	padding: 10px;
	border: 0;
	display: flex;
	gap: 12px;
	align-items: center;
	text-align: left;
	background: transparent;
	color: var(--md-sys-color-on-surface);
	font: inherit;
	cursor: pointer;
}
.route-list button:hover,
.route-list button:focus {
	background: var(--md-sys-color-primary-container);
}
.route-list button > span:nth-child(2) {
	flex: 1;
}
.route-list small {
	display: block;
	color: var(--md-sys-color-on-surface-variant);
}
.stop-seq {
	display: grid;
	place-items: center;
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	border-radius: 50%;
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
	font-size: 13px;
}
.map-hint {
	margin: 0;
	color: var(--md-sys-color-on-surface-variant);
	font-size: 14px;
}
.retry {
	border: 0;
	background: none;
	color: var(--md-sys-color-primary);
	text-decoration: underline;
	cursor: pointer;
}
@media (max-width: 767px) {
	.search-grid {
		grid-template-columns: 1fr;
	}
	.route-panel {
		max-height: 46svh;
	}
}
</style>
