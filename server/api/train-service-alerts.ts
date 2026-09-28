import { getTrainAlertFeed } from '~~/server/utils/train-alert-feed';
import type { TrainServiceMessage } from '~~/shared/types/TrainServiceMessage';

export default defineEventHandler(async () => {
	const data = await getTrainAlertFeed();

	const formattedAlerts: TrainServiceMessage[] = [];
	for (const alert of data.value.Message) {
		if (!isAlertCurrent(alert.Content)) continue;
		const parsed = parseAlertContent(alert.Content);
		formattedAlerts.push({
			Content: alert.Content,
			CreatedDate: formatSgDate(alert.CreatedDate),
			AlertTime: parsed.time,
			LineTag: parsed.lineTag,
			ParsedText: parsed.text,
		});
	}

	return formattedAlerts;
});
