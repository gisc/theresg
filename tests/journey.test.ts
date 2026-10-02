import assert from 'node:assert/strict';
import { JourneyGraph, planJourneys, runningAt } from '../shared/utils/journey';
// Tiny synthetic network: place o - walk - stop 1 - bus 9 - stop 2 - walk - station X - MRT - station Y - walk - place d.
const stops = [
	{ code: '00001', name: 'A', road: 'R', lat: 1.3, lon: 103.8 },
	{ code: '00002', name: 'B', road: 'R', lat: 1.31, lon: 103.8 },
	{ code: '00003', name: 'C', road: 'R', lat: 1.32, lon: 103.8 },
];
const lines = [
	{
		code: 'XX',
		name: 'Test Line',
		color: '#123456',
		stations: [
			{ code: 'XX1', name: 'X', lat: 1.3101, lon: 103.8 },
			{ code: 'XX2', name: 'M', lat: 1.35, lon: 103.8 },
			{ code: 'XX3', name: 'Y', lat: 1.4, lon: 103.8 },
		],
	},
];
// ids: 0 b:00001, 1 b:00002, 2 b:00003, 3 m:X, 4 m:Y, 5 p:o, 6 p:d
const walk = {
	ids: ['b:00001', 'b:00002', 'b:00003', 'm:X', 'm:Y', 'p:o', 'p:d'],
	links: { '0': [5, 40], '1': [3, 150], '3': [1, 150], '4': [6, 300], '5': [0, 40], '6': [4, 300] } as Record<string, number[]>,
};
const mk = (hours?: Record<string, Record<string, string[]>>, when?: { minutes: number; day: 'WD' | 'SAT' | 'SUN' }) =>
	new JourneyGraph({ stops, lines, extraEdges: [], services: { '9': { '0': ['00001', '00002', '00003'] } }, walk, hours, when });
const o = { id: 'p:o', name: 'o', lat: 1.3, lon: 103.8 };
const d = { id: 'p:d', name: 'd', lat: 1.4, lon: 103.8 };
const r = planJourneys(mk(), o, d);
assert.equal(r[0]!.modes.join(), 'bus,mrt');
const mrtLeg = r[0]!.legs.find((l) => l.mode === 'mrt');
assert.ok(mrtLeg && mrtLeg.mode === 'mrt' && mrtLeg.from === 'X' && mrtLeg.to === 'Y' && mrtLeg.towards === 'Y');
assert.ok(r[0]!.minutes > 10 && r[0]!.minutes < 70);
// Walk legs use the precomputed path distances, not straight lines.
assert.ok(r[0]!.legs.some((l) => l.mode === 'walk' && Math.round(l.meters) === 300));
// A place with no walking links gets no route rather than an invented one.
assert.deepEqual(planJourneys(mk(), { id: 'p:none', name: 'n', lat: 1.2, lon: 103.6 }, d), []);
// Operating hours: a late-night-only service is not offered at 3pm.
const night = ['2335,2345,2335,2345,2335,2345', '2335,2345,2335,2345,2335,2345', '2335,2345,2335,2345,2335,2345'];
const noon = { minutes: 15 * 60, day: 'WD' as const };
const noBus = planJourneys(mk({ '9': { '0': night } }, noon), o, d);
assert.ok(noBus.every((x) => !x.modes.includes('bus')));
assert.equal(runningAt('2335,2345,2335,2345,2335,2345', noon), false);
assert.equal(runningAt('2335,2345,2335,2345,2335,2345', { minutes: 23 * 60 + 40, day: 'WD' }), true);
assert.equal(runningAt('2335,0020,-,-,-,-', { minutes: 10, day: 'WD' }), true);
assert.equal(runningAt('0530,2350,-,-,-,-', { minutes: 600, day: 'SAT' }), false);
console.log('journey assertions passed');
