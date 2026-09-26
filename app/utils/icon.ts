import type { IncidentType } from '~~/shared/types/IncidentType';

export function getAlertIcon(alert: string): string {
	const a = alert.toLowerCase();

	if (a.includes('mrt')) {
		return 'material-symbols:train-outline';
	} else if (a.includes('lrt')) {
		return 'material-symbols:tram-outline';
	} else if (a.includes('bus')) {
		return 'material-symbols:directions-bus-outline';
	} else {
		return 'material-symbols:info-outline';
	}
}

export function getTrafficIcon(type: IncidentType): string {
	switch (type) {
		case 'Accident': {
			return 'material-symbols:car-crash-outline';
		}
		case 'Roadwork': {
			return 'material-symbols:construction-outline';
		}
		case 'Vehicle breakdown': {
			return 'material-symbols:minor-crash-outline';
		}
		case 'Weather': {
			return 'material-symbols:rainy-outline';
		}
		case 'Obstacle': {
			return 'material-symbols:add-triangle-outline';
		}
		case 'Road Block': {
			return 'material-symbols:remove-road-outline';
		}
		case 'Heavy Traffic': {
			return 'material-symbols:traffic-jam-outline';
		}
		case 'Diversion': {
			return 'material-symbols:alt-route-outline';
		}
		case 'Unattended Vehicle': {
			return 'material-symbols:minor-crash-outline';
		}
		case 'Fire': {
			return 'material-symbols:mode-heat-outline';
		}
		default: {
			return 'material-symbols:warning-outline';
		}
	}
}
