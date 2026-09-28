import { DAILY_LIMIT, reserveLtaCall } from './lta-budget';

/** Every protected DataMall fetch goes through this function; no implicit retry. */
export async function datamallFetch<T>(url: string, options: Parameters<typeof $fetch>[1]): Promise<T> {
  let reservation;
  try {
    reservation = await reserveLtaCall();
  } catch (error) {
    console.error('[LTA budget] ledger unavailable', error);
    throw createError({ statusCode: 503, statusMessage: 'Live data temporarily unavailable' });
  }
  if (!reservation) {
    throw createError({ statusCode: 503, statusMessage: 'Live data limit reached' });
  }
  if (reservation.calls === Math.ceil(DAILY_LIMIT * 0.7) || reservation.calls === Math.ceil(DAILY_LIMIT * 0.9)) {
    console.warn(`[LTA budget] ${reservation.day} used ${reservation.calls}/${DAILY_LIMIT} outbound calls`);
  }
  return $fetch<T>(url, { ...options, retry: 0 });
}
