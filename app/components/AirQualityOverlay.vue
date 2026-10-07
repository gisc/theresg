<script setup lang="ts">
import { airRegions, airBands, airBand, airIsStale, type AirQuality, type AirMetric } from '~~/shared/utils/air-quality';
const { data, refresh, error } = await useLazyFetch<AirQuality>('/api/air-quality', { server: false, key: 'air-quality' });
const open = ref(false);
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => { timer = setInterval(() => { now.value = Date.now(); void refresh(); }, 5 * 60_000); });
onUnmounted(() => { if (timer) clearInterval(timer); });
const metrics: AirMetric[] = ['psi', 'pm25'];
function time(value: string) { return new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) + ' SGT'; }
function stale(metric: AirMetric) { const series = data.value?.[metric]; return Boolean(series && airIsStale(series.timestamp, now.value)); }
function summary(metric: AirMetric) {
	const series = data.value?.[metric];
	if (error.value || !series) return 'Unavailable';
	if (stale(metric)) return 'Outdated';
	const values = airRegions.flatMap(region => series.values[region] === null ? [] : [series.values[region]!]);
	const low = Math.min(...values), high = Math.max(...values);
	return `${low === high ? low : `${low}-${high}`}${metric === 'pm25' ? ' µg/m³' : ''}`;
}
function summaryStyle(metric: AirMetric) {
	const series = data.value?.[metric];
	if (error.value || !series || stale(metric)) return { backgroundColor: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-on-surface)', borderColor: 'var(--md-sys-color-outline)' };
	const values = airRegions.flatMap(region => series.values[region] === null ? [] : [series.values[region]!]);
	const band = airBand(metric, Math.max(...values));
	return band ? { backgroundColor: band.bg, color: band.color, borderColor: band.color } : {};
}
function badge(metric: AirMetric, region: typeof airRegions[number]) {
	if (stale(metric) || error.value) return {};
	const band = airBand(metric, data.value?.[metric]?.values[region] ?? null);
	return band ? { color: band.color, backgroundColor: band.bg, borderColor: band.color } : {};
}
</script>

<template>
	<div class="air-bar">
		<button class="air-toggle" :aria-expanded="open" aria-controls="air-panel" @click="open = !open">
			<span class="air-title">Air quality</span>
			<span class="summary psi" :style="summaryStyle('psi')">24h PSI <b>{{ summary('psi') }}</b></span>
			<span class="summary pm25" :style="summaryStyle('pm25')">1h PM2.5 <b>{{ summary('pm25') }}</b></span>
			<span aria-hidden="true">{{ open ? '▴' : '▾' }}</span>
		</button>
	<aside v-if="open" id="air-panel" class="air-panel" aria-labelledby="air-title" @keydown.esc="open = false">
		<header><div><h2 id="air-title">Singapore air quality</h2><p>Regional layout, not an exact-location map</p></div><button class="close" aria-label="Close air quality" @click="open = false">×</button></header>
		<div class="metric-grid">
			<section v-for="metric in metrics" :key="metric" :class="metric">
				<h3>{{ metric === 'psi' ? '24-hour PSI' : '1-hour PM2.5' }}</h3>
				<p class="definition">{{ metric === 'psi' ? 'Daily air-quality index · no units' : 'Fine particles · µg/m³ · immediate activities' }}</p>
				<p v-if="error || !data?.[metric]" class="state">Feed unavailable. No current readings.</p>
				<template v-else>
					<p class="timestamp">Observed {{ time(data[metric]!.timestamp) }}</p>
					<p v-if="stale(metric)" class="state">Outdated reading (over 2 hours old). Check NEA.</p>
					<ul class="readings">
						<li v-for="region in airRegions" :key="region" :class="region"><span class="region">{{ region }}</span><span class="value" :style="badge(metric, region)">{{ data[metric]!.values[region] ?? '—' }}</span><span class="descriptor">{{ data[metric]!.values[region] === null ? 'No reading' : stale(metric) ? 'Historical' : airBand(metric, data[metric]!.values[region])?.label }}</span></li>
					</ul>
					<p class="updated">Feed updated {{ time(data[metric]!.updatedTimestamp) }}</p>
				</template>
				<div class="legend" :aria-label="`${metric} legend`"><span v-for="band in airBands[metric]" :key="band.label"><i :style="{ backgroundColor: band.bg, borderColor: band.color }"></i>{{ band.range }} {{ band.label }}</span></div>
			</section>
		</div>
		<p class="explain">Different measures and scales. PM2.5 colours are ThereSG's design, using NEA's bands; they are not PSI categories.</p>
		<footer>Source: <a href="https://www.haze.gov.sg/" target="_blank" rel="noopener">NEA &amp; health guidance</a> via <a href="https://guide.data.gov.sg/developer-guide/real-time-apis" target="_blank" rel="noopener">data.gov.sg</a>. Hourly observations; checks every 5 min while the page is open. No forecast is shown.</footer>
	</aside>
	</div>
