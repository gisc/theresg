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


const { toggleBlue } = useBlueTheme();
</script>

<template>
	<div class="bg">
		<div class="pg">
			<header class="home-intro">
				<h1 class="sr-only">ThereSG</h1>
				<p class="tagline">
					Check live bus arrivals, plan MRT journeys, find bicycle parking, see
					transport alerts, and discover food and attractions across Singapore.
				</p>
				<p class="quote">Life is a journey. <span class="enjoy" @click="toggleBlue()">Enjoy</span> the ride. :)</p>
				<div class="tile-grid">
					<div class="tile hero-tile">
						<Icon class="hero-ic" name="material-symbols:push-pin-outline" />
						<span class="hero-title">My commute</span>
						<MyCommute hero />
					</div>
					<NuxtLink class="tile" to="/bus">
						<Icon name="material-symbols:directions-bus-outline" />
						<span class="tile-title">Bus</span>
						<span class="tile-desc">Live arrivals at any stop</span>
					</NuxtLink>
					<NuxtLink class="tile" to="/mrt">
						<Icon name="material-symbols:train-outline" />
						<span class="tile-title">MRT</span>
						<span class="tile-desc">Journey planner &amp; fares</span>
					</NuxtLink>
					<NuxtLink class="tile" to="/bike">
						<Icon name="material-symbols:pedal-bike-outline" />
						<span class="tile-title">Bike</span>
						<span class="tile-desc">Parking near you</span>
					</NuxtLink>
					<NuxtLink class="tile" to="/food">
						<Icon name="material-symbols:restaurant-outline" />
						<span class="tile-title">Food</span>
						<span class="tile-desc">Hawker &amp; eats nearby</span>
					</NuxtLink>
					<NuxtLink class="tile" to="/tourist">
						<Icon name="material-symbols:photo-camera-outline" />
						<span class="tile-title">Tourist</span>
						<span class="tile-desc">Attractions &amp; guides</span>
					</NuxtLink>
					<a class="tile" href="#service-alerts">
						<Icon name="material-symbols:warning-outline" />
						<span class="tile-title">Alerts</span>
						<span class="tile-desc">Service &amp; traffic updates</span>
					</a>
				</div>
				<details class="about">
					<summary>
						<Icon name="material-symbols:expand-more" />
						About this project &amp; credits
					</summary>
					<p class="credit">
						ThereSG started as a fork of
						<a href="https://github.com/ingStudiosOfficial/transitsg" rel="noopener"
							>TransitSG</a
						>
						by ingStudios, used under the
						<a href="https://www.apache.org/licenses/LICENSE-2.0" rel="noopener"
							>Apache License 2.0</a
						>. Check out the original at
						<a href="https://transitsg.ingstudios.dev" rel="noopener"
							>transitsg.ingstudios.dev</a
						>.
					</p>
					<p class="ai-note">ThereSG is built with the help of AI tools.</p>
				</details>
			</header>
			<m3e-heading id="service-alerts" class="heading" variant="headline" size="large"
				>Service Alerts</m3e-heading
			>
			<m3e-card>
				<m3e-list slot="content" variant="segmented">
					<m3e-list-item v-for="alert in trainServiceMessages" :key="alert.Content">
						<m3e-avatar slot="leading">
							<Icon :name="getAlertIcon(alert.Content)" />
						</m3e-avatar>
						<span slot="overline">{{ alert.CreatedDate }}</span>
						<span v-if="alert.LineTag" class="line-tag">{{ alert.LineTag }}</span>
						{{ alert.ParsedText ?? alert.Content }}
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

<style scoped>
.home-intro {
	padding: 8px 4px 14px;
}
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0 0 0 0);
	white-space: nowrap;
	border: 0;
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
	font-weight: 700;
	font-size: 20px;
	line-height: 1.4;
	letter-spacing: 0.1px;
	color: var(--sg-brand-text);
}

.home-intro > p.quote {
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

.tile-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
	margin-top: 14px;
}
@media (min-width: 768px) {
	.tile-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}
.tile {
	display: flex;
	flex-direction: column;
	gap: 3px;
	background: var(--md-sys-color-surface-container-lowest);
	border: 1px solid var(--md-sys-color-surface-variant);
	border-radius: 18px;
	padding: 13px 12px;
	text-decoration: none;
}
.tile .iconify {
	width: 26px;
	height: 26px;
	color: var(--sg-brand-text);
}
.tile-title {
	font-weight: 700;
	font-size: 14px;
	color: var(--md-sys-color-on-surface);
	margin-top: 5px;
}
.tile-desc {
	font-size: 11.5px;
	line-height: 1.35;
	color: var(--md-sys-color-on-surface-variant);
}
.hero-tile {
	grid-column: 1 / -1;
	background: linear-gradient(135deg, var(--sg-brand), var(--sg-brand-strong));
	border: none;
}
.hero-tile .hero-ic {
	color: #ffffff;
}
.hero-title {
	font-weight: 700;
	font-size: 16px;
	color: #ffffff;
	margin-top: 6px;
	margin-bottom: 8px;
}
.about {
	margin-top: 14px;
	background: var(--md-sys-color-surface-container-lowest);
	border: 1px solid var(--md-sys-color-surface-variant);
	border-radius: 14px;
	padding: 12px 14px;
}
.about summary {
	display: flex;
	align-items: center;
	gap: 6px;
	font-weight: 700;
	font-size: 14px;
	color: var(--sg-brand-text);
	cursor: pointer;
	list-style: none;
}
.about summary::-webkit-details-marker {
	display: none;
}
.about summary .iconify {
	width: 18px;
	height: 18px;
	transition: transform 0.15s ease;
}
.about[open] summary .iconify {
	transform: rotate(180deg);
}
</style>
