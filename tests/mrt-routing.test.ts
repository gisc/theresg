import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildStationIndex, findRoute, type MrtNetwork } from '../app/utils/mrtRoute';

const network: MrtNetwork = {
	lines: [
		{ code: 'A', name: 'Line A', color: '#123456', stations: [
			{ code: 'A1', name: 'First' }, { code: 'A2', name: 'Change' }, { code: 'A3', name: 'Last' },
		] },
		{ code: 'B', name: 'Line B', color: '#654321', stations: [
			{ code: 'B1', name: 'Change' }, { code: 'B2', name: 'Other' },
		] },
		{ code: 'L', name: 'Loop', color: '#456789', loop: true, stations: [
			{ code: 'L1', name: 'Loop 1' }, { code: 'L2', name: 'Loop 2' }, { code: 'L3', name: 'Loop 3' },
		] },
		{ code: 'E', name: 'Empty', color: '#000000', stations: [] },
	], extraEdges: [],
};

test('MRT endpoint indexing keeps transfer, reverse and loop routes', () => {
	assert.deepEqual(findRoute(network, 'First', 'First'), []);
	assert.equal(findRoute(network, 'First', 'Unknown'), null);
	const transfer = findRoute(network, 'First', 'Other')!;
	assert.deepEqual(transfer.map(s => [s.line.code, s.stations, s.towards, s.stops]), [
		['A', ['First', 'Change'], 'Last', 1], ['B', ['Change', 'Other'], 'Other', 1],
	]);
	assert.equal(findRoute(network, 'Last', 'First')![0]!.towards, 'First');
	const loop = findRoute(network, 'Loop 1', 'Loop 3')!;
	assert.equal(loop[0]!.stops, 1);
	assert.equal(loop[0]!.towards, null);
	assert.equal(buildStationIndex(network).find(s => s.name === 'Change')!.codes.length, 2);
});

test('empty or one-station lines never invent a route', () => {
	assert.equal(findRoute({ lines: [], extraEdges: [] }, 'A', 'B'), null);
	assert.equal(findRoute({ lines: [{ ...network.lines[0]!, stations: [{ code: 'A1', name: 'Only' }] }], extraEdges: [] }, 'Only', 'Other'), null);
});
