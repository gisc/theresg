<script setup lang="ts">
import { isInSingapore } from '~/composables/location';
import type { JourneyPlace } from '~/components/JourneyPlaceInput.vue';
import type { BusArrivalsResponse } from '~~/shared/types/BusArrivalsResponse';
import {
	ASSUMPTIONS,
	JourneyGraph,
	planJourneys,
	type JLine,
	type JNetworkInput,
	type JourneyOption,
	type JStop,
	type Leg,
} from '~~/shared/utils/journey';

definePageMeta({ title: 'Go There' });
useSeoMeta({
	title: 'Go There: bus and MRT',
	robots: 'noindex, nofollow',
});

interface StopFeature {
	geometry: { coordinates: [number, number] };
	properties: { code: string; name: string; road: string };
}
interface MrtJson {
	lines: JLine[];
	extraEdges: { from: string; to: string; line: string }[];
}
interface PlacesFile {
	items: { name: string; address?: string; lat?: number; lon?: number; category?: string; closed?: boolean }[];
}

const loadError = ref('');
const ready = ref(false);
const places = ref<JourneyPlace[]>([]);
const extraLoaded = ref(false);
let unsnapped = new Set<string>();
// Explicit holds override legacy walk links as well as the new approach records.
const heldVenueIds = new Set<string>(["p:Brooks Park", "p:Bulim Park", "p:Changi Beach Park", "p:Changi Boardwalk", "p:Faber Heights Park", "p:Greenwood Crescent Playground", "p:Holland Green Linear Park", "p:Holland Green Playground", "p:Lilac Drive Playground", "p:Mimosa Walk Playground", "p:Neram Crescent Playground", "p:Nim Crescent Open Space", "p:Orchid Village Playground", "p:Saraca Road Playground", "p:Seletar Terrace Park", "p:Springleaf Avenue Playground", "a:Bird Paradise", "a:Jewel Changi Airport", "p:Harbourfront Library"]);
interface ReviewedLink {capturedAtDate?:string;id:string;meters:number;pathReviewed:boolean;source:'OneMap';sourceUrl:string;geometry:[number,number][];geometryFormat:'lat-lon';direction:'transit-to-venue';instructions:unknown[]}
interface ReviewedAccess { checkedAt:string;id:string; name:string; entranceName:string; entranceReviewed:boolean; buildingApproachReviewed:boolean; lat:number; lon:number; accessScope:'building-approach'|'park-approach';accessNote:string;officialUrl:string; links:ReviewedLink[] }
const venueAccess = shallowRef(new Map<string, ReviewedAccess>());
const approvedVenueLinks = shallowRef(new Map<string, {id:string;meters:number}[]>());
async function loadReviewedAccess() {
 const data = await $fetch<{items:ReviewedAccess[]}>('/venue-access.json').catch(()=>({items:[]}));
 if(!rawInput||!graph)return;
 const valid=new Set([...rawInput.stops.map(s=>`b:${s.code}`),...graph.stations.map(s=>`m:${s.name}`)]);
 const access=new Map<string,ReviewedAccess>();const links=new Map<string,{id:string;meters:number}[]>();
 for(const it of data.items){
  if(heldVenueIds.has(it.id)||!/^[aph]:.+/.test(it.id)||!((it.accessScope==='building-approach'||it.accessScope==='park-approach')&&it.buildingApproachReviewed)||!isInSingapore({lat:it.lat,lon:it.lon}))continue;
  const usable=it.links.filter(l=>l.pathReviewed&&l.source==='OneMap'&&valid.has(l.id)&&Number.isFinite(l.meters)&&l.meters>0&&l.meters<=2000&&l.geometryFormat==='lat-lon'&&l.geometry?.length>1&&l.geometry.every(p=>isInSingapore({lat:p[0],lon:p[1]})));
  if(!usable.length)continue;access.set(it.id,it);links.set(it.id,usable);
 }
 venueAccess.value=access;approvedVenueLinks.value=links;
}
let graph: JourneyGraph | null = null;
let rawInput: Omit<JNetworkInput, 'when'> | null = null;
let builtFor = '';
const clock = ref(Date.now());
let clockTimer: ReturnType<typeof setInterval> | undefined;
onBeforeUnmount(() => clearInterval(clockTimer));

