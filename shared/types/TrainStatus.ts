import type { TrainServiceMessage } from './TrainServiceMessage';

export interface TrainStatus {
	status: number;
	disrupted: boolean;
	hasBridging: boolean;
	messages: TrainServiceMessage[];
}
