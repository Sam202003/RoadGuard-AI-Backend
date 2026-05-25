const DEFAULT_SPEED_KMH = 40;
const MIN_ETA_MINUTES = 5;

/**
 * MVP ETA: distance / average speed, with optional live speed override.
 */
export function calculateEtaMinutes(distanceKm: number, speedKmh?: number): number {
  const speed = speedKmh && speedKmh > 5 ? speedKmh : DEFAULT_SPEED_KMH;
  if (distanceKm <= 0) return MIN_ETA_MINUTES;
  return Math.max(MIN_ETA_MINUTES, Math.ceil((distanceKm / speed) * 60));
}
