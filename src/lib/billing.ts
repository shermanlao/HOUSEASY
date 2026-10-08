export type ChargeMode = 'reading' | 'qty';

/** Meter lines store last/this readings. Quantity lines store QTY and zero readings. */
export function chargeUsesReadings(lastReading: number, thisReading: number): boolean {
  return lastReading !== 0 || thisReading !== 0;
}

export function inferChargeMode(lastReading: number, thisReading: number, qty: number): ChargeMode {
  if (chargeUsesReadings(lastReading, thisReading)) return 'reading';
  if (qty !== 0) return 'qty';
  return 'reading';
}
