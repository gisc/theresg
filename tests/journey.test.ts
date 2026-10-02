import assert from 'node:assert/strict';
import { JourneyGraph, planJourneys } from '../shared/utils/journey';
// Tiny synthetic network: bus stop A - bus - stop B (near station X) - MRT - station Y - walk - destination.
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
const g = new JourneyGraph({ stops, lines, extraEdges: [], services: { '9': { '0': ['00001', '00002', '00003'] } } });
const r = planJourneys(g, { name: 'o', lat: 1.3, lon: 103.8 }, { name: 'd', lat: 1.4, lon: 103.8001 });
assert.equal(r[0]!.modes.join(), 'bus,mrt');
assert.equal(r[0]!.legs.filter((l) => l.mode === 'bus').length, 1);
const mrtLeg = r[0]!.legs.find((l) => l.mode === 'mrt');
assert.ok(mrtLeg && mrtLeg.mode === 'mrt' && mrtLeg.from === 'X' && mrtLeg.to === 'Y' && mrtLeg.towards === 'Y');
assert.ok(r[0]!.minutes > 10 && r[0]!.minutes < 60);
// Far from any stop: no route rather than an invented one.
assert.deepEqual(planJourneys(g, { name: 'o', lat: 1.2, lon: 103.6 }, { name: 'd', lat: 1.4, lon: 103.8 }), []);
console.log('journey assertions passed');
