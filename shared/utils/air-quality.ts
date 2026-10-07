export const airRegions = ['north', 'south', 'east', 'west', 'central'] as const;
export type AirRegion = typeof airRegions[number];
export type AirMetric = 'psi' | 'pm25';
export interface AirSeries {
	timestamp: string;
	updatedTimestamp: string;
	values: Record<AirRegion, number | null>;
}
export interface AirQuality { fetchedAt: string; psi: AirSeries | null; pm25: AirSeries | null }
export const airBands = {
	psi: [
		{ max: 50, label: 'Good', range: '0-50', color: '#35733a', bg: '#edf6e9' },
		{ max: 100, label: 'Moderate', range: '51-100', color: '#175b97', bg: '#e8f2ff' },
		{ max: 200, label: 'Unhealthy', range: '101-200', color: '#943f00', bg: '#fff0d9' },
		{ max: 300, label: 'Very unhealthy', range: '201-300', color: '#a02a4b', bg: '#ffe5ee' },
		{ max: Infinity, label: 'Hazardous', range: '>300', color: '#a00018', bg: '#ffdae0' },
	],
	pm25: [
		{ max: 55, label: 'Normal', range: '0-55', color: '#17665a', bg: '#e1f5ef' },
		{ max: 150, label: 'Elevated', range: '56-150', color: '#6846a0', bg: '#efe7fc' },
		{ max: 250, label: 'High', range: '151-250', color: '#782a8a', bg: '#f8e0fc' },
		{ max: Infinity, label: 'Very high', range: '≥251', color: '#3d1a56', bg: '#e3d1ef' },
	],
};
export function airBand(metric: AirMetric, value: number | null) {
	if (value === null || !Number.isFinite(value) || value < 0) return null;
	return airBands[metric].find((band) => value <= band.max) ?? null;
}
// Two hours is our stale-data guard, not an NEA category or reporting promise.
export function airIsStale(timestamp: string, now: number) {
	const age = now - Date.parse(timestamp);
	return !Number.isFinite(age) || age > 2 * 60 * 60_000 || age < -5 * 60_000;
}
export function parseAirSeries(body: unknown, metric: AirMetric): AirSeries | null {
	if (!body || typeof body !== 'object') return null;
	const response = body as { code?: number; data?: { items?: unknown[] } };
	if (response.code !== 0 || !Array.isArray(response.data?.items)) return null;
	const items = response.data.items.filter((item): item is { timestamp: string; updatedTimestamp?: string; readings?: Record<string, unknown> } =>
		Boolean(item && typeof item === 'object' && 'timestamp' in item && typeof item.timestamp === 'string' && Number.isFinite(Date.parse(item.timestamp))),
	).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
	const item = items[0];
	if (!item) return null;
	const readings = item.readings?.[metric === 'psi' ? 'psi_twenty_four_hourly' : 'pm25_one_hourly'];
	if (!readings || typeof readings !== 'object') return null;
	const raw = readings as Record<string, unknown>;
	const values = Object.fromEntries(airRegions.map((region) => [region,
		typeof raw[region] === 'number' && Number.isFinite(raw[region]) && raw[region] >= 0 ? raw[region] : null,
	])) as AirSeries['values'];
	if (airRegions.every((region) => values[region] === null)) return null;
	return { timestamp: item.timestamp, updatedTimestamp: item.updatedTimestamp ?? item.timestamp, values };
}
