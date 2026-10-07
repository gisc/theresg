import assert from 'node:assert/strict';
import { foodIsClosed } from '../shared/utils/food-closure';
assert.equal(foodIsClosed(undefined, Date.parse('2026-10-26T00:00:00+08:00')), false);
assert.equal(foodIsClosed('2026-10-25', Date.parse('2026-10-06T11:00:00+08:00')), false);
assert.equal(foodIsClosed('2026-10-25', Date.parse('2026-10-25T23:59:59+08:00')), false);
assert.equal(foodIsClosed('2026-10-25', Date.parse('2026-10-26T00:00:00+08:00')), true);
// At 4pm UTC the day has already changed in Singapore.
assert.equal(foodIsClosed('2026-10-25', Date.parse('2026-10-25T16:00:00Z')), true);
