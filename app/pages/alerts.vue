<script setup lang="ts">
import type { TrafficIncident } from '~~/shared/types/TrafficIncident';
import type { TrainServiceMessage } from '~~/shared/types/TrainServiceMessage';
definePageMeta({ title: 'Alerts' });
useSeoMeta({ title: 'Alerts' });
const { data: trainServiceMessages, status: trainStatus, refresh: refreshTrain } = useLazyFetch<TrainServiceMessage[]>('/api/train-service-alerts', { server: false });
const { data: trafficIncidents, status: trafficStatus, refresh: refreshTraffic } = useLazyFetch<TrafficIncident[]>('/api/traffic-incidents', { server: false });
</script>
<template><div class="bg"><div class="pg">
<m3e-heading class="heading" variant="headline" size="large">Alerts</m3e-heading>
<p class="intro">Train service notices and traffic updates across Singapore. Planned works are labelled separately from live disruptions.</p>

			<m3e-heading id="service-alerts" class="heading" variant="headline" size="large"
				>Service Alerts</m3e-heading
			>
			<m3e-card>
				<p v-if="trainStatus === 'pending'" slot="content" class="empty-note">Loading service alerts...</p>
				<p v-else-if="trainStatus === 'error'" slot="content" class="empty-note">Service alerts unavailable. <button type="button" @click="refreshTrain()">Retry</button></p>
				<p v-else-if="!trainServiceMessages?.length" slot="content" class="empty-note">No current alerts.</p>
				<m3e-list v-else slot="content" variant="segmented">
					<m3e-list-item v-for="alert in trainServiceMessages" :key="alert.Content">
						<m3e-avatar slot="leading">
							<Icon :name="getAlertIcon(alert.Content)" />
						</m3e-avatar>
						<span slot="overline">{{ alert.CreatedDate }}</span>
						<span v-if="alert.LineTag" class="line-tag">{{ alert.LineTag }}</span>
						<span v-if="isPlannedAlert(alert.Content)" class="notice-label">Planned works</span>{{ alert.ParsedText ?? alert.Content }}
					</m3e-list-item>
				</m3e-list>
			</m3e-card>

			<m3e-heading class="heading" variant="headline" size="large"
				>Traffic Incidents</m3e-heading
			>
			<m3e-card>
				<p v-if="trafficStatus === 'pending'" slot="content" class="empty-note">Loading traffic incidents...</p>
				<p v-else-if="trafficStatus === 'error'" slot="content" class="empty-note">Traffic incidents unavailable. <button type="button" @click="refreshTraffic()">Retry</button></p>
				<p v-else-if="!trafficIncidents?.length" slot="content" class="empty-note">No current traffic incidents.</p>
				<m3e-list v-else slot="content" variant="segmented">
					<m3e-list-item v-for="incident in trafficIncidents" :key="incident.Message">
						<m3e-avatar slot="leading">
							<Icon :name="getTrafficIcon(incident.Type)" />
						</m3e-avatar>
						<span slot="overline">{{ incident.Type }}</span>
						{{ incident.Message }}
					</m3e-list-item>
				</m3e-list>
			</m3e-card>
<DataCredits /></div></div></template>
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
	overflow-y: scroll;
	background-color: var(--md-sys-color-surface);
	border-radius: 32px;
	padding: 16px;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.pg::-webkit-scrollbar {
	display: none;
}

.heading {
	color: var(--md-sys-color-on-surface);
}

.line-tag {
	display: inline-block;
	margin-right: 6px;
	padding: 2px 8px;
	border-radius: 6px;
	background-color: var(--md-sys-color-primary);
	color: var(--md-sys-color-on-primary);
	font-size: 11px;
	font-weight: 700;
	vertical-align: baseline;
}

.credit {
	margin: 8px 0 0;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}

.ai-note.gap {
	margin-top: 1em;
}

.ai-note {
	margin: 10px 0 0;
	font-family:
		'Space Grotesk',
		system-ui,
		-apple-system,
		'Segoe UI',
		Roboto,
		sans-serif;
	font-weight: 500;
	font-size: 16px;
	color: var(--md-sys-color-on-surface);
}

.credit a {
	color: var(--md-sys-color-primary);
}

@media (max-width: 767px) {
	.pg {
		border-radius: 0;
		padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
		gap: 14px;
	}
}
</style>


<style scoped>.intro { margin: 0; font-size: 14px; line-height: 1.5; color: var(--md-sys-color-on-surface-variant); }.notice-label { font-weight: 700; }</style>
