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
				<h1>ThereSG</h1>
				<div class="flag-accent" aria-hidden="true"></div>
				<p class="tagline">
					Check live bus arrivals, explore bus routes, plan MRT journeys, and see
					transport alerts across Singapore.
				</p>
				<p class="credit">
					Project motivated by TransitSG, a project created by Mr Ethan Lee Qi Yang
					(Secondary 2, Hwa Chong International School). The initial version was forked from
					<a href="https://github.com/ingStudiosOfficial/transitsg"
						>github.com/ingStudiosOfficial/transitsg</a
					>
					under the Apache-2.0 license. He believes AI-generated content is AI slop.
				</p>
				<p class="ai-note">
					ThereSG is AI-generated. :)<br />
					Life is a journey. Enjoy the ride.
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

<style scoped>
.home-intro {
	padding: 8px 4px 14px;
}
.home-intro h1 {
	margin: 0;
	font-size: clamp(32px, 7vw, 42px);
	font-weight: 800;
	letter-spacing: -0.5px;
	color: var(--sg-brand);
}
.flag-accent {
	width: 60px;
	height: 7px;
	margin: 10px 0 12px;
	border-radius: 4px;
	background: linear-gradient(to bottom, var(--sg-brand) 50%, #ffffff 50%);
	box-shadow: inset 0 0 0 1px var(--md-sys-color-outline-variant);
}
.home-intro > p.tagline {
	margin: 0;
	font-family:
		'Space Grotesk',
		system-ui,
		-apple-system,
		'Segoe UI',
		Roboto,
		sans-serif;
	font-weight: 500;
	font-size: 20px;
	line-height: 1.4;
	letter-spacing: 0.1px;
	color: var(--md-sys-color-on-surface);
}
</style>
