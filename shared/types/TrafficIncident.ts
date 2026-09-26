import type { IncidentType } from './IncidentType';

export interface TrafficIncident {
	Type: IncidentType;
	Latitude: string;
	Longitude: string;
	Message: string;
}
