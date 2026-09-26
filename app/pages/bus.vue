<script setup lang="ts">
import type { BusStop } from '~/types/BusStop';
import type { Geojson } from '~/types/Geojson';

definePageMeta({
	title: 'Bus',
});

useSeoMeta({
	title: 'Bus',
});

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
const selectedStop = ref<BusStop | null>(null);

const allStops = computed(() => {
	const data = geojson.value as Geojson | null;
	return data?.features?.map((f) => f.properties) ?? [];
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleStopClick(e: any) {
	console.log(e);

	const feature = e.features[0];
	if (!feature) {
		console.error('No feature found.');
		return;
	}

	const properties: BusStop = feature.properties;
	selectedStop.value = properties;
}

onMounted(() => {
	const content = document.querySelector('#content');
	if (content) {
		const style = window.getComputedStyle(content);

		const primaryVar = style.getPropertyValue('--md-sys-color-primary').trim();
		const outlineVar = style.getPropertyValue('--md-sys-color-outline').trim();

		if (primaryVar) {
			console.log('Primary variable:', primaryVar);
			circleColor.value = primaryVar;
		}

		if (outlineVar) {
			console.log('Outline variable:', outlineVar);
			outlineColor.value = outlineVar;
		}
	}
});
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading variant="headline" size="large">Bus Stops</m3e-heading>
			<BusStop :stop="selectedStop" :stops="allStops" />
			<ClientOnly>
				<MglMap :map-style="style" :center="center" :zoom="zoom">
					<MglGeoJsonSource v-if="geojson" source-id="stops" :data="geojson">
						<MglCircleLayer
							layer-id="stops"
							:paint="{
								'circle-color': circleColor,
								'circle-radius': 12,
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
</style>

<style lang="css">
.maplibregl-map {
	border-radius: 16px;
	min-height: 50svh;
	box-sizing: border-box;
}
</style>
