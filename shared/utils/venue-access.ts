/** Shared walking-access rules. Keep explicit holds even when legacy links exist. */
export const HELD_VENUE_IDS: readonly string[] = [
	'p:Brooks Park',
	'p:Bulim Park',
	'p:Changi Beach Park',
	'p:Changi Boardwalk',
	'p:Faber Heights Park',
	'p:Greenwood Crescent Playground',
	'p:Holland Green Linear Park',
	'p:Holland Green Playground',
	'p:Lilac Drive Playground',
	'p:Mimosa Walk Playground',
	'p:Neram Crescent Playground',
	'p:Nim Crescent Open Space',
	'p:Orchid Village Playground',
	'p:Saraca Road Playground',
	'p:Seletar Terrace Park',
	'p:Springleaf Avenue Playground',
	'a:Bird Paradise',
	'a:Jewel Changi Airport',
	'p:Harbourfront Library',
];

// Return a fresh Set so one consumer cannot change another page's hold policy.
export function createHeldVenueIds(): Set<string> {
	return new Set(HELD_VENUE_IDS);
}

export interface ReviewedLinkCandidate {
	id: string;
	pathReviewed: boolean;
	source: string;
	meters: number;
	geometryFormat: string;
	geometry: [number, number][];
}

export interface ReviewedAccessCandidate {
	id: string;
	lat: number;
	lon: number;
	buildingApproachReviewed: boolean;
	accessScope: string;
	links: ReviewedLinkCandidate[];
}

export interface ReviewedLink extends ReviewedLinkCandidate {
	capturedAtDate?: string;
	source: 'OneMap';
	sourceUrl: string;
	geometryFormat: 'lat-lon';
	direction: 'transit-to-venue';
	instructions: unknown[];
	originName?: string;
}

export interface ReviewedAccess extends ReviewedAccessCandidate {
	checkedAt: string;
	name: string;
	entranceName: string;
	entranceReviewed: boolean;
	accessScope: 'building-approach' | 'park-approach';
	accessNote: string;
	officialUrl: string;
	links: ReviewedLink[];
}

function isSingaporePoint(point: { lat: number; lon: number }): boolean {
	return (
		Number.isFinite(point.lat) &&
		Number.isFinite(point.lon) &&
		point.lat >= 1.15 &&
		point.lat <= 1.5 &&
		point.lon >= 103.58 &&
		point.lon <= 104.1
	);
}

export function isReviewedApproach(
	access: ReviewedAccessCandidate,
	heldVenueIds: ReadonlySet<string>,
	isPointAllowed: (point: { lat: number; lon: number }) => boolean = isSingaporePoint,
): boolean {
	return (
		!heldVenueIds.has(access.id) &&
		access.buildingApproachReviewed &&
		(access.accessScope === 'building-approach' || access.accessScope === 'park-approach') &&
		isPointAllowed(access)
	);
}

/** Filter links without losing their source, geometry or entrance metadata. */
export function usableReviewedLinks<T extends ReviewedLinkCandidate>(
	links: readonly T[],
	validTransitIds: ReadonlySet<string>,
	isPointAllowed: (point: { lat: number; lon: number }) => boolean = isSingaporePoint,
): T[] {
	return links.filter(
		(link) =>
			link.pathReviewed &&
			link.source === 'OneMap' &&
			validTransitIds.has(link.id) &&
			Number.isFinite(link.meters) &&
			link.meters > 0 &&
			link.meters <= 2000 &&
			link.geometryFormat === 'lat-lon' &&
			link.geometry?.length > 1 &&
			link.geometry.every((point) => isPointAllowed({ lat: point[0], lon: point[1] })),
	);
}
