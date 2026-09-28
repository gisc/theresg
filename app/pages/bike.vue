<script setup lang="ts">
import type { BicycleParking } from '~~/shared/types/BicycleParking';

definePageMeta({
	title: 'Bike',
});

useSeoMeta({
	title: 'Bike',
});

interface ParkingSpot extends BicycleParking {
	distanceM: number;
}

const point = ref<UserCoords | null>(null);
const pointLabel = ref<'location' | 'map' | null>(null);
const parking = ref<ParkingSpot[]>([]);
const parkingStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapInstance = ref<any>(null);

const { data: pcn } = await useLazyFetch('/pcn.json', {
	server: false,
});

function formatDistance(m: number): string {
	return m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

function spotMeta(spot: ParkingSpot): string {
	const parts = [formatDistance(spot.distanceM)];
	if (spot.RackCount > 0) parts.push(`${spot.RackCount} racks`);
	parts.push(spot.ShelterIndicator === 'Y' ? 'Sheltered' : 'Unsheltered');
	return parts.join(' · ');
}

const searchedWider = ref(false);

async function fetchParking(p: UserCoords) {
	parkingStatus.value = 'pending';
	searchedWider.value = false;
	try {
		let rows = await $fetch<BicycleParking[]>('/api/bicycle-parking', {
			query: { lat: p.lat, lon: p.lon, dist: 0.5 },
		});
		if (!rows.length) {
			rows = await $fetch<BicycleParking[]>('/api/bicycle-parking', {
				query: { lat: p.lat, lon: p.lon, dist: 1.5 },
			});
			searchedWider.value = true;
		}
		parking.value = rows
			.map((r) => ({
				...r,
				distanceM: haversineM(p, { lat: r.Latitude, lon: r.Longitude }),
			}))
			.sort((a, b) => a.distanceM - b.distanceM)
			.slice(0, 8);
		parkingStatus.value = 'success';
	} catch {
		parkingStatus.value = 'error';
	}
}

function setPoint(p: UserCoords, label: 'location' | 'map') {
	point.value = p;
	pointLabel.value = label;
	if (mapInstance.value) {
		mapInstance.value.flyTo({
			center: [p.lon, p.lat],
			zoom: Math.max(mapInstance.value.getZoom?.() ?? 11, 13),
		});
	}
	fetchParking(p);
}

const parkingGeojson = computed(() => ({
	type: 'FeatureCollection',
	features: parking.value.map((spot) => ({
		type: 'Feature',
		properties: { address: spot.Address },
		geometry: {
			type: 'Point',
			coordinates: [spot.Longitude, spot.Latitude],
		},
	})),
}));

const pointGeojson = computed(() => ({
	type: 'FeatureCollection',
	features: point.value
		? [
				{
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'Point',
						coordinates: [point.value.lon, point.value.lat],
					},
				},
			]
		: [],
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleMapLoad(e: any) {
	mapInstance.value = e.target;
	// Listen at the DOM level: maplibre's own click synthesis can be swallowed
	// by the cooperative-gestures overlay on touch devices.
	const canvas = mapInstance.value.getCanvas();
	// Attach to the container, not the canvas: the cooperative-gestures
	// overlay sits above the canvas and becomes the click target.
	mapInstance.value.getContainer().addEventListener('click', (ev: MouseEvent) => {
		const rect = canvas.getBoundingClientRect();
		const lngLat = mapInstance.value.unproject([
			ev.clientX - rect.left,
			ev.clientY - rect.top,
		]);
		setPoint({ lat: lngLat.lat, lon: lngLat.lng }, 'map');
	});
}

const style = 'https://tiles.openfreemap.org/styles/liberty';
const center = {
	lng: 103.8501,
	lat: 1.2897,
};
const zoom = 11;
const minZoom = 10;
const maxBounds = [
	[103.55, 1.15], // south-west
	[104.1, 1.5], // north-east
];

const circleColor = ref<string>('#006A66');
const pcnColor = ref<string>('#2E7D32');

onMounted(async () => {
	const content = document.querySelector('#content');
	if (content) {
		const computedStyle = window.getComputedStyle(content);
		const primaryVar = computedStyle.getPropertyValue('--md-sys-color-primary').trim();
		if (primaryVar) {
			circleColor.value = primaryVar;
		}
	}

	// Default to the user's location when inside Singapore. Leaves the page
	// blank otherwise - the user can tap the map to pick a point manually.
	const coords = await getSingaporeCoords();
	if (coords && !point.value) {
		setPoint(coords, 'location');
	}
});
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading class="heading" variant="headline" size="large">Bike</m3e-heading>

			<m3e-card>
				<m3e-heading slot="header" variant="title" size="large">
					Nearest bicycle parking
				</m3e-heading>
				<div slot="content" class="parking-list">
					<p v-if="!point" class="hint">
						Allow location access in Singapore, or tap the map below, to find
						bicycle parking near you for the first or last mile.
					</p>
					<p v-else-if="parkingStatus === 'pending'" class="hint">
						Finding nearby parking…
					</p>
					<p v-else-if="parkingStatus === 'error'" class="hint">
						Could not load parking data. Tap the map to try again.
					</p>
					<p v-else-if="!parking.length" class="hint">
						No bicycle parking found within 1.5 km of this point.
					</p>
					<m3e-list v-else variant="segmented">
						<m3e-list-item v-for="(spot, index) in parking" :key="index">
							{{ spot.Description || 'Bicycle parking' }}
							<span slot="supporting-text">{{ spotMeta(spot) }}</span>
						</m3e-list-item>
					</m3e-list>
					<p v-if="searchedWider && parking.length" class="hint">
						Nothing within 500 m - showing the closest spots within 1.5 km.
					</p>
					<p v-if="pointLabel === 'map'" class="hint">
						Showing parking near the point you picked on the map.
					</p>
				</div>
			</m3e-card>

			<p class="map-hint">
				Tap the map to search parking around any point. Green lines are park
				connectors.
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
						<MglGeoJsonSource v-if="pcn" source-id="pcn" :data="pcn">
							<MglLineLayer
								layer-id="pcn-lines"
								:paint="{
									'line-color': pcnColor,
									'line-width': 2.5,
									'line-opacity': 0.75,
								}"
							/>
						</MglGeoJsonSource>
						<MglGeoJsonSource source-id="parking" :data="parkingGeojson">
							<MglCircleLayer
								layer-id="parking-points"
								:paint="{
									'circle-color': circleColor,
									'circle-radius': 6,
									'circle-stroke-width': 1.5,
									'circle-stroke-color': '#FFFFFF',
								}"
							/>
						</MglGeoJsonSource>
						<MglGeoJsonSource source-id="query-point" :data="pointGeojson">
							<MglCircleLayer
								layer-id="query-point"
								:paint="{
									'circle-color': '#E62333',
									'circle-radius': 7,
									'circle-stroke-width': 2,
									'circle-stroke-color': '#FFFFFF',
								}"
							/>
						</MglGeoJsonSource>
						<MglNavigationControl />
					</MglMap>
				</ClientOnly>
			</div>
			<p class="source">
				Parking: LTA DataMall · Park connectors: NParks Tracks via data.gov.sg
				(Singapore Open Data Licence)
			</p>
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

.parking-list {
	margin-top: 8px;
}

.hint {
	margin: 0 0 8px;
	font-size: 14px;
	line-height: 1.5;
	color: var(--md-sys-color-on-surface-variant);
}

.map-hint {
	margin: 0;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}

.source {
	margin: 0;
	font-size: 12px;
	color: var(--md-sys-color-on-surface-variant);
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
	.pg {
		border-radius: 0;
		padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
		gap: 14px;
	}
	.map-container {
		height: min(45svh, 380px);
		min-height: 280px;
	}
}
</style>
