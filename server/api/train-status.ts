import type { TrainServiceAlerts } from '~~/server/types/TrainServiceAlerts';
import type { TrainServiceMessage } from '~~/shared/types/TrainServiceMessage';
import type { TrainStatus } from '~~/shared/types/TrainStatus';

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

	const messages: TrainServiceMessage[] = [];
	for (const alert of data.value.Message) {
		messages.push({
			Content: alert.Content,
			CreatedDate: new Date(alert.CreatedDate).toLocaleDateString(),
		});
	}

	const hasBridging = messages.some((m) => /bridg|shuttle|free bus/i.test(m.Content));

	const status: TrainStatus = {
		status: data.value.Status,
		disrupted: data.value.Status !== 1,
		hasBridging,
		messages,
	};

	return status;
});