</template>

<style scoped>
.air-bar { position:relative; flex-shrink:0; background:var(--md-sys-color-surface-container); border-bottom:1px solid var(--md-sys-color-outline-variant); }
.air-toggle { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:6px 10px; width:100%; padding:8px 12px; background:transparent; border:0; color:var(--md-sys-color-on-surface); font:inherit; font-size:12px; cursor:pointer; }
.air-title { font-weight:700; }
.summary { display:inline-flex; gap:5px; align-items:center; padding:4px 7px; }
.summary.psi { border-radius:18px; border:1px solid #943f00; background:#fff0d9; color:#763000; }
.summary.pm25 { border-radius:4px; border:1px dashed #6846a0; background:#efe7fc; color:#533681; }
.air-panel { position:absolute; z-index:30; top:calc(100% + 8px); right:16px; width:min(620px,calc(100vw - 32px)); max-height:calc(100svh - 205px); overflow:auto; box-sizing:border-box; border:1px solid var(--md-sys-color-outline-variant); border-radius:20px; padding:18px; box-shadow:0 8px 32px #0003; background:var(--md-sys-color-surface); color:var(--md-sys-color-on-surface); }
header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:14px; } h2 { font-size:19px; margin:0 0 4px; } header p { font-size:12px; margin:0; } .close { cursor:pointer; border:0; background:transparent; color:inherit; font-size:25px; min-width:36px; height:36px; }
.metric-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; } section { border:1px solid var(--md-sys-color-outline-variant); padding:12px; border-radius:12px; }
h3 { margin:0 0 4px; font-size:16px; } .psi h3 { color:#943f00; } .pm25 h3 { color:#6846a0; }
p { line-height:1.4; } .definition { min-height:34px; font-size:12px; margin:0 0 10px; } .timestamp { font-size:12px; font-weight:700; margin:0 0 10px; } .updated { font-size:10px; opacity:.8; margin:8px 0; }
.readings { list-style:none; padding:0; margin:0; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); grid-template-rows:repeat(3,auto); gap:8px 4px; } .readings li { display:flex; flex-direction:column; align-items:center; gap:4px; font-size:11px; } .readings .north { grid-column:2; grid-row:1; } .readings .west { grid-column:1; grid-row:2; } .readings .central { grid-column:2; grid-row:2; } .readings .east { grid-column:3; grid-row:2; } .readings .south { grid-column:2; grid-row:3; } .region { text-transform:capitalize; } .value { text-align:center; min-width:42px; padding:7px 0; border:1px solid var(--md-sys-color-outline); font-weight:700; font-size:17px; }
.psi .value { border-radius:50%; } .pm25 .value { border-radius:4px; border-style:dashed; }
.legend { display:grid; gap:5px; margin-top:12px; font-size:10px; } .legend span { display:flex; align-items:center; gap:6px; } .legend i { width:12px; height:12px; border:1px solid; flex:none; border-radius:50%; } .pm25 .legend i { border-radius:2px; border-style:dashed; }
.explain, footer { font-size:11px; line-height:1.5; } .explain { margin:12px 0 8px; } footer a { color:var(--md-sys-color-primary); } .state { font-size:12px; font-weight:700; }
@media(max-width:600px) { .air-panel { right:10px; width:calc(100vw - 20px); padding:14px; max-height:calc(100svh - 197px); } .metric-grid { grid-template-columns:1fr; gap:12px; } .definition { min-height:0; } .legend { grid-template-columns:1fr 1fr; } }
</style>
