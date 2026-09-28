export interface UserCoords {
	lat: number;
	lon: number;
}

// Generous bounding box covering mainland Singapore and its islands.
const SG_BOUNDS = {
	minLat: 1.15,
	maxLat: 1.5,
	minLon: 103.58,
	maxLon: 104.1,
};

export function isInSingapore(coords: UserCoords): boolean {
	return (
		coords.lat >= SG_BOUNDS.minLat &&
		coords.lat <= SG_BOUNDS.maxLat &&
		coords.lon >= SG_BOUNDS.minLon &&
		coords.lon <= SG_BOUNDS.maxLon
	);
}

export function haversineM(a: UserCoords, b: UserCoords): number {
	const rad = Math.PI / 180;
	const dLat = (b.lat - a.lat) * rad;
	const dLon = (b.lon - a.lon) * rad;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
	return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// Browser geolocation, resolved only when the fix is inside Singapore.
// Returns null when geolocation is unsupported, denied, times out, or the
// user is outside Singapore - callers then keep their blank default.
export function getSingaporeCoords(): Promise<UserCoords | null> {
	if (!import.meta.client || !('geolocation' in navigator)) {
		return Promise.resolve(null);
	}
	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
				resolve(isInSingapore(coords) ? coords : null);
			},
			() => resolve(null),
			{ timeout: 8000, maximumAge: 300000 },
		);
	});
}

export function nearestByCoords<T>(
	items: readonly T[],
	getCoords: (item: T) => UserCoords | null,
	user: UserCoords,
): T | null {
	let best: T | null = null;
	let bestDist = Infinity;
	for (const item of items) {
		const c = getCoords(item);
		if (!c) continue;
		const d = haversineM(user, c);
		if (d < bestDist) {
			bestDist = d;
			best = item;
		}
	}
	return best;
}