// Singapore time and day type (public holidays follow Sunday timings but cannot be detected here).
function sgWhen(ms: number): { minutes: number; day: 'WD' | 'SAT' | 'SUN'; label: string } {
	const f = new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(ms));
	const g = (t: string) => f.find((p) => p.type === t)?.value ?? '';
	const wd = g('weekday');
	const minutes = Number(g('hour')) * 60 + Number(g('minute'));
	const day = wd === 'Sat' ? 'SAT' : wd === 'Sun' ? 'SUN' : 'WD';
	return { minutes, day, label: `${g('hour').padStart(2, '0')}:${g('minute').padStart(2, '0')}` };
}
function ensureGraph() {
	if (!rawInput) return;
	const w = sgWhen(clock.value);
	const key = `${w.day}${Math.floor(w.minutes / 5)}`;
	if (key === builtFor && graph) return;
	graph = new JourneyGraph({ ...rawInput, when: { minutes: w.minutes, day: w.day } });
 for(const id of heldVenueIds)graph.setPlaceLinks(id, []);
	builtFor = key;
}
const dataDate = ref<number | null>(null);
const dataSource = ref<'datamall' | 'datamall-snapshot' | 'dev-snapshot'>('datamall');

onMounted(async () => {
	clockTimer = setInterval(() => (clock.value = Date.now()), 60_000);
	try {
		const [stopsFc, mrt, net, walk] = await Promise.all([
			$fetch<{ features: StopFeature[] }>('/bus-stops.json'),
			$fetch<MrtJson>('/mrt-lines.json'),
			$fetch<{ updatedAt: number; source: 'datamall' | 'datamall-snapshot' | 'dev-snapshot'; services: Record<string, Record<string, string[]>>; dist?: JNetworkInput['dist']; hours?: JNetworkInput['hours'] }>('/api/bus-network'),
			$fetch<{ ids: string[]; links: Record<string, number[]>; unsnapped: string[]; source: string }>('/walk-links.json'),
		]);
		const stops: JStop[] = stopsFc.features.map((f) => ({
			code: f.properties.code,
			name: f.properties.name,
			road: f.properties.road,
			lon: f.geometry.coordinates[0],
			lat: f.geometry.coordinates[1],
		}));
		rawInput = {
			stops,
			lines: mrt.lines,
			extraEdges: mrt.extraEdges,
			services: net.services,
			dist: net.dist,
			hours: net.hours,
			walk: { ids: walk.ids, links: walk.links },
		};
		ensureGraph();
		unsnapped = new Set(walk.unsnapped);
		dataDate.value = net.updatedAt;
		dataSource.value = net.source;
		const out: JourneyPlace[] = [];
		for (const st of graph!.stations) {
			out.push({
				id: `m:${st.name}`,
				name: st.name,
				sub: '',
				kind: 'mrt',
				lat: st.lat,
				lon: st.lon,
				codes: st.codes.map((c) => ({ code: c.code, color: c.color, textColor: c.textColor })),
			});
		}
		for (const s of stops) {
			out.push({ id: `b:${s.code}`, name: s.name, sub: `${s.road} - stop ${s.code}`, kind: 'bus', lat: s.lat, lon: s.lon });
		}
		places.value = out;
		ready.value = true;
		await loadReviewedAccess();
		await applyQuery();
		// Reuse an existing grant, but never prompt until the visitor asks.
		if (!from.value && !route.query.from && navigator.permissions) {
			const permission = await navigator.permissions.query({ name: 'geolocation' }).catch(() => null);
			if (permission?.state === 'granted' && !from.value) useLocation();
		}
	} catch {
		loadError.value = 'Route data is unavailable right now. Try again in a minute.';
	}
});

