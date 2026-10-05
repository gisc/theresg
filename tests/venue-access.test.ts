import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	createHeldVenueIds,
	isReviewedApproach,
	usableReviewedLinks,
	type ReviewedAccess,
} from '../shared/utils/venue-access';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const data: { items: ReviewedAccess[] } = read('public/venue-access.json');
const stops = read('public/bus-stops.json').features;
const rail = read('public/mrt-lines.json');
const valid = new Set<string>([
	...stops.map((s: any) => `b:${s.properties.code}`),
	...rail.lines.flatMap((l: any) =>
		l.stations.filter((s: any) => typeof s.lat === 'number').map((s: any) => `m:${s.name}`),
	),
]);
const held = createHeldVenueIds();
const bounded = (p: { lat: number; lon: number }) =>
	p.lat >= 1.15 && p.lat <= 1.5 && p.lon >= 103.58 && p.lon <= 104.1;
const finiteBounded = (p: { lat: number; lon: number }) =>
	Number.isFinite(p.lat) && Number.isFinite(p.lon) && bounded(p);
// Independently preserve both pages' original coordinate checks and filter order.
for (const pointCheck of [bounded, finiteBounded]) {
	for (const access of data.items) {
		const oldApproach =
			!held.has(access.id) &&
			access.buildingApproachReviewed &&
			['building-approach', 'park-approach'].includes(access.accessScope) &&
			pointCheck(access);
		assert.equal(isReviewedApproach(access, held, pointCheck), oldApproach, access.name);
		const oldLinks = access.links.filter(
			(l) =>
				l.pathReviewed &&
				l.source === 'OneMap' &&
				valid.has(l.id) &&
				Number.isFinite(l.meters) &&
				l.meters > 0 &&
				l.meters <= 2000 &&
				l.geometryFormat === 'lat-lon' &&
				l.geometry?.length > 1 &&
				l.geometry.every((p) => pointCheck({ lat: p[0], lon: p[1] })),
		);
		assert.deepEqual(
			usableReviewedLinks(access.links, valid, pointCheck),
			oldLinks,
			access.name,
		);
	}
}
const a = data.items.find((a) => !held.has(a.id) && usableReviewedLinks(a.links, valid).length)!;
assert.ok(a);
const l = usableReviewedLinks(a.links, valid)[0]!;
assert.equal(usableReviewedLinks([l], valid)[0], l, 'keep original geometry/source metadata');
for (const patch of [
	{ pathReviewed: false },
	{ source: 'unverified' },
	{ id: 'm:missing' },
	{ meters: 0 },
	{ meters: -1 },
	{ meters: 2001 },
	{ meters: NaN },
	{ meters: Infinity },
	{ geometryFormat: 'lon-lat' },
	{ geometry: [] },
	{ geometry: [[1.3, 103.8]] },
	{
		geometry: [
			[1.3, 103.8],
			[0, 0],
		],
	},
	{
		geometry: [
			[NaN, 103.8],
			[1.3, 103.8],
		],
	},
])
	assert.deepEqual(usableReviewedLinks([{ ...l, ...patch } as typeof l], valid), []);
assert.equal(usableReviewedLinks([{ ...l, meters: 2000 }], valid).length, 1);
for (const id of held) assert.equal(isReviewedApproach({ ...a, id }, held), false);
for (const patch of [
	{ buildingApproachReviewed: false },
	{ accessScope: 'unverified' },
	{ lat: NaN },
	{ lon: 0 },
]) {
	assert.equal(isReviewedApproach({ ...a, ...patch } as typeof a, held), false);
}
const other = createHeldVenueIds();
other.clear();
assert.equal(held.size, 19);
assert.equal(createHeldVenueIds().size, 19);
console.log(
	`${data.items.length} venue records match both original page filters; invalid/held/metadata regressions passed`,
);
