/** Empty input is null. Invalid or negative input is rejected. */
export function parseOptionalMonthlyRent(
  raw: FormDataEntryValue | null
): { ok: true; value: number | null } | { ok: false } {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) return { ok: true, value: null };
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return { ok: false };
  return { ok: true, value };
}

export function formatMonthlyRent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `$${value.toLocaleString()}`;
}
