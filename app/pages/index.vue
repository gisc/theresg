<script setup lang="ts">
import type { TrafficIncident } from '~~/shared/types/TrafficIncident';
import type { TrainServiceMessage } from '~~/shared/types/TrainServiceMessage';

definePageMeta({
	title: 'Home',
});

useSeoMeta({
	title: 'Home',
});

const { data: trainServiceMessages } = await useFetch<TrainServiceMessage[]>(
	'/api/train-service-alerts',
);

const { data: trafficIncidents } = await useFetch<TrafficIncident[]>('/api/traffic-incidents');
</script>

<template>
	<div class="bg">
		<div class="pg">
			<header class="home-intro">
				<h1>TransitSG</h1>
				<p>
					Check live bus arrivals, explore bus routes, plan MRT journeys, and see
					transport alerts across Singapore.
				</p>
				<p class="credit">
					TransitSG was originally created by Mr Ethan Lee Qi Yang (Secondary 2, Hwa Chong
					International School). This app is forked from his
					<a href="https://github.com/ingStudiosOfficial/transitsg"
						>original project on GitHub</a
					>, used under the Apache-2.0 license.
				</p>
			</header>
			<MyCommute />
			<m3e-heading class="heading" variant="headline" size="large"
				>Service Alerts</m3e-heading
			>
			<m3e-card>
				<m3e-list slot="content" variant="segmented">
					<m3e-list-item v-for="alert in trainServiceMessages" :key="alert.Content">
						<m3e-avatar slot="leading">
							<Icon :name="getAlertIcon(alert.Content)" />
						</m3e-avatar>
						<span slot="overline">{{ alert.CreatedDate }}</span>
						{{ alert.Content }}
					</m3e-list-item>
				</m3e-list>
			</m3e-card>

			<m3e-heading class="heading" variant="headline" size="large"
				>Traffic Incidents</m3e-heading
			>
			<m3e-card>
				<m3e-list slot="content" variant="segmented">
					<m3e-list-item v-for="incident in trafficIncidents" :key="incident.Message">
						<m3e-avatar slot="leading">
							<Icon :name="getTrafficIcon(incident.Type)" />
						</m3e-avatar>
						<span slot="overline">{{ incident.Type }}</span>
						{{ incident.Message }}
					</m3e-list-item>
				</m3e-list>
			</m3e-card>
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

.credit {
	margin: 8px 0 0;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}

.credit a {
	color: var(--md-sys-color-primary);
}

@media (max-width: 767px) {
	.pg {
		border-radius: 20px;
		padding: 12px;
		gap: 12px;
	}
}
</style>

<style scoped>
.home-intro {
	padding: 8px 4px 14px;
}
.home-intro h1 {
	margin: 0 0 8px;
	font-size: clamp(28px, 6vw, 38px);
}
.home-intro > p:not(.credit) {
	margin: 0;
	line-height: 1.45;
}
</style>
