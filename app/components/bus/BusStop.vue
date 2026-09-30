<script setup lang="ts">
import type { BusStop } from '~/types/BusStop';
import type { BusArrivalsResponse } from '~~/shared/types/BusArrivalsResponse';

const props = defineProps<{
	stops: BusStop[];
}>();

const { stops } = toRefs(props);

const route = useRoute();

const { isFavourite, toggleFavourite } = useFavouriteStops();

const stop = ref<BusStop | null>(null);
const arrivals = ref<BusArrival[]>([]);
const arrivalsLoading = ref(false);
const arrivalsError = ref(false);
let arrivalsRequest = 0;
const now = ref<number>(Date.now());

let timeInterval: ReturnType<typeof setInterval> | null = null;

const visibleArrivals = computed(() => {
	return arrivals.value.filter((a) => !hasPassedArrival(a));
});

async function refreshArrivals(s: BusStop) {
	const request = ++arrivalsRequest;
	arrivalsLoading.value = true;
	arrivalsError.value = false;
	try {
		const result = await $fetch<BusArrivalsResponse>('/api/bus-arrivals', {
			method: 'GET',
			query: { stopCode: s.code },
		});
		if (request === arrivalsRequest) {
			arrivals.value = result.services;
			arrivalsError.value = Boolean(result.error);
		}
	} catch {
		if (request === arrivalsRequest) arrivalsError.value = true;
	} finally {
		if (request === arrivalsRequest) arrivalsLoading.value = false;
	}
}

function hasPassedArrival(a: BusArrival) {
	const arrival = a?.NextBus?.EstimatedArrival;
	if (!arrival) return false;
	const arrivalTime = new Date(arrival).getTime();
	return now.value - arrivalTime > 30000;
}

watch(stop, async (s) => {
	arrivals.value = [];
	arrivalsError.value = false;
	if (!s) {
		arrivalsRequest++;
		arrivalsLoading.value = false;
		return;
	}
	await refreshArrivals(s);
});

watch(
	() => [route.query.stop, stops.value],
	() => {
		const code = route.query.stop;
		stop.value = typeof code === 'string' ? getStop(stops.value, code) : null;
	},
	{ immediate: true },
);

onMounted(() => {
	timeInterval = setInterval(async () => {
		now.value = Date.now();

		const includesPastArrival = arrivals.value.some((a) => {
			return hasPassedArrival(a);
		});

		if (includesPastArrival && stop.value) {
			await refreshArrivals(stop.value);
		}
	}, 30000);
});

onBeforeUnmount(() => {
	if (timeInterval) clearInterval(timeInterval);
});
</script>

