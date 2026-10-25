export const MAX_SIGNATURE_PNG_BYTES = 1_572_864; // ~1.5MB

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function decodeSignaturePng(input: string): { bytes: Buffer } | { error: string } {
  const raw = input.includes(',') ? input.slice(input.indexOf(',') + 1) : input;
  if (!raw.trim()) {
    return { error: '簽署檔案無效' };
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(raw, 'base64');
  } catch {
    return { error: '簽署檔案無效' };
  }
  if (!bytes.length) {
    return { error: '簽署檔案無效' };
  }
  if (bytes.length > MAX_SIGNATURE_PNG_BYTES) {
    return { error: '簽署檔案過大（上限約 1.5MB）' };
  }
  if (!isPng(bytes)) {
    return { error: '簽署必須為 PNG 圖片' };
  }
  return { bytes };
}

function isPng(bytes: Buffer): boolean {
  if (bytes.length < PNG_MAGIC.length) return false;
  return PNG_MAGIC.every((b, i) => bytes[i] === b);
}
