import { parseAirSeries, type AirQuality, type AirMetric, type AirSeries } from '../../shared/utils/air-quality';

let cached: AirQuality | null = null;
let cachedAt = 0;
let pending: Promise<AirQuality> | null = null;
const getSeries = async (metric: AirMetric): Promise<AirSeries | null> => {
	try {
		const body = await $fetch<unknown>(`https://api-open.data.gov.sg/v2/real-time/api/${metric === 'psi' ? 'psi' : 'pm25'}`, { timeout: 8000, retry: 0 });
		return parseAirSeries(body, metric);
	} catch { return null; }
};
export default defineEventHandler(async (): Promise<AirQuality> => {
	if (cached && Date.now() - cachedAt < 5 * 60_000) return cached;
	if (!pending) pending = (async (): Promise<AirQuality> => {
		const [psi, pm25] = await Promise.all([getSeries('psi'), getSeries('pm25')]);
		cached = { fetchedAt: new Date().toISOString(), psi, pm25 };
		cachedAt = Date.now();
		return cached;
	})().finally(() => { pending = null; });
	return pending;
});
