export type CrowdLevel = 'l' | 'm' | 'h';

export interface PlatformCrowdEntry {
	line: string;
	station: string;
	level: CrowdLevel;
	start: string;
	end: string;
}

export interface PlatformCrowdResponse {
	updated: string;
	entries: PlatformCrowdEntry[];
}
