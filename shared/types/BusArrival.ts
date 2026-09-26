import type { NextBus } from './NextBus';

export interface BusArrival {
	ServiceNo: string;
	Operator: string;
	NextBus: NextBus;
	NextBus2: NextBus;
	NextBus3: NextBus;
}
