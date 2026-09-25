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
