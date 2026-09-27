<script setup lang="ts">
import type { MrtNetwork, RouteSegment, StationInfo } from '~/utils/mrtRoute';

const { data: network } = await useLazyFetch<MrtNetwork>('/mrt-lines.json', {
	server: false,
});

const stations = computed(() => (network.value ? buildStationIndex(network.value) : []));

const from = ref<StationInfo | null>(null);
const to = ref<StationInfo | null>(null);

// Default the journey start to the station nearest the user (Singapore
// only); stays blank when location is unavailable or outside Singapore.
const triedGeoDefault = ref(false);
watch(
	() => network.value,
	async (net) => {
		if (triedGeoDefault.value || !net || from.value) return;
		triedGeoDefault.value = true;
		const coords = await getSingaporeCoords();
		if (!coords || from.value) return;
		const entries = net.lines.flatMap((line) =>
			line.stations.map((s) => ({ name: s.name, lat: s.lat, lon: s.lon })),
		);
		const nearest = nearestByCoords(entries, (e) => ({ lat: e.lat, lon: e.lon }), coords);
		if (!nearest || from.value) return;
		const match = stations.value.find((s) => s.name === nearest.name);
		if (match) from.value = match;
	},
);

const segments = computed<RouteSegment[] | null>(() => {
	if (!network.value || !from.value || !to.value) {
		return null;
	}
	return findRoute(network.value, from.value.name, to.value.name);
});

const totalStops = computed(() => segments.value?.reduce((n, s) => n + s.stops, 0) ?? 0);

function swap() {
	const f = from.value;
	from.value = to.value;
	to.value = f;
}

function codesFor(name: string): StationInfo | undefined {
	return stations.value.find((s) => s.name === name);
}
</script>

<template>
	<m3e-card>
		<m3e-heading slot="header" variant="title" size="large">Plan your journey</m3e-heading>
		<div slot="content" class="planner">
			<div class="fields">
				<MrtStationAutocomplete v-model="from" label="From" :stations="stations" />
				<m3e-icon-button class="swap" aria-label="Swap from and to" @click="swap">
					<Icon name="material-symbols:swap-vert" />
				</m3e-icon-button>
				<MrtStationAutocomplete v-model="to" label="To" :stations="stations" />
			</div>

			<div v-if="from && to && segments" class="result">
				<p v-if="segments.length === 0" class="summary">
					{{ from.name }} and {{ to.name }} are the same station.
				</p>
				<template v-else>
					<p class="summary">
						{{ totalStops }} {{ totalStops === 1 ? 'stop' : 'stops'
						}}<template v-if="segments.length > 1">
							&middot; {{ segments.length - 1 }}
							{{ segments.length - 1 === 1 ? 'transfer' : 'transfers' }}</template
						>
					</p>
					<div v-for="(segment, i) in segments" :key="i" class="segment">
						<div class="segment-header">
							<span
								class="chip"
								:style="{
									backgroundColor: segment.line.color,
									color: segment.line.textColor ?? '#FFFFFF',
								}"
								>{{ segment.line.code }}</span
							>
							<span class="segment-title">
								{{ segment.line.name
								}}<span v-if="segment.towards"> towards {{ segment.towards }}</span>
							</span>
						</div>
						<ol class="station-list">
							<li v-for="(name, j) in segment.stations" :key="j" class="station-row">
								<span
									class="station-name"
									:class="{ endpoint: j === 0 || j === segment.stations.length - 1 }"
									>{{ name }}</span
								>
								<span v-if="codesFor(name)" class="station-chips">
									<span
										v-for="c in codesFor(name)!.codes"
										:key="c.line"
										class="chip small"
										:style="{ backgroundColor: c.color, color: c.textColor }"
										>{{ c.code }}</span
									>
								</span>
							</li>
						</ol>
						<p v-if="i < segments.length - 1" class="transfer">
							Transfer at {{ segment.stations[segment.stations.length - 1] }} to the
							{{ segments[i + 1].line.name }}
						</p>
					</div>
				</template>
			</div>
			<p v-else-if="!network" class="hint">Loading stations...</p>
			<p v-else class="hint">Select two stations to see the route.</p>
		</div>
	</m3e-card>
</template>

<style lang="css" scoped>
.planner {
	display: flex;
	flex-direction: column;
	gap: 16px;
	box-sizing: border-box;
	margin-top: 8px;
}

.fields {
	display: flex;
	flex-direction: column;
	gap: 8px;
	box-sizing: border-box;
}

.swap {
	align-self: flex-end;
	flex-shrink: 0;
}

.result {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.summary {
	margin: 0;
	font-weight: 600;
	color: var(--md-sys-color-on-surface);
}

.hint {
	margin: 0;
	color: var(--md-sys-color-on-surface-variant);
}

.segment {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.segment-header {
	display: flex;
	align-items: center;
	gap: 8px;
}

.segment-title {
	font-weight: 600;
	color: var(--md-sys-color-on-surface);
}

.station-list {
	margin: 0;
	padding: 0 0 0 8px;
	list-style: none;
	display: flex;
	flex-direction: column;
	border-left: 3px solid var(--md-sys-color-outline-variant);
}

.station-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 4px 0 4px 12px;
	color: var(--md-sys-color-on-surface-variant);
}

.station-name.endpoint {
	font-weight: 600;
	color: var(--md-sys-color-on-surface);
}

.station-chips {
	display: inline-flex;
	gap: 4px;
	flex-shrink: 0;
}

.transfer {
	margin: 0;
	padding: 8px 12px;
	border-radius: 8px;
	background-color: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
	font-size: 14px;
}

.chip {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 700;
	line-height: 1.4;
}

.chip.small {
	padding: 1px 6px;
	font-size: 12px;
	font-weight: 600;
}

@media (min-width: 768px) {
	.fields {
		flex-direction: row;
		align-items: center;
	}

	.fields > .ac {
		flex: 1;
	}
}
</style>
