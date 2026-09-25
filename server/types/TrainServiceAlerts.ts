import type { TrainServiceMessage } from '../../shared/types/TrainServiceMessage';

export interface TrainServiceAlerts {
	value: {
		Status: number;
		AffectedSegments: string[];
		Message: TrainServiceMessage[];
	};
}
