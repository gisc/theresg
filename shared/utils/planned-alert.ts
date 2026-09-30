// Do not suppress unknown alerts or a live disruption that mentions planned works.
export function isPlannedAlert(content: string): boolean {
 const text = content.replace(/^\d{1,2}:\d{2}-[A-Z]{2}-/, '').trim();
 return /^(?:planned service (?:adjustment|changes?)|planned (?:engineering )?works|scheduled (?:maintenance|engineering works))\b/i.test(text);
}
