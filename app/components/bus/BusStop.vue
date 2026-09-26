<script setup lang="ts">
import type { BusStop } from '~/types/BusStop';

const props = defineProps<{
	stops: BusStop[];
}>();

const { stops } = toRefs(props);

const route = useRoute();

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
		const result = await $fetch<BusArrival[]>('/api/bus-arrivals', {
			method: 'GET',
			query: { stopCode: s.code },
		});
		if (request === arrivalsRequest) arrivals.value = result;
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
					Could not load arrivals.
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
						</span>
						<span v-if="arrival.NextBus2.EstimatedArrival" slot="supporting-text">
							Also {{ timeToArrival(arrival.NextBus2.EstimatedArrival, now)
							}}<span v-if="arrival.NextBus3.EstimatedArrival"
								>, {{ timeToArrival(arrival.NextBus3.EstimatedArrival, now) }}</span
							>
						</span>
					</m3e-list-item>
				</m3e-list>
				<p v-else>No arrival times available for this stop right now.</p>
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
