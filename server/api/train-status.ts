import { isPlannedAlert } from '~~/shared/utils/planned-alert';
import { getTrainAlertFeed } from '~~/server/utils/train-alert-feed';
import type { TrainServiceMessage } from '~~/shared/types/TrainServiceMessage';
import type { TrainStatus } from '~~/shared/types/TrainStatus';

export default defineEventHandler(async () => {
	const data = await getTrainAlertFeed();

	const messages: TrainServiceMessage[] = [];
	for (const alert of data.value.Message) {
		if (!isAlertCurrent(alert.Content)) continue;
		const parsed = parseAlertContent(alert.Content);
		messages.push({
			Content: alert.Content,
			CreatedDate: formatSgDate(alert.CreatedDate),
			AlertTime: parsed.time,
			LineTag: parsed.lineTag,
			ParsedText: parsed.text,
		});
	}

	const disruptionMessages = messages.filter((m) => !isPlannedAlert(m.Content));
	const hasBridging = disruptionMessages.some((m) => /bridg|shuttle|free bus/i.test(m.Content));

	const status: TrainStatus = {
		status: data.value.Status,
		disrupted: data.value.Status !== 1 && disruptionMessages.length > 0,
		hasBridging,
		messages,
	};

	return status;
});
