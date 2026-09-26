<script setup lang="ts">
import type { BusStop } from '~/types/BusStop';
import type { Geojson } from '~/types/Geojson';

definePageMeta({
	title: 'Bus',
});

useSeoMeta({
	title: 'Bus',
});

const router = useRouter();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapInstance = shallowRef<any>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleMapLoad(e: any) {
	mapInstance.value = e.target;
}

const { data: geojson } = await useLazyFetch('/bus-stops.json', {
	server: false,
});

const style = 'https://tiles.openfreemap.org/styles/liberty';
const center = {
	lng: 103.8501,
	lat: 1.2897,
};
const zoom = 10;

const circleColor = ref<string>('#006A66');
const outlineColor = ref<string>('#6F7978');
const clusterTextColor = ref<string>('#FFFFFF');

const allStops = computed(() => {
	const data = geojson.value as Geojson | null;
	return data?.features?.map((f) => f.properties) ?? [];
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleStopClick(e: any) {
	const feature = e.features[0];
	if (!feature) {
		console.error('No feature found.');
		return;
	}

	const properties: BusStop = feature.properties;

	router.push({
		name: 'bus',
		query: {
			stop: properties.code,
		},
	});
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
});
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading class="heading" variant="headline" size="large">Bus Stops</m3e-heading>
			<BusStop v-if="allStops && allStops.length !== 0" :stops="allStops" />
			<ClientOnly>
				<MglMap :map-style="style" :center="center" :zoom="zoom" @map:load="handleMapLoad">
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
								'circle-radius': ['step', ['get', 'point_count'], 18, 100, 24, 500, 30],
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
								'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 6, 15, 10],
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

@media (max-width: 767px) {
	.pg {
		border-radius: 20px;
		padding: 12px;
		gap: 12px;
	}
}
</style>

<style lang="css">
.maplibregl-map {
	border-radius: 16px;
	min-height: 50svh;
	flex: 1 1 auto;
	box-sizing: border-box;
}

@media (max-width: 767px) {
	.maplibregl-map {
		min-height: 55svh;
	}
}
</style>