// Hawker centres, attractions, parks and libraries load when a field is first used.
async function loadExtra() {
	if (extraLoaded.value) return;
	extraLoaded.value = true;
	try {
		const [h, a, e] = await Promise.all([
			$fetch<PlacesFile>('/hawker-centres.json'),
			$fetch<PlacesFile>('/attractions.json'),
			$fetch<PlacesFile>('/explore-places.json'),
		]);
		const add: JourneyPlace[] = [];
		const push = (items: PlacesFile['items'], kind: JourneyPlace['kind'], sub: string, prefix: string) => {
			for (const it of items) {
				if (typeof it.lat !== 'number' || typeof it.lon !== 'number' || it.closed) continue;
				if (heldVenueIds.has(`${prefix}:${it.name}`)) continue;
				if (unsnapped.has(`${prefix}:${it.name}`) && !venueAccess.value.has(`${prefix}:${it.name}`)) continue;
				add.push({ id: `${prefix}:${it.name}`, name: it.name, sub, kind, lat: it.lat, lon: it.lon });
			}
		};
		push(h.items, 'hawker', 'Hawker centre', 'h');
		push(a.items, 'attraction', 'Attraction', 'a');
		push(e.items, 'park', 'Park', 'p');
		for(const it of venueAccess.value.values()){
 const existing=add.find(p=>p.id===it.id);
 if(existing){existing.lat=it.lat;existing.lon=it.lon;existing.sub=it.entranceName;}
 else add.push({id:it.id,name:it.name,sub:it.entranceName,kind:it.id.startsWith('a:')?'attraction':it.id.startsWith('h:')?'hawker':'park',lat:it.lat,lon:it.lon});
}
places.value = [...add, ...places.value];
	} catch {
		extraLoaded.value = false;
	}
}

const from = ref<JourneyPlace | null>(null);
const to = ref<JourneyPlace | null>(null);
const heldSelection = computed(()=>[from.value,to.value].find(p=>p && heldVenueIds.has(p.id)) ?? null);
function heldPlace(id:string):JourneyPlace{return {id,name:id.slice(id.indexOf(':')+1),sub:'Walking connection unavailable',kind:id.startsWith('a:')?'attraction':'park',lat:0,lon:0};}

// Location is a one-shot, fresh fix. It is not stored on the device or watched.
const locationBusy = ref(false);
const locationMsg = ref('');
let originRevision = 0;
watch(from, () => { originRevision++; locationMsg.value = ''; }, { flush: 'sync' });
function onFromFocused() {
	originRevision++; // A manual choice always wins over a pending location request.
	loadExtra();
}
async function walkingLinks(lat: number, lon: number) {
	if (!rawInput || !graph) throw new Error('Route data is not ready');
	const near = <T extends { lat: number; lon: number }>(items: T[], n: number) => items
		.map((it) => ({ it, d: distM(lat, lon, it.lat, it.lon) }))
		.filter((x) => x.d <= 1500).sort((a, b) => a.d - b.d).slice(0, n).map((x) => x.it);
	const targets = [
		...near(rawInput.stops, 10).map((s) => ({ id: `b:${s.code}`, lat: s.lat, lon: s.lon })),
		...near(graph.stations, 5).map((s) => ({ id: `m:${s.name}`, lat: s.lat, lon: s.lon })),
	];
	if (!targets.length) return [];
	const result = await $fetch<{ links: { id: string; meters: number }[] }>('/api/postal-walk', {
		method: 'POST', body: { lat, lon, targets },
	});
	return result.links;
}
async function useLocation() {
	if (locationBusy.value || !ready.value) return;
	locationMsg.value = '';
	if (!navigator.geolocation) {
		locationMsg.value = 'Location is not supported in this browser. Enter a start manually.';
		return;
	}
	locationBusy.value = true;
	const revision = originRevision;
	try {
		const fix = await new Promise<GeolocationPosition>((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject, {
				enableHighAccuracy: true, timeout: 10000, maximumAge: 60000,
			});
		});
		if (revision !== originRevision) return;
		if (Date.now() - fix.timestamp > 120000 || fix.coords.accuracy > 250) {
			locationMsg.value = 'Your location is too old or imprecise. Try again or enter a start manually.';
			return;
		}
		const lat = fix.coords.latitude;
		const lon = fix.coords.longitude;
		if (!Number.isFinite(lat) || !Number.isFinite(lon) || !isInSingapore({ lat, lon }) || lat >= 1.48) {
			locationMsg.value = 'This planner covers Singapore. Enter a Singapore start manually.';
			return;
		}
		const links = await walkingLinks(lat, lon);
		if (revision !== originRevision) return;
		if (!links.length) {
			locationMsg.value = 'No walkable bus stop or MRT station was found nearby. Enter a start manually.';
			return;
		}
		const id = `here:${lat.toFixed(6)},${lon.toFixed(6)}`;
		const next = new Map(postalLinks.value);
		next.set(id, links);
		postalLinks.value = next;
		from.value = { id, name: 'My current location', sub: 'Current location', kind: 'here', lat, lon };
		locationMsg.value = 'Using your current location. Tap Clear location to remove it, or enter a different start.';
	} catch (e) {
		if (revision !== originRevision) return;
		const code = (e as { code?: number }).code;
		locationMsg.value = code === 1
			? 'Location permission was declined. Enter a start manually, or allow location in your browser settings.'
			: code === 2 || code === 3
				? 'Could not get your location. Try again or enter a start manually.'
				: 'Walking routes from your location are unavailable right now. Try again or enter a start manually.';
	} finally {
		locationBusy.value = false;
	}
}