<template>
	<m3e-card v-if="stop">
		<m3e-heading slot="header" variant="title" size="large">{{ stop.name }}</m3e-heading>
		<div slot="content" class="content">
			<span>{{ stop.road }}</span>
			<button
				type="button"
				class="pin"
				:aria-pressed="isFavourite(stop.code)"
				@click="toggleFavourite(stop)"
			>
				<Icon
					:name="
						isFavourite(stop.code)
							? 'material-symbols:star'
							: 'material-symbols:star-outline'
					"
				/>
				{{
					isFavourite(stop.code) ? 'Pinned to My commute' : 'Pin this stop'
				}}
			</button>
			<m3e-expansion-panel class="arrivals-panel" open>
				<span slot="header">Bus arrivals</span>
				<div
					v-if="arrivalsLoading"
					class="loading-container"
					role="status"
					aria-label="Loading arrivals"
				>
					<m3e-loading-indicator />
				</div>
				<p v-else-if="arrivalsError" role="alert">
					Could not reach LTA DataMall for live arrivals.
					<button type="button" class="retry" @click="refreshArrivals(stop)">
						Retry
					</button>
				</p>
				<m3e-list v-else-if="visibleArrivals.length" variant="segmented">
					<m3e-list-item v-for="arrival in visibleArrivals" :key="arrival.ServiceNo">
						<span>
							<span class="bus-number">{{ arrival.ServiceNo }}</span>
							<span>{{ ' ' }}</span>
							<span v-if="getStopName(stops, arrival.NextBus.DestinationCode)">
								for {{ getStopName(stops, arrival.NextBus.DestinationCode) }}
							</span>
							<span>{{ ' ' }}</span>
							<span class="time-to-arrival">
								{{ timeToArrival(arrival.NextBus.EstimatedArrival, now) }}
							</span>
							<span class="bus-meta">
								<span
									v-if="busLoadLabel(arrival.NextBus.Load)"
									class="meta-chip"
									:class="busLoadClass(arrival.NextBus.Load)"
									>{{ busLoadLabel(arrival.NextBus.Load) }}</span
								>
								<span
									v-if="isWheelchairAccessible(arrival.NextBus.Feature)"
									class="meta-chip"
									title="Wheelchair accessible"
									>♿</span
								>
								<span v-if="busDeckLabel(arrival.NextBus.Type)" class="meta-chip">{{
									busDeckLabel(arrival.NextBus.Type)
								}}</span>
								<span v-if="!isLiveEstimate(arrival.NextBus)" class="meta-chip scheduled"
									>Scheduled</span
								>
							</span>
						</span>
						<span v-if="arrival.NextBus2.EstimatedArrival" slot="supporting-text">
							Also {{ timeToArrival(arrival.NextBus2.EstimatedArrival, now)
							}}<span v-if="arrival.NextBus3.EstimatedArrival"
								>, {{ timeToArrival(arrival.NextBus3.EstimatedArrival, now) }}</span
							>
						</span>
					</m3e-list-item>
				</m3e-list>
				<p v-else>
					No buses running at this stop right now. Services may have ended for
					the night.
				</p>
			</m3e-expansion-panel>
		</div>
	</m3e-card>
	<m3e-card v-else>
		<m3e-heading slot="header" variant="title" size="large">
			Select a stop to view timings
		</m3e-heading>
		<div slot="content" class="content">
			<span>Search above or choose a stop on the map below to view live bus arrivals.</span>
		</div>
	</m3e-card>
</template>

<style lang="css" scoped>
.content {
	display: flex;
	flex-direction: column;
	gap: 4px;
	box-sizing: border-box;
	margin-top: 8px;
}

.pin {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	width: fit-content;
	padding: 6px 14px;
	border: 1px solid var(--md-sys-color-outline-variant);
	border-radius: 999px;
	background: none;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	color: var(--md-sys-color-primary);
	cursor: pointer;
}

.pin[aria-pressed='true'] {
	background-color: var(--md-sys-color-primary-container);
	border-color: transparent;
	color: var(--md-sys-color-on-primary-container);
}

.arrivals-panel {
	--m3e-expansion-panel-content-padding: 0;
	--m3e-expansion-panel-open-shape: 8px;
	--m3e-expansion-panel-shape: 8px;
}

.loading-container {
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: center;
}

.bus-number {
	padding: 4px;
	box-sizing: border-box;
	border-radius: 8px;
	background-color: var(--md-sys-color-primary-container);
	color: var(--md-sys-color-on-primary-container);
	width: fit-content;
	height: fit-content;
}

.bus-meta {
	display: inline-flex;
	flex-wrap: wrap;
	gap: 4px;
	margin-left: 6px;
}

.meta-chip {
	padding: 1px 7px;
	border-radius: 999px;
	font-size: 10.5px;
	font-weight: 600;
	background-color: var(--md-sys-color-surface-variant);
	color: var(--md-sys-color-on-surface-variant);
	white-space: nowrap;
}

.meta-chip.load-seats {
	background-color: #dcf5e3;
	color: #14532d;
}

.meta-chip.load-standing {
	background-color: #fdf0c8;
	color: #713f12;
}

.meta-chip.load-limited {
	background-color: var(--md-sys-color-error-container);
	color: var(--md-sys-color-on-error-container);
}

.meta-chip.scheduled {
	border: 1px dashed var(--md-sys-color-outline);
	background: none;
}

.time-to-arrival {
	color: var(--md-sys-color-secondary);
	width: fit-content;
	height: fit-content;
}
</style>

<style scoped>
.retry {
	border: 0;
	background: none;
	color: var(--md-sys-color-primary);
	text-decoration: underline;
	cursor: pointer;
	font: inherit;
}
</style>
