// Bus + MRT journey search. Runs in the browser on static stop/line data plus
// one cached bus-route snapshot. All times are planning estimates from
// distances and average waits - nothing here is live or timetable data.

export interface JPoint {
	lat: number;
	lon: number;
}
export interface JStop extends JPoint {
	code: string;
	name: string;
	road: string;
}
export interface JStation extends JPoint {
	name: string;
	codes: { code: string; line: string; color: string; textColor: string }[];
}
export interface JLine {
	code: string;
	name: string;
	color: string;
	textColor?: string;
	loop?: boolean;
	stations: { code: string; name: string; lat?: number; lon?: number }[];
}
export interface JNetworkInput {
	stops: JStop[];
	lines: JLine[];
	extraEdges: { from: string; to: string; line: string }[];
	/** service -> direction -> ordered stop codes */
	services: Record<string, Record<string, string[]>>;
	/** Optional DataMall extras: cumulative km per stop and "WDf,WDl,SATf,SATl,SUNf,SUNl" (HHMM) per stop. */
	dist?: Record<string, Record<string, (number | null)[]>>;
	hours?: Record<string, Record<string, string[]>>;
	/** Plan for this Singapore time; services not running at their boarding stop then are left out. */
	when?: { minutes: number; day: 'WD' | 'SAT' | 'SUN' };
	/** Precomputed pedestrian distances (public/walk-links.json). */
	walk: { ids: string[]; links: Record<string, number[]> };
}

export type Leg =
	| { mode: 'walk'; meters: number; minutes: number; from: string; to: string }
	| {
			mode: 'bus';
			service: string;
			boardCode: string;
			boardName: string;
			alightCode: string;
			alightName: string;
			stops: number;
			minutes: number;
			waitMinutes: number;
			towards: string;
	  }
	| {
			mode: 'mrt';
			line: string;
			lineName: string;
			color: string;
			textColor: string;
			from: string;
			to: string;
			stops: number;
			minutes: number;
			waitMinutes: number;
			towards: string | null;
	  };

export interface JourneyOption {
	label: string;
	minutes: number;
	legs: Leg[];
	transfers: number;
	walkMeters: number;
	modes: ('bus' | 'mrt')[];
}

export interface Endpoint extends JPoint {
	name: string;
	/** `b:<stop code>`, `m:<station name>` or a place id from walk-links.json. */
	id: string;
}

// Planning constants (all minutes / metres). Exposed so the UI can state them.
export const ASSUMPTIONS = {
	walkMetersPerMin: 70,
	busWaitMin: 6,
	busKmh: 17,
	busExpressKmh: 38,
	busDwellMin: 0.5,
	mrtWaitMin: 3,
	mrtKmh: 55,
	mrtDwellMin: 0.5,
	interchangeMin: 2,
};

/** Is a service scheduled to reach this stop at the given time? Missing or "-" times count as not running. */
export function runningAt(h: string | undefined, when: { minutes: number; day: 'WD' | 'SAT' | 'SUN' }): boolean {
	if (!h) return true;
	const f = h.split(',');
	const o = when.day === 'WD' ? 0 : when.day === 'SAT' ? 2 : 4;
	const a = f[o];
	const b = f[o + 1];
	if (!a || !b || a === '-' || b === '-') return false;
	const m = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(2));
	const first = m(a);
	const last = m(b);
	const t = when.minutes;
	// A last bus after midnight (e.g. first 2335, last 0020) wraps the clock.
	return first <= last ? t >= first && t <= last : t >= first || t <= last;
}

