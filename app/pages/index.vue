<script setup lang="ts">

definePageMeta({
	title: 'Home',
});

useSeoMeta({
	title: 'Home',
});

const { favourites } = useFavouriteStops();

onMounted(() => { if (window.location.hash === '#service-alerts') navigateTo('/alerts', { replace: true }); });

const { toggleBlue } = useBlueTheme();
</script>

<template>
	<div class="bg">
		<div class="pg">
			<header class="home-intro">
				<h1 class="sr-only">ThereSG</h1>
				<p class="tagline">
					Get around and experience Singapore.
				</p>
				<p class="quote">Life is a journey. <button type="button" class="enjoy" aria-label="Toggle blue theme" @click="toggleBlue()">Enjoy</button> the ride. :)</p>
				<div class="tile-grid">
					<NuxtLink class="tile" to="/all">
						<svg class="route-icon" viewBox="-27 -16 54 48" width="30" height="26" fill="none" aria-hidden="true">
							<path d="M-18 24 C-18 -4 18 22 18 -6" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" />
							<circle cx="-18" cy="24" r="7" fill="currentColor" />
							<circle cx="18" cy="-6" r="7" class="route-ring" stroke="currentColor" stroke-width="4.5" />
						</svg>
						<span class="tile-title">Commute</span>
						<span class="tile-desc">Bus, MRT &amp; walking routes</span>
					</NuxtLink>
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
						<span class="tile-desc">Parking &amp; park connectors</span>
					</NuxtLink>
					<NuxtLink class="tile" to="/food">
						<Icon name="material-symbols:restaurant-outline" />
						<span class="tile-title">Food</span>
						<span class="tile-desc">Hawker &amp; eats nearby</span>
					</NuxtLink>
					<NuxtLink class="tile" to="/places">
						<Icon name="material-symbols:photo-camera-outline" />
						<span class="tile-title">Places</span>
						<span class="tile-desc">Parks, libraries &amp; attractions</span>
					</NuxtLink>
					<NuxtLink class="tile" to="/events">
						<Icon name="material-symbols:event-outline" />
						<span class="tile-title">Events</span>
						<span class="tile-desc">Local happenings &amp; programmes</span>
					</NuxtLink>
					<NuxtLink class="tile" to="/alerts">
						<Icon name="material-symbols:warning-outline" />
						<span class="tile-title">Alerts</span>
						<span class="tile-desc">Service &amp; traffic updates</span>
					</NuxtLink>
				</div>
				<MyCommute v-if="favourites.length" compact class="home-commute" />
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

.enjoy { appearance: none; background: none; border: 0; padding: 0; color: inherit; font: inherit; cursor: pointer; }
.enjoy:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

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
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
	column-gap: 8px;
	row-gap: 2px;
	background: var(--md-sys-color-surface-container-lowest);
	border: 1px solid var(--md-sys-color-surface-variant);
	border-radius: 18px;
	padding: 11px 12px;
	text-decoration: none;
}
/* Icon sits to the right of the title; the description spans the full width below. */
.tile .route-icon,
.tile .iconify {
	grid-column: 2;
	grid-row: 1;
}
.tile-title { grid-column: 1; grid-row: 1; }
.tile-desc { grid-column: 1 / -1; grid-row: 2; }
.route-ring { fill: var(--md-sys-color-surface-container-lowest); }
.tile .route-icon {
	width: 26px;
	height: 23px;
	color: var(--sg-brand-text);
}
.tile .iconify {
	width: 24px;
	height: 24px;
	color: var(--sg-brand-text);
}
.tile-title {
	font-weight: 700;
	font-size: 14px;
	color: var(--md-sys-color-on-surface);
}
.tile-desc {
	font-size: 11.5px;
	line-height: 1.35;
	color: var(--md-sys-color-on-surface-variant);
}
/* Saved stops appear below the equal-weight portal grid, not as a seventh tile. */
.home-commute {
	margin-top: 14px;
}
.empty-note {
	margin: 0;
	padding: 4px 2px;
	font-size: 13.5px;
	color: var(--md-sys-color-on-surface-variant);
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
