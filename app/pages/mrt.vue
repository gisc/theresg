<script setup lang="ts">
import type { TrainServiceMessage } from '~~/shared/types/TrainServiceMessage';

definePageMeta({
	title: 'MRT',
});

useSeoMeta({
	title: 'MRT',
});

const { data: alerts, status, error, refresh } = await useFetch<TrainServiceMessage[]>(
	'/api/train-service-alerts',
);
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading class="heading" variant="headline" size="large">MRT</m3e-heading>
			<MrtRoutePlanner />
			<MrtCrowdLevels />
			<m3e-card>
				<m3e-heading slot="header" variant="title" size="large">System Map</m3e-heading>
				<div slot="content" class="system-map">
					<span>
						View the latest official MRT/LRT system map (July 2026 edition, includes
						Circle Line Stage 6) from the Land Transport Authority.
					</span>
					<a
						class="map-link"
						href="https://www.lta.gov.sg/content/dam/ltagov/getting_around/public_transport/rail_network/pdf/SM_EN_(Ver210726)_CCL6.pdf"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Open the full LTA MRT and LRT system map PDF in a new tab"
					>
						<img src="/img/mrt-system-map.webp" alt="Preview of LTA's July 2026 MRT and LRT system map" width="1000" height="1000" loading="lazy" />
						<span>Tap map to open the full PDF</span>
					</a>
					<span class="source">Map: Land Transport Authority</span>
				</div>
			</m3e-card>
			<m3e-heading class="heading" variant="headline" size="medium"
				>Service Alerts</m3e-heading
			>
			<p v-if="status === 'pending'">Loading service alerts...</p>
			<div v-else-if="error">
				<p>Service alerts are unavailable right now.</p>
				<button type="button" @click="refresh()">Try again</button>
			</div>
			<p v-else-if="!alerts?.length">No train service alerts reported.</p>
			<m3e-card v-else>
				<m3e-list slot="content" variant="segmented">
					<m3e-list-item v-for="(alert, index) in alerts" :key="`${alert.CreatedDate}-${index}`">
						<m3e-avatar slot="leading">
							<Icon :name="getAlertIcon(alert.Content)" />
						</m3e-avatar>
						<span slot="overline">{{ alert.CreatedDate }}</span>
						{{ alert.Content }}
					</m3e-list-item>
				</m3e-list>
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
	padding: 16px;
	gap: 16px;
}

.pg::-webkit-scrollbar {
	display: none;
}

.heading {
	color: var(--md-sys-color-on-surface);
}

.system-map {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 8px;
	color: var(--md-sys-color-on-surface-variant);
}

.map-link {
	font-weight: 600;
	color: var(--md-sys-color-primary);
	width: min(100%, 460px);
	text-decoration: none;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.map-link img {
	display: block;
	width: 100%;
	height: auto;
	border-radius: 12px;
	border: 1px solid var(--md-sys-color-outline-variant);
	box-sizing: border-box;
}

.map-link:focus-visible { outline: 2px solid var(--md-sys-color-primary); outline-offset: 3px; }

.source {
	font-size: 12px;
}

@media (max-width: 767px) {
	.pg {
		border-radius: 0;
		padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
		gap: 14px;
	}
}
</style>
