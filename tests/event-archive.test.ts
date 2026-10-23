import assert from 'node:assert/strict';
import { eventHasEnded } from '../shared/utils/event-archive';
assert.equal(eventHasEnded('2026-11-01', Date.parse('2026-10-21T12:00:00+08:00')), false);
assert.equal(eventHasEnded('2026-11-01', Date.parse('2026-11-01T23:59:59+08:00')), false);
assert.equal(eventHasEnded('2026-11-01', Date.parse('2026-11-02T00:00:00+08:00')), true);
// At 4pm UTC the day has already changed in Singapore.
assert.equal(eventHasEnded('2026-11-01', Date.parse('2026-11-01T16:00:00Z')), true);

import { currentEventStop, formatStopRange } from '../shared/utils/event-archive';
const stops = [
	{ venue: 'JEM', from: '2026-10-19', to: '2026-10-25', mrtTo: 'Jurong East' },
	{ venue: 'AMK Hub', from: '2026-10-27', to: '2026-11-01', mrtTo: 'Ang Mo Kio' },
];
// During a stop, that stop is current; the boundary day still counts.
assert.equal(currentEventStop(stops, Date.parse('2026-10-23T12:00:00+08:00'))?.venue, 'JEM');
assert.equal(currentEventStop(stops, Date.parse('2026-10-25T23:59:59+08:00'))?.venue, 'JEM');
// Between or before stops, the next upcoming stop is shown.
assert.equal(currentEventStop(stops, Date.parse('2026-10-18T12:00:00+08:00'))?.venue, 'JEM');
assert.equal(currentEventStop(stops, Date.parse('2026-10-26T12:00:00+08:00'))?.venue, 'AMK Hub');
// After the final stop there is nothing to point at.
assert.equal(currentEventStop(stops, Date.parse('2026-11-03T00:00:00+08:00')), null);
// A late-UTC day is already the next day in Singapore.
assert.equal(currentEventStop(stops, Date.parse('2026-10-25T16:00:00Z'))?.venue, 'AMK Hub');
assert.equal(formatStopRange('2026-10-19', '2026-10-25'), '19–25 Oct');
assert.equal(formatStopRange('2026-10-26', '2026-11-01'), '26 Oct–1 Nov');
