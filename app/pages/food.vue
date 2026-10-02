<script setup lang="ts">
definePageMeta({
	title: 'Food',
});

useSeoMeta({
	title: 'Food',
});

interface HawkerLine {
	code: string;
	color: string;
}
interface HawkerItem {
	name: string;
	address: string;
	mrt?: { name: string; lines: HawkerLine[]; dist: number };
	bus?: { code: string; name: string; dist: number };
}
interface HawkerData {
	source: string;
	asOf: string;
	count: number;
	items: HawkerItem[];
}

interface CultureItem {
	id: string;
	name: string;
	tag: string;
	area: string;
	img: string;
	address: string;
	story: string;
	tips: string[];
	mrt: { name: string; lines: HawkerLine[]; meters: number; minutes: number }[];
	mapsUrl: string;
	sources: { label: string; url: string }[];
}
// Go there opens the Commute planner with this place as the destination, found by its postal code.
function goThere(name: string, address: string) {
	const code = address.match(/\b(\d{6})\b/)?.[1];
	return code ? `/all?to=${code}&toName=${encodeURIComponent(name)}` : null;
}

interface CultureData {
	title: string;
	intro: string;
	banner: string;
	note: string;
	items: CultureItem[];
	video: { title: string; author: string; url: string };
}
const { data: culture } = await useLazyFetch<CultureData>('/food-culture.json', {
	server: false,
});

const { data } = await useLazyFetch<HawkerData>('/hawker-centres.json', {
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
			<m3e-heading class="heading" variant="headline" size="large">Food</m3e-heading>

			<m3e-card v-if="culture">
				<m3e-heading slot="header" variant="title" size="large">
					{{ culture.title }}
				</m3e-heading>
				<div slot="content" class="culture">
					<img class="banner" :src="culture.banner" alt="" loading="lazy" />
					<p class="intro-text">{{ culture.intro }}</p>
					<p class="note">{{ culture.note }} Walking times are map estimates from the station.</p>
					<article v-for="c in culture.items" :key="c.id" class="spot">
						<img class="spot-img" :src="c.img" alt="" loading="lazy" />
						<span class="tag">{{ c.tag }} · {{ c.area }}</span>
						<h3 class="spot-name">{{ c.name }}</h3>
						<span class="addr">{{ c.address }}</span>
						<p class="intro-text">{{ c.story }}</p>
						<ul class="tips">
							<li v-for="t in c.tips" :key="t">{{ t }}</li>
						</ul>
						<span v-for="m in c.mrt" :key="m.name" class="near">
							<span
								v-for="ln in m.lines"
								:key="ln.code"
								class="chip"
								:style="{ backgroundColor: ln.color }"
								>{{ ln.code }}</span
							>
							{{ m.name }} · about {{ fmtDist(m.meters) }}, {{ m.minutes }} min walk
						</span>
						<span class="src">
							Sources:
							<a
								v-for="s in c.sources"
								:key="s.url"
								:href="s.url"
								target="_blank"
								rel="noopener"
								>{{ s.label }}</a
							>
						</span>
						<span class="go-row">
							<NuxtLink v-if="goThere(c.name, c.address)" class="go-btn route" :to="goThere(c.name, c.address)!">
								<Icon name="material-symbols:route" />
								Go there
							</NuxtLink>
							<a class="go-btn alt" :href="c.mapsUrl" target="_blank" rel="noopener">
								<Icon name="material-symbols:map" />
								Map
							</a>
							<NuxtLink
								class="go-btn mrt"
								:to="`/mrt?to=${encodeURIComponent(c.mrt[0]!.name)}`"
							>
								<Icon name="material-symbols:train" />
								By MRT
							</NuxtLink>
						</span>
					</article>
					<a class="video" :href="culture.video.url" target="_blank" rel="noopener">
						<Icon name="material-symbols:play-circle" />
						<span>Watch: {{ culture.video.title }} · {{ culture.video.author }} (YouTube)</span>
					</a>
				</div>
			</m3e-card>

			<m3e-card>
				<m3e-heading slot="header" variant="title" size="large">
					{{ data?.count ?? 123 }} markets &amp; hawker centres
				</m3e-heading>
				<div slot="content" class="intro">
					<p>
						NEA's August 2026 directory lists 123 markets and hawker centres
						combined - it does not publish a hawker-centre-only count. 122
						entries have street addresses; Bukit Timah Market is closed for
						redevelopment till 2029 (tentative).
					</p>
					<a
						href="https://www.nea.gov.sg/docs/default-source/hawker-centres-documents/list-of-hcs_-17-august-2026.pdf"
						target="_blank"
						rel="noopener"
					>
						Source: NEA directory of markets &amp; hawker centres (PDF, Aug
						2026)
					</a>
				</div>
			</m3e-card>

			<input
				v-model="query"
				class="filter"
				type="search"
				placeholder="Filter by name or address"
				aria-label="Filter hawker centres"
			/>

			<m3e-card>
				<m3e-list slot="content" variant="segmented">
					<m3e-list-item v-for="item in filtered" :key="item.name">
						{{ item.name }}
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
							<span v-if="item.mrt || goThere(item.name, item.address)" class="go-row">
								<NuxtLink v-if="goThere(item.name, item.address)" class="go-btn route" :to="goThere(item.name, item.address)!">
									<Icon name="material-symbols:route" />
									Go there
								</NuxtLink>
								<NuxtLink
									v-if="item.mrt"
									class="go-btn mrt"
									:to="`/mrt?to=${encodeURIComponent(item.mrt.name)}`"
								>
									<Icon name="material-symbols:train" />
									By MRT
								</NuxtLink>
							</span>
						</span>
					</m3e-list-item>
					<m3e-list-item v-if="data && !filtered.length">
						No matches.
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

.supporting {
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.near {
	font-size: 12px;
	color: var(--md-sys-color-on-surface-variant);
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
.go-btn.route {
	background-color: var(--sg-brand-strong);
}
.go-btn.mrt {
	background-color: var(--sg-brand);
}

.culture { display: flex; flex-direction: column; gap: 12px; }
.banner, .spot-img { width: 100%; max-height: 280px; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 16px; display: block; }
.intro-text { margin: 0; font-size: 14px; line-height: 1.5; color: var(--md-sys-color-on-surface); }
.spot { display: flex; flex-direction: column; gap: 6px; padding-top: 12px; border-top: 1px solid var(--md-sys-color-outline-variant); }
.spot-name { margin: 0; font-size: 17px; font-weight: 700; color: var(--md-sys-color-on-surface); }
.tag { align-self: flex-start; padding: 0 10px; border-radius: 10px; font-size: 11px; font-weight: 700; line-height: 20px; color: var(--md-sys-color-on-primary-container); background: var(--md-sys-color-primary-container); }
.addr { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
.note { margin: 0; font-size: 12px; font-style: italic; color: var(--md-sys-color-on-surface-variant); }
.tips { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5; color: var(--md-sys-color-on-surface-variant); }
.src { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
.src a { margin-left: 8px; color: var(--md-sys-color-primary); }
.go-btn.alt { background-color: var(--md-sys-color-secondary); }
.video :deep(svg), .video svg { flex: none; width: 22px; height: 22px; }
.video { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--md-sys-color-primary); text-decoration: none; }

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
