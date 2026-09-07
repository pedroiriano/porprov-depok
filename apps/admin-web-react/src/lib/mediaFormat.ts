export function formatMediaSize(bytes: number | null) {
  if (!bytes || bytes < 1) return 'Ukuran tidak tersedia';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
