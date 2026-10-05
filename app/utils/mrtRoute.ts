export interface MrtStationEntry {
	code: string;
	name: string;
	lat?: number;
	lon?: number;
}

export interface MrtLine {
	code: string;
	name: string;
	color: string;
	textColor?: string;
	loop?: boolean;
	stations: MrtStationEntry[];
}

export interface MrtNetwork {
	lines: MrtLine[];
	extraEdges: { from: string; to: string; line: string }[];
}

export interface StationCode {
	line: string;
	code: string;
	color: string;
	textColor: string;
}

export interface StationInfo {
	name: string;
	codes: StationCode[];
}

export interface RouteSegment {
	line: MrtLine;
	stations: string[];
	towards: string | null;
	stops: number;
}

export function buildStationIndex(network: MrtNetwork): StationInfo[] {
	const map = new Map<string, StationCode[]>();

	for (const line of network.lines) {
		for (const station of line.stations) {
			const codes = map.get(station.name) ?? [];
			if (!codes.some((c) => c.code === station.code)) {
				codes.push({
					line: line.code,
					code: station.code,
					color: line.color,
					textColor: line.textColor ?? '#FFFFFF',
				});
			}
			map.set(station.name, codes);
		}
	}

	return [...map.entries()]
		.map(([name, codes]) => ({ name, codes }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

interface GraphEdge {
	to: string;
	line: string;
}

function buildGraph(network: MrtNetwork): Map<string, GraphEdge[]> {
	const graph = new Map<string, GraphEdge[]>();

	function addEdge(a: string, b: string, line: string) {
		if (!graph.has(a)) graph.set(a, []);
		if (!graph.has(b)) graph.set(b, []);
		graph.get(a)!.push({ to: b, line });
		graph.get(b)!.push({ to: a, line });
	}

	for (const line of network.lines) {
		const names = line.stations.map((s) => s.name);
		for (let i = 0; i < names.length - 1; i++) {
			addEdge(names[i]!, names[i + 1]!, line.code);
		}
		if (line.loop && names.length > 1) {
			addEdge(names[names.length - 1]!, names[0]!, line.code);
		}
	}

	for (const edge of network.extraEdges ?? []) {
		addEdge(edge.from, edge.to, edge.line);
	}

	return graph;
}

const TRANSFER_PENALTY = 0.9;

export function findRoute(
	network: MrtNetwork,
	fromName: string,
	toName: string,
): RouteSegment[] | null {
	if (fromName === toName) {
		return [];
	}

	const graph = buildGraph(network);
	if (!graph.has(fromName) || !graph.has(toName)) {
		return null;
	}

	// Dijkstra over (station, line) states: 1 per stop + penalty per line change.
	const dist = new Map<string, number>();
	const prev = new Map<string, { key: string; station: string; viaLine: string }>();
	const visited = new Set<string>();

	const startKey = `${fromName}|`;
	dist.set(startKey, 0);

	let endKey: string | null = null;

	while (true) {
		let currentKey: string | null = null;
		let currentDist = Infinity;
		for (const [key, d] of dist) {
			if (!visited.has(key) && d < currentDist) {
				currentDist = d;
				currentKey = key;
			}
		}

		if (currentKey === null) {
			break;
		}

		visited.add(currentKey);

		const sep = currentKey.lastIndexOf('|');
		const station = currentKey.slice(0, sep);
		const line = currentKey.slice(sep + 1) || null;

		if (station === toName) {
			endKey = currentKey;
			break;
		}

		for (const edge of graph.get(station) ?? []) {
			const penalty = line && line !== edge.line ? TRANSFER_PENALTY : 0;
			const nextDist = currentDist + 1 + penalty;
			const nextKey = `${edge.to}|${edge.line}`;
			if (nextDist < (dist.get(nextKey) ?? Infinity)) {
				dist.set(nextKey, nextDist);
				prev.set(nextKey, { key: currentKey, station, viaLine: edge.line });
			}
		}
	}

	if (!endKey) {
		return null;
	}

	// Reconstruct station sequence and the line used on each hop.
	const stations: string[] = [toName];
	const hopLines: string[] = [];
	let key = endKey;
	while (key !== startKey) {
		const p = prev.get(key);
		if (!p) {
			return null;
		}
		hopLines.unshift(p.viaLine);
		stations.unshift(p.station);
		key = p.key;
	}

	// Compress consecutive hops on the same line into segments.
	const lineByCode = new Map(network.lines.map((l) => [l.code, l]));
	const segments: RouteSegment[] = [];

	for (let i = 0; i < hopLines.length; i++) {
		const lineCode = hopLines[i]!;
		const line = lineByCode.get(lineCode);
		if (!line) {
			continue;
		}

		const last = segments[segments.length - 1];
		if (last && last.line.code === lineCode) {
			last.stations.push(stations[i + 1]!);
			last.stops += 1;
		} else {
			segments.push({
				line,
				stations: [stations[i]!, stations[i + 1]!],
				towards: null,
				stops: 1,
			});
		}
	}

	// Direction terminus for non-loop lines.
	for (const segment of segments) {
		if (segment.line.loop) {
			continue;
		}
		const names = segment.line.stations.map((s) => s.name);
		const fromIdx = names.indexOf(segment.stations[0]!);
		const toIdx = names.indexOf(segment.stations[segment.stations.length - 1]!);
		if (fromIdx !== -1 && toIdx !== -1) {
			segment.towards = fromIdx < toIdx ? names[names.length - 1]! : names[0]!;
		}
	}

	return segments;
					}