export function distM(a: JPoint, b: JPoint): number {
	const rad = Math.PI / 180;
	const dLat = (b.lat - a.lat) * rad;
	const dLon = (b.lon - a.lon) * rad;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
	return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

type Kind = 'walk' | 'busBoard' | 'busRide' | 'busAlight' | 'railBoard' | 'railRide' | 'railAlight';
interface Edge {
	to: number;
	cost: number;
	kind: Kind;
	meters?: number;
}
interface Meta {
	type: 'stop' | 'station' | 'bus' | 'rail';
	stop?: JStop;
	station?: JStation;
	service?: string;
	dir?: string;
	index?: number;
	line?: string;
	name?: string;
}

export class JourneyGraph {
	meta: Meta[] = [];
	adj: Edge[][] = [];
	stopNode = new Map<string, number>();
	stationNode = new Map<string, number>();
	stations: JStation[] = [];
	stops: JStop[];
	lineByCode = new Map<string, JLine>();
	serviceSeq = new Map<string, string[]>();
	private stopByCode = new Map<string, JStop>();

	constructor(input: JNetworkInput) {
		this.stops = input.stops;
		const A = ASSUMPTIONS;
		const add = (m: Meta) => {
			this.meta.push(m);
			this.adj.push([]);
			return this.meta.length - 1;
		};
		const link = (a: number, b: number, cost: number, kind: Kind, meters?: number) =>
			this.adj[a]!.push({ to: b, cost, kind, meters });

		for (const s of input.stops) {
			this.stopByCode.set(s.code, s);
			this.stopNode.set(s.code, add({ type: 'stop', stop: s }));
		}

		// Stations by name (interchanges share a node).
		const byName = new Map<string, JStation>();
		for (const line of input.lines) {
			this.lineByCode.set(line.code, line);
			for (const st of line.stations) {
				if (st.lat === undefined || st.lon === undefined) continue;
				const e =
					byName.get(st.name) ??
					({ name: st.name, lat: st.lat, lon: st.lon, codes: [] } as JStation);
				if (!e.codes.some((c) => c.code === st.code)) {
					e.codes.push({
						code: st.code,
						line: line.code,
						color: line.color,
						textColor: line.textColor ?? '#FFFFFF',
					});
				}
				byName.set(st.name, e);
			}
		}
		for (const st of byName.values()) {
			this.stations.push(st);
			this.stationNode.set(st.name, add({ type: 'station', station: st, name: st.name }));
		}

		// Rail: one node per (line, station); edges follow the line order.
		const railNode = new Map<string, number>();
		const rn = (line: string, name: string) => {
			const key = `${line}|${name}`;
			let id = railNode.get(key);
			if (id === undefined) {
				id = add({ type: 'rail', line, name });
				railNode.set(key, id);
				const sn = this.stationNode.get(name);
				if (sn !== undefined) {
					link(sn, id, A.mrtWaitMin, 'railBoard');
					link(id, sn, A.interchangeMin / 2, 'railAlight');
				}
			}
			return id;
		};
		const rideCost = (a: string, b: string) => {
			const sa = byName.get(a);
			const sb = byName.get(b);
			if (!sa || !sb) return 2.5;
			const m = distM(sa, sb) * 1.15;
			return (m / 1000 / A.mrtKmh) * 60 + A.mrtDwellMin;
		};
		const rideEdge = (line: string, a: string, b: string) => {
			if (!byName.has(a) || !byName.has(b)) return;
			const na = rn(line, a);
			const nb = rn(line, b);
			const c = rideCost(a, b);
			link(na, nb, c, 'railRide');
			link(nb, na, c, 'railRide');
		};
		for (const line of input.lines) {
			const names = line.stations.map((s) => s.name);
			for (let i = 0; i < names.length - 1; i++) rideEdge(line.code, names[i]!, names[i + 1]!);
			if (line.loop && names.length > 1) rideEdge(line.code, names[names.length - 1]!, names[0]!);
		}
		for (const e of input.extraEdges ?? []) rideEdge(e.line, e.from, e.to);

		// Bus: one node per (service, direction, position).
		for (const [svc, dirs] of Object.entries(input.services)) {
			for (const [dir, codes] of Object.entries(dirs)) {
				const keep: number[] = [];
				codes.forEach((c, k) => {
					if (this.stopByCode.has(c)) keep.push(k);
				});
				if (keep.length < 2) continue;
				const seq = keep.map((k) => codes[k]!);
				this.serviceSeq.set(`${svc}|${dir}`, seq);
				const dists = input.dist?.[svc]?.[dir];
				const hrs = input.hours?.[svc]?.[dir];
				let prev = -1;
				let prevK = -1;
				for (let i = 0; i < seq.length; i++) {
					const k = keep[i]!;
					const stop = this.stopByCode.get(seq[i]!)!;
					const v = add({ type: 'bus', service: svc, dir, index: i, stop });
					const p = this.stopNode.get(stop.code)!;
					if (!input.when || !hrs || runningAt(hrs[k], input.when)) link(p, v, A.busWaitMin, 'busBoard');
					link(v, p, 0, 'busAlight');
					if (prev >= 0) {
						const ps = this.meta[prev]!.stop!;
						const d1 = dists?.[k];
						const d0 = dists?.[prevK];
						const m =
							typeof d1 === 'number' && typeof d0 === 'number' && d1 > d0
								? (d1 - d0) * 1000
								: distM(ps, stop) * 1.3;
						// Close stops: street speed. Long gaps are expressway running.
						const kmh = A.busKmh + (A.busExpressKmh - A.busKmh) * Math.min(1, Math.max(0, (m - 800) / 1700));
						link(prev, v, (m / 1000 / kmh) * 60 + A.busDwellMin, 'busRide');
					}
					prev = v;
					prevK = k;
				}
			}
		}

		// Walking links come from precomputed OpenStreetMap pedestrian distances.
		const nodeOf = (id: string): number | undefined =>
			id.startsWith('b:') ? this.stopNode.get(id.slice(2)) : id.startsWith('m:') ? this.stationNode.get(id.slice(2)) : undefined;
		this.walkIds = input.walk.ids;
		this.walkIndex = new Map(input.walk.ids.map((id, i) => [id, i]));
		this.walkLinks = input.walk.links;
		for (const [key, flat] of Object.entries(input.walk.links)) {
			const fromId = input.walk.ids[Number(key)]!;
			const a = nodeOf(fromId);
			if (a === undefined) continue;
			for (let k = 0; k < flat.length; k += 2) {
				const b = nodeOf(input.walk.ids[flat[k]!]!);
				if (b === undefined || b === a) continue;
				const m = flat[k + 1]!;
				// +1 min per transfer walk for finding the next stop; this also discourages chains of walks.
				link(a, b, m / A.walkMetersPerMin + 1, 'walk', m);
			}
		}
	}

	private walkIds: string[] = [];
	private walkIndex = new Map<string, number>();
	private walkLinks: Record<string, number[]> = {};
	private placeLinks = new Map<string, { id: string; meters: number }[]>();

	/** Walking links for a place that is not in walk-links.json (e.g. a postal code), from a pedestrian router. ids are `b:<code>` or `m:<name>`. */
	setPlaceLinks(placeId: string, links: { id: string; meters: number }[]) {
		this.placeLinks.set(placeId, links);
	}

	/** Where a journey may start or end: the stop or station itself, or the stops and stations walkable from a place. */
	access(p: Endpoint, allowBus: boolean, allowRail: boolean) {
		const A = ASSUMPTIONS;
		const out: { node: number; cost: number; meters: number }[] = [];
		if (p.id.startsWith('b:') || p.id.startsWith('m:')) {
			const node = p.id.startsWith('b:') ? this.stopNode.get(p.id.slice(2)) : this.stationNode.get(p.id.slice(2));
			if (node !== undefined) out.push({ node, cost: 0, meters: 0 });
			return out;
		}
		const extra = this.placeLinks.get(p.id);
		const i = this.walkIndex.get(p.id);
		const flat = i === undefined ? undefined : this.walkLinks[String(i)];
		if (!flat && !extra) return out;
		const stops: typeof out = [];
		const stations: typeof out = [];
		const pairs: [string, number][] = extra ? extra.map((l) => [l.id, l.meters]) : [];
		if (!extra && flat) for (let k = 0; k < flat.length; k += 2) pairs.push([this.walkIds[flat[k]!]!, flat[k + 1]!]);
		for (const [id, m] of pairs) {
			if (id.startsWith('b:') && allowBus) {
				const node = this.stopNode.get(id.slice(2));
				if (node !== undefined) stops.push({ node, cost: m / A.walkMetersPerMin, meters: m });
			} else if (id.startsWith('m:') && allowRail) {
				const node = this.stationNode.get(id.slice(2));
				if (node !== undefined) stations.push({ node, cost: m / A.walkMetersPerMin, meters: m });
			}
		}
		stops.sort((a, b) => a.meters - b.meters);
		stations.sort((a, b) => a.meters - b.meters);
		return [...stops.slice(0, 8), ...stations.slice(0, 4)];
	}

	search(from: Endpoint, to: Endpoint, allowBus: boolean, allowRail: boolean): JourneyOption | null {
		const A = ASSUMPTIONS;
		const src = this.access(from, allowBus, allowRail);
		const dst = this.access(to, allowBus, allowRail);
		if (!src.length || !dst.length) return null;
		const dstCost = new Map(dst.map((d) => [d.node, d]));
		const n = this.meta.length;
		const dist = new Float64Array(n).fill(Infinity);
		const prevNode = new Int32Array(n).fill(-1);
		const prevEdge: (Edge | null)[] = new Array(n).fill(null);
		const startVia = new Map<number, { meters: number }>();
		const heap = new MinHeap();
		for (const s of src) {
			if (s.cost < dist[s.node]!) {
				dist[s.node] = s.cost;
				startVia.set(s.node, { meters: s.meters });
				heap.push(s.cost, s.node);
			}
		}
		const rail = (id: number) => this.meta[id]!.type === 'rail';
		const bus = (id: number) => this.meta[id]!.type === 'bus';
		let best = Infinity;
		let bestNode = -1;
		while (heap.size) {
			const [d, u] = heap.pop();
			if (d > dist[u]!) continue;
			if (d >= best) break;
			const end = dstCost.get(u);
			if (end && d + end.cost < best) {
				best = d + end.cost;
				bestNode = u;
			}
			for (const e of this.adj[u]!) {
				if (!allowBus && (bus(e.to) || bus(u))) continue;
				if (!allowRail && (rail(e.to) || rail(u))) continue;
				const nd = d + e.cost;
				if (nd < dist[e.to]!) {
					dist[e.to] = nd;
					prevNode[e.to] = u;
					prevEdge[e.to] = e;
					heap.push(nd, e.to);
				}
			}
		}
		if (bestNode < 0) return null;

		// Rebuild node path.
		const path: number[] = [];
		const edges: Edge[] = [];
		for (let v = bestNode; v !== -1; v = prevNode[v]!) {
			path.unshift(v);
			if (prevEdge[v]) edges.unshift(prevEdge[v]!);
		}
		return this.toOption(from, to, path, edges, startVia.get(path[0]!)!.meters, dstCost.get(bestNode)!.meters, best);
	}

	private nodeName(id: number): string {
		const m = this.meta[id]!;
		if (m.type === 'station' || m.type === 'rail') return m.name!;
		return m.stop!.name;
	}

	private toOption(
		from: Endpoint,
		to: Endpoint,
		path: number[],
		edges: Edge[],
		startM: number,
		endM: number,
		total: number,
	): JourneyOption {
		const A = ASSUMPTIONS;
		const legs: Leg[] = [];
		const pushWalk = (meters: number, f: string, t: string) => {
			if (meters < 30) return;
			const last = legs[legs.length - 1];
			if (last && last.mode === 'walk') {
				last.meters += meters;
				last.minutes = last.meters / A.walkMetersPerMin;
				last.to = t;
			} else legs.push({ mode: 'walk', meters, minutes: meters / A.walkMetersPerMin, from: f, to: t });
		};
		pushWalk(startM, from.name, this.nodeName(path[0]!));

		let i = 0;
		while (i < edges.length) {
			const e = edges[i]!;
			const a = path[i]!;
			if (e.kind === 'walk') {
				pushWalk(e.meters ?? 0, this.nodeName(a), this.nodeName(e.to));
				i++;
			} else if (e.kind === 'busBoard') {
				const first = this.meta[e.to]!;
				let j = i + 1;
				let minutes = 0;
				let last = e.to;
				while (j < edges.length && edges[j]!.kind === 'busRide') {
					minutes += edges[j]!.cost;
					last = edges[j]!.to;
					j++;
				}
				const lm = this.meta[last]!;
				const seq = this.serviceSeq.get(`${first.service}|${first.dir}`) ?? [];
				const termCode = seq[seq.length - 1];
				const term = this.stops.find((s) => s.code === termCode);
				legs.push({
					mode: 'bus',
					service: first.service!,
					boardCode: first.stop!.code,
					boardName: first.stop!.name,
					alightCode: lm.stop!.code,
					alightName: lm.stop!.name,
					stops: (lm.index ?? 0) - (first.index ?? 0),
					minutes,
					waitMinutes: A.busWaitMin,
					towards: term?.name ?? '',
				});
				i = j + (edges[j]?.kind === 'busAlight' ? 1 : 0);
			} else if (e.kind === 'railBoard') {
				const first = this.meta[e.to]!;
				let j = i + 1;
				let minutes = 0;
				let last = e.to;
				while (j < edges.length && edges[j]!.kind === 'railRide') {
					minutes += edges[j]!.cost;
					last = edges[j]!.to;
					j++;
				}
				const lm = this.meta[last]!;
				const line = this.lineByCode.get(first.line!)!;
				const names = line.stations.map((s) => s.name);
				const a1 = names.indexOf(first.name!);
				const a2 = names.indexOf(lm.name!);
				let towards: string | null = null;
				if (!line.loop && a1 !== -1 && a2 !== -1) towards = a1 < a2 ? names[names.length - 1]! : names[0]!;
				const stops = j - i - 1;
				legs.push({
					mode: 'mrt',
					line: line.code,
					lineName: line.name,
					color: line.color,
					textColor: line.textColor ?? '#FFFFFF',
					from: first.name!,
					to: lm.name!,
					stops,
					minutes,
					waitMinutes: A.mrtWaitMin,
					towards,
				});
				i = j + (edges[j]?.kind === 'railAlight' ? 1 : 0);
			} else {
				i++;
			}
		}
		pushWalk(endM, this.nodeName(path[path.length - 1]!), to.name);

		const rides = legs.filter((l) => l.mode !== 'walk');
		const modes = [...new Set(rides.map((l) => l.mode))] as ('bus' | 'mrt')[];
		return {
			label: '',
			minutes: Math.round(total),
			legs,
			transfers: Math.max(0, rides.length - 1),
			walkMeters: legs.reduce((t, l) => t + (l.mode === 'walk' ? l.meters : 0), 0),
			modes,
		};
	}
}

function signature(o: JourneyOption): string {
	return o.legs
		.map((l) =>
			l.mode === 'walk' ? 'w' : l.mode === 'bus' ? `b${l.service}${l.boardCode}${l.alightCode}` : `m${l.from}>${l.to}`,
		)
		.join('|');
}

/** Best mixed route plus bus-only and MRT-only alternatives when they differ. */
export function planJourneys(graph: JourneyGraph, from: Endpoint, to: Endpoint): JourneyOption[] {
	const out: JourneyOption[] = [];
	const mixed = graph.search(from, to, true, true);
	const bus = graph.search(from, to, true, false);
	const mrt = graph.search(from, to, false, true);
	const seen = new Set<string>();
	const add = (o: JourneyOption | null, label: string) => {
		if (!o) return;
		const sig = signature(o);
		if (seen.has(sig)) return;
		seen.add(sig);
		out.push({ ...o, label });
	};
	if (mixed) {
		const kind = mixed.modes.length === 2 ? 'Bus + MRT' : mixed.modes[0] === 'bus' ? 'Bus only' : mixed.modes[0] === 'mrt' ? 'MRT only' : 'Walk';
		add(mixed, `Fastest: ${kind}`);
	}
	// Alternatives only when they are a sensible trip: at most 2 transfers and
	// not far slower than the best option.
	const ref = mixed?.minutes ?? Infinity;
	const sensible = (o: JourneyOption | null) =>
		o && o.transfers <= 2 && o.minutes <= ref * 1.6 + 10 ? o : null;
	// Alternatives are only worth showing when they use different modes from the fastest option.
	const key = (o: JourneyOption | null) => o?.modes.join('+') ?? '';
	if (key(mrt) !== key(mixed)) add(sensible(mrt), 'MRT only');
	if (key(bus) !== key(mixed)) add(sensible(bus), 'Bus only');
	return out;
}

class MinHeap {
	private k: number[] = [];
	private v: number[] = [];
	get size() {
		return this.k.length;
	}
	push(key: number, val: number) {
		let i = this.k.length;
		this.k.push(key);
		this.v.push(val);
		while (i > 0) {
			const p = (i - 1) >> 1;
			if (this.k[p]! <= this.k[i]!) break;
			this.swap(i, p);
			i = p;
		}
	}
	pop(): [number, number] {
		const top: [number, number] = [this.k[0]!, this.v[0]!];
		const lk = this.k.pop()!;
		const lv = this.v.pop()!;
		if (this.k.length) {
			this.k[0] = lk;
			this.v[0] = lv;
			let i = 0;
			for (;;) {
				const l = 2 * i + 1;
				const r = l + 1;
				let m = i;
				if (l < this.k.length && this.k[l]! < this.k[m]!) m = l;
				if (r < this.k.length && this.k[r]! < this.k[m]!) m = r;
				if (m === i) break;
				this.swap(i, m);
				i = m;
			}
		}
		return top;
	}
	private swap(a: number, b: number) {
		[this.k[a], this.k[b]] = [this.k[b]!, this.k[a]!];
		[this.v[a], this.v[b]] = [this.v[b]!, this.v[a]!];
	}
}
