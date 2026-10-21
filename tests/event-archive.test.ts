import assert from 'node:assert/strict';
import { eventHasEnded } from '../shared/utils/event-archive';
assert.equal(eventHasEnded('2026-11-01', Date.parse('2026-10-21T12:00:00+08:00')), false);
assert.equal(eventHasEnded('2026-11-01', Date.parse('2026-11-01T23:59:59+08:00')), false);
assert.equal(eventHasEnded('2026-11-01', Date.parse('2026-11-02T00:00:00+08:00')), true);
// At 4pm UTC the day has already changed in Singapore.
assert.equal(eventHasEnded('2026-11-01', Date.parse('2026-11-01T16:00:00Z')), true);
