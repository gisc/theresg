import type { TrainServiceAlerts } from '~~/server/types/TrainServiceAlerts';
import type { TrainServiceMessage } from '~~/shared/types/TrainServiceMessage';

export default defineEventHandler(async () => {
	const apiKey = process.env.NUXT_DATAMALL_API_KEY;

	const data = await $fetch<TrainServiceAlerts>(
		'https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts',
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
				AccountKey: apiKey || '',
			},
		},
	);

	const formattedAlerts: TrainServiceMessage[] = [];
	for (const alert of data.value.Message) {
		formattedAlerts.push({
			Content: alert.Content,
			CreatedDate: new Date(alert.CreatedDate).toLocaleDateString(),
		});
	}

	return formattedAlerts;
});
