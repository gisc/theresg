<script setup lang="ts">
import type { BusArrival } from '~~/shared/types/BusArrival';

const { favourites, removeFavourite } = useFavouriteStops();

interface StopArrivals {
	loading: boolean;
	error: boolean;
	arrivals: BusArrival[];
}

const arrivalsByStop = ref<Record<string, StopArrivals>>({});
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

async function loadArrivals(code: string) {
	arrivalsByStop.value = {
		...arrivalsByStop.value,
		[code]: { loading: true, error: false, arrivals: [] },
	};
	try {
		const result = await $fetch<BusArrival[]>('/api/bus-arrivals', {
			query: { stopCode: code },
		});
		arrivalsByStop.value = {
			...arrivalsByStop.value,
			[code]: { loading: false, error: false, arrivals: result },
		};
	} catch {
		arrivalsByStop.value = {
			...arrivalsByStop.value,
			[code]: { loading: false, error: true, arrivals: [] },
		};
	}
}

function refreshAll() {
	for (const favourite of favourites.value) {
		loadArrivals(favourite.code);
	}
}

function upcoming(code: string): BusArrival[] {
	const entry = arrivalsByStop.value[code];
	if (!entry) return [];
	return entry.arrivals.filter((a) => {
		const eta = a?.NextBus?.EstimatedArrival;
		if (!eta) return true;
		return now.value - new Date(eta).getTime() <= 30000;
	});
}

onMounted(() => {
	refreshAll();
	timer = setInterval(() => {
		now.value = Date.now();
		refreshAll();
	}, 60000);
});

onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
});

watch(favourites, (list) => {
	for (const favourite of list) {
		if (!arrivalsByStop.value[favourite.code]) loadArrivals(favourite.code);
	}
});
</script>

<template>
	<section class="my-commute" aria-label="My commute">
		<m3e-heading class="heading" variant="headline" size="large">My commute</m3e-heading>
		<m3e-card v-if="!favourites.length">
			<div slot="content" class="empty">
				<p>
					Pin your home, school, or work bus stops and their live arrivals will show
					here every time you open the app. Saved only in this browser &middot; no
					login needed.
				</p>
				<NuxtLink class="link" to="/bus">Find a stop on the Bus page</NuxtLink>
			</div>
		</m3e-card>
		<m3e-card v-for="favourite in favourites" :key="favourite.code">
			<m3e-heading slot="header" variant="title" size="large">{{
				favourite.name
			}}</m3e-heading>
			<div slot="content" class="fav-body">
				<span class="road">{{ favourite.road }} &middot; {{ favourite.code }}</span>
				<p v-if="arrivalsByStop[favourite.code]?.loading">Loading arrivals...</p>
				<p v-else-if="arrivalsByStop[favourite.code]?.error">
					Could not load arrivals.
					<button type="button" class="retry" @click="loadArrivals(favourite.code)">
						Retry
					</button>
				</p>
				<ul v-else-if="upcoming(favourite.code).length" class="services">
					<li v-for="arrival in upcoming(favourite.code).slice(0, 4)" :key="arrival.ServiceNo">
						<span class="bus-number">{{ arrival.ServiceNo }}</span>
						<span class="eta">{{
							timeToArrival(arrival.NextBus.EstimatedArrival, now)
						}}</span>
						<span v-if="arrival.NextBus2?.EstimatedArrival" class="eta-next">
							then {{ timeToArrival(arrival.NextBus2.EstimatedArrival, now) }}
						</span>
					</li>
				</ul>
				<p v-else>No arrival times available for this stop right now.</p>
				<div class="actions">
					<NuxtLink class="link" :to="`/bus?stop=${favourite.code}`">
						Open in Bus
					</NuxtLink>
					<button
						type="button"
						class="remove"
						@click="removeFavourite(favourite.code)"
					>
						Unpin
					</button>
				</div>
			</div>
		</m3e-card>
	</section>
</template>

<style lang="css" scoped>
.my-commute {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.heading {
	color: var(--md-sys-color-on-surface);
}

.empty {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 8px;
	color: var(--md-sys-color-on-surface-variant);
}

.empty p {
	margin: 0;
}

.fav-body {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 8px;
	color: var(--md-sys-color-on-surface);
}

.road {
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}

.services {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.services li {
	display: flex;
	align-items: center;
	gap: 10px;
}

.bus-number {
	padding: 4px 8px;
	border-radius: 8px;
	background-color: var(--md-sys-color-primary-container);
	color: var(--md-sys-color-on-primary-container);
	font-weight: 600;
}

.eta {
	color: var(--md-sys-color-secondary);
	font-weight: 600;
}

.eta-next {
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}

.actions {
	display: flex;
	align-items: center;
	gap: 16px;
}

.link {
	color: var(--md-sys-color-primary);
	font-weight: 600;
}

.retry,
.remove {
	border: 0;
	background: none;
	padding: 0;
	font: inherit;
	cursor: pointer;
	text-decoration: underline;
}

.retry {
	color: var(--md-sys-color-primary);
}

.remove {
	color: var(--md-sys-color-error);
}

@media (max-width: 767px) {
	.my-commute {
		gap: 12px;
	}
}
</style>
