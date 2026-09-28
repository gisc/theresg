import type { TrainServiceAlerts } from '~~/server/types/TrainServiceAlerts';
import { createTtlCache } from '~~/server/utils/ttl-cache';

const cachedFeed = createTtlCache<TrainServiceAlerts>(30_000, 1);

export function getTrainAlertFeed() {
	return cachedFeed('alerts', () =>
		$fetch<TrainServiceAlerts>(
			'https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts',
			{
				method: 'GET',
				headers: {
					Accept: 'application/json',
					AccountKey: process.env.NUXT_DATAMALL_API_KEY || '',
				},
			},
		),
	);
}
