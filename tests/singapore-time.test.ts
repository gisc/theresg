import assert from 'node:assert/strict';
import { sgWhen } from '../shared/utils/singapore-time';

assert.deepEqual(sgWhen(Date.UTC(2026, 9, 5, 15, 30)), {
	minutes: 1410,
	day: 'WD',
	label: '23:30',
});
assert.deepEqual(sgWhen(Date.UTC(2026, 9, 9, 16)), { minutes: 0, day: 'SAT', label: '00:00' });
assert.deepEqual(sgWhen(Date.UTC(2026, 9, 10, 16)), { minutes: 0, day: 'SUN', label: '00:00' });
assert.deepEqual(sgWhen(Date.UTC(2026, 9, 11, 16)), { minutes: 0, day: 'WD', label: '00:00' });
assert.deepEqual(sgWhen(Date.UTC(2026, 9, 10, 21, 30)), {
	minutes: 330,
	day: 'SUN',
	label: '05:30',
});
console.log('5 Singapore timetable assertions passed');
