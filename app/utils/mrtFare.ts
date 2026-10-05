import type { MrtNetwork, RouteSegment } from '~/utils/mrtRoute';

// PTC adult card fare table for distance-based travel, effective
// 27 December 2025. Source: https://simplygo.com.sg/travel-fares/adult-fares/
// Bands are the official distance bands (km); values in cents. Review after
// each December PTC fare adjustment.
const ADULT_CARD_BANDS: { maxKm: number; cents: number }[] = [
	{ maxKm: 3.2, cents: 128 },
	{ maxKm: 4.2, cents: 138 },
	{ maxKm: 5.2, cents: 149 },
	{ maxKm: 6.2, cents: 159 },
	{ maxKm: 7.2, cents: 168 },
	{ maxKm: 8.2, cents: 175 },
	{ maxKm: 9.2, cents: 182 },
	{ maxKm: 10.2, cents: 186 },
	{ maxKm: 11.2, cents: 190 },
	{ maxKm: 12.2, cents: 194 },
	{ maxKm: 13.2, cents: 198 },
	{ maxKm: 14.2, cents: 202 },
	{ maxKm: 15.2, cents: 207 },
	{ maxKm: 16.2, cents: 211 },
	{ maxKm: 17.2, cents: 215 },
	{ maxKm: 18.2, cents: 220 },
	{ maxKm: 19.2, cents: 224 },
	{ maxKm: 20.2, cents: 227 },
	{ maxKm: 21.2, cents: 230 },
	{ maxKm: 22.2, cents: 233 },
	{ maxKm: 23.2, cents: 236 },
	{ maxKm: 24.2, cents: 238 },
	{ maxKm: 25.2, cents: 240 },
	{ maxKm: 26.2, cents: 242 },
	{ maxKm: 27.2, cents: 243 },
	{ maxKm: 28.2, cents: 244 },
	{ maxKm: 29.2, cents: 245 },
	{ maxKm: 30.2, cents: 246 },
	{ maxKm: 31.2, cents: 247 },
	{ maxKm: 32.2, cents: 248 },
	{ maxKm: 33.2, cents: 249 },
	{ maxKm: 34.2, cents: 250 },
	{ maxKm: 35.2, cents: 251 },
	{ maxKm: 36.2, cents: 252 },
	{ maxKm: 37.2, cents: 253 },
	{ maxKm: 38.2, cents: 254 },
	{ maxKm: 39.2, cents: 255 },
	{ maxKm: 40.2, cents: 256 },
];
const ADULT_CARD_MAX_CENTS = 257; // over 40.2 km

export function adultCardFareCents(distanceKm: number): number {
	for (const band of ADULT_CARD_BANDS) {
		if (distanceKm <= band.maxKm) {
			return band.cents;
		}
	}
	return ADULT_CARD_MAX_CENTS;
}

// Sums straight-line distance between consecutive stations on the route.
// Real track distance differs (tracks curve), so this is an estimate and
// can land one fare band off on some trips. Returns null if any station on
// the route has no coordinates.
export function routeDistanceKm(
	network: MrtNetwork,
	segments: RouteSegment[],
): number | null {
	const coords = new Map<string, { lat: number; lon: number }>();
	for (const line of network.lines) {
		for (const s of line.stations) {
			if (s.lat != null && s.lon != null && !coords.has(s.name)) {
				coords.set(s.name, { lat: s.lat, lon: s.lon });
			}
		}
	}

	let metres = 0;
	for (const segment of segments) {
		for (let i = 0; i < segment.stations.length - 1; i++) {
			const a = coords.get(segment.stations[i]!);
			const b = coords.get(segment.stations[i + 1]!);
			if (!a || !b) {
				return null;
			}
			metres += haversineM(a, b);
		}
	}
	return metres / 1000;
}
