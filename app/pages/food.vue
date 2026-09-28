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
						</span>
					</m3e-list-item>
					<m3e-list-item v-if="data && !filtered.length">
						No matches.
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
