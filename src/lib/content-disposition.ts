export function sanitizeFilename(fileName: string | null | undefined, fallback: string): string {
  const cleaned = (fileName ?? "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/["\\;]/g, "")
    .trim();
  return cleaned || fallback;
}
