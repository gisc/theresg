export interface TrainServiceMessage {
	Content: string;
	CreatedDate: string;
	// Parsed from LTA's "05:00-SK-" style prefix when present; fall back to Content.
	AlertTime?: string;
	LineTag?: string;
	ParsedText?: string;
}
