const AVERAGE_SPEED_KMH = 40;

/** Estimated arrival time in minutes from distance (km). */
export function estimateArrivalMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 5;
  return Math.max(5, Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60));
}