// Postal codes: OneMap gives the address and point, then walking distances to nearby stops
// and stations come from OneMap's pedestrian router (not straight-line guesses).
const postalLinks = shallowRef(new Map<string, { id: string; meters: number }[]>());
const postalMsg = reactive<{ from: string; to: string }>({ from: '', to: '' });
const postalBusy = ref(false);
function distM(aLat: number, aLon: number, bLat: number, bLon: number) {
	const p = Math.PI / 180;
	const x = Math.sin(((bLat - aLat) * p) / 2) ** 2 + Math.cos(aLat * p) * Math.cos(bLat * p) * Math.sin(((bLon - aLon) * p) / 2) ** 2;
	return 2 * 6371000 * Math.asin(Math.sqrt(x));
}
function tidyAddress(address: string, code: string) {
	const base = address.replace(new RegExp(`\\s*SINGAPORE\\s*${code}$`, 'i'), '');
	return base.toLowerCase().replace(/(^|[\s(-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
}
// Walking legs next to a postal code come from OneMap's pedestrian router, the others from OpenStreetMap paths.
const isPostalName = (n: string) => [from.value, to.value].some((p) => (p?.kind === 'postal' || p?.kind === 'here') && p.name === n);
async function resolvePostal(side: 'from' | 'to') {
	const ref_ = side === 'from' ? from : to;
	const place = ref_.value;
	if (!place || !place.id.startsWith('pc:') || postalLinks.value.has(place.id) || !rawInput) return;
	const code = place.id.slice(3);
	postalMsg[side] = '';
	postalBusy.value = true;
	try {
		const r = await $fetch<{ address: string; lat: number; lon: number }>('/api/postal', { query: { code } });
		const links = await walkingLinks(r.lat, r.lon);
		if (!links.length) {
			postalMsg[side] = `No walkable bus stop or station found near ${r.address}.`;
		}

		const next = new Map(postalLinks.value);
		next.set(place.id, links);
		postalLinks.value = next;
		if (ref_.value?.id === place.id) {
			const named = !place.name.startsWith('Postal code');
			ref_.value = {
				id: place.id,
				name: named ? place.name : `${tidyAddress(r.address, code)} (${code})`,
				sub: `Postal code ${code}`,
				kind: 'postal',
				lat: r.lat,
				lon: r.lon,
			};
		}
	} catch (e) {
		const status = (e as { statusCode?: number }).statusCode;
		postalMsg[side] =
			status === 404
				? `Postal code ${code} was not found.`
				: status === 429
					? 'Too many lookups, try again in a minute.'
					: 'Postal code lookup is unavailable right now. Try a station, bus stop or place name.';
		if (ref_.value?.id === place.id) ref_.value = null;
	} finally {
		postalBusy.value = false;
	}
}
watch(from, () => {
	postalMsg.from = '';
	resolvePostal('from');
});
watch(to, () => {
	postalMsg.to = '';
	resolvePostal('to');
});

// /all?from=<station or stop name>&to=<name> pre-fills the fields.
const route = useRoute();
async function applyQuery() {
	if (route.query.from || route.query.to || route.query.toId) await loadExtra();
	const find = (q: unknown) => {
		if (typeof q !== 'string' || !q) return null;
		const l = q.toLowerCase();
 const held=[...heldVenueIds].find(id=>id.slice(id.indexOf(':')+1).toLowerCase()===l);
 if(held)return heldPlace(held);
		return places.value.find((p) => p.name.toLowerCase() === l || p.id === `b:${l}`) ?? null;
	};
	if (!from.value) from.value = find(route.query.from);
	if (!to.value) {
  const requestedId=route.query.toId;
  if(typeof requestedId==='string'){
   // Explicit venue IDs never fall through to a same-named stop or station.
   to.value=heldVenueIds.has(requestedId)?heldPlace(requestedId):places.value.find(p=>p.id===requestedId && /^[aph]:/.test(p.id))??null;
   return;
  }
		const q = route.query.to;
		const nm = route.query.toName;
		if (typeof q === 'string' && /^\d{6}$/.test(q)) {
			// A postal-code destination with a display name, e.g. from Food "Go there".
			const name = typeof nm === 'string' && nm.trim() ? nm.trim().slice(0, 80) : `Postal code ${q}`;
			to.value = { id: `pc:${q}`, name, sub: `Postal code ${q}`, kind: 'postal', lat: 0, lon: 0 };
		} else to.value = find(q);
	}
}

function clearLocation() {
	// Drops the current-location start; the watcher on `from` cancels any pending fix and clears the message.
	// After a swap the location can sit in To, so clear whichever end holds it.
	if (from.value?.kind === 'here') from.value = null;
	if (to.value?.kind === 'here') to.value = null;
}

function swap() {
	const f = from.value;
	from.value = to.value;
	to.value = f;
}

const options = computed<JourneyOption[] | null>(() => {
	if (!ready.value || !from.value || !to.value) return null;
	if (heldVenueIds.has(from.value.id) || heldVenueIds.has(to.value.id)) return null;
 if (from.value.id === to.value.id) return [];
	clock.value; // re-plan when the clock moves on
	ensureGraph();
	if (!graph) return null;
	for(const p of [from.value,to.value]){
 const links=approvedVenueLinks.value.get(p.id);
 if(links)graph.setPlaceLinks(p.id,links);
}
// A postal code is only plannable once its walking links have arrived.
	for (const p of [from.value, to.value]) {
		if (p.id.startsWith('pc:') || p.kind === 'here') {
			const links = postalLinks.value.get(p.id);
			if (!links) return null;
			graph.setPlaceLinks(p.id, links);
		}
	}
	return planJourneys(graph, from.value, to.value);
});

// Match reviewed endpoint legs without flattening source/geometry into distance alone.
function reviewedWalk(l: Leg) {
 if(l.mode!=='walk')return null;
 for(const p of [from.value,to.value]){
  if(!p)continue;const a=venueAccess.value.get(p.id);if(!a)continue;
  const arriving=l.to===a.name;const leaving=l.from===a.name;
  if(!arriving&&!leaving)continue;
  const transit=arriving?l.from:l.to;
  const link=a.links.find(x=>x.pathReviewed&&(x.id===`m:${transit}`||x.originName===transit));
  if(!link)continue;
  return {access:a,link,geometry:arriving?link.geometry:[...link.geometry].reverse()};
 }
 return null;
}
function walkPathPoints(l:Leg){
 const g=reviewedWalk(l)?.geometry;if(!g?.length)return '';
 const xs=g.map(p=>p[1]*Math.cos(1.35*Math.PI/180)),ys=g.map(p=>-p[0]);
 const minX=Math.min(...xs),minY=Math.min(...ys),span=Math.max(Math.max(...xs)-minX,Math.max(...ys)-minY,0.00001);
 return g.map((p,i)=>`${10+180*(xs[i]!-minX)/span},${10+180*(ys[i]!-minY)/span}`).join(' ');
}
const whenLabel = computed(() => sgWhen(clock.value));
// Rail and most buses do not run overnight; warn rather than imply a trip is possible.
const offHours = computed(() => whenLabel.value.minutes >= 60 && whenLabel.value.minutes < 5 * 60 + 30);

const live = reactive<Record<string, { loading: boolean; text: string }>>({});
async function checkLive(leg: Extract<Leg, { mode: 'bus' }>) {
	const key = `${leg.boardCode}:${leg.service}`;
	live[key] = { loading: true, text: '' };
	try {
		const r = await $fetch<BusArrivalsResponse>('/api/bus-arrivals', { query: { stopCode: leg.boardCode } });
		if (r.error) {
			live[key] = { loading: false, text: 'Live arrivals are unavailable right now.' };
			return;
		}
		const svc = r.services.find((s) => s.ServiceNo.toLowerCase() === leg.service.toLowerCase());
		if (!svc) {
			live[key] = { loading: false, text: `No live ${leg.service} reported at this stop right now.` };
			return;
		}
		const now = Date.now();
		const times = [svc.NextBus, svc.NextBus2, svc.NextBus3]
			.filter((b) => b?.EstimatedArrival)
			.map((b) => `${timeToArrival(b.EstimatedArrival, now)}${isLiveEstimate(b) ? '' : ' (scheduled)'}`);
		live[key] = { loading: false, text: times.length ? `Next: ${times.join(', ')}` : 'No estimate yet.' };
	} catch {
		live[key] = { loading: false, text: 'Live arrivals are unavailable right now.' };
	}
}

function mins(n: number) {
	return `${Math.max(1, Math.round(n))} min`;
}
function dataAsOf() {
	return dataDate.value
		? new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', day: 'numeric', month: 'short', year: 'numeric' }).format(dataDate.value)
		: '';
}
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading class="heading" variant="headline" size="large">Go There</m3e-heading>
			<m3e-card>
				<div slot="content" class="planner">
					<div class="fields">
						<div class="from-row">
							<div class="flabel">From</div>
							<div class="from-actions">
								<button type="button" class="live-btn" :disabled="!ready || locationBusy" @click="from?.kind === 'here' || to?.kind === 'here' ? clearLocation() : useLocation()">
									{{ locationBusy ? 'Finding your location...' : from?.kind === 'here' || to?.kind === 'here' ? 'Clear location' : 'Use my location' }}
								</button>
							</div>
						</div>
						<JourneyPlaceInput
							v-model="from"
							label="Station, bus stop, place or postal code"
							:places="places"
							@focused="onFromFocused()"
						/>
						<div class="from-row">
							<div class="flabel">To</div>
							<m3e-icon-button class="swap" aria-label="Swap from and to" @click="swap">
								<Icon name="material-symbols:swap-vert" />
							</m3e-icon-button>
						</div>
						<JourneyPlaceInput v-model="to" label="Station, bus stop, place or postal code" :places="places" @focused="loadExtra()" />
					</div>
					<p class="hint" role="status" aria-live="polite">{{ locationMsg || 'Use your location as From after granting permission, or enter a start manually. Your coordinates are sent to this site and OneMap to find walking routes, but are not saved as a preference.' }}</p>
					<p v-if="postalMsg.from || postalMsg.to" class="hint err">{{ postalMsg.from || postalMsg.to }}</p>
					<p v-else-if="postalBusy" class="hint">Looking up postal code...</p>
					<p v-if="loadError" class="hint err">{{ loadError }}</p>
					<p v-else-if="!ready" class="hint">Loading routes...</p>

					<p v-if="offHours && options" class="warn">
						<Icon name="material-symbols:schedule-outline" />
						It is late. MRT and most buses may not be running now, so check before you set off.
					</p>

					<template v-if="options">
						<p v-if="options.length === 0" class="hint">
							No bus or MRT route found between these two places within walking range of a stop or station.
						</p>
						<div v-for="(o, oi) in options" :key="oi" class="option">
							<div class="option-head">
								<span class="option-label">{{ o.label }}</span>
								<span class="option-time">~{{ o.minutes }} min</span>
							</div>
							<p class="option-meta">
								{{ o.transfers === 0 ? 'No transfers' : `${o.transfers} ${o.transfers === 1 ? 'transfer' : 'transfers'}` }}
								<template v-if="o.walkMeters >= 30"> &middot; {{ Math.round(o.walkMeters / 10) * 10 }} m walking</template>
							</p>
							<ol class="legs">
								<li v-for="(l, li) in o.legs" :key="li" class="leg">
									<template v-if="l.mode === 'walk'">
										<span class="badge walk"><Icon name="material-symbols:directions-walk" /></span>
										<div class="leg-body">
											<div class="leg-title">Walk about {{ Math.round(l.meters / 10) * 10 }} m <span class="dim">({{ mins(l.minutes) }})</span></div>
											<div class="dim">{{ l.from }} to {{ l.to }}</div>
											<div v-if="reviewedWalk(l)" class="dim">{{ reviewedWalk(l)!.access.entranceName }}. {{ reviewedWalk(l)!.access.accessScope==='park-approach' ? 'Mapped park point, not a checked entrance or step-free route.' : 'Indoor/floor and station travel not included.' }}</div>
                                            <details v-if="reviewedWalk(l)"><summary>Access and source details</summary><div class="dim">{{ reviewedWalk(l)!.access.accessNote }} <a :href="reviewedWalk(l)!.access.officialUrl" target="_blank" rel="noopener">Official access details</a></div>
                                            <details v-if="reviewedWalk(l)"><summary>Mapped approach outline</summary><svg viewBox="0 0 200 200" width="160" height="160" role="img" :aria-label="`Mapped approach from ${l.from} to ${l.to}; route outline only, not a street map`"><polyline :points="walkPathPoints(l)" fill="none" stroke="currentColor" stroke-width="3"/><circle :cx="walkPathPoints(l).split(' ')[0]?.split(',')[0]" :cy="walkPathPoints(l).split(' ')[0]?.split(',')[1]" r="4"/></svg>
                                            <div v-if="reviewedWalk(l)" class="dim">Route outline only. No turn-by-turn instructions are supplied.</div></details>
                                            <div v-if="reviewedWalk(l)" class="dim"><a :href="reviewedWalk(l)!.link.sourceUrl" target="_blank" rel="noopener">Check mapped walk on OneMap</a> · <a href="https://www.onemap.gov.sg/legal/opendatalicence.html" target="_blank" rel="noopener">Singapore Open Data Licence</a> · captured {{ reviewedWalk(l)!.link.capturedAtDate || reviewedWalk(l)!.access.checkedAt }}</div></details>
                                            <div class="dim">Path distance from {{ reviewedWalk(l) || isPostalName(l.from) || isPostalName(l.to) ? 'OneMap' : 'OpenStreetMap' }}</div>
										</div>
									</template>
									<template v-else-if="l.mode === 'bus'">
										<span class="badge bus">{{ l.service }}</span>
										<div class="leg-body">
											<div class="leg-title">
												Bus {{ l.service }} <span v-if="l.towards" class="dim">towards {{ l.towards }}</span>
											</div>
											<div class="dim">
												Board {{ l.boardName }} ({{ l.boardCode }})<br />
												Get off {{ l.alightName }} ({{ l.alightCode }})
											</div>
											<div class="dim">
												{{ l.stops }} {{ l.stops === 1 ? 'stop' : 'stops' }} &middot; about {{ mins(l.minutes) }} on board, plus ~{{ l.waitMinutes }} min average wait
											</div>
											<div class="live-row">
												<button type="button" class="live-btn" @click="checkLive(l)">Live arrivals here</button>
												<span v-if="live[`${l.boardCode}:${l.service}`]" class="dim">
													{{ live[`${l.boardCode}:${l.service}`]!.loading ? 'Checking...' : live[`${l.boardCode}:${l.service}`]!.text }}
												</span>
											</div>
										</div>
									</template>
									<template v-else>
										<span class="badge mrt" :style="{ backgroundColor: l.color, color: l.textColor }">{{ l.line }}</span>
										<div class="leg-body">
											<div class="leg-title">
												{{ l.lineName }} <span v-if="l.towards" class="dim">towards {{ l.towards }}</span>
											</div>
											<div class="dim">{{ l.from }} to {{ l.to }}</div>
											<div class="dim">
												{{ l.stops }} {{ l.stops === 1 ? 'stop' : 'stops' }} &middot; about {{ mins(l.minutes) }} on board, plus ~{{ l.waitMinutes }} min average wait
											</div>
										</div>
									</template>
								</li>
							</ol>
						</div>
						<p v-if="options.length" class="note">
							Times are planning estimates from distances and average waits, not live or timetable data
							(building-approach walks exclude indoor/floor travel; walk {{ ASSUMPTIONS.walkMetersPerMin }} m/min, bus wait ~{{ ASSUMPTIONS.busWaitMin }} min, MRT wait ~{{ ASSUMPTIONS.mrtWaitMin }} min).
							Use "Live arrivals here" for the next bus. Combined bus and MRT fares are not calculated.
							Walking distances are measured along OpenStreetMap footpaths and roads (map data of 26 Sep 2026), or by OneMap for reviewed building/park approaches, postal codes and your location, not
							surveyed on site: they do not know about closed paths, works, weather or whether a route is sheltered. Check a walk on a map
							before you rely on it. Buses shown are those scheduled to run at {{ whenLabel.label }} Singapore time
							(public holidays follow Sunday timings, which this page cannot detect).
							<template v-if="dataSource === 'datamall'">Bus routes: LTA DataMall, loaded {{ dataAsOf() }}.</template>
							<strong v-else-if="dataSource === 'datamall-snapshot'">PREVIEW: bus routes and operating hours are a saved copy of LTA DataMall BusRoutes fetched on {{ dataAsOf() }}. The live site will fetch them daily.</strong>
							<strong v-else>PREVIEW ONLY: bus routes here come from a sample snapshot (data.busrouter.sg, {{ dataAsOf() }}), not live LTA DataMall, and its operating hours are placeholders except 73T.</strong>
						</p>
					</template>
					<p v-else-if="ready && heldSelection" class="hint" role="status">Walking connection to {{ heldSelection.name }} is unavailable in this planner because its access path has not been verified. No route is offered. Choose another destination or check the venue's official directions.</p>
					<p v-else-if="ready" class="hint">Choose a start and a destination to see bus, MRT and mixed routes.</p>
				</div>
			</m3e-card>
			<DataCredits />
		</div>
	</div>
</template>

<style lang="css" scoped>
.from-actions { display: flex; align-items: center; gap: 8px; }
.from-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.from-row button:disabled { opacity: 0.6; cursor: wait; }
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
	gap: 16px;
	padding: 20px;
}
.pg::-webkit-scrollbar {
	display: none;
}
.heading {
	color: var(--md-sys-color-on-surface);
}
.planner {
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin-top: 8px;
}
.fields {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.swap {
	flex: none;
}
.hint {
	margin: 0;
	color: var(--md-sys-color-on-surface-variant);
}
.err {
	color: var(--md-sys-color-error);
}
.warn {
	display: flex;
	gap: 8px;
	align-items: flex-start;
	margin: 0;
	padding: 10px 12px;
	border-radius: 12px;
	background: var(--md-sys-color-surface-container-high);
	color: var(--md-sys-color-on-surface);
	font-size: 14px;
}
.option {
	border: 1px solid var(--md-sys-color-outline-variant);
	border-radius: 16px;
	padding: 12px;
	background: var(--md-sys-color-surface-container-low);
}
.option-head {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 8px;
}
.option-label {
	font-weight: 700;
	color: var(--md-sys-color-on-surface);
}
.option-time {
	font-weight: 700;
	color: var(--md-sys-color-primary);
	white-space: nowrap;
}
.option-meta {
	margin: 2px 0 10px;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}
.legs {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
}
.leg {
	display: flex;
	gap: 10px;
	align-items: flex-start;
}
.badge {
	flex: 0 0 auto;
	min-width: 38px;
	height: 28px;
	padding: 0 8px;
	box-sizing: border-box;
	border-radius: 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 13px;
}
.badge.bus {
	background: #1a1a1a;
	color: #fff;
}
.flabel {
	font-weight: 600;
	font-size: 0.9rem;
}
.badge.walk {
	background: var(--md-sys-color-surface-container-highest);
	color: var(--md-sys-color-on-surface);
}
.leg-body {
	min-width: 0;
	color: var(--md-sys-color-on-surface);
}
.leg-title {
	font-weight: 600;
}
.dim {
	font-weight: 400;
	font-size: 13px;
	color: var(--md-sys-color-on-surface-variant);
}
.live-row {
	margin-top: 6px;
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}
.live-btn {
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	padding: 6px 12px;
	border-radius: 999px;
	border: 1px solid var(--md-sys-color-outline);
	background: transparent;
	color: var(--md-sys-color-primary);
	cursor: pointer;
}
.note {
	margin: 0;
	font-size: 12px;
	color: var(--md-sys-color-on-surface-variant);
}
@media (max-width: 600px) {
	.pg {
		border-radius: 0;
		padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
		gap: 14px;
	}
}
</style>
