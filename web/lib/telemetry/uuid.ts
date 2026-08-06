// crypto.randomUUID() TƏHLÜKƏSİZ KONTEKST tələb edir (https və ya localhost) —
// telefon LAN IP-dən http ilə test edildiyi üçün (docs/PHASE-1.md S1a qəbulu) işləməyəcək.
// getRandomValues bu məhdudiyyətə tabe deyil, ona görə UUID v4-ü əl ilə qururuq.
export function uuidv4(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
