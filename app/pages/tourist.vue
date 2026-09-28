<script setup lang="ts">
definePageMeta({
	title: 'Tourist',
});

useSeoMeta({
	title: 'Tourist',
});

interface AttractionLine {
	code: string;
	color: string;
}
interface AttractionItem {
	name: string;
	img?: string;
	address: string;
	mrt?: { name: string; lines: AttractionLine[]; dist: number };
	bus?: { code: string; name: string; dist: number };
	note?: string;
}
interface AttractionData {
	source: string;
	asOf: string;
	count: number;
	items: AttractionItem[];
}

const { data } = await useLazyFetch<AttractionData>('/attractions.json', {
	server: false,
});

function fmtDist(m: number): string {
	return m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

const query = ref('');
const filtered = computed(() => {
	const q = query.value.trim().toLowerCase();
	const items = data.value?.items ?? [];
	if (!q) return items;
	return items.filter(
		(i) => i.name.toLowerCase().includes(q) || i.address.toLowerCase().includes(q),
	);
});
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading class="heading" variant="headline" size="large">Tourist</m3e-heading>

			<m3e-card>
				<m3e-heading slot="header" variant="title" size="large">
					{{ data?.count ?? 23 }} major attractions
				</m3e-heading>
				<div slot="content" class="intro">
					<p>
						A curated list of Singapore's major attractions with addresses, the nearest
						MRT station (with line colours) and bus stop by straight-line distance.
					</p>
					<p>
						The Mandai wildlife parks (Singapore Zoo, Night Safari, River Wonders, Bird
						Paradise, Rainforest Wild Asia) are best reached by the M2 Mandai Khatib Bus
						shuttle from Khatib MRT (NS14) - the geographically nearest stations have no
						practical walking route. Sentosa attractions are reached via HarbourFront
						MRT (NE1/CC29), then the Sentosa Express, cable car or bus.
					</p>
				</div>
			</m3e-card>

			<input
				v-model="query"
				class="filter"
				type="search"
				placeholder="Filter by name or address"
				aria-label="Filter attractions"
			/>

			<m3e-card>
				<m3e-list slot="content" variant="segmented">
					<m3e-list-item v-for="item in filtered" :key="item.name">
						{{ item.name }}
						<img
							v-if="item.img"
							class="art"
							:src="`/img/attractions/${item.img}-640.webp`"
							:srcset="`/img/attractions/${item.img}-320.webp 320w, /img/attractions/${item.img}-640.webp 640w`"
							sizes="(max-width: 767px) 100vw, 640px"
							:alt="`Illustration of ${item.name}`"
							width="640"
							height="360"
							loading="lazy"
							decoding="async"
						/>
						<span slot="supporting-text" class="supporting">
							<span class="addr">{{ item.address }}</span>
							<span v-if="item.mrt" class="near">
								<span
									v-for="ln in item.mrt.lines"
									:key="ln.code"
									class="chip"
									:style="{ backgroundColor: ln.color }"
									>{{ ln.code }}</span
								>
								{{ item.mrt.name }} · {{ fmtDist(item.mrt.dist) }}
							</span>
							<span v-if="item.bus" class="near">
								Bus stop {{ item.bus.code }} ({{ item.bus.name }}) ·
								{{ fmtDist(item.bus.dist) }}
							</span>
							<span v-if="item.mrt" class="go-row">
								<NuxtLink
									class="go-btn mrt"
									:to="`/mrt?to=${encodeURIComponent(item.mrt.name)}`"
								>
									<Icon name="material-symbols:train" />
									Go by MRT
								</NuxtLink>
							</span>
							<span v-if="item.note" class="near note">{{ item.note }}</span>
						</span>
					</m3e-list-item>
					<m3e-list-item v-if="data && !filtered.length"> No matches. </m3e-list-item>
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

.intro p {
	margin: 8px 0;
	font-size: 14px;
	line-height: 1.5;
	color: var(--md-sys-color-on-surface);
}
.intro a {
	font-size: 13px;
	color: var(--md-sys-color-primary);
}

.art {
	display: block;
	width: 100%;
	max-width: 640px;
	height: auto;
	aspect-ratio: 16 / 9;
	margin: 6px 0 4px;
	border-radius: 12px;
	background-color: var(--md-sys-color-surface-container);
}

.supporting {
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.near {
	font-size: 12px;
	color: var(--md-sys-color-on-surface-variant);
}
.note {
	color: var(--md-sys-color-primary);
}
.go-row {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 4px;
}
.go-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 12px;
	border-radius: 16px;
	font-size: 12px;
	font-weight: 600;
	line-height: 18px;
	text-decoration: none;
	color: #ffffff;
}
.go-btn.mrt {
	background-color: var(--sg-brand);
}

.chip {
	display: inline-block;
	padding: 0 5px;
	margin-right: 3px;
	border-radius: 4px;
	font-size: 11px;
	font-weight: 700;
	line-height: 16px;
	color: #ffffff;
}

.filter {
	box-sizing: border-box;
	width: 100%;
	padding: 12px 16px;
	font-size: 15px;
	font-family: inherit;
	color: var(--md-sys-color-on-surface);
	background: var(--md-sys-color-surface-container-low);
	border: 1px solid var(--md-sys-color-outline-variant);
	border-radius: 999px;
	outline: none;
}
.filter:focus {
	border-color: var(--md-sys-color-primary);
}

@media (max-width: 767px) {
	.pg {
		border-radius: 0;
		padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
		gap: 14px;
	}
}
</style>
